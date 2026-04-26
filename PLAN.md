# MMM-PhotoStack — Plan

A custom MagicMirror² module that displays photos as a physical stack: overlapping, slightly-rotated polaroid-style prints, with a new photo periodically flying in on top while older ones drop off the back.

## Files

| File | Purpose |
|---|---|
| `MMM-PhotoStack.js` | Frontend module — manages stack state, triggers animations, cycles photos on a timer |
| `node_helper.js` | Server-side — reads image directory, builds shuffled file list, serves paths to frontend via MM socket |
| `MMM-PhotoStack.css` | Polaroid frame, rotation, shadow, fly-in keyframe animation |
| `package.json` | No npm dependencies needed |

## Visual design

Each photo is an `<img>` inside a `<div>` with:
- White padding border (polaroid frame)
- `box-shadow` for depth
- `transform: rotate(Xdeg)` — small random angle per photo
- Absolute positioning with slight x/y jitter per photo
- CSS keyframe animation for fly-in (translates from off-screen, settles into rotated position)

3–5 photos visible simultaneously on the stack.

## Configuration options

```js
{
  module: "MMM-PhotoStack",
  position: "middle_center",
  config: {
    imagePaths: ["/home/stefan/Pictures"],
    speed: 8000,        // ms between new photos
    stackSize: 4,       // number of photos visible at once
    maxRotation: 8,     // max tilt in degrees
    frameColor: "white",
    frameWidth: 16,     // px
    photoWidth: 400,    // px
  }
}
```

## Effort estimate

| Part | Estimate |
|---|---|
| Module scaffolding + node_helper (adapt from MMM-BackgroundSlideshow) | ~1h |
| Stack DOM logic + timer cycling | ~1h |
| CSS: polaroid frame, rotation, shadow | ~1h |
| CSS: fly-in animation (the tricky part) | ~1–2h |
| Config wiring + testing on Pi | ~1h |

**Total: ~4–6 hours**

## Integration

Replace or sit alongside `MMM-BackgroundSlideshow` on page 1 in `MMM-pages`. Module position would be `middle_center` or `fullscreen_below` depending on desired look.
