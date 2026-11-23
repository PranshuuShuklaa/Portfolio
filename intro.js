(() => {
  const form = document.querySelector("[data-console-form]");
  const output = document.querySelector("[data-console-output]");
  const input = document.querySelector("#command-input");
  const toggle = document.querySelector("[data-motion-toggle]");
  const replayButtons = [...document.querySelectorAll("[data-replay]")];
  const heading = document.querySelector("#name");
  const header = document.querySelector(".topbar");
  const pointerTemplate = document.querySelector("#cursor-template");
  const sections = [...document.querySelectorAll(".site-nav a")].map(link => ({
    link, target: document.querySelector(link.hash)
  }));
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const compact = window.matchMedia("(max-width: 41rem)");
  const { createTimeline, cubicBezier } = window.anime ?? {};
  const supported = Boolean(createTimeline && cubicBezier && pointerTemplate);
  const landing = supported ? cubicBezier(.2, .78, .25, 1) : "linear";
  const travelY = supported ? cubicBezier(.42, .08, .34, 1) : "linear";
  const pulling = supported ? cubicBezier(.55, .08, .26, 1) : "linear";
  const preferenceKey = "pranshu-build-motion";
  const scenes = [...document.querySelectorAll("[data-build]")].map(element => ({
    element,
    parts: [...element.querySelectorAll("[data-build-part]")],
    state: "built",
    timeline: null,
    overlay: null
  }));
  let enabled = readMotionPreference();
  let queued = false;
  let layoutWidth = document.documentElement.clientWidth;

  function readMotionPreference() {
    try { return sessionStorage.getItem(preferenceKey) !== "off"; }
    catch { return true; }
  }

  function canPlay() {
    return supported && enabled && !reduced.matches;
  }

  function finish(scene) {
    scene.state = "built";
    scene.element.dataset.buildState = "built";
    const timeline = scene.timeline;
    scene.timeline = null;
    if (timeline) timeline.revert();
    scene.overlay?.remove();
    scene.overlay = null;
  }

  function settleAll() {
    scenes.forEach(finish);
  }

  function resetBuild() {
    settleAll();
    if (canPlay()) {
      for (const scene of scenes) {
        scene.state = "pending";
        scene.element.dataset.buildState = "pending";
      }
    }
    schedule();
  }

  function updateControls() {
    toggle.hidden = !supported || reduced.matches;
    toggle.setAttribute("aria-pressed", String(canPlay()));
    toggle.textContent = canPlay() ? "Motion on" : "Motion off";
    replayButtons.forEach(button => { button.hidden = !canPlay(); });
    document.documentElement.toggleAttribute("data-motion-off", !canPlay());
    if (!canPlay()) settleAll();
  }

  function toggleMotion() {
    if (!supported || reduced.matches) return;
    enabled = !enabled;
    try { sessionStorage.setItem(preferenceKey, enabled ? "on" : "off"); }
    catch { /* The control also works without storage. */ }
    updateControls();
    if (enabled) {
      const top = header.getBoundingClientRect().bottom;
      for (const scene of scenes) {
        if (scene.element.getBoundingClientRect().top > Math.max(top, window.innerHeight)) {
          scene.state = "pending";
          scene.element.dataset.buildState = "pending";
        }
      }
      schedule();
    }
  }

  function replayBuild() {
    if (!canPlay()) return;
    if (window.location.hash) {
      const url = new URL(window.location.href);
      url.hash = "";
      history.replaceState(history.state, "", url);
    }
    window.scrollTo({ top: 0, behavior: "instant" });
    heading.focus({ preventScroll: true });
    resetBuild();
  }

  function updateLocation(top) {
    let current;
    for (const section of sections) {
      if (section.target.getBoundingClientRect().top <= top + 30) current = section.link;
    }
    if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4) {
      current = sections.at(-1).link;
    }
    for (const { link } of sections) {
      const selected = link === current;
      if (selected && !link.hasAttribute("aria-current")) link.setAttribute("aria-current", "location");
      if (!selected && link.hasAttribute("aria-current")) link.removeAttribute("aria-current");
    }
  }

  function scan() {
    queued = false;
    const top = Math.max(0, header.getBoundingClientRect().bottom);
    const bottom = window.innerHeight;
    updateLocation(top);
    if (!canPlay()) return;

    const visible = scenes.filter(scene => scene.state !== "built").map(scene => ({
      scene, rect: scene.element.getBoundingClientRect()
    }));
    for (const { scene, rect } of visible) {
      const isHeader = scene.element.dataset.build === "header";
      if (!isHeader && rect.bottom <= top) {
        finish(scene);
      } else if (!isHeader && scene.state === "running" && rect.top >= bottom) {
        finish(scene);
      } else if (scene.state === "pending" && (isHeader || rect.top < bottom * .96)) {
        play(scene, rect);
      }
    }
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(scan);
  }

  function point(box, x, y) {
    return { x: box.left + box.width * x, y: box.top + box.height * y };
  }

  function place(node, x, y) {
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
  }

  function pointer(overlay, alternate = false) {
    const element = pointerTemplate.content.firstElementChild.cloneNode(true);
    if (alternate) element.classList.add("is-alt");
    overlay.append(element);
    return element;
  }

  function approach(timeline, cursor, start, destination, time, duration) {
    timeline.call(() => cursor.classList.add("is-present"), time);
    timeline.add(cursor, {
      x: { from: start.x, to: destination.x, ease: landing },
      y: { from: start.y, to: destination.y, ease: travelY },
      opacity: { from: 0, to: 1, duration: 120 },
      duration
    }, time);
  }

  function chase(timeline, cursor, start, destination, time, duration, ease = pulling) {
    timeline.add(cursor, { x: [start.x, destination.x], y: [start.y, destination.y], duration, ease }, time);
  }

  function depart(timeline, cursor, point, direction, time) {
    timeline.add(cursor, {
      x: [point.x, point.x + direction * 45],
      y: [point.y, point.y - 23],
      opacity: [1, 0],
      duration: 190,
      ease: travelY
    }, time);
  }

  function ripple(timeline, overlay, point, time) {
    const ring = document.createElement("span");
    ring.className = "build-ripple";
    place(ring, point.x - 7, point.y - 7);
    overlay.append(ring);
    timeline.call(() => ring.classList.add("is-present"), time);
    timeline.add(ring, {
      opacity: [{ from: 0, to: .87, duration: 45 }, { to: 0, duration: 190 }],
      scale: [.45, 1.65],
      duration: 235,
      ease: landing
    }, time);
  }

  function selection(overlay, box) {
    const outline = document.createElement("span");
    outline.className = "build-selection";
    place(outline, box.left, box.top);
    outline.style.width = `${box.width}px`;
    outline.style.height = `${box.height}px`;
    overlay.append(outline);
    return outline;
  }

  function write(timeline, overlay, element, box, time, index) {
    const cursor = pointer(overlay, index % 2 === 1);
    const first = point(box, 0, 1);
    const last = point(box, 1, 1);
    const start = { x: first.x - (compact.matches ? 35 : 73), y: first.y + 28 };
    const contact = time + 245;
    const draw = Math.min(470, 245 + box.width * .31);
    const guide = selection(overlay, { ...box, top: first.y + 1, height: 1 });
    guide.style.transformOrigin = "left center";
    approach(timeline, cursor, start, first, time, 245);
    ripple(timeline, overlay, first, contact);
    timeline.call(() => guide.classList.add("is-present"), contact);
    timeline.add(element, {
      opacity: [1, 1],
      clipPath: ["inset(0% 100% 0% 0%)", "inset(0% -2% 0% 0%)"],
      ease: pulling, duration: draw
    }, contact);
    timeline.add(guide, {
      opacity: [{ from: 0, to: .7, duration: 50 }, { to: .7, duration: Math.max(1, draw - 50) }],
      scaleX: [0, 1], duration: draw, ease: pulling
    }, contact);
    timeline.add(guide, { opacity: [.7, 0], duration: 125 }, contact + draw);
    chase(timeline, cursor, first, last, contact, draw);
    depart(timeline, cursor, last, 1, contact + draw);
  }

  function drop(timeline, overlay, element, box, time, index) {
    const cursor = pointer(overlay, index % 2 === 1);
    const spot = point(box, compact.matches ? .72 : .85, .56);
    const start = { x: spot.x + 66, y: spot.y + 53 };
    const contact = time + 290;
    approach(timeline, cursor, start, spot, time, 290);
    ripple(timeline, overlay, spot, contact);
    timeline.add(element, { opacity: [0, 1], y: [9, 0], ease: landing, duration: 275 }, contact);
    timeline.add(cursor, { scale: [1, .8, 1], duration: 130, ease: travelY }, contact);
    depart(timeline, cursor, spot, 1, contact + 145);
  }

  function drag(timeline, overlay, element, box, time) {
    const first = pointer(overlay);
    const second = pointer(overlay, true);
    const grabFirst = point(box, .43, .38);
    const grabSecond = point(box, .57, .62);
    const cornerFirst = point(box, 0, 0);
    const cornerSecond = point(box, 1, 1);
    const opening = time + 310;
    const duration = 540;
    const release = opening + duration;
    const outline = selection(overlay, box);

    approach(timeline, first, { x: box.left - 55, y: grabFirst.y - 54 }, grabFirst, time, 310);
    approach(timeline, second, { x: box.left + box.width + 54, y: grabSecond.y + 48 }, grabSecond, time + 34, 276);
    ripple(timeline, overlay, grabFirst, opening);
    ripple(timeline, overlay, grabSecond, opening);
    timeline.call(() => outline.classList.add("is-present"), opening);
    timeline.add(element, {
      opacity: { from: .65, to: 1, duration: 185 },
      clipPath: ["inset(38% 43% 38% 43%)", "inset(0% 0% 0% 0%)"],
      duration, ease: pulling
    }, opening);
    timeline.add(outline, {
      opacity: { from: 0, to: .64, duration: 120 },
      scaleX: [.14, 1],
      scaleY: [.24, 1],
      duration, ease: pulling
    }, opening);
    timeline.add(outline, { opacity: [.64, 0], duration: 160 }, release);
    chase(timeline, first, grabFirst, cornerFirst, opening, duration);
    chase(timeline, second, grabSecond, cornerSecond, opening, duration);
    depart(timeline, first, cornerFirst, -1, release);
    depart(timeline, second, cornerSecond, 1, release);
  }

  const moves = { write, drop, drag };

  function play(scene, sceneRect) {
    const overlay = document.createElement("div");
    overlay.className = "build-overlay";
    overlay.setAttribute("aria-hidden", "true");
    const geometry = scene.parts.map(element => {
      const rect = element.getBoundingClientRect();
      return {
        element,
        box: { left: rect.left - sceneRect.left, top: rect.top - sceneRect.top, width: rect.width, height: rect.height }
      };
    });

    scene.state = "running";
    scene.element.dataset.buildState = "running";
    scene.overlay = overlay;
    scene.element.append(overlay);
    try {
      const timeline = createTimeline({
        autoplay: false,
        onComplete: () => {
          if (scene.timeline === timeline) finish(scene);
        }
      });
      scene.timeline = timeline;
      const gap = compact.matches ? 110 : 130;
      const delay = scene.element.dataset.build === "hero" ? 85 : 0;
      geometry.forEach(({ element, box }, index) => {
        moves[element.dataset.buildPart](timeline, overlay, element, box, delay + index * gap, index);
      });
      timeline.play();
    } catch (error) {
      console.error("Could not run the cursor build.", error);
      finish(scene);
    }
  }

  function log(command, message) {
    const example = document.createElement("p");
    example.textContent = `$ ${command}`;
    const result = document.createElement("p");
    result.className = "terminal-result";
    result.textContent = message;
    output.append(example, result);
    while (output.children.length > 12) output.firstChild.remove();
    output.scrollTop = output.scrollHeight;
  }

  const destinations = new Map([
    ["work", "Selected work"],
    ["about", "About me"],
    ["experience", "Experience"],
    ["education", "Education"],
    ["contact", "Get in touch"]
  ]);

  form.hidden = false;
  form.addEventListener("submit", event => {
    event.preventDefault();
    const value = input.value.trim().toLowerCase().replace(/^cd\s+/, "");
    input.value = "";
    if (!value) return;

    if (destinations.has(value)) {
      log(value, `Opening ${destinations.get(value)}.`);
      window.location.hash = value;
    } else if (value === "help" || value === "ls") {
      log(value, "work · about · experience · education · contact · replay · motion · clear");
    } else if (value === "clear") {
      output.replaceChildren();
    } else if (value === "motion") {
      toggleMotion();
      log(value, canPlay() ? "Cursor motion enabled." : "Cursor motion is off.");
    } else if (value === "replay") {
      log(value, canPlay() ? "Replaying the page build." : "Cursor motion is off.");
      replayBuild();
    } else {
      log(value, "Unknown command. Try help.");
    }
  });

  toggle.addEventListener("click", toggleMotion);
  replayButtons.forEach(button => button.addEventListener("click", replayBuild));
  reduced.addEventListener("change", updateControls);
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", () => {
    const width = document.documentElement.clientWidth;
    if (width !== layoutWidth) {
      layoutWidth = width;
      scenes.filter(scene => scene.state === "running").forEach(finish);
    }
    schedule();
  }, { passive: true });

  document.addEventListener("focusin", event => {
    const parent = event.target.closest("[data-build]");
    const scene = scenes.find(candidate => candidate.element === parent);
    if (scene && scene.state !== "built") finish(scene);
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") scenes.filter(scene => scene.state === "running").forEach(finish);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) scenes.filter(scene => scene.state === "running").forEach(finish);
    else schedule();
  });

  updateControls();
  resetBuild();
})();
