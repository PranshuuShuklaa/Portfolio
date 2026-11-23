(() => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const phone = window.matchMedia("(max-width: 42rem)");
  const { createTimeline } = window.anime ?? {};
  const header = document.querySelector(".topbar");
  const handoff = document.querySelector("[data-handoff]");
  const pin = document.querySelector("[data-handoff-pin]");
  const title = document.querySelector("[data-handoff-title]");
  const wipe = document.querySelector("[data-handoff-wipe]");
  const progress = document.querySelector("[data-scroll-progress]");
  let chapter;
  let queued = false;
  let lastPhase = -1;

  function rebuildChapter() {
    chapter?.revert();
    chapter = undefined;
    lastPhase = -1;
    handoff.removeAttribute("data-scrub");
    if (createTimeline && !reduced.matches) {
      handoff.dataset.scrub = "active";
      chapter = createTimeline({ autoplay: false, defaults: { duration: 1000, ease: "linear" } });
      chapter.add(title, {
        scale: [phone.matches ? 1.18 : 1.58, 1],
        x: [phone.matches ? 0 : -14, 0],
        y: [phone.matches ? 2 : 11, 0]
      }, 0);
      chapter.add(wipe, { clipPath: ["inset(0% 100% 0% 0%)", "inset(0% 0% 0% 0%)"] }, 0);
    }
    schedule();
  }

  function drawScroll() {
    queued = false;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const fraction = max > 0 ? Math.max(0, Math.min(window.scrollY / max, 1)) : 0;
    progress.style.transform = `scaleX(${fraction})`;
    if (!chapter) return;
    const distance = Math.max(1, handoff.offsetHeight - pin.offsetHeight);
    const traveled = header.getBoundingClientRect().bottom - handoff.getBoundingClientRect().top;
    const phase = Math.max(0, Math.min(traveled / distance, 1));
    if (phase !== lastPhase) {
      lastPhase = phase;
      chapter.seek(phase * 1000);
    }
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(drawScroll);
  }

  const form = document.querySelector("[data-terminal-form]");
  const input = document.querySelector("#terminal-command");
  const log = document.querySelector("[data-terminal-log]");
  const history = [];
  let historyIndex = 0;
  let draft = "";
  const destinations = new Map([
    ["work", ["work", "Selected work"]],
    ["klove", ["klove-kicks", "Klove Kicks"]],
    ["stipple", ["stipple", "Stipple"]],
    ["infinity", ["infinity", "Infinity"]],
    ["about", ["about", "About me"]],
    ["activity", ["activity", "Outside class"]],
    ["contact", ["contact", "Contact"]]
  ]);

  function appendLine(command, response) {
    const entry = document.createElement("div");
    entry.className = "terminal-entry";
    const line = document.createElement("p");
    const code = document.createElement("code");
    code.textContent = `$ ${command}`;
    line.append(code);
    const result = document.createElement("p");
    result.className = "terminal-result";
    result.textContent = response;
    entry.append(line, result);
    log.append(entry);
    while (log.children.length > 12) log.firstElementChild.remove();
    log.scrollTop = log.scrollHeight;
  }

  form.hidden = false;
  form.addEventListener("submit", event => {
    event.preventDefault();
    const command = input.value.trim();
    if (!command) return;
    if (history.at(-1) !== command) history.push(command);
    if (history.length > 20) history.shift();
    historyIndex = history.length;
    draft = "";
    input.value = "";

    const key = command.toLowerCase().replace(/^cd\s+/, "");
    if (destinations.has(key)) {
      const [id, label] = destinations.get(key);
      appendLine(command, `Opening ${label}.`);
      location.hash = id;
    } else if (key === "help") {
      appendLine(command, "ls · work · klove · stipple · infinity · about · activity · contact · clear");
    } else if (key === "ls") {
      appendLine(command, "Klove Kicks · Stipple · Infinity");
    } else if (key === "clear") {
      log.replaceChildren();
    } else {
      appendLine(command, "Unknown command. Type help to see the available commands.");
    }
  });

  input.addEventListener("keydown", event => {
    if (!history.length || (event.key !== "ArrowUp" && event.key !== "ArrowDown")) return;
    event.preventDefault();
    if (historyIndex === history.length) draft = input.value;
    const shift = event.key === "ArrowUp" ? -1 : 1;
    historyIndex = Math.min(history.length, Math.max(0, historyIndex + shift));
    input.value = historyIndex === history.length ? draft : history[historyIndex];
    input.setSelectionRange(input.value.length, input.value.length);
  });

  const copy = document.querySelector("[data-copy-email]");
  const copyStatus = document.querySelector("[data-copy-status]");
  const email = document.querySelector(".email-link");
  let copyTimer;

  copy.hidden = false;
  copy.addEventListener("click", async () => {
    clearTimeout(copyTimer);
    try {
      await navigator.clipboard.writeText(email.textContent.trim());
      copy.textContent = "Copied";
      copyStatus.textContent = "Email address copied.";
    } catch {
      const text = document.createRange();
      text.selectNodeContents(email);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(text);
      copy.textContent = "Selected";
      copyStatus.textContent = "Email address selected. Use your copy shortcut.";
    }
    copyTimer = setTimeout(() => { copy.textContent = "Copy email"; }, 2200);
  });

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });
  phone.addEventListener("change", rebuildChapter);
  reduced.addEventListener("change", rebuildChapter);
  rebuildChapter();
})();
