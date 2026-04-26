# MMM-PhotoStack

A MagicMirror² module that displays your photos as a stack of overlapping, slightly-rotated polaroid-style cards. At a configurable interval a new photo flies in from off-screen and lands on top of the stack, while the oldest card drops off the back once the stack has grown beyond its configured size.

## Screenshot

![Screenshot](docs/screenshot.png)

Screenshot pending.

## Installation

```
cd ~/MagicMirror/modules
git clone https://github.com/stefansiebel/MMM-PhotoStack.git
```

No `npm install` is required. The module has no runtime dependencies beyond what MagicMirror² itself provides.

## Usage

Add an entry to the `modules` array in your `config.js`:

```js
{
  module: "MMM-PhotoStack",
  position: "middle_center",
  config: {
    imagePaths: ["/home/pi/Pictures"],
    speed: 8000,
    stackSize: 4
  }
}
```

## Configuration

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `imagePaths` | array of strings | `[]` | Absolute server-side directory paths to scan for photos. |
| `speed` | number | `8000` | Time in milliseconds between new photos arriving on the stack. |
| `stackSize` | number | `4` | Number of cards visible on the stack at once. |
| `maxRotation` | number | `8` | Maximum rotation in degrees applied to each card (plus or minus). |
| `maxOffset` | number | `30` | Maximum positional jitter in pixels for each card's rest position (plus or minus). |
| `frameColor` | string | `"white"` | Any valid CSS color for the polaroid frame. |
| `frameWidth` | number | `16` | Width of the polaroid frame in pixels. |
| `photoWidth` | number | `400` | Width of each photo in pixels. |
| `flyInDuration` | number | `1200` | Duration in milliseconds of the fly-in animation for new cards. |
| `flyOutDuration` | number | `800` | Duration in milliseconds of the fly-out animation for cards leaving the stack. |
| `recursiveSubDirectories` | boolean | `true` | Whether to walk subdirectories of each entry in `imagePaths`. |
| `randomizeImageOrder` | boolean | `true` | Whether to shuffle the image list before cycling through it. |
| `imageExtensions` | array of strings | `["jpg","jpeg","png","gif","webp"]` | File extensions to include when scanning the image directories. |

## How it works

When the module starts it asks its `node_helper.js` to scan every directory in `imagePaths`, optionally walking subdirectories, and to build a list of files matching `imageExtensions`. The list can be shuffled or kept in directory order.

On each tick of `speed` the front-end picks the next image and animates it in from a randomly chosen off-screen edge. The card lands on top of the stack at a small random rotation and offset, bounded by `maxRotation` and `maxOffset`. Existing cards stay where they are; their stacking order shifts down by one.

Once the number of visible cards exceeds `stackSize`, the oldest card at the back of the stack is animated out using `flyOutDuration` and removed. Because images are served by a small Express route registered by the module's `node_helper.js`, the directories listed in `imagePaths` can live anywhere on the host filesystem and do not have to be inside the MagicMirror² installation.

## Compatibility

Requires MagicMirror² v2.15 or newer — any reasonably recent version that exposes `expressApp` to module helpers.

## License

MIT. See [LICENSE](LICENSE).

## Credits

Inspired by MMM-BackgroundSlideshow's directory-walking pattern.
