import * as pdfjs from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import mammoth from "mammoth";
import JSZip from "jszip";
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

export async function extract(file) {
  if (file.size > 15 * 1024 * 1024)
    throw Error("Please use a file smaller than 15 MB.");
  const ext = file.name.split(".").pop().toLowerCase(),
    buffer = await file.arrayBuffer();
  if (["txt", "md"].includes(ext)) return new TextDecoder().decode(buffer);
  if (ext === "docx")
    return (await mammoth.extractRawText({ arrayBuffer: buffer })).value;
  if (ext === "pdf") {
    const pdf = await pdfjs.getDocument({ data: buffer }).promise;
    let pages = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const p = await pdf.getPage(i);
      pages.push((await p.getTextContent()).items.map((x) => x.str).join(" "));
    }
    await pdf.destroy();
    return pages.join("\n\n");
  }
  if (ext === "pptx") {
    const zip = await JSZip.loadAsync(buffer);
    const slides = Object.keys(zip.files)
      .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
      .sort(
        (a, b) =>
          Number(a.match(/slide(\d+)/)[1]) - Number(b.match(/slide(\d+)/)[1]),
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
  throw Error("Please choose a PDF, PPTX, DOCX, TXT, or Markdown file.");
}
