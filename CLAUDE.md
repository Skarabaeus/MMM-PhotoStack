# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A MagicMirror² (MM²) third-party module. There is no build step, no bundler, no test suite, and no runtime npm dependencies — `express` and `node_helper` are provided by the host MagicMirror² installation. The whole module is three source files plus `package.json`.

`npm test` is a stub that prints and exits 0. To exercise the module you have to drop it into a real MagicMirror² install (`~/MagicMirror/modules/MMM-PhotoStack`) and run MM², because both the frontend (`Module.register`) and backend (`NodeHelper.create`, `this.expressApp`) only run inside that host.

## Architecture

Three pieces coordinate over MagicMirror's socket-notification bus and a per-instance Express static route:

1. **`MMM-PhotoStack.js` (browser)** — registered with `Module.register`. On `start()` it sends `PHOTOSTACK_REGISTER` to the helper containing `this.identifier` + the configured paths/extensions/recursive/randomize flags. It owns no DOM until `getDom()` is first called; it owns no image list until `PHOTOSTACK_IMAGES` arrives.

2. **`node_helper.js` (Node, server-side)** — on `PHOTOSTACK_REGISTER`:
   - For each configured path, mounts `express.static(dir)` under `/MMM-PhotoStack/photo/<identifier>/<pathIndex>` on `this.expressApp`. The `<pathIndex>` matters: paths from `imagePaths[i]` are served at index `i`, so URLs are stable across rescans. Routes are tracked in `this.registeredRoutes` and only mounted once per `(identifier, i)` pair — re-registering an existing instance does not double-mount.
   - Walks each directory (recursive optional), filters by extension, builds a list of fully-qualified URLs (each path segment URI-encoded), optionally shuffles, and returns the list via `PHOTOSTACK_IMAGES`. **This is a one-shot scan** — there is no filesystem watching and no periodic rescan. To pick up new photos the user has to restart MM².

3. **`MMM-PhotoStack.css`** — defines `.photostack-container` and `.photostack-card`, plus the `photostack-fly-in` / `photostack-fly-out` keyframes. The JS does not compute transforms; it sets per-card CSS custom properties (`--rest-x`, `--rest-y`, `--rest-rotate`, `--in-x`, `--in-y`) and the stylesheet consumes them in both the static `transform` and the keyframes. **Keep the JS↔CSS variable contract in sync** when changing animation logic.

### Stack lifecycle (in `addCard`)

- A timer fires every `config.speed` ms. The first tick is scheduled with `immediate: true` so a card appears as soon as URLs arrive.
- New card gets `z-index = stackSize`. Every existing card has its z-index decremented, so the most recent card is always on top and stacking order reflects insertion order.
- The fly-in animation is removed by a `setTimeout(flyInDuration)` so the card settles into its rest transform via the static rule.
- When `cards.length > stackSize`, the oldest card (`shift()`) gets `photostack-fly-out` added; a `setTimeout(flyOutDuration)` then removes it from the DOM. If you change durations, the JS timeouts and CSS animation durations must stay aligned, otherwise cards either snap or leak.
- The container div is created lazily and cached on `this.container`; `getDom()` returns the same element across re-renders. CSS custom properties for sizing/colors are written to it once.

### Identifier-scoped messaging

Multiple instances of this module can coexist. The helper echoes `payload.identifier` back, and the frontend ignores any `PHOTOSTACK_IMAGES` whose identifier doesn't match `this.identifier`. Preserve this when adding new socket notifications.

## Editing notes specific to MagicMirror²

- The frontend file is loaded as a plain script — there is no module system. Don't add `import`/`require` to `MMM-PhotoStack.js`. `node_helper.js` is CommonJS and may `require` Node built-ins and anything MagicMirror² ships (notably `express`).
- Compatibility floor is MM² ≥ 2.15 (needs `expressApp` exposed to helpers). Don't rely on newer MM² APIs without checking.
- Image paths in `imagePaths` are absolute host paths and may live outside the MagicMirror² install — that's the whole point of the per-instance Express static mount. Don't replace it with a relative-to-module path.