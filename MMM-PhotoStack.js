Module.register("MMM-PhotoStack", {
  defaults: {
    imagePaths: [],
    speed: 8000,
    stackSize: 4,
    maxRotation: 8,
    maxOffset: 30,
    frameColor: "white",
    frameWidth: 16,
    photoWidth: 400,
    flyInDuration: 1200,
    flyOutDuration: 800,
    recursiveSubDirectories: true,
    randomizeImageOrder: true,
    imageExtensions: ["jpg", "jpeg", "png", "gif", "webp"]
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
      randomize: this.config.randomizeImageOrder
    });
  },

  getStyles() {
    return ["MMM-PhotoStack.css"];
  },

  getDom() {
    if (!this.container) {
      this.container = document.createElement("div");
      this.container.className = "photostack-container";
      this.container.style.setProperty("--photo-width", this.config.photoWidth + "px");
      this.container.style.setProperty("--frame-width", this.config.frameWidth + "px");
      this.container.style.setProperty("--frame-color", this.config.frameColor);
      this.container.style.setProperty("--fly-in-duration", this.config.flyInDuration + "ms");
      this.container.style.setProperty("--fly-out-duration", this.config.flyOutDuration + "ms");
    }
    return this.container;
  },

  socketNotificationReceived(notification, payload) {
    if (notification !== "PHOTOSTACK_IMAGES") return;
    if (!payload || payload.identifier !== this.identifier) return;
    this.urls = payload.urls || [];
    this.cursor = 0;
    if (this.urls.length === 0) return;
    if (!this.container) this.updateDom();
    this.scheduleNextCard(true);
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
    img.src = url;
    img.alt = "";
    card.appendChild(img);

    for (const existing of this.cards) {
      const z = parseInt(existing.element.style.zIndex, 10) || 0;
      existing.element.style.zIndex = String(z - 1);
    }

    const newZ = this.config.stackSize;
    card.style.zIndex = String(newZ);

    this.container.appendChild(card);
    this.cards.push({ element: card });

    setTimeout(() => {
      card.classList.remove("photostack-fly-in");
    }, this.config.flyInDuration);

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
