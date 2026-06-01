## Context

Images are displayed in `.photostack-card` elements. The card is a fixed-size polaroid frame; the inner `.photostack-image` element fills a hardcoded 4:3 box (`width: --photo-width`, `height: --photo-width * 0.75`) with `object-fit: cover`. This works for landscape photos but crops portrait photos, typically cutting off the top of the subject.

The container height is derived from the same 4:3 assumption. Cards are `position: absolute; top: 50%; left: 50%` and centered via `transform: translate(-50%, -50%)`, so the container must be tall enough to contain the tallest card in the stack.

## Goals / Non-Goals

**Goals:**
- Portrait images render at their natural aspect ratio with no cropping
- Landscape images are unaffected
- Container height is driven by a user-configurable `photoHeight` value
- Backward compatible: existing configs without `photoHeight` behave as before (visually identical for 4:3 collections; slightly taller container for mixed collections)

**Non-Goals:**
- Per-image dynamic container resizing (the container is sized once at init)
- Changing the stacking or animation logic
- Supporting video or non-image media in this change

## Decisions

**Decision: `photoHeight` config with a fixed default, not auto-sizing**

The container is created once in `getDom()` and its CSS custom properties are written once. Auto-sizing the container to the tallest card in the current stack would require measuring rendered images after load and resizing the container, which is significantly more complex and could cause layout jank. A single configurable `photoHeight` is simpler and gives users control.

Default: `600` px (i.e., `photoWidth * 1.5` for the standard 400px default), which fits a 2:3 portrait at full width without cropping. Users with landscape-only collections can set it to `300` to restore the old container footprint.

Alternatives considered:
- `object-position: top` — one-line fix but still crops; doesn't fully solve the problem
- `object-fit: contain` with fixed box — no crop but introduces letterboxing bars inside the frame
- Auto-size container per-card — correct but significantly more complex; deferred

**Decision: Remove `object-fit: cover` and `height` from `.photostack-image`**

With `height: auto`, the `<img>` renders at its natural aspect ratio constrained only by its fixed `width`. No cropping occurs. The card frame grows to wrap the image naturally, just as a physical polaroid would.

**Decision: `--photo-height` CSS custom property on the container**

Mirrors the existing `--photo-width` pattern. The container height formula becomes:
```
calc(var(--photo-height) + var(--frame-width) * 3.5 + 80px)
```
`getDom()` writes `--photo-height` from `this.config.photoHeight`, same as it writes `--photo-width`.

## Risks / Trade-offs

- [Mixed collections] Cards in the stack will be different heights — a tall portrait surrounded by landscape photos looks uneven. → Accepted trade-off; a natural photo stack behaves the same way. Users who dislike it can set `photoHeight` to a consistent value and add `object-fit: cover` via custom CSS.
- [Container too short] If `photoHeight` is set smaller than a photo's natural height at the configured `photoWidth`, the card will overflow the container. → Document that `photoHeight` should be set to at least the tallest expected photo height. No code guard needed; CSS overflow is visible and the user can adjust.
- [Backward compat] Container becomes taller for users who don't set `photoHeight` (new default 600 vs old implicit 300). → This is intentional — portrait support requires the extra space. Users who want the old footprint set `photoHeight: 300`.
