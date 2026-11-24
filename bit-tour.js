(() => {
  const stage = document.querySelector("[data-bit-tour]");
  const flyer = stage.querySelector("[data-tour-flyer]");
  const dialogue = stage.querySelector("[data-tour-dialogue]");
  const invite = stage.querySelector("[data-tour-invite]");
  const copy = stage.querySelector("[data-tour-copy]");
  const question = stage.querySelector("[data-tour-question]");
  const action = stage.querySelector("[data-tour-action]");
  const companion = document.querySelector("[data-companion]");
  const header = document.querySelector(".topbar");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const { createTimeline, cubicBezier } = window.anime ?? {};
  const glide = cubicBezier?.(.32, .07, .25, 1);
  const stops = [
    ["klove-kicks", "Klove Kicks is a sneaker shop Pranshu built end to end, from the storefront to the backend.", "Want to browse the store?"],
    ["stipple", "Stipple turns public GitHub repos into interactive maps. Every dot is a file.", "Want to try it on a repo?"],
    ["infinity", "Infinity is a tech society site demo. Scroll through its opening, then explore the events and meet the team.", "Want to try the demo?"],
    ["contact", "An online shop, a web app, or an idea scribbled on a napkin? Pranshu’s up for building it. Broom mail and regular email both welcome."]
  ].map(([id, summary, invitation]) => {
    const section = document.getElementById(id);
    return { section, summary, invitation, target: section.querySelector("[data-tour-link]") };
  });
  flyer.append(companion.querySelector(".companion-art").cloneNode(true));

  let current;
  let lastTour;
  let timer;
  let motion;
  let returning = false;

  const limit = (value, min, max) => Math.max(min, Math.min(value, max));

  function clearDialogue(restoreFocus = false) {
    clearTimeout(timer);
    if (!current) return;
    current.target.classList.remove("bit-tour-target");
    if (restoreFocus && stage.contains(document.activeElement)) current.target.focus({ preventScroll: true });
    current = null;
    dialogue.hidden = true;
    dialogue.classList.remove("is-in-flight");
    flyer.classList.remove("is-hovering");
  }

  function hideStage() {
    motion?.cancel();
    returning = false;
    stage.hidden = true;
    delete document.body.dataset.bitTourActive;
  }

  function stop(restoreFocus = false) {
    clearDialogue(restoreFocus);
    hideStage();
  }

  function readStop() {
    const top = header.offsetHeight;
    const readingLine = top + (innerHeight - top) * .51;
    const atBottom = scrollY > 0 && scrollY + innerHeight >= document.documentElement.scrollHeight - 4;
    const candidate = atBottom ? stops.at(-1) : stops.find(({ section }) => {
      const bounds = section.getBoundingClientRect();
      return bounds.top <= readingLine && bounds.bottom >= readingLine;
    });
    if (!candidate) return;
    const bounds = candidate.target.getBoundingClientRect();
    if (bounds.top < top + 4 || bounds.bottom > innerHeight - 10) return;
    return candidate;
  }

  function showDialogue(asking, point) {
    const target = current.target.getBoundingClientRect();
    invite.hidden = !asking;
    dialogue.hidden = false;
    const width = dialogue.offsetWidth;
    const height = dialogue.offsetHeight;
    const viewport = document.documentElement.clientWidth;
    const besideContact = current.section.id === "contact" && viewport >= 820;
    const idealX = besideContact ? Math.max(target.right + 135, viewport * .48) :
      asking ? target.left : point.x + flyer.offsetWidth - 8;
    const notes = current.section.querySelector(".project-notes");
    const below = Math.max(target.bottom, notes?.getBoundingClientRect().bottom ?? 0) + 10;
    const above = target.top - height - 12;
    const corner = besideContact ? above + 24 : below + height <= innerHeight - 12 ? below : above;
    dialogue.style.left = `${limit(idealX, 12, viewport - width - 12)}px`;
    dialogue.style.top = `${limit(corner, header.offsetHeight + 10, innerHeight - height - 12)}px`;
  }

  function fly(from, getDestination, duration, complete) {
    motion?.cancel();
    const travel = { progress: 0 };
    function render() {
      const to = getDestination();
      const t = travel.progress;
      const x = from.x + (to.x - from.x) * t;
      const lift = Math.min(52, Math.abs(to.x - from.x) * .14);
      const y = from.y + (to.y - from.y) * t - Math.sin(t * Math.PI) * lift;
      flyer.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }
    motion = createTimeline({ autoplay: false, onUpdate: render, onComplete: complete });
    motion.add(travel, { progress: 1, duration, ease: glide }, 0);
    render();
    motion.play();
  }

  function returnToRail() {
    if (!current) return;
    if (flyer.hidden || companion.hidden) {
      stop(true);
      return;
    }
    const from = flyer.getBoundingClientRect();
    clearDialogue(true);
    returning = true;
    const size = flyer.offsetWidth;
    fly(from, () => {
      const rail = companion.getBoundingClientRect();
      return { x: rail.left + (rail.width - size) / 2, y: rail.top + (rail.height - size) / 2 };
    }, 490, hideStage);
  }

  function launch(candidate) {
    current = candidate;
    lastTour = { stop: candidate, y: scrollY };
    copy.textContent = candidate.summary;
    question.textContent = candidate.invitation ?? "";
    question.hidden = !candidate.invitation;
    action.href = candidate.target.href;
    action.textContent = candidate.invitation ? candidate.target.textContent : "Say hello";
    action.target = candidate.target.target;
    action.rel = candidate.target.rel;
    stage.hidden = false;
    invite.hidden = true;
    document.body.dataset.bitTourActive = "";
    document.dispatchEvent(new Event("bit-tour-start"));

    const width = document.documentElement.clientWidth;
    const target = candidate.target.getBoundingClientRect();
    const size = flyer.offsetWidth;
    const links = candidate.target.parentElement.querySelectorAll("a, button");
    const edge = Math.max(...Array.from(links, item => item.getBoundingClientRect().right));
    const hover = {
      x: limit(edge + 7, 8, width - size - 7),
      y: limit(target.top + (target.height - size) / 2 - 4, header.offsetHeight + 8, innerHeight - size)
    };
    const explainX = candidate.section.id === "contact" && width >= 820 ? .36 : .12;
    const explain = { x: width * explainX, y: limit(target.top - size * .9, header.offsetHeight + 22, innerHeight - size - 12) };
    const still = reduced.matches || !createTimeline;
    flyer.hidden = still;

    function ask() {
      flyer.classList.add("is-hovering");
      candidate.target.classList.add("bit-tour-target");
      showDialogue(true, hover);
      dialogue.classList.remove("is-in-flight");
    }

    if (still) {
      ask();
      return;
    }
    fly({ x: width + 10, y: hover.y + 28 }, () => explain, 790, () => {
      showDialogue(false, explain);
      timer = setTimeout(() => {
        dialogue.classList.add("is-in-flight");
        fly(explain, () => hover, 590, ask);
      }, candidate.invitation ? 2050 : 2750);
    });
  }

  function queue(delay = 320) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (returning) {
        queue(130);
        return;
      }
      if (document.hidden || document.body.hasAttribute("data-name-intro") || companion.dataset.sleeping === "true" || document.querySelector(".quick-jump[open]")) return;
      if (companion.contains(document.activeElement) || !companion.querySelector(".companion-actions").hidden) return;
      if (window.getSelection()?.toString() || [...document.querySelectorAll("video")].some(video => !video.paused)) return;
      const candidate = readStop();
      if (!candidate || (lastTour?.stop === candidate && Math.abs(scrollY - lastTour.y) < 180)) return;
      if (candidate.section.querySelector('[data-build-state="running"], [data-build-state="pending"]') ||
        ["running", "pending"].includes(candidate.section.dataset.buildState)) {
        queue(180);
        return;
      }
      launch(candidate);
    }, delay);
  }

  window.addEventListener("scroll", () => {
    returnToRail();
    if (lastTour && lastTour.stop !== readStop()) lastTour = null;
    queue();
  }, { passive: true });
  window.addEventListener("resize", () => { stop(); queue(); }, { passive: true });
  document.addEventListener("visibilitychange", () => {
    stop();
    if (!document.hidden) queue();
  });
  reduced.addEventListener("change", () => {
    stop(true);
    lastTour = null;
    queue();
  });
  stage.querySelector("[data-tour-dismiss]").addEventListener("click", () => stop(true));
  document.addEventListener("quick-jump-open", () => stop());
  document.addEventListener("keydown", event => { if (event.key === "Escape") stop(true); });
  for (const eventName of ["click", "auxclick"]) {
    document.addEventListener(eventName, event => {
      if (current && event.target.closest("a")?.matches(".project a[href^='https:'], [data-tour-action], .contact a")) {
        const openedFrom = current;
        setTimeout(() => { if (current === openedFrom) stop(); }, 0);
      }
    });
  }
  queue(550);
})();
