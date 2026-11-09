import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { readFileSync } from "node:fs";
const require = createRequire(import.meta.url);
export function ocrAssets() {
  const root = (name) => dirname(require.resolve(`${name}/package.json`));
  const files = {
    "worker.min.js": join(root("tesseract.js"), "dist/worker.min.js"),
    "tesseract-core-lstm.wasm.js": join(
      root("tesseract.js-core"),
      "tesseract-core-lstm.wasm.js",
    ),
    "tesseract-core-lstm.wasm": join(
      root("tesseract.js-core"),
      "tesseract-core-lstm.wasm",
    ),
    "eng.traineddata.gz": join(
      root("@tesseract.js-data/eng"),
      "4.0.0/eng.traineddata.gz",
    ),
  };
  return {
    name: "local-ocr-assets",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const name = req.url?.split("?")[0].replace(/^\/ocr\//, "");
        if (!req.url?.startsWith("/ocr/") || !files[name]) return next();
        res.setHeader(
          "Content-Type",
          name.endsWith(".js")
            ? "text/javascript"
            : name.endsWith(".wasm")
              ? "application/wasm"
              : "application/octet-stream",
        );
        res.end(readFileSync(files[name]));
      });
    },
    generateBundle() {
      for (const [name, path] of Object.entries(files))
        this.emitFile({
          type: "asset",
          fileName: `ocr/${name}`,
          source: readFileSync(path),
        });
    },
  };
}
