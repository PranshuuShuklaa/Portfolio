(() => {
  const nav = document.querySelector(".site-nav");
  const header = nav.closest(".topbar");
  const highlight = nav.querySelector("[data-nav-highlight]");
  let hovered;
  let navFrame = 0;

  function updateNavHighlight() {
    navFrame = 0;
    const link = nav.querySelector("a:focus-visible") ?? hovered ?? nav.querySelector("[aria-current]");
    highlight.toggleAttribute("data-visible", Boolean(link));
    if (!link) return;
    const origin = nav.getBoundingClientRect();
    const bounds = link.getBoundingClientRect();
    const left = bounds.left - origin.left - 5;
    const top = bounds.top - origin.top + bounds.height * .14;
    highlight.style.transform = `translate3d(${left}px, ${top}px, 0) scale(${bounds.width + 10}, ${bounds.height * .72})`;
  }

  function queueNavHighlight() {
    if (!navFrame) navFrame = requestAnimationFrame(updateNavHighlight);
  }

  nav.addEventListener("pointerover", event => {
    if (event.pointerType === "touch") return;
    hovered = event.target.closest("a");
    queueNavHighlight();
  });
  nav.addEventListener("pointerleave", () => {
    hovered = null;
    queueNavHighlight();
  });
  nav.addEventListener("focusin", queueNavHighlight);
  nav.addEventListener("focusout", queueNavHighlight);
  window.addEventListener("resize", queueNavHighlight, { passive: true });
  if (typeof ResizeObserver === "function") new ResizeObserver(queueNavHighlight).observe(nav);
  new MutationObserver(queueNavHighlight).observe(nav, { subtree: true, attributes: true, attributeFilter: ["aria-current"] });
  queueNavHighlight();

  const motion = window.matchMedia("(prefers-reduced-motion: no-preference)");
  const pointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const iconTemplate = document.querySelector("#project-link-icon");
  for (const link of document.querySelectorAll(".project [data-tour-link]")) {
    link.append(iconTemplate.content.cloneNode(true));
    const icon = link.lastElementChild;
    let pointerFrame = 0;
    link.addEventListener("pointermove", event => {
      if (!motion.matches || !pointer.matches || event.pointerType === "touch") return;
      cancelAnimationFrame(pointerFrame);
      const { clientX, clientY } = event;
      pointerFrame = requestAnimationFrame(() => {
        const bounds = link.getBoundingClientRect();
        const x = (clientX - bounds.left - bounds.width / 2) * .055;
        const y = (clientY - bounds.top - bounds.height / 2) * .105;
        icon.style.setProperty("--magnet-x", `${x.toFixed(2)}px`);
        icon.style.setProperty("--magnet-y", `${y.toFixed(2)}px`);
      });
    });
    link.addEventListener("pointerleave", () => {
      cancelAnimationFrame(pointerFrame);
      icon.style.removeProperty("--magnet-x");
      icon.style.removeProperty("--magnet-y");
    });
  }

  const chart = document.querySelector("[data-activity-chart]");
  const activity = document.querySelector(".activity-list");
  const entries = [...activity.querySelectorAll("[data-outcome]")];
  const outcomes = [
    ["advanced", "Passed round one"],
    ["internal", "Reached internal round"],
    ["organized", "Organizing volunteer"]
  ].map(([kind, label]) => ({ label, entries: entries.filter(entry => entry.dataset.outcome === kind) }))
    .filter(outcome => outcome.entries.length);
  if (!outcomes.length) return;
  const largestCount = Math.max(...outcomes.map(outcome => outcome.entries.length));

  for (const [index, outcome] of outcomes.entries()) {
    const count = outcome.entries.length;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "activity-chart-row";
    button.setAttribute("aria-label", `${outcome.label}, ${count} ${count === 1 ? "event" : "events"}. Show matching entries.`);
    const name = document.createElement("span");
    name.textContent = outcome.label;
    const track = document.createElement("span");
    track.className = "activity-chart-track";
    track.setAttribute("aria-hidden", "true");
    const bar = document.createElement("span");
    bar.className = "activity-chart-bar";
    bar.style.width = `${100 * count / largestCount}%`;
    bar.style.setProperty("--bar-delay", `${index * 75}ms`);
    const value = document.createElement("span");
    value.className = "activity-chart-value";
    value.textContent = count;
    const tooltip = document.createElement("span");
    tooltip.className = "activity-chart-tooltip";
    tooltip.id = `activity-chart-tooltip-${index}`;
    tooltip.setAttribute("role", "tooltip");
    tooltip.textContent = outcome.entries.map(entry => entry.querySelector("summary span").textContent).join(" · ");
    button.setAttribute("aria-describedby", tooltip.id);
    track.append(bar);
    button.append(name, track, value, tooltip);
    chart.append(button);

    button.addEventListener("click", () => {
      for (const entry of entries) entry.toggleAttribute("data-chart-match", outcome.entries.includes(entry));
      for (const entry of outcome.entries) entry.open = true;
      const summary = outcome.entries[0].querySelector("summary");
      summary.focus({ preventScroll: true });
      const { top, bottom } = summary.getBoundingClientRect();
      if (top < header.offsetHeight + 12 || bottom > window.innerHeight * .72) {
        summary.scrollIntoView({ block: "center", behavior: motion.matches ? "smooth" : "instant" });
      }
    });
  }
  chart.hidden = false;
  if (typeof IntersectionObserver === "function") {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      chart.dataset.drawChart = "";
      observer.disconnect();
    }, { threshold: .25 });
    observer.observe(chart);
  }
})();
