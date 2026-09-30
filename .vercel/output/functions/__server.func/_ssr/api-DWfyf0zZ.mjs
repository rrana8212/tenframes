import { i as TSS_SERVER_FUNCTION, r as createServerFn } from "./ssr.mjs";
import { r as getSql } from "./db-CIdSKErV.mjs";
import { i as nearestAspect, n as authMiddleware, r as isAspectRatio } from "./aspect-DC4YBkrE.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/api-DWfyf0zZ.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
/** Operational brief for the variant planner. Analysis stays on the server. */
var ENGINE_DIRECTIVE = `You are the Universal Reference-Image Variant Engine.
The user attached one reference photograph. Invent exactly 10 photographs that stay in that image's visual universe while being genuinely different pictures.

Do the analysis silently. Return only JSON.

Rules:
- Preserve identity. For a person: recognizable face, craniofacial geometry, natural features, complexion and undertone, age, body identity, body type, proportions. For an object, animal, place, or product: the equivalent identity. Never swap in a different subject.
- Level II traits (wardrobe, hair, makeup, defining place, emotional register, medium) stay recognizable unless a stronger photograph truly needs a deliberate adaptation. Say so inside the prompt when you adapt them.
- Change pose, gaze, placement, camera, distance, crop, lens, depth, light, and the captured instant when that produces a different photograph.
- This is not ten poses, ten crops, ten lenses, ten light presets, or ten color grades of the same picture.
- Every variant is one single full-frame photograph. Never a collage, grid, contact sheet, diptych, split screen, or multi-panel image.
- No text, captions, titles, watermarks, logos, or borders unless they already exist physically in the scene.
- Reject generic defaults unless the reference itself uses them: centered glamour, automatic 85mm, excessive bokeh, orange/teal grade, plastic skin, perfect symmetry, glowing skin, meaningless flare, unexplained fog, HDR shadow recovery.
- Physical coherence beats novelty. Camera position must be occupiable. Light, shadow, and color must agree. Anatomy, weight, and contact must be believable.
- No two variants may share the same dominant mechanism or the same overall solution. A viewer must tell all ten apart as tiny thumbnails.
- Spread the ten across different distances, viewpoint heights, temporal moments, light architectures, depth structures, compositional geometries, and subject-environment relationships — but only using ideas this specific reference can honestly support. Do not force mirrors, fog, motion, or cinematic color into a picture that does not want them.
- Each prompt is standalone. Do not write "same as above" or "similar lighting". State subject and state, camera position and distance, lens behavior, composition, environment, light direction and quality, depth, color logic, materials, and capture character.
- Each prompt is one paragraph of concrete visual direction, 90 to 150 words. No bullet lists. No quality clichés (masterpiece, stunning, 8k, best quality).
- Names are unique, two to five words, evocative, not "Variant 1" or camera jargon.
- composition is one information-dense sentence describing the photographic proposition.
- aspectRatio is one of: 1:1, 3:4, 4:3, 9:16, 16:9, 2:3, 3:2, 9:19.5, 19.5:9, 9:20, 20:9, 1:2, 2:1, 21:9, 5:2. Vary the frame when the picture truly wants a different frame. Otherwise stay near the source aspect.
- mechanism is a private 3-to-6 word label of the dominant idea. It is not shown as a title.

Return only a JSON object with a "variants" array of exactly 10 objects.
Each object has non-empty strings: name, composition, prompt, aspectRatio, mechanism.
Do not return an example, a schema, or blank fields.`;
function asRecord(value) {
	if (!value || typeof value !== "object" || Array.isArray(value)) return null;
	return value;
}
function clip(value, max) {
	if (typeof value !== "string") return "";
	return value.replace(/\s+/g, " ").trim().slice(0, max);
}
function extractJson(text) {
	const trimmed = text.trim();
	const raw = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)?.[1] ?? trimmed;
	const start = raw.indexOf("{");
	const end = raw.lastIndexOf("}");
	if (start < 0 || end <= start) {
		const arrayStart = raw.indexOf("[");
		const arrayEnd = raw.lastIndexOf("]");
		if (arrayStart < 0 || arrayEnd <= arrayStart) throw new Error("The plan was not readable. Try again.");
		return JSON.parse(raw.slice(arrayStart, arrayEnd + 1));
	}
	return JSON.parse(raw.slice(start, end + 1));
}
function parsePlan(text, fallbackAspect) {
	const parsed = extractJson(text);
	const record = asRecord(parsed);
	const list = Array.isArray(parsed) ? parsed : record && Array.isArray(record.variants) ? record.variants : null;
	if (!list) throw new Error("The plan did not include ten variants. Try again.");
	const seen = /* @__PURE__ */ new Set();
	const variants = [];
	for (const item of list) {
		const row = asRecord(item);
		if (!row) continue;
		const name = clip(row.name, 64).replace(/^[\d.\s-]+/, "");
		const composition = clip(row.composition, 320);
		const prompt = clip(row.prompt, 1800);
		const mechanism = clip(row.mechanism, 80) || name;
		const requested = clip(row.aspectRatio, 16);
		const aspectRatio = isAspectRatio(requested) ? requested : fallbackAspect;
		const key = name.toLowerCase();
		if (name.length < 2 || composition.length < 12 || prompt.length < 80) continue;
		if (seen.has(key)) continue;
		seen.add(key);
		variants.push({
			name,
			composition,
			prompt,
			aspectRatio,
			mechanism
		});
		if (variants.length === 10) break;
	}
	if (variants.length !== 10) throw new Error("The plan was incomplete. Try again.");
	return variants;
}
function padNumber(n) {
	return String(n).padStart(3, "0");
}
var MAX_IMAGE_CHARS = 18e5;
function fail(message) {
	throw new Error(message);
}
function clipText(value, max) {
	if (typeof value !== "string") return "";
	return value.replace(/\s+/g, " ").trim().slice(0, max);
}
function assertUpload(input) {
	if (!input || typeof input !== "object") fail("Choose a photograph first.");
	const raw = input;
	const dataBase64 = typeof raw.dataBase64 === "string" ? raw.dataBase64.replace(/\s/g, "") : "";
	if (dataBase64.length < 64 || dataBase64.length > MAX_IMAGE_CHARS) fail("That photograph is too large. Try another from your gallery.");
	if (!/^[A-Za-z0-9+/=]+$/.test(dataBase64.slice(0, 120))) fail("That file could not be read as a photograph.");
	const width = Number(raw.width);
	const height = Number(raw.height);
	if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > 8e3 || height > 8e3) fail("That photograph has an unusable size.");
	return {
		dataBase64,
		width,
		height
	};
}
function assertReferenceId(input) {
	if (!input || typeof input !== "object") fail("Choose a photograph first.");
	const referenceId = clipText(input.referenceId, 80);
	if (!/^[0-9a-f-]{36}$/i.test(referenceId)) fail("Choose a photograph first.");
	return { referenceId };
}
function assertPlan(input) {
	const { referenceId } = assertReferenceId(input);
	const raw = input;
	const startNumber = Number(raw.startNumber);
	if (!Number.isInteger(startNumber) || startNumber < 1 || startNumber > 191 || (startNumber - 1) % 10 !== 0) fail("This sequence cannot continue.");
	const priorRaw = Array.isArray(raw.prior) ? raw.prior.slice(0, 40) : [];
	const prior = [];
	for (const item of priorRaw) {
		if (!item || typeof item !== "object") continue;
		const row = item;
		const number = clipText(row.number, 8);
		const name = clipText(row.name, 80);
		const composition = clipText(row.composition, 360);
		const mechanism = clipText(row.mechanism, 80);
		if (!number || !name) continue;
		prior.push({
			number,
			name,
			composition,
			mechanism
		});
	}
	return {
		referenceId,
		startNumber,
		prior
	};
}
function assertRender(input) {
	const { referenceId } = assertReferenceId(input);
	if (!input || typeof input !== "object") fail("Missing frame.");
	const raw = input;
	const prompt = clipText(raw.prompt, 2200);
	if (prompt.length < 40) fail("That frame has no direction yet.");
	const requested = clipText(raw.aspectRatio, 16);
	const aspectRatio = [
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
		"5:2"
	].find((ratio) => ratio === requested);
	if (!aspectRatio) fail("That frame size is not supported.");
	return {
		referenceId,
		prompt,
		aspectRatio
	};
}
async function loadReference(userId, referenceId) {
	const row = (await (await getSql())`
    select data_base64, mime, width, height
    from studio_references
    where id = ${referenceId} and user_id = ${userId}
  `)[0];
	if (!row) fail("That photograph is no longer available. Choose it again.");
	return row;
}
function apiKeyOrThrow() {
	const apiKey = process.env.XAI_API_KEY;
	if (!apiKey) fail("Image generation is not available right now.");
	return apiKey;
}
async function xaiError(res) {
	const text = await res.text();
	try {
		const body = JSON.parse(text);
		const message = typeof body.error === "string" ? body.error : body.error?.message || body.message;
		if (message) return message.slice(0, 280);
	} catch {}
	if (res.status === 429) return "Grok is busy. Retry this frame in a moment.";
	return `Grok could not finish that request (${res.status}).`;
}
function editPrompt(prompt) {
	return [
		"Create one new standalone photograph that fills the entire frame.",
		"This is a single exposure: not a collage, contact sheet, grid, diptych, split screen, or picture-in-picture.",
		"The attached image is the only reference. Preserve identity-defining traits exactly — recognizable identity, facial geometry when a person is present, natural features, inherent complexion and undertone, age presentation, body identity, body type, and authentic proportions.",
		"Do not replace the subject with a different person, animal, product, or place. Do not beautify, symmetrize, or plastic-smooth skin. Do not add captions, titles, watermarks, logos, or borders.",
		"Photograph this new moment:",
		prompt
	].join(" ");
}
async function chatPlan(args) {
	const end = args.startNumber + 9;
	const ledger = args.prior.length === 0 ? "No previous variants. This is the first batch." : args.prior.map((item) => `${item.number} ${item.name} — ${item.mechanism}. ${item.composition}`).join("\n");
	const userText = [
		`Source frame is about ${args.width}×${args.height} pixels, closest aspect ${args.sourceAspect}.`,
		`Number this batch ${padNumber(args.startNumber)} through ${padNumber(end)}. Do not restart at 001 if this is a later batch.`,
		"Previously accepted solutions, which you must not repeat:",
		ledger,
		"Return the JSON object only.",
		args.nudge ?? ""
	].filter(Boolean).join("\n\n");
	const body = {
		model: "grok-4.5",
		temperature: .8,
		max_tokens: 8e3,
		response_format: { type: "json_object" },
		messages: [{
			role: "system",
			content: ENGINE_DIRECTIVE
		}, {
			role: "user",
			content: [{
				type: "text",
				text: userText
			}, {
				type: "image_url",
				image_url: { url: args.dataUrl }
			}]
		}]
	};
	const res = await fetch("https://api.x.ai/v1/chat/completions", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${args.apiKey}`
		},
		body: JSON.stringify(body),
		signal: AbortSignal.timeout(55e3)
	});
	if (!res.ok) fail(await xaiError(res));
	const content = (await res.json()).choices?.[0]?.message?.content;
	if (!content || !content.trim()) fail("The plan came back empty. Try again.");
	return content;
}
var uploadReference_createServerFn_handler = createServerRpc({
	id: "18a10f73f0494c57965465c1e8b5e728a7afe6238961795d5c19a4ef29419a0f",
	name: "uploadReference",
	filename: "src/lib/variants/api.ts"
}, (opts) => uploadReference.__executeServer(opts));
var uploadReference = createServerFn({ method: "POST" }).validator(assertUpload).middleware([authMiddleware]).handler(uploadReference_createServerFn_handler, async ({ data, context }) => {
	const sql = await getSql();
	const id = crypto.randomUUID();
	await sql`delete from studio_references where user_id = ${context.userId}`;
	await sql`
      insert into studio_references (id, user_id, mime, data_base64, width, height)
      values (${id}, ${context.userId}, ${"image/jpeg"}, ${data.dataBase64}, ${data.width}, ${data.height})
    `;
	return { id };
});
var planVariants_createServerFn_handler = createServerRpc({
	id: "29f66cc022d926d9f29ae8f0df0654237917180e433c430390c8976a7cb9928f",
	name: "planVariants",
	filename: "src/lib/variants/api.ts"
}, (opts) => planVariants.__executeServer(opts));
var planVariants = createServerFn({ method: "POST" }).validator(assertPlan).middleware([authMiddleware]).handler(planVariants_createServerFn_handler, async ({ data, context }) => {
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
		prior: data.prior
	});
	let variants;
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
			nudge: "Your previous reply was incomplete or not usable JSON. Return only the JSON object with exactly 10 fully written variants."
		});
		variants = parsePlan(text, sourceAspect);
	}
	return {
		sourceAspect,
		variants: variants.map((variant, index) => ({
			number: padNumber(data.startNumber + index),
			...variant
		}))
	};
});
var renderVariant_createServerFn_handler = createServerRpc({
	id: "be6e018b79cbe3438258c600500ce578bbbbfdfc2dd7408686a42be7e068de85",
	name: "renderVariant",
	filename: "src/lib/variants/api.ts"
}, (opts) => renderVariant.__executeServer(opts));
var renderVariant = createServerFn({ method: "POST" }).validator(assertRender).middleware([authMiddleware]).handler(renderVariant_createServerFn_handler, async ({ data, context }) => {
	const row = await loadReference(context.userId, data.referenceId);
	const apiKey = apiKeyOrThrow();
	const res = await fetch("https://api.x.ai/v1/images/edits", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify({
			model: "grok-imagine-image-2.0",
			prompt: editPrompt(data.prompt),
			image: {
				url: `data:${row.mime || "image/jpeg"};base64,${row.data_base64}`,
				type: "image_url"
			},
			aspect_ratio: data.aspectRatio,
			resolution: "1k",
			response_format: "url",
			user: context.userId
		}),
		signal: AbortSignal.timeout(55e3)
	});
	if (!res.ok) fail(await xaiError(res));
	const url = (await res.json()).data?.[0]?.url;
	if (!url) fail("Grok returned no photograph for that frame.");
	return { url };
});
//#endregion
export { planVariants_createServerFn_handler, renderVariant_createServerFn_handler, uploadReference_createServerFn_handler };
