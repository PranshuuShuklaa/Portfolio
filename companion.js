(() => {
  const companion = document.querySelector("[data-companion]");
  const trigger = companion.querySelector("[data-companion-trigger]");
  const actions = companion.querySelector(".companion-actions");
  const projectLink = companion.querySelector("[data-companion-project]");
  const nextLink = companion.querySelector("[data-companion-next]");
  const sleepButton = companion.querySelector("[data-companion-toggle]");
  const coffeeButton = companion.querySelector("[data-companion-coffee]");
  const sparkButton = companion.querySelector("[data-companion-spark]");
  const coffeeNote = companion.querySelector(".companion-note");
  const coffeeTitle = coffeeNote.querySelector("p");
  const acceptCoffee = coffeeNote.querySelector("[data-coffee-accept]");
  const dismissCoffee = coffeeNote.querySelector("[data-coffee-close]");
  const status = companion.querySelector("[data-companion-status]");
  const rider = companion.querySelector("[data-companion-rider]");
  const broom = companion.querySelector("[data-companion-broom]");
  const header = document.querySelector(".topbar");
  const opening = document.querySelector(".opening");
  const hero = opening.querySelector(".hero");
  const contact = document.querySelector("#contact");
  const stops = [...document.querySelectorAll(".opening, .work-handoff, .project, .profile, .activity, .contact")];
  const { createTimeline, cubicBezier } = window.anime ?? {};
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const glide = cubicBezier?.(.18, .67, .24, 1);
  const quietPeriod = 165;

  let state = "rest";
  let sleeping = false;
  let frame = 0;
  let motion;
  let reactionTimer;
  let coffeeTimer;
  let offeredCoffee = false;
  let lastScroll = Math.max(0, window.scrollY);
  let lastInput = 0;
  let lastFrame = 0;
  let scrollSpeed = 0;
  let y = 0;
  let targetY = 0;
  let bank = 0;
  let flightTop = 0;
  let flightHeight = 0;
  let currentStop;
  let wavedAtContact = false;

  function canFly() {
    return createTimeline && !reduced.matches && !sleeping && !document.hidden;
  }

  function setState(next) {
    state = next;
    companion.dataset.state = next;
  }

  function clearReaction() {
    clearTimeout(reactionTimer);
    delete companion.dataset.reaction;
  }

  function react(name) {
    if (state !== "rest" || companion.dataset.reaction || (!canFly() && name !== "spark")) return;
    companion.dataset.reaction = name;
    reactionTimer = setTimeout(clearReaction, 660);
  }

  function dock() {
    const size = companion.offsetHeight;
    const headerBottom = header.getBoundingClientRect().bottom;
    const bottom = window.innerHeight;
    const topY = headerBottom + 16;
    const bottomY = Math.max(topY, bottom - size - 18);
    const readingLine = headerBottom + (bottom - headerBottom) * .64;
    const atBottom = lastScroll > 0 && lastScroll + bottom >= document.documentElement.scrollHeight - 3;
    const rects = stops.map(stop => ({ stop, bounds: stop.getBoundingClientRect() }));
    const end = rects.at(-1);
    const { stop, bounds } = atBottom ? end : rects.find(({ bounds }) => bounds.bottom > readingLine) ?? end;
    currentStop = stop;
    if (!canFly()) {
      targetY = bottomY;
      return;
    }
    const nearHeading = Math.max(bounds.top + 38, readingLine);
    const withinSection = Math.min(nearHeading, bounds.bottom - size / 2 - 5);
    targetY = Math.min(bottomY, Math.max(topY, withinSection - size / 2));
  }

  function paint() {
    companion.style.setProperty("--companion-y", `${y.toFixed(2)}px`);
    companion.style.setProperty("--companion-bank", `${bank.toFixed(2)}deg`);
  }

  function stopMotion() {
    cancelAnimationFrame(frame);
    frame = 0;
    motion?.cancel();
    rider.style.removeProperty("transform");
    broom.style.removeProperty("transform");
    broom.style.removeProperty("opacity");
    clearReaction();
    setState("rest");
    dock();
    y = targetY;
    bank = 0;
    paint();
  }

  function measureFlight() {
    flightTop = header.offsetHeight;
    flightHeight = Math.max(0, window.innerHeight - flightTop - companion.offsetHeight);
  }

  function takeOff() {
    clearReaction();
    motion?.cancel();
    measureFlight();
    setState("flight");
    motion = createTimeline({ defaults: { ease: glide } });
    motion.add(broom, { opacity: 1, x: 0, y: 0, rotate: 0, duration: 160 }, 0);
    motion.add(rider, { x: 0, y: -4, rotate: -4, duration: 205 }, 0);
  }

  function land() {
    dock();
    motion?.cancel();
    setState("landing");
    motion = createTimeline({
      defaults: { ease: glide },
      onComplete: () => {
        setState("rest");
        if (currentStop === contact && !wavedAtContact) {
          wavedAtContact = true;
          react("wave");
        } else {
          react(currentStop.classList.contains("project") ? "inspect" : "blink");
        }
        scheduleCoffee();
      }
    });
    motion.add(rider, { x: -4, y: -15, rotate: -9, duration: 105 }, 0);
    motion.add(rider, { x: 0, y: 0, rotate: 0, duration: 235 }, 105);
    motion.add(broom, { x: 11, y: 14, rotate: 66, opacity: 0, duration: 285 }, 80);
  }

  function draw(now) {
    frame = 0;
    const elapsed = Math.min(now - lastFrame, 40);
    lastFrame = now;
    if (state === "flight" && now - lastInput >= quietPeriod) land();

    let targetBank = 0;
    if (state === "flight") {
      const down = companion.dataset.direction === "down";
      const speed = Math.min(Math.abs(scrollSpeed), 2.3);
      const fraction = down ? .59 + speed * .055 : .42 - speed * .055;
      targetY = flightTop + flightHeight * fraction + Math.sin(now / 115) * 3;
      targetBank = (down ? 1 : -1) * (11 + speed * 5);
    }

    const ease = 1 - Math.exp(-elapsed / 83);
    y += (targetY - y) * ease;
    bank += (targetBank - bank) * ease;
    const moving = Math.abs(targetY - y) > .25 || Math.abs(targetBank - bank) > .2;
    if (!moving && state !== "flight") {
      y = targetY;
      bank = targetBank;
    }
    paint();
    if (moving || state === "flight") frame = requestAnimationFrame(draw);
  }

  function animatePosition(now) {
    if (frame) return;
    lastFrame = now;
    frame = requestAnimationFrame(draw);
  }

  function closeActions(returnFocus = false) {
    if (actions.hidden) return;
    actions.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    if (returnFocus) trigger.focus({ preventScroll: true });
  }

  function updateActions() {
    const project = currentStop.matches(".project");
    projectLink.hidden = !project;
    if (project) {
      const link = currentStop.querySelector(".project-copy a");
      projectLink.href = link.href;
      projectLink.textContent = link.textContent;
    }
    const nextProject = project && currentStop.nextElementSibling;
    const destination = nextProject && nextProject.matches(".project") ? `#${nextProject.id}` :
      currentStop === opening || currentStop.matches(".work-handoff") ? "#work" : "#top";
    nextLink.href = destination;
    nextLink.textContent = { "#work": "See projects", "#top": "Back to top" }[destination] ?? "Next project";
    sleepButton.textContent = sleeping ? "Wake Bit" : "Put Bit to sleep";
    coffeeButton.hidden = sleeping;
    sparkButton.hidden = sleeping;
  }

  function toggleSleep() {
    sleeping = !sleeping;
    companion.dataset.sleeping = String(sleeping);
    closeActions(actions.contains(document.activeElement));
    closeCoffee();
    stopMotion();
    if (!sleeping) react("wave");
    scheduleCoffee();
  }

  trigger.addEventListener("click", () => {
    if (!actions.hidden) {
      closeActions();
      scheduleCoffee();
      return;
    }
    closeCoffee();
    stopMotion();
    updateActions();
    actions.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    fitPanel(actions);
    react("wave");
    if (currentStop === opening && !sleeping) opening.dispatchEvent(new Event("bit-pulse"));
  });

  function fitPanel(panel) {
    if (panel.hidden) return;
    const half = panel.offsetHeight / 2;
    const center = y + companion.offsetHeight / 2;
    const top = header.offsetHeight + half + 6;
    const bottom = window.innerHeight - half - 6;
    const offset = Math.max(top, Math.min(bottom, center)) - center;
    panel.style.setProperty("--companion-panel-offset", `${offset}px`);
  }

  function closeCoffee() {
    clearTimeout(coffeeTimer);
    if (coffeeNote.contains(document.activeElement)) trigger.focus({ preventScroll: true });
    coffeeNote.hidden = true;
    delete companion.dataset.coffee;
    status.textContent = "";
  }

  function canOfferCoffee() {
    return state === "rest" && !sleeping && !companion.hidden && !document.hidden && actions.hidden;
  }

  function visitorIsBusy() {
    return Boolean(document.activeElement?.closest("input, textarea, select, button, summary, a, video, [contenteditable]")) ||
      Boolean(window.getSelection()?.toString()) || [...document.querySelectorAll("video")].some(video => !video.paused);
  }

  function brewCoffee(manual = false) {
    if (!canOfferCoffee() || companion.dataset.coffee) return;
    clearTimeout(coffeeTimer);
    clearReaction();
    const offer = () => {
      if (!canOfferCoffee() || (!manual && visitorIsBusy())) {
        closeCoffee();
        return;
      }
      offeredCoffee = true;
      companion.dataset.coffee = "offer";
      coffeeTitle.textContent = "Want a coffee?";
      acceptCoffee.hidden = false;
      dismissCoffee.textContent = "Maybe later";
      coffeeNote.hidden = false;
      fitPanel(coffeeNote);
      if (manual && document.activeElement === trigger) acceptCoffee.focus({ preventScroll: true });
      else status.textContent = "Bit is offering you a coffee.";
    };
    if (reduced.matches) offer();
    else {
      companion.dataset.coffee = "brewing";
      coffeeTimer = setTimeout(offer, 1100);
    }
  }

  function scheduleCoffee() {
    if (offeredCoffee || companion.dataset.coffee || !canOfferCoffee()) return;
    clearTimeout(coffeeTimer);
    coffeeTimer = setTimeout(() => {
      if (!visitorIsBusy()) brewCoffee();
    }, 7400);
  }

  function reveal() {
    if (!companion.hidden) return;
    clearTimeout(revealTimer);
    heroObserver.disconnect();
    companion.hidden = false;
    stopMotion();
    scheduleCoffee();
  }

  const heroObserver = new MutationObserver(() => {
    if (hero.dataset.buildState === "built") reveal();
  });
  const revealTimer = setTimeout(reveal, 1500);
  heroObserver.observe(hero, { attributes: true, attributeFilter: ["data-build-state"] });
  document.body.dataset.companionReady = "";
  if (!["pending", "running"].includes(hero.dataset.buildState) || lastScroll > 0) reveal();

  companion.addEventListener("toggle-bit", () => {
    reveal();
    toggleSleep();
  });
  sleepButton.addEventListener("click", toggleSleep);
  coffeeButton.addEventListener("click", () => {
    closeActions(true);
    brewCoffee(true);
  });
  acceptCoffee.addEventListener("click", () => {
    companion.dataset.coffee = "served";
    coffeeTitle.textContent = "Coffee’s ready.";
    dismissCoffee.textContent = "Done";
    dismissCoffee.focus({ preventScroll: true });
    acceptCoffee.hidden = true;
    status.textContent = "Bit served your coffee.";
    fitPanel(coffeeNote);
  });
  dismissCoffee.addEventListener("click", closeCoffee);
  sparkButton.addEventListener("click", () => {
    closeActions(true);
    clearReaction();
    react("spark");
    status.textContent = "Bit cast a spark.";
    document.dispatchEvent(new CustomEvent("bit-pulse", { detail: { y: y + companion.offsetHeight / 2 } }));
    scheduleCoffee();
  });
  actions.addEventListener("click", event => {
    if (event.target.closest("a")) closeActions();
  });
  document.addEventListener("pointerdown", event => {
    if (!companion.contains(event.target)) {
      closeActions();
      closeCoffee();
      scheduleCoffee();
    }
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeActions(companion.contains(document.activeElement));
      closeCoffee();
      scheduleCoffee();
    }
  });
  document.querySelector(".activity-list").addEventListener("toggle", event => {
    if (event.target.open && currentStop?.matches(".activity")) react("inspect");
  }, true);

  window.addEventListener("scroll", () => {
    const position = Math.max(window.scrollY, 0);
    const distance = position - lastScroll;
    if (!distance) return;
    lastScroll = position;
    closeActions(actions.contains(document.activeElement));
    closeCoffee();
    reveal();
    if (!canFly()) {
      scheduleCoffee();
      return;
    }
    const now = performance.now();
    scrollSpeed = distance / Math.max(now - lastInput, 8);
    lastInput = now;
    companion.dataset.direction = distance > 0 ? "down" : "up";
    if (state !== "flight") takeOff();
    animatePosition(now);
  }, { passive: true });

  window.addEventListener("resize", () => {
    if (companion.hidden) return;
    if (state === "flight") measureFlight();
    else stopMotion();
    fitPanel(actions);
    fitPanel(coffeeNote);
  }, { passive: true });
  reduced.addEventListener("change", () => {
    if (!companion.hidden) stopMotion();
  });
  document.addEventListener("visibilitychange", () => {
    if (companion.hidden) return;
    stopMotion();
    if (document.hidden) closeCoffee();
    else scheduleCoffee();
  });
})();
