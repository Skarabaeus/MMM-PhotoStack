Module.register("MMM-PhotoStack", {
  defaults: {
    imagePaths: [],
    speed: 8000,
    stackSize: 4,
    maxRotation: 8,
    maxOffset: 30,
    frameColor: "white",
    backgroundColor: "black",
    frameWidth: 16,
    photoWidth: null,
    photoHeight: null,
    flyInDuration: 1200,
    flyOutDuration: 800,
    recursiveSubDirectories: true,
    randomizeImageOrder: true,
    imageExtensions: ["jpg", "jpeg", "png", "gif", "webp"],
    rescanInterval: 0
  },

  start() {
    this.urls = [];
    this.cursor = 0;
    this.cards = [];
    this.timer = null;
    this.registered = false;

    this.sendSocketNotification("PHOTOSTACK_REGISTER", {
      identifier: this.identifier,
      paths: this.config.imagePaths,
      recursive: this.config.recursiveSubDirectories,
      extensions: this.config.imageExtensions,
      randomize: this.config.randomizeImageOrder,
      rescanInterval: this.config.rescanInterval
    });

    // The browser freezes CSS animations whenever the document is hidden
    // (screen blanking / DPMS, window focus loss, occlusion) — independent of
    // MM²'s hide/show. Pause the timer in that case too, otherwise cards keep
    // appending unseen and all replay their fly-in at once when the document
    // becomes visible again.
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.suspend();
      } else {
        this.resume();
      }
    });
  },

  getStyles() {
    return ["MMM-PhotoStack.css"];
  },

  // MM² hides this module (e.g. MMM-pages switching away) by setting the
  // wrapper to display:none. CSS animations don't run while hidden, so a card
  // appended during that time never fires animationend and never settles.
  // Stop the timer while suspended so cards don't pile up and then all fly in
  // at once when the module is shown again.
  suspend() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  },

  resume() {
    if (this.urls && this.urls.length > 0 && !this.timer) {
      this.scheduleNextCard(false);
    }
  },

  getDom() {
    if (!this.container) {
      this.container = document.createElement("div");
      this.container.className = "photostack-container";
      const box = this.computePhotoBox();
      this.container.style.setProperty("--photo-width", box.width + "px");
      this.container.style.setProperty("--photo-height", box.height + "px");
      this.container.style.setProperty("--frame-width", this.config.frameWidth + "px");
      this.container.style.setProperty("--frame-color", this.config.frameColor);
      this.container.style.setProperty("--background-color", this.config.backgroundColor);
      this.container.style.setProperty("--fly-in-duration", this.config.flyInDuration + "ms");
      this.container.style.setProperty("--fly-out-duration", this.config.flyOutDuration + "ms");
    }
    return this.container;
  },

  // Largest photo box whose worst-case card — at full rotation and offset —
  // still fits the viewport. Honors explicit photoWidth/photoHeight as caps.
  computePhotoBox() {
    const frame = this.config.frameWidth;
    // Card chrome around the photo: frame on all sides, 2.5x frame at the bottom.
    const chromeW = frame * 2;
    const chromeH = frame * 3.5;

    if (this.config.photoWidth != null && this.config.photoHeight != null) {
      return { width: this.config.photoWidth, height: this.config.photoHeight };
    }

    const theta = (this.config.maxRotation * Math.PI) / 180;
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    const offset = this.config.maxOffset;

    // Budget for offset jitter (both sides) and the container's own chrome.
    const Aw = window.innerWidth - 2 * offset - 80;
    const Ah = window.innerHeight - 2 * offset - 80;
    const r = window.innerHeight / window.innerWidth; // target box aspect = viewport

    // Rotated bounding box of cardW x (r*cardW) must fit Aw x Ah.
    const cardW = Math.min(Aw / (cos + r * sin), Ah / (sin + r * cos));
    const cardH = r * cardW;

    const width = this.config.photoWidth ?? Math.max(1, Math.round(cardW - chromeW));
    const height = this.config.photoHeight ?? Math.max(1, Math.round(cardH - chromeH));
    return { width, height };
  },

  // Largest photo box for a known image aspect ratio whose card — at full
  // rotation and offset — still fits the viewport. This beats the global
  // computePhotoBox() cap because it uses the photo's actual aspect ratio
  // instead of assuming the worst-case (viewport-shaped) photo, so typical
  // landscape/portrait photos fill far more of the screen.
  fitPhotoToViewport(aspect) {
    const frame = this.config.frameWidth;
    const theta = (this.config.maxRotation * Math.PI) / 180;
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    const offset = this.config.maxOffset;

    // Span available for the card's rotated bounding box after reserving offset jitter.
    const Bw = window.innerWidth - 2 * offset;
    const Bh = window.innerHeight - 2 * offset;

    // card = photo + chrome: cardW = w + 2*frame, cardH = w/aspect + 3.5*frame.
    // Solve each rotated-bbox constraint for the photo width w:
    //   cardW*cos + cardH*sin <= Bw
    //   cardW*sin + cardH*cos <= Bh
    const wFromWidth = (Bw - frame * (2 * cos + 3.5 * sin)) / (cos + sin / aspect);
    const wFromHeight = (Bh - frame * (2 * sin + 3.5 * cos)) / (sin + cos / aspect);
    let width = Math.min(wFromWidth, wFromHeight);

    // Honor explicit caps (preserving aspect ratio).
    if (this.config.photoWidth != null) width = Math.min(width, this.config.photoWidth);
    if (this.config.photoHeight != null) width = Math.min(width, this.config.photoHeight * aspect);

    width = Math.max(1, Math.floor(width));
    const height = Math.max(1, Math.floor(width / aspect));
    return { width, height };
  },

  socketNotificationReceived(notification, payload) {
    if (notification !== "PHOTOSTACK_IMAGES") return;
    if (!payload || payload.identifier !== this.identifier) return;
    const hadUrls = this.urls.length > 0;
    this.urls = payload.urls || [];
    if (this.urls.length === 0) return;
    if (!this.container) this.updateDom();
    if (!hadUrls) {
      this.cursor = 0;
      this.scheduleNextCard(true);
    }
  },

  scheduleNextCard(immediate) {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (!this.urls || this.urls.length === 0) return;
    const delay = immediate ? 0 : this.config.speed;
    this.timer = setTimeout(() => {
      this.timer = null;
      if (!this.container) {
        this.scheduleNextCard(false);
        return;
      }
      this.addCard();
      this.scheduleNextCard(false);
    }, delay);
  },

  addCard() {
    if (!this.container || this.urls.length === 0) return;

    const url = this.urls[this.cursor % this.urls.length];
    this.cursor = (this.cursor + 1) % this.urls.length;

    const entries = [
      { x: "120vw", y: "-60vh" },
      { x: "-120vw", y: "-60vh" },
      { x: "0vw", y: "-150vh" },
      { x: "120vw", y: "0vh" }
    ];
    const entry = entries[Math.floor(Math.random() * entries.length)];

    const restX = this.randomBetween(-this.config.maxOffset, this.config.maxOffset);
    const restY = this.randomBetween(-this.config.maxOffset, this.config.maxOffset);
    const restRotate = this.randomBetween(-this.config.maxRotation, this.config.maxRotation);

    const card = document.createElement("div");
    card.className = "photostack-card photostack-fly-in";
    card.style.setProperty("--rest-x", restX.toFixed(2) + "px");
    card.style.setProperty("--rest-y", restY.toFixed(2) + "px");
    card.style.setProperty("--rest-rotate", restRotate.toFixed(2) + "deg");
    card.style.setProperty("--in-x", entry.x);
    card.style.setProperty("--in-y", entry.y);

    const img = document.createElement("img");
    img.className = "photostack-image";
    img.alt = "";
    const sizeImg = () => {
      const aspect = img.naturalWidth && img.naturalHeight
        ? img.naturalWidth / img.naturalHeight
        : window.innerWidth / window.innerHeight;
      const box = this.fitPhotoToViewport(aspect);
      img.style.maxWidth = box.width + "px";
      img.style.maxHeight = box.height + "px";
    };
    img.addEventListener("load", sizeImg, { once: true });
    img.src = url;
    if (img.complete && img.naturalWidth) sizeImg();
    card.appendChild(img);

    for (const existing of this.cards) {
      const z = parseInt(existing.element.style.zIndex, 10) || 0;
      existing.element.style.zIndex = String(z - 1);
    }

    const newZ = this.config.stackSize;
    card.style.zIndex = String(newZ);

    this.container.appendChild(card);
    this.cards.push({ element: card });

    card.addEventListener("animationend", () => {
      card.classList.remove("photostack-fly-in");
    }, { once: true });

    while (this.cards.length > this.config.stackSize) {
      const oldest = this.cards.shift();
      const el = oldest.element;
      el.classList.add("photostack-fly-out");
      setTimeout(() => {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, this.config.flyOutDuration);
    }
  },

  randomBetween(min, max) {
    return Math.random() * (max - min) + min;
  }
});
