export class UploadError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "UploadError";
    this.code = code;
  }
}
export function checkFile(file) {
  const ext = file.name.split(".").pop().toLowerCase();
  if (!["pdf", "pptx", "docx", "txt", "md"].includes(ext))
    throw new UploadError(
      "unsupported",
      "This file format is not supported. Choose a PDF, PPTX, DOCX, TXT, or Markdown file. For older .ppt or .doc files, export them as PPTX, DOCX, or PDF first.",
    );
  if (!file.size)
    throw new UploadError(
      "empty",
      `"${file.name}" is empty (0 bytes). Export or download the original file again, then select the new copy.`,
    );
  if (file.size > 15 * 1024 * 1024)
    throw new UploadError(
      "too-large",
      `"${file.name}" is ${(file.size / 1024 / 1024).toFixed(1)} MB. The upload limit is 15 MB. Compress it or split it into smaller files.`,
    );
  return ext;
}
export function unreadableError(file, error) {
  if (error instanceof UploadError) return error;
  if (error?.name === "PasswordException")
    return new UploadError(
      "password",
      "This PDF is password-protected. Open it with the password and export an unlocked copy before uploading.",
    );
  return new UploadError(
    "unreadable",
    `We couldn't read "${file.name}" as a ${file.name.split(".").pop().toUpperCase()} file. It may be damaged or have the wrong extension. Check that it opens normally, then export a fresh copy in a supported format.`,
  );
}
export function checkMaterial(text, file) {
  const count = text.trim().length;
  if (count < 100) {
    if (!file)
      throw new UploadError(
        "short-notes",
        `Your notes contain ${count} characters; at least 100 are needed to create a quest. Paste more course material or choose a file.`,
      );
    const ext = file.name.split(".").pop().toLowerCase();
    const hint =
      ext === "pdf"
        ? "Pages with little embedded text were checked with English text recognition. Blurry, handwritten, or non-English pages may not be readable. Try a clearer PDF or paste its text."
        : ["docx", "pptx"].includes(ext)
          ? "Text inside embedded images is not extracted from Word or PowerPoint. Export the document as a PDF for text recognition, or paste the notes."
          : "Add more course material or paste additional notes below.";
    throw new UploadError(
      "short-material",
      `"${file.name}" and your pasted notes contain ${count} readable characters; at least 100 are needed. ${hint}`,
    );
  }
  if (text.length > 60000)
    throw new UploadError(
      "long-material",
      `Your material contains ${text.length.toLocaleString()} characters; the limit is 60,000 per quest. Upload a shorter section or split the course into several materials.`,
    );
}
