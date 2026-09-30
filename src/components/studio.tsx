import { useRef, useState } from "react";
import { Download, ImagePlus } from "lucide-react";
import { planVariants, renderVariant, uploadReference } from "@/lib/variants/api";
import { aspectToCss, type AspectRatio } from "@/lib/variants/aspect";
import { prepareGalleryFile } from "@/lib/variants/prepare-image";

type FrameStatus = "waiting" | "rendering" | "done" | "error";

type Frame = {
  number: string;
  name: string;
  composition: string;
  prompt: string;
  aspectRatio: AspectRatio;
  mechanism: string;
  status: FrameStatus;
  url?: string;
  error?: string;
};

type Photo = {
  previewUrl: string;
  width: number;
  height: number;
  id: string | null;
  uploading: boolean;
};

function messageFrom(error: unknown): string {
  if (error instanceof Error && error.message) {
    if (error.message === "Unauthorized") return "Sign in to generate photographs.";
    return error.message;
  }
  return "Something went wrong. Try again.";
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

async function saveImage(url: string, filename: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("unreadable");
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(objectUrl);
  } catch {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

export function Studio() {
  const inputRef = useRef<HTMLInputElement>(null);
  const framesRef = useRef<HTMLDivElement>(null);
  const runRef = useRef(0);
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);
  const [frames, setFrames] = useState<Frame[]>([]);
  const [phase, setPhase] = useState<"idle" | "planning" | "rendering">("idle");
  const [batchStart, setBatchStart] = useState(1);

  const busy = phase !== "idle";
  const lastNumber = Number(frames.at(-1)?.number ?? 0);
  const batch = frames.filter((frame) => Number(frame.number) >= batchStart);
  const batchReady = batch.filter((frame) => frame.status === "done" || frame.status === "error").length;

  function scrollToFrames() {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    framesRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }

  async function renderOne(referenceId: string, frame: Frame, token: number) {
    setFrames((current) => {
      const base = current.some((item) => item.number === frame.number) ? current : [...current, frame];
      return base.map((item) =>
        item.number === frame.number ? { ...item, status: "rendering", error: undefined } : item,
      );
    });
    try {
      const result = await renderVariant({
        data: {
          referenceId,
          prompt: frame.prompt,
          aspectRatio: frame.aspectRatio,
        },
      });
      if (runRef.current !== token) return;
      setFrames((current) =>
        current.map((item) =>
          item.number === frame.number ? { ...item, status: "done", url: result.url, error: undefined } : item,
        ),
      );
    } catch (error) {
      if (runRef.current !== token) return;
      setFrames((current) =>
        current.map((item) =>
          item.number === frame.number ? { ...item, status: "error", error: messageFrom(error) } : item,
        ),
      );
    }
  }

  async function renderPool(referenceId: string, seeded: Frame[], token: number) {
    let cursor = 0;
    const worker = async () => {
      while (cursor < seeded.length) {
        const index = cursor;
        cursor += 1;
        const frame = seeded[index];
        if (!frame || runRef.current !== token) return;
        await renderOne(referenceId, frame, token);
      }
    };
    const workers = Math.min(3, seeded.length);
    await Promise.all(Array.from({ length: workers }, () => worker()));
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    const token = ++runRef.current;
    setFileError(null);
    setPlanError(null);
    setFrames([]);
    setPhase("idle");
    setBatchStart(1);
    try {
      const prepared = await prepareGalleryFile(file);
      if (runRef.current !== token) {
        URL.revokeObjectURL(prepared.previewUrl);
        return;
      }
      setPhoto((current) => {
        if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl);
        return {
          previewUrl: prepared.previewUrl,
          width: prepared.width,
          height: prepared.height,
          id: null,
          uploading: true,
        };
      });
      const uploaded = await uploadReference({
        data: {
          dataBase64: prepared.dataBase64,
          width: prepared.width,
          height: prepared.height,
        },
      });
      if (runRef.current !== token) return;
      setPhoto((current) =>
        current ? { ...current, id: uploaded.id, uploading: false } : current,
      );
    } catch (error) {
      if (runRef.current !== token) return;
      setPhoto(null);
      setFileError(messageFrom(error));
    }
  }

  async function generate(continueSequence: boolean) {
    if (!photo?.id || busy) return;
    const token = ++runRef.current;
    const referenceId = photo.id;
    const start = continueSequence ? lastNumber + 1 : 1;
    const prior = continueSequence
      ? frames.map((frame) => ({
          number: frame.number,
          name: frame.name,
          composition: frame.composition,
          mechanism: frame.mechanism,
        }))
      : [];
    setPlanError(null);
    setPhase("planning");
    setBatchStart(start);
    if (!continueSequence) setFrames([]);
    try {
      const plan = await planVariants({
        data: { referenceId, startNumber: start, prior },
      });
      if (runRef.current !== token) return;
      const seeded: Frame[] = plan.variants.map((variant) => ({
        ...variant,
        status: "waiting",
      }));
      setFrames((current) => (continueSequence ? [...current, ...seeded] : seeded));
      setPhase("rendering");
      scrollToFrames();
      await renderPool(referenceId, seeded, token);
      if (runRef.current === token) setPhase("idle");
    } catch (error) {
      if (runRef.current !== token) return;
      setPlanError(messageFrom(error));
      setPhase("idle");
    }
  }

  const buttonLabel = (() => {
    if (phase === "planning") return "Planning ten frames";
    if (phase === "rendering") return `Rendering ${batchReady} of ${Math.max(batch.length, 10)}`;
    if (frames.length > 0 && lastNumber >= 200) return "Sequence complete";
    if (frames.length > 0) return "Next 10";
    return "10 Variants";
  })();

  const sequenceFull = lastNumber >= 200;

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="font-display text-4xl leading-tight tracking-tight">Ten full frames.</h1>
        <p className="text-base text-muted">
          Choose a photograph. Ten Frames keeps its identity and builds ten separate pictures — each one its own frame.
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif,.jpg,.jpeg,.png,.webp,.gif,.avif,.bmp,.tif,.tiff"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          void onFile(file);
        }}
      />

      {photo ? (
        <figure className="space-y-3">
          <div className="overflow-hidden rounded-xl bg-surface p-4">
            <img
              src={photo.previewUrl}
              alt="Uploaded reference photograph"
              className="w-full rounded-md object-contain"
            />
          </div>
          <figcaption className="flex items-center justify-between gap-3 text-sm text-muted">
            <span className="tabular-nums">
              Reference · {photo.width} × {photo.height}
              {photo.uploading ? " · saving" : ""}
            </span>
            <button
              type="button"
              className="inline-flex min-h-11 items-center font-medium text-fg underline-offset-4 hover:underline disabled:opacity-50"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              Choose another
            </button>
          </figcaption>
        </figure>
      ) : (
        <button
          type="button"
          className="flex min-h-52 w-full flex-col items-center justify-center gap-3 rounded-xl bg-surface px-6 py-8 text-center"
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus className="size-6 text-muted" aria-hidden="true" />
          <span className="font-display text-3xl leading-tight">Choose a photograph</span>
          <span className="text-sm text-muted">Gallery · JPEG, PNG, WEBP, HEIC, GIF, AVIF</span>
        </button>
      )}

      {fileError ? <p className="text-sm text-danger">{fileError}</p> : null}

      <div className="space-y-3">
        <button
          type="button"
          className="btn-primary"
          aria-busy={busy}
          disabled={!photo?.id || photo.uploading || busy || (frames.length > 0 && sequenceFull)}
          onClick={() => void generate(frames.length > 0)}
        >
          {buttonLabel}
        </button>
        {planError ? <p className="text-sm text-danger">{planError}</p> : null}
        {frames.length > 0 && !busy ? (
          <button
            type="button"
            className="text-sm font-medium text-muted underline-offset-4 hover:text-fg hover:underline"
            onClick={() => {
              runRef.current += 1;
              setFrames([]);
              setPlanError(null);
              setPhase("idle");
              setBatchStart(1);
            }}
          >
            Start this photograph over
          </button>
        ) : null}
        <p className="text-sm text-faint">
          Each press asks Grok for ten new photographs from this reference. Later presses continue the sequence.
        </p>
      </div>

      {phase === "planning" && frames.length === 0 ? (
        <div className="space-y-4" aria-live="polite">
          <p className="text-sm text-muted">Reading the photograph and separating ten pictures.</p>
          <div className="h-80 animate-pulse rounded-xl bg-surface" />
        </div>
      ) : null}

      {frames.length > 0 ? (
        <div ref={framesRef} className="scroll-mt-24 space-y-10" aria-live="polite">
          <h2 className="font-display text-2xl tracking-tight">
            {frames[0]?.number}–{frames.at(-1)?.number}
          </h2>
          <ol className="space-y-10">
            {frames.map((frame) => (
              <li key={frame.number} className="frame-enter space-y-3">
                <div className="overflow-hidden rounded-xl bg-surface p-3">
                  <div
                    className="overflow-hidden rounded-md bg-surface-2"
                    style={{ aspectRatio: aspectToCss(frame.aspectRatio) }}
                  >
                      {frame.url ? (
                      <img src={frame.url} alt={frame.name} className="h-full w-full object-contain" />
                    ) : (
                      <div className="flex h-full min-h-48 items-end p-4">
                        <p className="text-sm text-muted">
                          {frame.status === "error" ? "This frame did not finish." : "Making this frame"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2 px-1">
                  <p className="font-display text-2xl leading-tight tracking-tight">
                    <span className="mr-2 text-faint tabular-nums">{frame.number}</span>
                    {frame.name}
                  </p>
                  <p className="text-sm text-muted">{frame.composition}</p>
                  {frame.error ? <p className="text-sm text-danger">{frame.error}</p> : null}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {frame.url ? (
                      <button
                        type="button"
                        className="btn-line"
                        onClick={() => void saveImage(frame.url!, `ten-frames-${frame.number}-${slug(frame.name) || "frame"}.jpg`)}
                      >
                        <Download className="size-4" aria-hidden="true" />
                        Save
                      </button>
                    ) : null}
                    {frame.status === "error" && photo?.id ? (
                      <button
                        type="button"
                        className="btn-line"
                        onClick={() => void renderOne(photo.id!, frame, runRef.current)}
                      >
                        Retry frame
                      </button>
                    ) : null}
                  </div>
                  <details className="text-sm text-faint">
                    <summary className="min-h-11 py-2">Prompt</summary>
                    <p className="pb-2 text-muted">{frame.prompt}</p>
                  </details>
                </div>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  );
}
