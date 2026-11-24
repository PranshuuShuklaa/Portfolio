(() => {
  const header = document.querySelector(".topbar");
  const pointerTemplate = document.querySelector("#cursor-template");
  const sections = [...document.querySelectorAll(".site-nav a")].map(link => ({
    link, target: document.querySelector(link.hash)
  }));
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const compact = window.matchMedia("(max-width: 42rem)");
  const { createTimeline, cubicBezier } = window.anime ?? {};
  const supported = Boolean(createTimeline && cubicBezier && pointerTemplate);
  const landing = supported ? cubicBezier(.23, .62, .24, 1) : "linear";
  const pulling = supported ? cubicBezier(.43, .06, .23, 1) : "linear";
  const releaseEase = supported ? cubicBezier(.3, .12, .66, 1) : "linear";
  const scenes = [...document.querySelectorAll("[data-build]")].map(element => ({
    element,
    parts: [...element.querySelectorAll("[data-build-part]")],
    state: "built",
    timeline: null,
    overlay: null
  }));
  let queued = false;
  let layoutWidth = document.documentElement.clientWidth;
  let lastScroll = window.scrollY;
  let direction = 1;

  function canPlay() {
    return supported && !reduced.matches;
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

  function arm(scene) {
    if (scene.state === "running") finish(scene);
    scene.state = "pending";
    scene.element.dataset.buildState = "pending";
  }

  function resetBuild() {
    settleAll();
    if (canPlay()) scenes.forEach(arm);
    schedule();
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
    if (window.scrollY !== lastScroll) direction = window.scrollY > lastScroll ? 1 : -1;
    lastScroll = window.scrollY;
    updateLocation(top);
    if (!canPlay()) return;

    const positions = scenes.map(scene => ({
      scene, rect: scene.element.getBoundingClientRect()
    }));
    let started = false;
    let hasMore = false;
    for (const { scene, rect } of positions) {
      const isHeader = scene.element.dataset.build === "header";
      const hasFocus = scene.element.contains(document.activeElement) && document.activeElement.matches(":focus-visible");
      const outside = rect.bottom < top - 46 || rect.top > bottom + 46;
      const enters = rect.bottom > top + Math.min(20, rect.height * .2) &&
        rect.top < bottom - Math.min(20, rect.height * .2);

      if (!isHeader && outside && !hasFocus) {
        if (scene.state !== "pending") arm(scene);
      } else if (scene.state === "pending" && (isHeader || enters)) {
        if (hasFocus) {
          finish(scene);
          continue;
        }
        if (started) {
          hasMore = true;
        } else {
          play(scene, rect, direction);
          started = true;
        }
      }
    }
    if (hasMore) schedule();
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
      x: [start.x, destination.x],
      y: [start.y, destination.y],
      opacity: { from: 0, to: 1, duration: 150 },
      duration,
      ease: landing
    }, time);
  }

  function chase(timeline, cursor, start, destination, time, duration, ease = pulling) {
    timeline.add(cursor, { x: [start.x, destination.x], y: [start.y, destination.y], duration, ease }, time);
  }

  function depart(timeline, cursor, point, direction, time) {
    timeline.add(cursor, {
      x: [point.x, point.x + direction * 54],
      y: [point.y, point.y - 29],
      opacity: [1, 0],
      duration: 230,
      ease: releaseEase
    }, time);
  }

  function ripple(timeline, overlay, point, time) {
    const ring = document.createElement("span");
    ring.className = "build-ripple";
    place(ring, point.x - 9, point.y - 9);
    overlay.append(ring);
    timeline.call(() => ring.classList.add("is-present"), time);
    timeline.add(ring, {
      opacity: [{ from: 0, to: .94, duration: 55 }, { to: 0, duration: 220 }],
      scale: [.42, 1.7],
      duration: 275,
      ease: landing
    }, time);
  }

  function selection(overlay, box, className = "build-selection") {
    const outline = document.createElement("span");
    outline.className = className;
    place(outline, box.left, box.top);
    outline.style.width = `${box.width}px`;
    outline.style.height = `${box.height}px`;
    overlay.append(outline);
    return outline;
  }

  function write(timeline, overlay, element, box, time, index, crew, direction) {
    const cursor = pointer(overlay, index % 2 === 1);
    const first = point(box, 0, 1);
    const last = point(box, 1, 1);
    const start = { x: first.x - (compact.matches ? 48 : 86), y: first.y + 37 * direction };
    const contact = time + 305;
    const draw = Math.min(520, 285 + box.width * .34);
    const guide = selection(overlay, { ...box, top: first.y + 1, height: 2 }, "build-selection build-trace");
    guide.style.transformOrigin = "left center";
    approach(timeline, cursor, start, first, time, 305);
    ripple(timeline, overlay, first, contact);
    timeline.call(() => guide.classList.add("is-present"), contact);
    timeline.add(element, {
      opacity: [1, 1],
      clipPath: ["inset(0% 100% 0% 0%)", "inset(0% -2% 0% 0%)"],
      ease: pulling, duration: draw
    }, contact);
    timeline.add(guide, {
      opacity: [{ from: 0, to: .83, duration: 65 }, { to: .83, duration: draw - 65 }],
      scaleX: [0, 1], duration: draw, ease: pulling
    }, contact);
    timeline.add(guide, { opacity: [.83, 0], duration: 175 }, contact + draw);
    chase(timeline, cursor, first, last, contact, draw);
    depart(timeline, cursor, last, 1, contact + draw);
  }

  function drop(timeline, overlay, element, box, time, index, crew, direction) {
    const cursor = pointer(overlay, index % 2 === 1);
    const spot = point(box, compact.matches ? .72 : .85, .56);
    const start = { x: spot.x + 66, y: spot.y + 53 * direction };
    const contact = time + 330;
    approach(timeline, cursor, start, spot, time, 330);
    ripple(timeline, overlay, spot, contact);
    timeline.add(element, { opacity: [.42, 1], y: [9, 0], ease: landing, duration: 300 }, contact);
    timeline.add(cursor, { scale: [1, .81, 1], duration: 155, ease: landing }, contact);
    depart(timeline, cursor, spot, 1, contact + 145);
  }

  function drag(timeline, overlay, element, box, time, index, crew) {
    const opening = time + 370;
    const duration = 680;
    const release = opening + duration;
    const outline = selection(overlay, box);
    const corners = crew ? [[0, 0], [1, 1], [1, 0], [0, 1]] : [[0, 0], [1, 1]];

    if (crew) {
      const footprint = selection(overlay, box, "build-footprint");
      timeline.call(() => footprint.classList.add("is-present"), time);
      timeline.add(footprint, { opacity: [0, .62], duration: 190, ease: landing }, time);
      timeline.add(footprint, { opacity: [.62, 0], duration: duration + 145, ease: pulling }, opening);
    }

    corners.forEach(([x, y], cornerIndex) => {
      const cursor = pointer(overlay, (index + cornerIndex) % 2 === 1);
      const grab = point(box, x ? .57 : .43, y ? .62 : .38);
      const corner = point(box, x, y);
      const start = { x: corner.x + (x ? 120 : -120), y: corner.y + (y ? 88 : -88) };
      const delay = cornerIndex * 32;
      approach(timeline, cursor, start, grab, time + delay, 370 - delay);
      ripple(timeline, overlay, grab, opening);
      chase(timeline, cursor, grab, corner, opening, duration);
      ripple(timeline, overlay, corner, release);
      depart(timeline, cursor, corner, x ? 1 : -1, release + 65);
    });

    timeline.call(() => outline.classList.add("is-present"), opening);
    timeline.add(element, {
      opacity: { from: .79, to: 1, duration: 195 },
      clipPath: ["inset(38% 43% 38% 43%)", "inset(0% 0% 0% 0%)"],
      duration, ease: pulling
    }, opening);
    timeline.add(outline, {
      opacity: { from: 0, to: .9, duration: 130 },
      scaleX: [.14, 1],
      scaleY: [.24, 1],
      duration, ease: pulling
    }, opening);
    timeline.add(outline, { opacity: [.9, 0], duration: 235 }, release);
  }

  const moves = { write, drop, drag };

  function play(scene, sceneRect, direction) {
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
      const gap = compact.matches ? 74 : 100;
      const delay = scene.element.dataset.build === "hero" ? 65 : 0;
      const crew = scene.element.hasAttribute("data-crew");
      const sequence = crew
        ? geometry.slice().sort((a, b) => Number(b.element.dataset.buildPart === "drag") - Number(a.element.dataset.buildPart === "drag"))
        : geometry;
      sequence.forEach(({ element, box }, index) => {
        moves[element.dataset.buildPart](timeline, overlay, element, box, delay + index * gap, index, crew, direction);
      });
      timeline.play();
    } catch (error) {
      console.error("Could not run the cursor build.", error);
      finish(scene);
    }
  }

  reduced.addEventListener("change", () => {
    if (reduced.matches) settleAll();
    else resetBuild();
  });
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

  resetBuild();
})();
