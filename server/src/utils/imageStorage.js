const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const UPLOADS_ROOT = path.join(__dirname, "..", "..", "uploads");

const MIME_EXT = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const MAX_BYTES = 6 * 1024 * 1024; // 6MB per image, generous but bounded

/**
 * Saves a `data:image/...;base64,...` string as a real file under
 * backend/uploads/<subdir>/ and returns its public URL path
 * (e.g. "/uploads/avatars/ab12cd.jpg"), which is what actually gets stored
 * in the JSON database instead of the raw base64 blob.
 *
 * Non-data-URL input (e.g. an existing "/uploads/..." path, or empty string)
 * is passed through untouched, so re-saving a profile without changing the
 * photo is a no-op.
 */
function saveBase64Image(dataUrl, subdir) {
  if (!dataUrl || typeof dataUrl !== "string") return dataUrl || "";
  if (!dataUrl.startsWith("data:")) return dataUrl; // already a URL/path — nothing to do

  const match = /^data:(image\/[a-zA-Z+]+);base64,(.+)$/.exec(dataUrl);
  if (!match) throw new Error("Unsupported image format.");

  const mime = match[1].toLowerCase();
  const ext = MIME_EXT[mime];
  if (!ext) throw new Error("Unsupported image type. Please upload a JPG, PNG, WEBP or GIF.");

  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length > MAX_BYTES) throw new Error("Image is too large (max 6MB).");

  const dir = path.join(UPLOADS_ROOT, subdir);
  fs.mkdirSync(dir, { recursive: true });

  const filename = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
  fs.writeFileSync(path.join(dir, filename), buffer);

  return `/uploads/${subdir}/${filename}`;
}

function deleteLocalImage(publicUrl) {
  if (!publicUrl || !publicUrl.startsWith("/uploads/")) return;
  const filePath = path.join(UPLOADS_ROOT, publicUrl.replace("/uploads/", ""));
  fs.unlink(filePath, () => {}); // best-effort, ignore errors
}

module.exports = { saveBase64Image, deleteLocalImage, UPLOADS_ROOT };
