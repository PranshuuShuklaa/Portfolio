document.querySelectorAll("[data-circuit]").forEach(canvas => {
  const context = canvas.getContext("2d");
  if (!context || typeof IntersectionObserver !== "function") return;

  const surface = canvas.parentElement;
  const hero = canvas.dataset.circuit === "hero";
  const mirrored = canvas.dataset.circuit === "left";
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const compact = window.matchMedia("(max-width: 42rem)");
  const routes = hero ? [
    [[.05,.28],[.16,.28],[.29,.12],[.62,.12],[.69,.04],[1,.04]],
    [[.14,.33],[.23,.33],[.37,.16],[.72,.16],[.78,.09],[1,.09]],
    [[.03,.39],[.26,.39],[.42,.21],[.76,.21],[.82,.14],[1,.14]],
    [[.20,.42],[.32,.42],[.50,.24],[.91,.24],[.96,.19],[1,.19]],
    [[.08,.49],[.36,.49],[.58,.27],[1,.27]],
    [[.04,.57],[.20,.57],[.29,.66],[.53,.66],[.72,.47],[1,.47]],
    [[.14,.60],[.19,.60],[.30,.71],[.58,.71],[.77,.52],[1,.52]],
    [[.09,.65],[.16,.65],[.26,.76],[.62,.76],[.81,.57],[1,.57]],
    [[.21,.76],[.26,.81],[.65,.81],[.85,.62],[1,.62]],
    [[.30,.88],[.69,.88],[.90,.67],[1,.67]],
    [[.45,.93],[.74,.93],[.95,.72],[1,.72]],
    [[.70,.96],[.80,.96],[.98,.78],[1,.78]]
  ] : [
    [[.09,.22],[.27,.22],[.36,.10],[.7,.10],[.78,.03],[1,.03]],
    [[.16,.37],[.39,.37],[.55,.15],[.83,.15],[.89,.08],[1,.08]],
    [[.25,.51],[.52,.51],[.74,.25],[1,.25]],
    [[.07,.61],[.33,.61],[.48,.8],[.79,.8],[.93,.66],[1,.66]],
    [[.2,.72],[.33,.72],[.46,.89],[.88,.89],[.97,.77],[1,.77]],
    [[.41,.97],[.86,.97],[.98,.86],[1,.86]]
  ];
  let width = 1;
  let height = 1;
  let paths = [];
  let visible = false;
  let frame = 0;
  let lastPaint = 0;
  let hovered = -1;
  let bursts = [];
  let traceColor;
  let accentColor;

  function resize() {
    const { width: w, height: h } = surface.getBoundingClientRect();
    width = Math.max(1, w);
    height = Math.max(1, h);
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5, Math.sqrt(1650000 / (width * height)));
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    const style = getComputedStyle(surface);
    traceColor = (style.getPropertyValue("--circuit-ink") || style.getPropertyValue("--graphite")).trim();
    accentColor = (style.getPropertyValue("--circuit-signal") || style.getPropertyValue("--accent")).trim();
    const edge = compact.matches ? .34 : hero ? .45 : .51;
    paths = routes.map(route => {
      let length = 0;
      const points = route.map(([x, y], index) => {
        const position = edge + x * (1 - edge);
        const point = { x: width * (mirrored ? 1 - position : position), y: height * y };
        if (index) {
          const [px, py] = route[index - 1];
          length += Math.hypot((x - px) * width * (1 - edge), (y - py) * height);
        }
        return { ...point, distance: length };
      });
      return { points, length };
    });
  }

  function along(path, distance) {
    const points = path.points;
    for (let i = 1; i < points.length; i++) {
      const from = points[i - 1];
      const to = points[i];
      if (distance <= to.distance) {
        const part = (distance - from.distance) / (to.distance - from.distance);
        return { x: from.x + (to.x - from.x) * part, y: from.y + (to.y - from.y) * part };
      }
    }
    return points.at(-1);
  }

  function stroke(points) {
    context.beginPath();
    context.moveTo(points[0].x, points[0].y);
    for (const point of points.slice(1)) context.lineTo(point.x, point.y);
    context.stroke();
  }

  function signal(path, distance, strong) {
    const tail = strong ? 48 : 21;
    const start = along(path, Math.max(0, distance - tail));
    const tip = along(path, distance);
    const points = path.points.filter(point => point.distance > distance - tail && point.distance < distance);
    context.strokeStyle = accentColor;
    context.globalAlpha = strong ? .95 : hero ? .64 : .36;
    context.lineWidth = strong ? 2 : 1.15;
    stroke([start, ...points, tip]);
    context.fillStyle = accentColor;
    const size = strong ? 4.5 : 3;
    context.fillRect(tip.x - size / 2, tip.y - size / 2, size, size);
  }

  function ripple(point, phase, strength) {
    context.globalAlpha = (1 - phase) * strength;
    context.strokeStyle = accentColor;
    context.lineWidth = 1;
    context.beginPath();
    context.arc(point.x, point.y, 3 + phase * 10, 0, Math.PI * 2);
    context.stroke();
  }

  function paint(now) {
    context.clearRect(0, 0, width, height);
    context.lineJoin = "round";
    for (const [index, path] of paths.entries()) {
      const active = index === hovered;
      context.globalAlpha = active ? .48 : hero && !compact.matches ? .24 : .14;
      context.strokeStyle = active ? accentColor : traceColor;
      context.lineWidth = active ? 1.25 : .8;
      stroke(path.points);
      const pad = path.points[0];
      context.strokeRect(pad.x - 2.6, pad.y - 2.6, 5.2, 5.2);

      const speed = .057 + (index % 4) * .011;
      const travel = (now * speed + index * 81) % (path.length + 220);
      if (travel < path.length) signal(path, travel, active);
      if (travel < 27) ripple(pad, travel / 27, hero ? .48 : .29);
    }

    for (const { index, time } of bursts) {
      const path = paths[index];
      const distance = (now - time) * .57;
      if (distance < 0 || distance > path.length) continue;
      signal(path, distance, true);
      if (distance < 90) ripple(path.points[0], distance / 90, .84);
    }
    bursts = bursts.filter(({ index, time }) => (now - time) * .57 <= paths[index].length);
    context.globalAlpha = 1;
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

  function sync() {
    const running = visible && !document.hidden && !reduced.matches;
    if (running && !frame) frame = requestAnimationFrame(tick);
    if (!running && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  }

  function aim(event) {
    if (!visible || reduced.matches) return;
    const bounds = surface.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    let nearest = 28;
    hovered = -1;
    for (const [index, { points }] of paths.entries()) {
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1];
        const b = points[i];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const part = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy)));
        const distance = Math.hypot(x - a.x - dx * part, y - a.y - dy * part);
        if (distance < nearest) {
          nearest = distance;
          hovered = index;
        }
      }
    }
  }

  function charge(index, acrossNeighbors = false) {
    if (!visible || reduced.matches || index < 0) return;
    const now = performance.now();
    const indices = acrossNeighbors ? [index, index + 1, index - 1].filter(i => paths[i]) : [index];
    bursts = indices.map((i, delay) => ({ index: i, time: now + delay * 95 }));
  }

  surface.addEventListener("pointermove", aim, { passive: true });
  surface.addEventListener("pointerdown", event => {
    aim(event);
    charge(hovered);
  }, { passive: true });
  surface.addEventListener("pointerleave", () => { hovered = -1; });
  if (hero) surface.addEventListener("bit-pulse", () => charge(7));
  document.addEventListener("bit-pulse", event => {
    if (!visible || !event.detail) return;
    const y = event.detail.y - surface.getBoundingClientRect().top;
    if (y < 0 || y > height) return;
    const closest = paths.reduce((best, path, i) =>
      Math.abs(path.points[0].y - y) < Math.abs(paths[best].points[0].y - y) ? i : best, 0);
    charge(closest, true);
  });
  document.addEventListener("visibilitychange", sync);
  reduced.addEventListener("change", sync);
  resize();
  if (typeof ResizeObserver === "function") new ResizeObserver(resize).observe(surface);
  else window.addEventListener("resize", resize, { passive: true });

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    sync();
  }).observe(surface);
});
