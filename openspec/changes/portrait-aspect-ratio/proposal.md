## Why

Portrait-oriented photos have their top portion cropped because the image box uses a hardcoded 4:3 landscape aspect ratio with `object-fit: cover`. Users with mixed or portrait-heavy photo collections see their subjects cut off.

## What Changes

- Remove the fixed `height` and `object-fit: cover` from `.photostack-image` so images render at their natural aspect ratio
- Add a `photoHeight` config option (default: `photoWidth * 1.5`) that sets the container's height, accommodating standard 2:3 portrait photos without cropping
- Expose `--photo-height` as a CSS custom property on the container, replacing the hardcoded `* 0.75` in the container height formula
- Wire `photoHeight` through `getDom()` alongside the existing `photoWidth`

## Capabilities

### New Capabilities
- `photo-display`: How images are sized and displayed within a card — aspect ratio handling, fit behaviour, and the config surface for controlling display dimensions

### Modified Capabilities

## Impact

- `MMM-PhotoStack.css`: `.photostack-image` height rule and `.photostack-container` height formula
- `MMM-PhotoStack.js`: `defaults` object (new `photoHeight` key) and `getDom()` (new `setProperty` call)
- No Node/helper changes required
- Backward compatible: landscape-only collections see no visual change; the container becomes taller but cards remain centered
