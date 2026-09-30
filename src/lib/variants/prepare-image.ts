export type PreparedImage = {
  dataBase64: string;
  width: number;
  height: number;
  previewUrl: string;
};

const IMAGE_EXT = /\.(heic|heif|jpe?g|png|webp|gif|avif|bmp|tiff?|svg)$/i;

function friendly(message: string): Error {
  return new Error(message);
}

async function blobToBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  const step = 0x8000;
  for (let i = 0; i < bytes.length; i += step) {
    binary += String.fromCharCode(...bytes.subarray(i, i + step));
  }
  return btoa(binary);
}

async function toJpeg(bitmap: ImageBitmap, maxEdge: number, quality: number): Promise<{ blob: Blob; width: number; height: number }> {
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw friendly("This browser could not prepare the photograph.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(friendly("Could not encode the photograph."))),
      "image/jpeg",
      quality,
    );
  });
  return { blob, width, height };
}

async function sourceBlob(file: File): Promise<Blob> {
  const heic =
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    /\.heic$/i.test(file.name) ||
    /\.heif$/i.test(file.name);
  if (!heic) return file;
  try {
    const heic2any = (await import("heic2any")).default;
    const converted = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.92 });
    return Array.isArray(converted) ? converted[0] : converted;
  } catch {
    throw friendly("This HEIC photo could not be read. Export it as JPEG from your gallery and try again.");
  }
}

export function isGalleryImage(file: File): boolean {
  return file.type.startsWith("image/") || IMAGE_EXT.test(file.name);
}

export async function prepareGalleryFile(file: File): Promise<PreparedImage> {
  if (!isGalleryImage(file)) {
    throw friendly("Choose a photograph. JPEG, PNG, WEBP, HEIC, GIF, AVIF, and similar gallery files work.");
  }
  const blob = await sourceBlob(file);
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(blob, { imageOrientation: "from-image" });
  } catch {
    throw friendly("This browser could not open that file. Try JPEG, PNG, WEBP, or HEIC.");
  }
  try {
    let maxEdge = 1280;
    let quality = 0.86;
    let encoded = await toJpeg(bitmap, maxEdge, quality);
    let dataBase64 = await blobToBase64(encoded.blob);
    while (dataBase64.length > 1_500_000 && maxEdge > 720) {
      maxEdge = Math.round(maxEdge * 0.8);
      quality = 0.74;
      encoded = await toJpeg(bitmap, maxEdge, quality);
      dataBase64 = await blobToBase64(encoded.blob);
    }
    if (dataBase64.length > 1_800_000) {
      throw friendly("That photograph is still too large after resizing. Try a different one.");
    }
    return {
      dataBase64,
      width: encoded.width,
      height: encoded.height,
      previewUrl: URL.createObjectURL(encoded.blob),
    };
  } finally {
    bitmap.close();
  }
}
