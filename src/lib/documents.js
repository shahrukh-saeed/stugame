import { checkFile, unreadableError, UploadError } from "./upload-errors.js";
import mammoth from "mammoth";
import JSZip from "jszip";

export async function extract(file, onProgress = () => {}) {
  const ext = checkFile(file);
  let buffer;
  try {
    buffer = await file.arrayBuffer();
  } catch {
    throw new UploadError(
      "file-access",
      "Your browser could not open the selected file. Download it to this device first, then select it again.",
    );
  }
  try {
    if (["txt", "md"].includes(ext)) return new TextDecoder().decode(buffer);
    if (ext === "docx")
      return (await mammoth.extractRawText({ arrayBuffer: buffer })).value;
    if (ext === "pdf") {
      const { extractPDF } = await import("./pdf.js");
      return extractPDF(buffer, onProgress);
    }
    if (ext === "pptx") {
      const zip = await JSZip.loadAsync(buffer);
      const slides = Object.keys(zip.files)
        .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
        .sort(
          (a, b) =>
            Number(a.match(/slide(\d+)/)[1]) - Number(b.match(/slide(\d+)/)[1]),
        );
      if (!slides.length)
        throw new UploadError(
          "no-slides",
          "This PowerPoint file contains no readable slides. Export it as a PDF or choose another presentation.",
        );
      return (
        await Promise.all(
          slides.map(async (n) => {
            const xml = new DOMParser().parseFromString(
              await zip.file(n).async("text"),
              "application/xml",
            );
            return [...xml.getElementsByTagNameNS("*", "t")]
              .map((x) => x.textContent)
              .join(" ");
          }),
        )
      ).join("\n\n");
    }
  } catch (error) {
    throw unreadableError(file, error);
  }
}
