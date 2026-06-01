## ADDED Requirements

### Requirement: Video card rendering
The module SHALL render video items as `<video>` elements with `autoplay`, `muted`, and `playsinline` attributes. The element SHALL use the `photostack-image` CSS class so it fills the card frame identically to images.

#### Scenario: Video card created from typed item
- **WHEN** `addCard()` processes an item with `type: "video"`
- **THEN** a `<video autoplay muted playsinline class="photostack-image">` element is appended to the card `<div>`

#### Scenario: Image card unchanged
- **WHEN** `addCard()` processes an item with `type: "image"`
- **THEN** an `<img class="photostack-image">` element is appended, identical to current behavior

---

### Requirement: Only top card video plays
The module SHALL ensure at most one video is playing at any time — the topmost card. All other video cards in the stack SHALL be paused.

#### Scenario: New card pushed, previous top was a video
- **WHEN** a new card is added to the stack
- **AND** the previous topmost card contains a `<video>` element
- **THEN** that video element SHALL have `.pause()` called before the new card is pushed

#### Scenario: New top card is a video
- **WHEN** a new video card becomes the topmost card
- **THEN** its `<video>` element SHALL have `.play()` called immediately after creation

#### Scenario: Fly-out card contains a video
- **WHEN** the oldest card is evicted from the stack
- **AND** that card contains a `<video>` element
- **THEN** the card is removed from the DOM after `flyOutDuration`; play state at removal time does not matter

---

### Requirement: Video display duration
The module SHALL advance the slideshow after the current video card's display duration elapses.

#### Scenario: `videoSpeed` not configured (0 or unset), metadata loads
- **WHEN** the current card is a video
- **AND** `config.videoSpeed` is `0` or not set
- **AND** the video's `loadedmetadata` event fires
- **THEN** `scheduleNextCard` SHALL be called with `video.duration * 1000` milliseconds

#### Scenario: `videoSpeed` configured
- **WHEN** the current card is a video
- **AND** `config.videoSpeed` is a positive integer
- **THEN** `scheduleNextCard` SHALL be called synchronously with `config.videoSpeed` milliseconds

#### Scenario: Metadata fallback
- **WHEN** the current card is a video
- **AND** `loadedmetadata` has not fired within 5000 milliseconds
- **THEN** `scheduleNextCard` SHALL be called with `5000` milliseconds as the delay
- **AND** the pending `loadedmetadata` handler SHALL be cleaned up

#### Scenario: Card evicted before metadata loads
- **WHEN** a video card is removed from `this.cards` before its `loadedmetadata` fires
- **THEN** the handler SHALL NOT call `scheduleNextCard`
- **AND** the 5-second fallback timeout SHALL be cleared

---

### Requirement: Video config defaults
The module SHALL expose `videoSpeed` (default `0`) and `videoExtensions` (default `["mp4", "mov", "webm"]`) as configurable options with sensible defaults requiring no user action for typical use.

#### Scenario: Default config, no video extensions specified
- **WHEN** user provides no `videoExtensions` in config
- **THEN** the module SHALL discover files with extensions `mp4`, `mov`, and `webm`

#### Scenario: Natural duration by default
- **WHEN** user provides no `videoSpeed` in config
- **THEN** videos SHALL display for their natural duration (via `loadedmetadata`)
