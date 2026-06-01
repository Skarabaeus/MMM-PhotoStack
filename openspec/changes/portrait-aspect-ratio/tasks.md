## 1. JavaScript — defaults and getDom

- [ ] 1.1 Add `photoHeight: 600` to `defaults` in `MMM-PhotoStack.js`
- [ ] 1.2 In `getDom()`, add `this.container.style.setProperty("--photo-height", this.config.photoHeight + "px")` alongside the existing `--photo-width` line

## 2. CSS — image sizing

- [ ] 2.1 In `.photostack-image`, remove the `height: calc(var(--photo-width) * 0.75)` line
- [ ] 2.2 In `.photostack-image`, remove the `object-fit: cover` line

## 3. CSS — container height

- [ ] 3.1 In `.photostack-container`, replace `var(--photo-width) * 0.75` in the `height` formula with `var(--photo-height)`
