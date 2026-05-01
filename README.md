# MMM-PhotoStack

A MagicMirror² module that displays your photos as a stack of overlapping, slightly-rotated polaroid-style cards. At a configurable interval a new photo flies in from off-screen and lands on top of the stack, while the oldest card drops off the back once the stack has grown beyond its configured size.

## Screenshot

![Screenshot](docs/mmm-photostack-screen.png)

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
| `rescanInterval` | number | `0` | How often in milliseconds to rescan `imagePaths` for new or removed photos. `0` disables periodic rescanning (the default). |

## Keeping photos up to date with Syncthing

By default the module scans your photo directories once at startup. If you add photos while MagicMirror² is running they won't appear until the next restart — unless you set `rescanInterval`.

A convenient way to add photos wirelessly without touching the Pi at all is [Syncthing](https://syncthing.net). Syncthing is free and open-source, runs well on Raspberry Pi, and has apps for Android, iOS, macOS, Windows, and Linux. You point it at a folder on the Pi and the same folder on your phone or laptop; when you drop photos into the folder on either device they sync automatically over your local network (or remotely if you want).

**Quick setup:**

1. Install Syncthing on the Pi:
   ```
   sudo apt install syncthing
   sudo systemctl enable --now syncthing@pi
   ```
2. Open the Syncthing web UI at `http://pi.local:8384` and add a shared folder (e.g. `/home/pi/Photos`).
3. Install Syncthing on your phone or laptop, pair the two devices, and accept the shared folder.
4. Point `imagePaths` in your module config at that folder.
5. Set `rescanInterval` so newly synced photos are picked up automatically:
   ```js
   rescanInterval: 3600000  // check for new photos every hour
   ```

After this, dropping a photo into the synced folder on your phone is all it takes — it will appear on the mirror within an hour (or sooner if you use a shorter interval).

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
