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

Upload text-based PDF, PPTX, DOCX, TXT, or Markdown, or paste notes. Material is stored in browser localStorage and sent to the configured provider when generating a quest. Files up to 15 MB and extracted text of 100–60,000 characters are supported. Scanned PDFs need external OCR. Explore the Forgotten Island with a movable character (WASD / arrow keys, or click/tap to walk). Approach a crystal and press E or the interaction button to open a challenge. Restore all five crystals, then enter the golden portal to complete the expedition. AI quests request two typed recall spells, two true-or-false judgments, and one multiple-choice riddle, all with explanations and verified source quotes. Recall answers accept model-supplied synonyms and differences in case/spacing; they are not graded by a second AI call. Incorrect answers reveal the solution and still let you explore, but award no XP. Four correct answers advance to the next of four difficulty tiers; missed rounds keep the same tier. XP and progress persist on this browser. There is no account sync.

## Validation
```sh
npm test
npm run build
```

Run both API and Vite for development; `npm run preview` can serve the build with the same API proxy. This prototype is intended for local/trusted use. Before public hosting add authentication, request rate limits, and durable per-user storage. Avoid exposing a shared provider key through an unauthenticated public API.

## Code layout

- `src/main.js`: entry point and styles.
- `src/app.js`: application state, events, and quest lifecycle.
- `src/views/`: layout, dashboard, upload dialog, and adventure/challenge templates.
- `src/game/`: canvas world rendering, movement/interaction, answer grading, and game styles.
- `src/lib/`: document extraction, API client, browser storage, and HTML helpers.
- `server.mjs`: HTTP API and provider transport.
- `server/`: question prompt and response/source validation.
- `test/`: API, validation, and grading tests.
