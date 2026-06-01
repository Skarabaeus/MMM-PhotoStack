## 1. Node Helper — Typed Scan Results

- [ ] 1.1 Add `videoExtensions` to the `PHOTOSTACK_REGISTER` handler: read `payload.videoExtensions` alongside existing `payload.extensions`
- [ ] 1.2 Update `scan()` to build `items: {url, type}[]` instead of `urls: string[]` — pass both extension lists to `collectFiles()` or tag after collecting
- [ ] 1.3 Update `collectFiles()` to accept video extensions and return `{rel, type}` entries instead of plain strings
- [ ] 1.4 Update the shuffle call to operate on the `items` array
- [ ] 1.5 Send `PHOTOSTACK_IMAGES` with `items` field instead of `urls`

## 2. Frontend — Config and Registration

- [ ] 2.1 Add `videoExtensions: ["mp4", "mov", "webm"]` and `videoSpeed: 0` to `defaults`
- [ ] 2.2 Include `videoExtensions` in the `PHOTOSTACK_REGISTER` payload sent in `start()`

## 3. Frontend — Consume Typed Items

- [ ] 3.1 Update `socketNotificationReceived` to read `payload.items` instead of `payload.urls`; store as `this.items` (array of `{url, type}`)
- [ ] 3.2 Update `addCard()` to pull `{url, type}` from `this.items[this.cursor]` instead of a flat URL string

## 4. Frontend — Card Rendering

- [ ] 4.1 In `addCard()`, branch on `type`: create `<img>` for images (unchanged) and `<video autoplay muted playsinline>` for videos, both with class `photostack-image`

## 5. Frontend — Timer Architecture

- [ ] 5.1 Remove `scheduleNextCard(false)` call from the timer callback in `scheduleNextCard()` — the timer callback now only calls `addCard()`
- [ ] 5.2 In `addCard()`, after creating an image card call `this.scheduleNextCard(false)` (uses `config.speed`)
- [ ] 5.3 In `addCard()`, after creating a video card: if `config.videoSpeed > 0` call `this.scheduleNextCard(false)` with a `videoSpeed`-based delay; otherwise attach `loadedmetadata` handler that calls `scheduleNextCard` with `video.duration * 1000`
- [ ] 5.4 Add 5-second fallback timeout for the `loadedmetadata` path; clear it when metadata fires
- [ ] 5.5 Guard the `loadedmetadata` handler: check that the card is still in `this.cards` before calling `scheduleNextCard`; clear fallback timeout in the same guard

## 6. Frontend — Play/Pause Lifecycle

- [ ] 6.1 In `addCard()`, before pushing the new card, find the current top card (`this.cards[this.cards.length - 1]`); if it has a `<video>` child, call `.pause()` on it
- [ ] 6.2 After creating a video card, call `.play()` on the `<video>` element
