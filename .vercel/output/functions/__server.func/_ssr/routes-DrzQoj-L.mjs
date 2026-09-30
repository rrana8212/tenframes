import { o as __toESM } from "../_runtime.mjs";
import { J as require_react, x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as getServerFnById, i as TSS_SERVER_FUNCTION, r as createServerFn } from "./ssr.mjs";
import { n as authMiddleware, t as aspectToCss } from "./aspect-DC4YBkrE.mjs";
import { i as Download, r as ImagePlus } from "../_libs/lucide-react.mjs";
import { n as Welcome, r as useCurrentUserState, t as Shell } from "./welcome-DT8GKKvA.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-DrzQoj-L.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
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
var uploadReference = createServerFn({ method: "POST" }).validator(assertUpload).middleware([authMiddleware]).handler(createSsrRpc("18a10f73f0494c57965465c1e8b5e728a7afe6238961795d5c19a4ef29419a0f"));
var planVariants = createServerFn({ method: "POST" }).validator(assertPlan).middleware([authMiddleware]).handler(createSsrRpc("29f66cc022d926d9f29ae8f0df0654237917180e433c430390c8976a7cb9928f"));
var renderVariant = createServerFn({ method: "POST" }).validator(assertRender).middleware([authMiddleware]).handler(createSsrRpc("be6e018b79cbe3438258c600500ce578bbbbfdfc2dd7408686a42be7e068de85"));
var IMAGE_EXT = /\.(heic|heif|jpe?g|png|webp|gif|avif|bmp|tiff?|svg)$/i;
function friendly(message) {
	return new Error(message);
}
async function blobToBase64(blob) {
	const bytes = new Uint8Array(await blob.arrayBuffer());
	let binary = "";
	const step = 32768;
	for (let i = 0; i < bytes.length; i += step) binary += String.fromCharCode(...bytes.subarray(i, i + step));
	return btoa(binary);
}
async function toJpeg(bitmap, maxEdge, quality) {
	const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
	const width = Math.max(1, Math.round(bitmap.width * scale));
	const height = Math.max(1, Math.round(bitmap.height * scale));
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw friendly("This browser could not prepare the photograph.");
	ctx.drawImage(bitmap, 0, 0, width, height);
	return {
		blob: await new Promise((resolve, reject) => {
			canvas.toBlob((result) => result ? resolve(result) : reject(friendly("Could not encode the photograph.")), "image/jpeg", quality);
		}),
		width,
		height
	};
}
async function sourceBlob(file) {
	if (!(file.type === "image/heic" || file.type === "image/heif" || /\.heic$/i.test(file.name) || /\.heif$/i.test(file.name))) return file;
	try {
		const heic2any = (await import("../_libs/heic2any.mjs").then((n) => /* @__PURE__ */ __toESM(n.t()))).default;
		const converted = await heic2any({
			blob: file,
			toType: "image/jpeg",
			quality: .92
		});
		return Array.isArray(converted) ? converted[0] : converted;
	} catch {
		throw friendly("This HEIC photo could not be read. Export it as JPEG from your gallery and try again.");
	}
}
function isGalleryImage(file) {
	return file.type.startsWith("image/") || IMAGE_EXT.test(file.name);
}
async function prepareGalleryFile(file) {
	if (!isGalleryImage(file)) throw friendly("Choose a photograph. JPEG, PNG, WEBP, HEIC, GIF, AVIF, and similar gallery files work.");
	const blob = await sourceBlob(file);
	let bitmap;
	try {
		bitmap = await createImageBitmap(blob, { imageOrientation: "from-image" });
	} catch {
		throw friendly("This browser could not open that file. Try JPEG, PNG, WEBP, or HEIC.");
	}
	try {
		let maxEdge = 1280;
		let quality = .86;
		let encoded = await toJpeg(bitmap, maxEdge, quality);
		let dataBase64 = await blobToBase64(encoded.blob);
		while (dataBase64.length > 15e5 && maxEdge > 720) {
			maxEdge = Math.round(maxEdge * .8);
			quality = .74;
			encoded = await toJpeg(bitmap, maxEdge, quality);
			dataBase64 = await blobToBase64(encoded.blob);
		}
		if (dataBase64.length > 18e5) throw friendly("That photograph is still too large after resizing. Try a different one.");
		return {
			dataBase64,
			width: encoded.width,
			height: encoded.height,
			previewUrl: URL.createObjectURL(encoded.blob)
		};
	} finally {
		bitmap.close();
	}
}
function messageFrom(error) {
	if (error instanceof Error && error.message) {
		if (error.message === "Unauthorized") return "Sign in to generate photographs.";
		return error.message;
	}
	return "Something went wrong. Try again.";
}
function slug(value) {
	return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
}
async function saveImage(url, filename) {
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
function Studio() {
	const inputRef = (0, import_react.useRef)(null);
	const framesRef = (0, import_react.useRef)(null);
	const runRef = (0, import_react.useRef)(0);
	const [photo, setPhoto] = (0, import_react.useState)(null);
	const [fileError, setFileError] = (0, import_react.useState)(null);
	const [planError, setPlanError] = (0, import_react.useState)(null);
	const [frames, setFrames] = (0, import_react.useState)([]);
	const [phase, setPhase] = (0, import_react.useState)("idle");
	const [batchStart, setBatchStart] = (0, import_react.useState)(1);
	const busy = phase !== "idle";
	const lastNumber = Number(frames.at(-1)?.number ?? 0);
	const batch = frames.filter((frame) => Number(frame.number) >= batchStart);
	const batchReady = batch.filter((frame) => frame.status === "done" || frame.status === "error").length;
	function scrollToFrames() {
		const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		framesRef.current?.scrollIntoView({
			behavior: reduce ? "auto" : "smooth",
			block: "start"
		});
	}
	async function renderOne(referenceId, frame, token) {
		setFrames((current) => {
			return (current.some((item) => item.number === frame.number) ? current : [...current, frame]).map((item) => item.number === frame.number ? {
				...item,
				status: "rendering",
				error: void 0
			} : item);
		});
		try {
			const result = await renderVariant({ data: {
				referenceId,
				prompt: frame.prompt,
				aspectRatio: frame.aspectRatio
			} });
			if (runRef.current !== token) return;
			setFrames((current) => current.map((item) => item.number === frame.number ? {
				...item,
				status: "done",
				url: result.url,
				error: void 0
			} : item));
		} catch (error) {
			if (runRef.current !== token) return;
			setFrames((current) => current.map((item) => item.number === frame.number ? {
				...item,
				status: "error",
				error: messageFrom(error)
			} : item));
		}
	}
	async function renderPool(referenceId, seeded, token) {
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
	async function onFile(file) {
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
					uploading: true
				};
			});
			const uploaded = await uploadReference({ data: {
				dataBase64: prepared.dataBase64,
				width: prepared.width,
				height: prepared.height
			} });
			if (runRef.current !== token) return;
			setPhoto((current) => current ? {
				...current,
				id: uploaded.id,
				uploading: false
			} : current);
		} catch (error) {
			if (runRef.current !== token) return;
			setPhoto(null);
			setFileError(messageFrom(error));
		}
	}
	async function generate(continueSequence) {
		if (!photo?.id || busy) return;
		const token = ++runRef.current;
		const referenceId = photo.id;
		const start = continueSequence ? lastNumber + 1 : 1;
		const prior = continueSequence ? frames.map((frame) => ({
			number: frame.number,
			name: frame.name,
			composition: frame.composition,
			mechanism: frame.mechanism
		})) : [];
		setPlanError(null);
		setPhase("planning");
		setBatchStart(start);
		if (!continueSequence) setFrames([]);
		try {
			const plan = await planVariants({ data: {
				referenceId,
				startNumber: start,
				prior
			} });
			if (runRef.current !== token) return;
			const seeded = plan.variants.map((variant) => ({
				...variant,
				status: "waiting"
			}));
			setFrames((current) => continueSequence ? [...current, ...seeded] : seeded);
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-4xl leading-tight tracking-tight",
					children: "Ten full frames."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-base text-muted",
					children: "Choose a photograph. Ten Frames keeps its identity and builds ten separate pictures — each one its own frame."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				ref: inputRef,
				type: "file",
				accept: "image/*,.heic,.heif,.jpg,.jpeg,.png,.webp,.gif,.avif,.bmp,.tif,.tiff",
				className: "sr-only",
				onChange: (event) => {
					const file = event.target.files?.[0];
					event.target.value = "";
					onFile(file);
				}
			}),
			photo ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figure", {
				className: "space-y-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-hidden rounded-xl bg-surface p-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: photo.previewUrl,
						alt: "Uploaded reference photograph",
						className: "w-full rounded-md object-contain"
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figcaption", {
					className: "flex items-center justify-between gap-3 text-sm text-muted",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "tabular-nums",
						children: [
							"Reference · ",
							photo.width,
							" × ",
							photo.height,
							photo.uploading ? " · saving" : ""
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "inline-flex min-h-11 items-center font-medium text-fg underline-offset-4 hover:underline disabled:opacity-50",
						disabled: busy,
						onClick: () => inputRef.current?.click(),
						children: "Choose another"
					})]
				})]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "flex min-h-52 w-full flex-col items-center justify-center gap-3 rounded-xl bg-surface px-6 py-8 text-center",
				onClick: () => inputRef.current?.click(),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImagePlus, {
						className: "size-6 text-muted",
						"aria-hidden": "true"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-display text-3xl leading-tight",
						children: "Choose a photograph"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-sm text-muted",
						children: "Gallery · JPEG, PNG, WEBP, HEIC, GIF, AVIF"
					})
				]
			}),
			fileError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-danger",
				children: fileError
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn-primary",
						"aria-busy": busy,
						disabled: !photo?.id || photo.uploading || busy || frames.length > 0 && sequenceFull,
						onClick: () => void generate(frames.length > 0),
						children: buttonLabel
					}),
					planError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-danger",
						children: planError
					}) : null,
					frames.length > 0 && !busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "text-sm font-medium text-muted underline-offset-4 hover:text-fg hover:underline",
						onClick: () => {
							runRef.current += 1;
							setFrames([]);
							setPlanError(null);
							setPhase("idle");
							setBatchStart(1);
						},
						children: "Start this photograph over"
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-faint",
						children: "Each press asks Grok for ten new photographs from this reference. Later presses continue the sequence."
					})
				]
			}),
			phase === "planning" && frames.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-4",
				"aria-live": "polite",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "Reading the photograph and separating ten pictures."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-80 animate-pulse rounded-xl bg-surface" })]
			}) : null,
			frames.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				ref: framesRef,
				className: "scroll-mt-24 space-y-10",
				"aria-live": "polite",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
					className: "font-display text-2xl tracking-tight",
					children: [
						frames[0]?.number,
						"–",
						frames.at(-1)?.number
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
					className: "space-y-10",
					children: frames.map((frame) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "frame-enter space-y-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "overflow-hidden rounded-xl bg-surface p-3",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "overflow-hidden rounded-md bg-surface-2",
								style: { aspectRatio: aspectToCss(frame.aspectRatio) },
								children: frame.url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: frame.url,
									alt: frame.name,
									className: "h-full w-full object-contain"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex h-full min-h-48 items-end p-4",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-muted",
										children: frame.status === "error" ? "This frame did not finish." : "Making this frame"
									})
								})
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2 px-1",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "font-display text-2xl leading-tight tracking-tight",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "mr-2 text-faint tabular-nums",
										children: frame.number
									}), frame.name]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-muted",
									children: frame.composition
								}),
								frame.error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-danger",
									children: frame.error
								}) : null,
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap gap-2 pt-1",
									children: [frame.url ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										className: "btn-line",
										onClick: () => void saveImage(frame.url, `ten-frames-${frame.number}-${slug(frame.name) || "frame"}.jpg`),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {
											className: "size-4",
											"aria-hidden": "true"
										}), "Save"]
									}) : null, frame.status === "error" && photo?.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "btn-line",
										onClick: () => void renderOne(photo.id, frame, runRef.current),
										children: "Retry frame"
									}) : null]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
									className: "text-sm text-faint",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", {
										className: "min-h-11 py-2",
										children: "Prompt"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "pb-2 text-muted",
										children: frame.prompt
									})]
								})
							]
						})]
					}, frame.number))
				})]
			}) : null
		]
	});
}
function Home() {
	const { user, isPending } = useCurrentUserState();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, { children: isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm font-medium text-muted",
				children: "Grok darkroom"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-4xl leading-tight tracking-tight",
				children: "One photograph. Ten different pictures."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-base text-muted",
				children: "Sign in with the account you use for Grok, choose a gallery photo, and make ten separate full-frame pictures."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-faint",
				children: "Checking your Grok account."
			})
		]
	}) : user ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Studio, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Welcome, {}) });
}
//#endregion
export { Home as component };
