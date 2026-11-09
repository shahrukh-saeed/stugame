import { UploadError } from "./upload-errors.js";
import * as pdfjs from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;
export async function extractPDF(buffer, onProgress = () => {}) {
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;
  let worker,
    scanned = 0;
  const pages = [];
  try {
    for (let i = 1; i <= pdf.numPages; i++) {
      onProgress(`Reading PDF page ${i} of ${pdf.numPages}…`);
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      let text = content.items
        .map((item) => `${item.str || ""}${item.hasEOL ? "\n" : " "}`)
        .join("");
      if (text.trim().length < 40) {
        if (++scanned > 20)
          throw new UploadError(
            "ocr-limit",
            "This PDF has more than 20 pages needing text recognition. Split it into PDFs with at most 20 scanned pages, or paste its text.",
          );
        onProgress(
          `Recognizing text on PDF page ${i} of ${pdf.numPages} (English)…`,
        );
        if (!worker) {
          const { createWorker } = await import("tesseract.js");
          const base = new URL(
            `${import.meta.env.BASE_URL}ocr/`,
            location.origin,
          ).href;
          try {
            worker = await createWorker("eng", 1, {
              workerPath: base + "worker.min.js",
              corePath: base + "tesseract-core-lstm.wasm.js",
              langPath: base,
              workerBlobURL: false,
            });
          } catch {
            throw new UploadError(
              "ocr-start",
              "Text recognition could not start. Reload the app and try again. If it persists, paste the notes or use a PDF with selectable text.",
            );
          }
        }
        const viewport = page.getViewport({
          scale: Math.min(
            2,
            2200 /
              Math.max(
                page.view[2] - page.view[0],
                page.view[3] - page.view[1],
              ),
          ),
        });
        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        try {
          await page.render({
            canvasContext: canvas.getContext("2d"),
            viewport,
          }).promise;
          let result;
          try {
            result = await worker.recognize(canvas);
          } catch {
            throw new UploadError(
              "ocr-read",
              `Text recognition failed on PDF page ${i}. Try a clearer scan, a smaller PDF, or paste the text.`,
            );
          }
          if (result.data.text.trim().length > text.trim().length)
            text = result.data.text;
        } finally {
          canvas.width = canvas.height = 0;
        }
      }
      pages.push(text);
      page.cleanup();
    }
    return pages.join("\n\n");
  } finally {
    await worker?.terminate();
    await pdf.destroy();
  }
}
