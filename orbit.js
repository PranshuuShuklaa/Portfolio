(() => {
  const canvas = document.querySelector("[data-orbit]");
  const opening = canvas.parentElement;
  const context = canvas.getContext("2d");
  if (!context || typeof IntersectionObserver !== "function") return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const compact = window.matchMedia("(max-width: 42rem)");
  const neutral = { x: .74, y: .36 };
  const target = { ...neutral };
  const pointer = { ...neutral };
  const tau = Math.PI * 2;
  let width = 1;
  let height = 1;
  let visible = false;
  let frame = 0;
  let lastPaint = 0;

  function resize() {
    const bounds = opening.getBoundingClientRect();
    width = Math.max(1, bounds.width);
    height = Math.max(1, bounds.height);
    const ratio = Math.min(window.devicePixelRatio || 1, 1.45);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function ring(center, radius, flatten, tilt, phase, steps) {
    const cos = Math.cos(tilt);
    const sin = Math.sin(tilt);
    context.beginPath();
    for (let step = 0; step <= steps; step++) {
      const angle = step / steps * tau;
      const wobble = radius * (1 + .04 * Math.sin(angle * 3 + phase));
      const u = Math.cos(angle) * wobble;
      const v = Math.sin(angle) * wobble * flatten;
      const x = center.x + u * cos - v * sin;
      const y = center.y + u * sin + v * cos;
      if (step === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.closePath();
  }

  function paint(now) {
    context.clearRect(0, 0, width, height);
    pointer.x += (target.x - pointer.x) * .12;
    pointer.y += (target.y - pointer.y) * .12;
    const phase = now * .00065;
    const shiftX = pointer.x - neutral.x;
    const shiftY = pointer.y - neutral.y;
    const center = {
      x: width * (compact.matches ? .78 : .74) + shiftX * Math.min(120, width * .17),
      y: height * (compact.matches ? .22 : .27) + shiftY * Math.min(85, height * .16)
    };
    const radius = Math.min(width * (compact.matches ? .245 : .108), height * .282);
    const tilt = -.21 + shiftY * .28 + Math.sin(phase * .45) * .07;
    const flare = Math.abs(shiftX) * .11 + Math.sin(phase) * .025;
    const outerRings = compact.matches ? 12 : 22;
    context.lineWidth = .7;

    for (let i = 0; i < outerRings; i++) {
      const depth = i / outerRings;
      ring(center, radius * (1.16 + depth * 2.13), .24 + depth * .14 + flare, tilt, phase + depth * 1.5, 74);
      context.strokeStyle = i % 4 === 0 ? "rgba(96,55,66,.29)" : `rgba(32,59,49,${.24 - depth * .17})`;
      context.stroke();
    }

    for (let i = 0; i < 10; i++) {
      const depth = i / 10;
      ring(center, radius * (.76 + .43 * depth), .9 - depth * .08, tilt * .55, phase * .8 - depth, 68);
      context.strokeStyle = `rgba(32,59,49,${.23 - depth * .13})`;
      context.stroke();
    }

    ring(center, radius * .72, .86, tilt * .32, phase * .62, 72);
    context.fillStyle = "#efeee4";
    context.fill();
    context.strokeStyle = "rgba(32,59,49,.35)";
    context.stroke();

    const cos = Math.cos(tilt);
    const sin = Math.sin(tilt);
    for (let i = 0; i < 64; i++) {
      const band = ((i * 47) % 67) / 67;
      const orbit = radius * (1.08 + band * 2.17);
      const angle = i * 2.39996 + phase * (1.32 - .77 * band);
      const u = Math.cos(angle) * orbit;
      const v = Math.sin(angle) * orbit * (.24 + band * .14 + flare);
      const x = center.x + u * cos - v * sin;
      const y = center.y + u * sin + v * cos;
      if (Math.hypot(x - center.x, y - center.y) < radius * .68) continue;
      context.beginPath();
      context.arc(x, y, i % 7 === 0 ? 1.65 : .75, 0, tau);
      context.fillStyle = i % 5 === 0 ? "rgba(96,55,66,.65)" : "rgba(32,59,49,.47)";
      context.fill();
    }
  }

  function tick(now) {
    if (!visible || document.hidden || reduced.matches) {
      frame = 0;
      return;
    }
    if (now - lastPaint >= 30) {
      lastPaint = now;
      paint(now);
    }
    frame = requestAnimationFrame(tick);
  }

  function synchronize() {
    const shouldMove = visible && !document.hidden && !reduced.matches;
    if (shouldMove && !frame) frame = requestAnimationFrame(tick);
    if (!shouldMove && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  }

  function aim(event) {
    const bounds = opening.getBoundingClientRect();
    target.x = (event.clientX - bounds.left) / width;
    target.y = (event.clientY - bounds.top) / height;
  }

  opening.addEventListener("pointermove", aim, { passive: true });
  opening.addEventListener("pointerdown", aim, { passive: true });
  opening.addEventListener("pointerleave", () => Object.assign(target, neutral));
  document.addEventListener("visibilitychange", synchronize);
  reduced.addEventListener("change", synchronize);
  resize();

  if (typeof ResizeObserver === "function") new ResizeObserver(resize).observe(opening);
  else window.addEventListener("resize", resize, { passive: true });

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    synchronize();
  }).observe(opening);
})();
