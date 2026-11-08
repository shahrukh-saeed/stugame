# Stugame
Turn course slides and notes into progressively harder AI-generated study quests.

## Run locally
Requires Node.js 22.12+ (tested on 24).

```sh
npm ci
cp .env.example .env
# Edit .env with your OpenAI-compatible provider base URL, model, and key.
npm run api
# In another terminal:
npm run dev
```

`AI_BASE_URL` is the API root including any version prefix (for example `https://api.openai.com/v1`). The server appends `/chat/completions`. `AI_MODEL` accepts the provider's model identifier; `AI_API_KEY` is optional for unauthenticated local providers. Restart the API after changing configuration. The provider must support chat completions and generating JSON text; no provider-specific structured-output feature is required. Keys remain on the server and must never use a `VITE_` prefix.

Upload text-based PDF, PPTX, DOCX, TXT, or Markdown, or paste notes. Material is stored in browser localStorage and sent to the configured provider when generating a quest. Files up to 15 MB and extracted text of 100–60,000 characters are supported. Scanned PDFs need external OCR. A quest contains five source-grounded questions with explanations. Four correct answers advance to the next of four difficulty tiers; missed rounds keep the same tier. XP and progress persist on this browser. There is no account sync.

## Validation
```sh
npm test
npm run build
```

Run both API and Vite for development; `npm run preview` can serve the build with the same API proxy. This prototype is intended for local/trusted use. Before public hosting add authentication, request rate limits, and durable per-user storage. Avoid exposing a shared provider key through an unauthenticated public API.
