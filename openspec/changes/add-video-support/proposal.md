## Why

MMM-PhotoStack currently displays only images. Users with mixed media libraries — photos and short video clips — have no way to include videos in their MagicMirror slideshow. Adding video support makes the module useful for the full range of media people actually keep.

## What Changes

- Add `videoExtensions` config (default: `["mp4", "mov", "webm"]`) — video files in `imagePaths` folders are now discovered and served alongside images
- Add `videoSpeed` config (default: `0`) — `0` means use the video's natural duration; any positive ms value overrides it with a fixed display time
- `node_helper` scan result changes from a flat URL string array to typed entries `{ url, type }` — **BREAKING** for any code reading `PHOTOSTACK_IMAGES` payload directly
- Video cards render as `<video autoplay muted playsinline>` instead of `<img>`
- Only the topmost card's video plays; videos pushed down the stack are paused automatically
- A 5-second fallback advances the slideshow if a video's metadata never loads
- `speed` config retains its current meaning (photo display time) — no change to existing configs

## Capabilities

### New Capabilities

- `video-playback`: Discover, serve, and display video files as cards in the photo stack. Controls playback (play/pause based on stack position), timing (natural duration or configured override), and fallback behavior for unplayable files.

### Modified Capabilities

- `media-scan`: Existing image scanning in `node_helper` is extended to also collect video files and tag each result with its media type.

## Impact

- `node_helper.js`: `scan()` and `collectFiles()` — adds video extension matching, changes return shape to typed entries
- `MMM-PhotoStack.js`: `addCard()`, `scheduleNextCard()` — new card element branching, timer architecture change, play/pause management
- `MMM-PhotoStack.css`: No changes needed
- Socket notification `PHOTOSTACK_IMAGES` payload shape changes (urls: string[] → items: `{url, type}[]`)
