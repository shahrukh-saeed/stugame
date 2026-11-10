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

Upload text-based PDF, PPTX, DOCX, TXT, or Markdown, or paste notes. Material is stored in browser localStorage and sent to the configured provider when generating a quest. Files up to 15 MB and extracted text of 100–60,000 characters are supported. PDF pages with fewer than 40 embedded text characters automatically use local English text recognition (up to 20 pages needing OCR per upload). Recognition assets are served by the app, not an external OCR service. Clear typed scans work best; handwriting and non-English scans may need external OCR. Images embedded in DOCX and PPTX are not recognized; export those documents as PDF or paste their text. Upload errors show file-specific guidance and character counts, and keep the selected file, title, and notes for correction. Explore a real-time 3D wilderness expedition rendered with Three.js, as a backpacked hiker with trekking gear. Walk with WASD or arrow keys, sprint with Shift, and drag the scene (or use Q/R) to orbit the camera. Click or tap the trail to walk to that point; dragging still orbits the camera. Keyboard input cancels tap-to-walk. The bottom arrow pad has been removed. Press B or choose Backpack to inspect your supplies; the expedition pauses while the pack is open. Follow the trail and press E, Space, or the action button when an obstacle is in range. Course knowledge drives five survival-themed objectives: securing a rope bridge, opening a ranger gate, clearing a rockfall, rigging a climbing route, and lighting a rescue signal. The route physically stays blocked until the current challenge is answered correctly. After all five objectives, walk into the base-camp tent to complete the expedition. Optional supply caches along the trail award 5 XP each. Requires WebGL 2 / hardware acceleration; unsupported browsers show a graphics setup message. Leaving or reloading discards the current expedition; completed progress persists.

AI quests request two typed recall spells, two true-or-false judgments, and one multiple-choice riddle, all with explanations and verified source quotes. Recall answers accept model-supplied synonyms and differences in case/spacing; they are not graded by a second AI call. Incorrect answers reveal feedback and require another cast; the obstacle stays locked until answered correctly. Challenges solved on the first attempt award 20 XP each, and retries cannot farm XP. Four first-attempt correct answers advance to the next of four difficulty tiers; missed rounds keep the same tier. XP and progress persist on this browser. There is no account sync.

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
- `src/game/`: Three.js rendering and input (`world.js`), scenery and character meshes (`scenery.js`), quest progression/collision/XP rules (`quest.js`), answer grading, and game styles.
- `src/lib/`: document extraction and PDF/OCR handling, typed upload errors, API client, browser storage, and HTML helpers.
- `build/ocr-assets.js`: serves and bundles local OCR worker, WebAssembly, and English recognition data.
- `server.mjs`: HTTP API and provider transport.
- `server/`: question prompt and response/source validation.
- `test/`: API, validation, and grading tests.

## Fullscreen and sound

Use **Fullscreen** in the trail kit to expand the expedition; **Exit fullscreen** or Escape returns to the normal view. Challenges stay visible in fullscreen. Browsers without the Fullscreen API use a full-window layout instead. Canvas resolution adapts to the available space.

Use **Enable sound** to start procedural wind, footsteps, occasional birds, supply pickups, action feedback, and completion cues. **Sound on** toggles it off. The preference is stored on this browser. Sound starts only after a user gesture, pauses when the tab is hidden or the expedition is left, and requires Web Audio support. No sound files or third-party audio services are used.

## Backpack and stamina

Start with two climbing ropes, one water flask, and one trail mix. The backpack holds eight supply units; compass and binoculars do not take slots. Walking and resting recover stamina, while sprinting drains it. Water restores 50 stamina; trail mix restores 25 and boosts sprint speed for 12 seconds. Binoculars switch to a zoomed scouting view. Rope is automatically consumed on successful bridge and climbing objectives; it cannot be dropped. The starting ropes are enough to finish the expedition.

Supply crates on the trail contain water or trail mix, award 5 XP each, and can only be collected once. A full pack leaves the crate on the trail until space is available. Use or drop consumables to free slots. Inventory and stamina belong to the current expedition and reset if you leave or reload, like the other unfinished expedition state.

## Visual design

The app uses a dark expedition palette, warm amber actions, locally bundled Fredoka headings, and Nunito Sans body text. Typography is enlarged across the dashboard, upload dialog, game HUD, challenges, and backpack, with responsive layouts and visible keyboard focus states. Font assets are included in production builds and do not require Google Fonts access.
