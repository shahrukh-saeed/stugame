# Stugame
Upload course notes and play a first-person obstacle course with AI-generated question checkpoints.

## Run locally
Requires Node.js 22.12+ (tested on 24).

```sh
npm ci
cp .env.example .env
# Configure your OpenAI-compatible endpoint, model, and optional key.
npm run api
# In a second terminal:
npm run dev
```

`AI_BASE_URL` includes the version prefix (e.g. `https://api.openai.com/v1`); `/chat/completions` is appended. `AI_MODEL` accepts any model identifier supported by that provider. `AI_API_KEY` is optional for unauthenticated local providers. Restart the API after configuration changes. Keys remain server-side; never use a `VITE_` key variable. Providers must support chat completions and JSON text output.

## Play

The route bends at every gate: north, east, north, west, then north. Jump gaps and raised stepping blocks, cross a narrow section, and navigate staggered platforms. Questions open automatically on reaching each checkpoint. Correct answers open the next gate; incorrect answers provide feedback and a retry. Falls return you to your last cleared checkpoint without removing rewards. Complete five gates and cross the finish banner to finish.

- WASD moves relative to your view. Space jumps; Shift sprints.
- Click the scene for mouse capture, or drag to look. Arrow keys look left/right or move forward/backward. Escape releases the mouse. Mouse capture is optional.
- E opens/reopens the question when you are at a gate.
- I opens the question power-up inventory.
- Touch: drag the left half of the scene to move, the right half to look, and tap Jump. There is no bottom arrow pad.
- Options contains sound and fullscreen controls. Fullscreen falls back to a full-window layout if unsupported. Sound begins after a user gesture and pauses when the page is hidden or the course is left.

Requires WebGL 2. Enable hardware acceleration if graphics cannot start.

## Rewards and hints

The survival backpack, supplies, stamina, ropes, and binoculars have been removed. Each correctly cleared gate awards one **Insight**. Every second cleared gate also awards one **Focus**. Duplicate submissions or retries cannot farm rewards.

At a question, spend Insight to reveal its verified supporting passage. Focus reveals a recall answer pattern, removes two wrong MCQ options, or exposes evidence to compare against a true/false statement. Each kind can be used once per question; spent hints remain revealed on retries and survive falls. The first checkpoint starts without power-ups. All challenge types remain playable without hints.

First-attempt correct answers earn 20 XP each; four first-attempt successes advance difficulty for the next course. Completed XP, levels, and materials are stored on this browser. Unfinished courses, positions, and power-ups reset on reload or leaving. There is no account sync.

## Uploads

PDF, PPTX, DOCX, TXT, and Markdown are supported, or paste notes. Maximum file size: 15 MB; extracted text must contain 100–60,000 characters. Material is stored on this device and sent to the configured model when generating a course.

PDF pages with fewer than 40 embedded characters use local English OCR (up to 20 such pages per upload). OCR assets are served by the app. Clear typed scans work best; handwriting and non-English scans may need external OCR. Images in Word/PowerPoint are not recognized: export those files as PDF or paste their text. Errors preserve the form and provide format-specific remedies.

## Validation

```sh
npm test
npm run build
```

Tests cover provider contracts, source grounding, upload errors, mixed question grading, power-up accounting, falling/respawn, gate locking, and traversal of every turning course section with jumps.

## Code layout

- `src/app.js`: state and event orchestration.
- `src/views/`: layout, material lists, uploads, course/question UI, and power-up inventory.
- `src/game/course.js`: shared platform layout and physics.
- `src/game/world.js`: first-person camera, mouse/touch/keyboard controls, and rendering lifecycle.
- `src/game/scenery.js`: platforms, turning checkpoint gates, scenery, and finish.
- `src/game/quest.js`, `inventory.js`, `answers.js`: progression, earned hints, and grading.
- `src/game/audio.js`, `presentation.js`: sound and fullscreen.
- `src/lib/`: file extraction/OCR, upload errors, API client, storage, HTML escaping.
- `server.mjs`, `server/`: provider transport, prompt, and validation.
- `build/ocr-assets.js`: local OCR assets for dev and production.

This prototype is intended for local/trusted use. Public hosting needs authentication, rate limits, and per-user durable storage before exposing a shared provider key.
