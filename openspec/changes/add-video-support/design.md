## Context

MMM-PhotoStack is a three-file MagicMirror² module (no build step, no bundler). The frontend runs as a plain browser script; the backend is CommonJS. They communicate over MM²'s socket notification bus.

Current state: `node_helper.scan()` returns `{ identifier, urls: string[] }`. The frontend iterates `urls`, creates `<img>` elements, and advances on a fixed `config.speed` timer regardless of content.

Target hardware: Raspberry Pi 5 (Chromium in kiosk mode). Hardware H.264/H.265 decode is available. Only one video should be actively decoding at a time.

## Goals / Non-Goals

**Goals:**
- Discover and serve video files from the same `imagePaths` folders as images
- Render video cards with correct play/pause lifecycle (only top card plays)
- Use video's natural duration to advance the slideshow, with `videoSpeed` as an override
- Survive unplayable files without stalling (5-second fallback)
- Zero breaking change to existing photo-only configurations

**Non-Goals:**
- Audio playback (videos are always muted)
- Separate video-only paths config
- Video seeking, progress indicators, or looping within a card
- Preloading future cards' video content

## Decisions

### D1: Typed URL entries in socket notification payload

**Decision:** Change `PHOTOSTACK_IMAGES` payload from `urls: string[]` to `items: Array<{url: string, type: "image"|"video"}>`.

**Why:** The frontend needs to know media type at card-creation time to decide the element type and timer behavior. Detecting type from URL extension in the browser would duplicate the extension-matching logic already in `node_helper`. Centralizing it server-side is cleaner.

**Alternative considered:** Keep flat string array; frontend re-parses URL extension. Rejected: duplicates logic, requires `videoExtensions` to be sent to frontend, fragile to encoded characters in paths.

**Note:** This is an internal socket notification — not a public API. No external consumers expected.

---

### D2: `addCard()` owns next-card scheduling

**Decision:** Remove `scheduleNextCard(false)` from the timer callback. `addCard()` calls `scheduleNextCard(delay)` itself after determining the appropriate delay.

**Why:** Photo delay is known synchronously. Video delay may only be known after `loadedmetadata` fires. The scheduling decision must live where the delay is known — inside `addCard()`.

**Current flow:**
```
timer fires → addCard() → scheduleNextCard(fixed)
```
**New flow:**
```
timer fires → addCard()
                ├── image → scheduleNextCard(photoSpeed)         [sync]
                ├── video + videoSpeed → scheduleNextCard(...)   [sync]
                └── video, no videoSpeed → loadedmetadata fires
                        └── scheduleNextCard(duration * 1000)    [async]
                        └── fallback: scheduleNextCard(5000)     [5s timeout]
```

---

### D3: Pause non-top videos by tracking the previous top card

**Decision:** Before pushing a new card to `this.cards`, find `this.cards[this.cards.length - 1]` (current top), call `.pause()` on its `<video>` if present. New video card calls `.play()` immediately after creation.

**Why:** `this.cards` is already ordered by insertion — last element is always the top card. No z-index scan needed. Fly-out cards are paused at demotion time; DOM removal happens after `flyOutDuration` regardless of play state.

**Alternative considered:** Query DOM for `<video>` elements not at max z-index. Rejected: fragile, requires z-index parsing.

---

### D4: `videoSpeed: 0` as sentinel for "use natural duration"

**Decision:** `0` means use the video's natural duration. Any positive integer is treated as a fixed ms override.

**Why:** Falsy zero is a natural sentinel in JS config objects. A user setting `videoSpeed: 0` explicitly and a user omitting it entirely both mean the same thing — natural duration. Avoids `null`/`undefined` handling in config defaults.

---

### D5: 5-second metadata fallback, not configurable

**Decision:** If `loadedmetadata` has not fired within 5 seconds, advance anyway. This value is hardcoded, not exposed as config.

**Why:** These are local files served by Express on the same machine. Metadata on a reachable file loads in under 100ms on RPi 5. 5 seconds is already very generous — it only fires for unplayable/corrupted files. Exposing it as config adds surface area for no practical benefit.

---

### D6: `videoExtensions` as separate config from `imageExtensions`

**Decision:** Add `videoExtensions: ["mp4", "mov", "webm"]` alongside existing `imageExtensions`. Both are passed to `node_helper` in `PHOTOSTACK_REGISTER`. Files matching `videoExtensions` get `type: "video"`; files matching `imageExtensions` get `type: "image"`.

**Why:** The node_helper needs to distinguish types at scan time (D1). Having separate lists makes the type assignment unambiguous. A file matching both lists would be an unusual misconfiguration, not a real-world scenario.

## Risks / Trade-offs

**[Very long videos stall the stack]** → If `videoSpeed` is not set and a user has a 10-minute clip in their folder, the stack won't advance for 10 minutes. Mitigation: document `videoSpeed` clearly as a cap for long content; no code change needed.

**[`loadedmetadata` fires after `flyOutDuration`]** → If a video card is evicted from the stack before its metadata loads, the `loadedmetadata` handler would call `scheduleNextCard` on a card that's already been removed. Mitigation: guard the handler with a check that the card is still in `this.cards` before scheduling. Clear the fallback timeout in the same guard.

**[Browser autoplay policy]** → Chromium on RPi may block autoplay even for muted video if the page hasn't received a user gesture. In MagicMirror kiosk mode this is typically not an issue (`--autoplay-policy=no-user-gesture-required` is often set), but documented as a known dependency on the MM² launch flags.

## Migration Plan

Existing configs require no changes. `speed`, `imagePaths`, `imageExtensions`, `recursiveSubDirectories`, `randomizeImageOrder`, and `rescanInterval` all behave identically. Users wanting video support add `videoExtensions` (or rely on defaults) — no other action needed.

No rollback complexity: the change is additive. Removing `videoExtensions` from config returns to image-only behavior.

## Open Questions

None — all decisions resolved during exploration.
