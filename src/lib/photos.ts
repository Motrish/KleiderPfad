import "server-only";
import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

export const uploadDir = process.env.UPLOAD_DIR || "/data/uploads";
export async function storePhoto(file: File): Promise<string> {
  if (file.size > 10 * 1024 * 1024) throw new Error("Foto darf maximal 10 MB groß sein.");
  if (!["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"].includes(file.type)) {
    throw new Error("JPEG, PNG, WebP oder HEIC erforderlich.");
  }
  const input = Buffer.from(await file.arrayBuffer());
  const output = await sharp(input, { limitInputPixels: 24_000_000 })
    .rotate().resize({ width: 1400, height: 1400, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 80, mozjpeg: true }).toBuffer();
  const filename = randomUUID() + ".jpg";
  await mkdir(uploadDir, { recursive: true });
  await writeFile(join(uploadDir, filename), output, { flag: "wx", mode: 0o600 });
  return filename;
}
