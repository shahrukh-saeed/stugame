import { test } from "node:test";
import assert from "node:assert/strict";
import {
  UploadError,
  checkFile,
  checkMaterial,
  unreadableError,
} from "../src/lib/upload-errors.js";
const file = (name, size = 500) => ({ name, size });
function fails(fn, code, part) {
  assert.throws(
    fn,
    (e) =>
      e instanceof UploadError && e.code === code && e.message.includes(part),
  );
}
test("file failures identify unsupported type, empty files and size with a remedy", () => {
  fails(() => checkFile(file("notes.ppt")), "unsupported", "export");
  fails(() => checkFile(file("notes.pdf", 0)), "empty", "0 bytes");
  fails(
    () => checkFile(file("notes.pdf", 16 * 1024 * 1024)),
    "too-large",
    "16.0 MB",
  );
  assert.equal(checkFile(file("NOTES.PDF")), "pdf");
});
test("insufficient extraction gives accurate count and format-specific next steps", () => {
  fails(
    () => checkMaterial("Hello", file("notes.pdf")),
    "short-material",
    "5 readable characters",
  );
  fails(
    () => checkMaterial("", file("notes.pptx")),
    "short-material",
    "embedded images",
  );
  fails(() => checkMaterial("x".repeat(99)), "short-notes", "99 characters");
  fails(() => checkMaterial("x".repeat(60001)), "long-material", "60,000");
  assert.doesNotThrow(() => checkMaterial("x".repeat(100)));
});
test("encrypted and unreadable documents have separate errors and preserve known OCR errors", () => {
  assert.equal(
    unreadableError(file("notes.pdf"), { name: "PasswordException" }).code,
    "password",
  );
  assert.match(
    unreadableError(file("bad.docx"), new Error("internal zip details"))
      .message,
    /export a fresh copy/,
  );
  const ocr = new UploadError("ocr-start", "Recognition failed.");
  assert.equal(unreadableError(file("notes.pdf"), ocr), ocr);
});
