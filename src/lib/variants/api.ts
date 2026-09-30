import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { nearestAspect, type AspectRatio } from "@/lib/variants/aspect";
import { ENGINE_DIRECTIVE } from "@/lib/variants/directive";
import {
  padNumber,
  parsePlan,
  type PlannedVariant,
} from "@/lib/variants/parse-plan";

type PriorEntry = {
  number: string;
  name: string;
  composition: string;
  mechanism: string;
};

type ReferenceRow = {
  data_base64: string;
  mime: string;
  width: number;
  height: number;
};

const MAX_IMAGE_CHARS = 1_800_000;

function fail(message: string): never {
  throw new Error(message);
}

function clipText(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

function assertUpload(input: unknown): { dataBase64: string; width: number; height: number } {
  if (!input || typeof input !== "object") fail("Choose a photograph first.");
  const raw = input as Record<string, unknown>;
  const dataBase64 = typeof raw.dataBase64 === "string" ? raw.dataBase64.replace(/\s/g, "") : "";
  if (dataBase64.length < 64 || dataBase64.length > MAX_IMAGE_CHARS) {
    fail("That photograph is too large. Try another from your gallery.");
  }
  if (!/^[A-Za-z0-9+/=]+$/.test(dataBase64.slice(0, 120))) {
    fail("That file could not be read as a photograph.");
  }
  const width = Number(raw.width);
  const height = Number(raw.height);
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > 8000 || height > 8000) {
    fail("That photograph has an unusable size.");
  }
  return { dataBase64, width, height };
}

function assertReferenceId(input: unknown): { referenceId: string } {
  if (!input || typeof input !== "object") fail("Choose a photograph first.");
  const referenceId = clipText((input as { referenceId?: unknown }).referenceId, 80);
  if (!/^[0-9a-f-]{36}$/i.test(referenceId)) fail("Choose a photograph first.");
  return { referenceId };
}

function assertPlan(input: unknown): {
  referenceId: string;
  startNumber: number;
  prior: PriorEntry[];
} {
  const { referenceId } = assertReferenceId(input);
  const raw = input as Record<string, unknown>;
  const startNumber = Number(raw.startNumber);
  if (!Number.isInteger(startNumber) || startNumber < 1 || startNumber > 191 || (startNumber - 1) % 10 !== 0) {
    fail("This sequence cannot continue.");
  }
  const priorRaw = Array.isArray(raw.prior) ? raw.prior.slice(0, 40) : [];
  const prior: PriorEntry[] = [];
  for (const item of priorRaw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const number = clipText(row.number, 8);
    const name = clipText(row.name, 80);
    const composition = clipText(row.composition, 360);
    const mechanism = clipText(row.mechanism, 80);
    if (!number || !name) continue;
    prior.push({ number, name, composition, mechanism });
  }
  return { referenceId, startNumber, prior };
}

function assertRender(input: unknown): {
  referenceId: string;
  prompt: string;
  aspectRatio: AspectRatio;
} {
  const { referenceId } = assertReferenceId(input);
  if (!input || typeof input !== "object") fail("Missing frame.");
  const raw = input as Record<string, unknown>;
  const prompt = clipText(raw.prompt, 2200);
  if (prompt.length < 40) fail("That frame has no direction yet.");
  const requested = clipText(raw.aspectRatio, 16);
  const aspectRatio = (
    [
      "1:1",
      "3:4",
      "4:3",
      "9:16",
      "16:9",
      "2:3",
      "3:2",
      "9:19.5",
      "19.5:9",
      "9:20",
      "20:9",
      "1:2",
      "2:1",
      "21:9",
      "5:2",
    ] as const
  ).find((ratio) => ratio === requested);
  if (!aspectRatio) fail("That frame size is not supported.");
  return { referenceId, prompt, aspectRatio };
}

async function loadReference(userId: string, referenceId: string): Promise<ReferenceRow> {
  const sql = await getSql();
  const rows = await sql<ReferenceRow>`
    select data_base64, mime, width, height
    from studio_references
    where id = ${referenceId} and user_id = ${userId}
  `;
  const row = rows[0];
  if (!row) fail("That photograph is no longer available. Choose it again.");
  return row;
}

function apiKeyOrThrow(): string {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) fail("Image generation is not available right now.");
  return apiKey;
}

async function xaiError(res: Response): Promise<string> {
  const text = await res.text();
  try {
    const body = JSON.parse(text) as { error?: { message?: string } | string; message?: string };
    const message =
      typeof body.error === "string" ? body.error : body.error?.message || body.message;
    if (message) return message.slice(0, 280);
  } catch {
    /* non-json */
  }
  if (res.status === 429) return "Grok is busy. Retry this frame in a moment.";
  return `Grok could not finish that request (${res.status}).`;
}

function editPrompt(prompt: string): string {
  return [
    "Create one new standalone photograph that fills the entire frame.",
    "This is a single exposure: not a collage, contact sheet, grid, diptych, split screen, or picture-in-picture.",
    "The attached image is the only reference. Preserve identity-defining traits exactly — recognizable identity, facial geometry when a person is present, natural features, inherent complexion and undertone, age presentation, body identity, body type, and authentic proportions.",
    "Do not replace the subject with a different person, animal, product, or place. Do not beautify, symmetrize, or plastic-smooth skin. Do not add captions, titles, watermarks, logos, or borders.",
    "Photograph this new moment:",
    prompt,
  ].join(" ");
}

async function chatPlan(args: {
  apiKey: string;
  dataUrl: string;
  sourceAspect: AspectRatio;
  width: number;
  height: number;
  startNumber: number;
  prior: PriorEntry[];
  nudge?: string;
}): Promise<string> {
  const end = args.startNumber + 9;
  const ledger =
    args.prior.length === 0
      ? "No previous variants. This is the first batch."
      : args.prior
          .map((item) => `${item.number} ${item.name} — ${item.mechanism}. ${item.composition}`)
          .join("\n");
  const userText = [
    `Source frame is about ${args.width}×${args.height} pixels, closest aspect ${args.sourceAspect}.`,
    `Number this batch ${padNumber(args.startNumber)} through ${padNumber(end)}. Do not restart at 001 if this is a later batch.`,
    "Previously accepted solutions, which you must not repeat:",
    ledger,
    "Return the JSON object only.",
    args.nudge ?? "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const body = {
    model: "grok-4.5",
    temperature: 0.8,
    max_tokens: 8000,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: ENGINE_DIRECTIVE },
      {
        role: "user",
        content: [
          { type: "text", text: userText },
          { type: "image_url", image_url: { url: args.dataUrl } },
        ],
      },
    ],
  };

  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${args.apiKey}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(240_000),
  });
  if (!res.ok) fail(await xaiError(res));
  const json = (await res.json()) as {
    choices?: { message?: { content?: string | null } }[];
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content || !content.trim()) fail("The plan came back empty. Try again.");
  return content;
}

export const uploadReference = createServerFn({ method: "POST" })
  .validator(assertUpload)
  .middleware([authMiddleware])
  .handler(async ({ data, context }) => {
    const sql = await getSql();
    const id = crypto.randomUUID();
    await sql`delete from studio_references where user_id = ${context.userId}`;
    await sql`
      insert into studio_references (id, user_id, mime, data_base64, width, height)
      values (${id}, ${context.userId}, ${"image/jpeg"}, ${data.dataBase64}, ${data.width}, ${data.height})
    `;
    return { id };
  });

export const planVariants = createServerFn({ method: "POST" })
  .validator(assertPlan)
  .middleware([authMiddleware])
  .handler(async ({ data, context }) => {
    const row = await loadReference(context.userId, data.referenceId);
    const apiKey = apiKeyOrThrow();
    const sourceAspect = nearestAspect(Number(row.width), Number(row.height));
    const dataUrl = `data:${row.mime || "image/jpeg"};base64,${row.data_base64}`;
    let text = await chatPlan({
      apiKey,
      dataUrl,
      sourceAspect,
      width: Number(row.width),
      height: Number(row.height),
      startNumber: data.startNumber,
      prior: data.prior,
    });
    let variants: PlannedVariant[];
    try {
      variants = parsePlan(text, sourceAspect);
    } catch {
      text = await chatPlan({
        apiKey,
        dataUrl,
        sourceAspect,
        width: Number(row.width),
        height: Number(row.height),
        startNumber: data.startNumber,
        prior: data.prior,
        nudge:
          "Your previous reply was incomplete or not usable JSON. Return only the JSON object with exactly 10 fully written variants.",
      });
      variants = parsePlan(text, sourceAspect);
    }
    return {
      sourceAspect,
      variants: variants.map((variant, index) => ({
        number: padNumber(data.startNumber + index),
        ...variant,
      })),
    };
  });

export const renderVariant = createServerFn({ method: "POST" })
  .validator(assertRender)
  .middleware([authMiddleware])
  .handler(async ({ data, context }) => {
    const row = await loadReference(context.userId, data.referenceId);
    const apiKey = apiKeyOrThrow();
    const res = await fetch("https://api.x.ai/v1/images/edits", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-imagine-image-2.0",
        prompt: editPrompt(data.prompt),
        image: {
          url: `data:${row.mime || "image/jpeg"};base64,${row.data_base64}`,
          type: "image_url",
        },
        aspect_ratio: data.aspectRatio,
        resolution: "1k",
        response_format: "url",
        user: context.userId,
      }),
      signal: AbortSignal.timeout(240_000),
    });
    if (!res.ok) fail(await xaiError(res));
    const json = (await res.json()) as { data?: { url?: string }[] };
    const url = json.data?.[0]?.url;
    if (!url) fail("Grok returned no photograph for that frame.");
    return { url };
  });
