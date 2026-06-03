var NodeHelper = require("node_helper");
var fs = require("fs");
var path = require("path");
var express = require("express");

module.exports = NodeHelper.create({
  start() {
    this.registeredRoutes = new Set();
    this.instances = {};
    this.rescanTimers = {};
  },

  socketNotificationReceived(notification, payload) {
    // TEMP DEBUG: front-end timing of card insertions, printed to MM² stdout
    // (terminal / pm2 logs). Remove once the burst is diagnosed.
    if (notification === "PHOTOSTACK_LOG") {
      console.log("[MMM-PhotoStack][addCard] " + JSON.stringify(payload));
      return;
    }
    if (notification !== "PHOTOSTACK_REGISTER") return;
    if (!payload || !payload.identifier) return;

    const identifier = payload.identifier;
    this.instances[identifier] = payload;

    const paths = Array.isArray(payload.paths) ? payload.paths : [];
    for (let i = 0; i < paths.length; i++) {
      const dir = paths[i];
      if (!dir) continue;
      const routeKey = identifier + "|" + i;
      if (!this.registeredRoutes.has(routeKey)) {
        let stat;
        try { stat = fs.statSync(dir); } catch (e) { continue; }
        if (!stat.isDirectory()) continue;
        const routeBase = "/MMM-PhotoStack/photo/" + identifier + "/" + i;
        this.expressApp.use(routeBase, express.static(dir));
        this.registeredRoutes.add(routeKey);
      }
    }

    this.scan(identifier);

    const rescanInterval = payload.rescanInterval;
    if (rescanInterval > 0) {
      if (this.rescanTimers[identifier]) clearInterval(this.rescanTimers[identifier]);
      this.rescanTimers[identifier] = setInterval(() => this.scan(identifier), rescanInterval);
    }
  },

  scan(identifier) {
    const payload = this.instances[identifier];
    if (!payload) return;

    const paths = Array.isArray(payload.paths) ? payload.paths : [];
    const recursive = payload.recursive !== false;
    const extensions = (payload.extensions || []).map((e) => e.toLowerCase().replace(/^\./, ""));
    const randomize = payload.randomize !== false;

    const urls = [];
    for (let i = 0; i < paths.length; i++) {
      const dir = paths[i];
      if (!dir) continue;
      let stat;
      try {
        stat = fs.statSync(dir);
      } catch (err) {
        console.error("[MMM-PhotoStack] Path does not exist or is not accessible: " + dir);
        continue;
      }
      if (!stat.isDirectory()) {
        console.error("[MMM-PhotoStack] Path is not a directory: " + dir);
        continue;
      }
      const routeBase = "/MMM-PhotoStack/photo/" + identifier + "/" + i;
      const files = this.collectFiles(dir, dir, recursive, extensions);
      for (const rel of files) {
        const encoded = rel
          .split("/")
          .map((seg) => encodeURIComponent(seg))
          .join("/");
        urls.push(routeBase + "/" + encoded);
      }
    }

    if (randomize) this.shuffle(urls);

    this.sendSocketNotification("PHOTOSTACK_IMAGES", {
      identifier: identifier,
      urls: urls
    });
  },

  collectFiles(root, dir, recursive, extensions) {
    const out = [];
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (err) {
      console.error("[MMM-PhotoStack] Could not read directory: " + dir + " (" + err.message + ")");
      return out;
    }

    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (recursive) {
          const sub = this.collectFiles(root, full, recursive, extensions);
          for (const s of sub) out.push(s);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase().replace(/^\./, "");
        if (extensions.length === 0 || extensions.indexOf(ext) !== -1) {
          const rel = path.relative(root, full).split(path.sep).join("/");
          out.push(rel);
        }
      }
    }
    return out;
  },

  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
  }
});
