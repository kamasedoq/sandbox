(() => {
  const MINUS = "−";
  const BUMP_DURATION = 180;
  const FLOAT_DURATION = 700;

  const countEl = document.querySelector(".count");
  const countNumEl = document.getElementById("count-num");
  const timerEl = document.getElementById("timer");
  const timerValueEl = document.getElementById("timer-value");
  const lapsCountEl = document.getElementById("laps-count");
  const lapsEmptyEl = document.getElementById("laps-empty");
  const lapsScrollEl = document.getElementById("laps-scroll");

  let count = 0;
  let laps = []; // newest first; each = { count, delta, t }
  let lastTs = null;
  let timerRaf = null;

  function formatDelta(ms) {
    if (ms == null) return "—";
    if (ms < 1000) return `0.${String(Math.floor(ms / 10)).padStart(2, "0")}s`;
    const totalSec = ms / 1000;
    if (totalSec < 60) return `${totalSec.toFixed(2)}s`;
    const m = Math.floor(totalSec / 60);
    const s = totalSec - m * 60;
    if (m < 60) return `${m}:${s.toFixed(1).padStart(4, "0")}`;
    const h = Math.floor(m / 60);
    const mm = m - h * 60;
    return `${h}:${String(mm).padStart(2, "0")}:${String(Math.floor(s)).padStart(2, "0")}`;
  }

  function formatTimer(ms) {
    const value = ms == null || ms < 0 ? 0 : ms;
    const totalSec = value / 1000;
    if (totalSec < 60) return `${totalSec.toFixed(2)}s`;
    const m = Math.floor(totalSec / 60);
    const s = totalSec - m * 60;
    if (m < 60) return `${m}:${s.toFixed(2).padStart(5, "0")}`;
    const h = Math.floor(m / 60);
    const mm = m - h * 60;
    return `${h}:${String(mm).padStart(2, "0")}:${s.toFixed(0).padStart(2, "0")}`;
  }

  function renderCount() {
    countNumEl.textContent = count < 0 ? `${MINUS}${Math.abs(count)}` : `${count}`;
  }

  function bump(direction) {
    const cls = direction > 0 ? "bump-up" : "bump-down";
    countEl.classList.add(cls);
    setTimeout(() => countEl.classList.remove(cls), BUMP_DURATION);
  }

  function spawnFloat(value, side) {
    const el = document.createElement("span");
    el.className = `float ${side}`;
    el.textContent = value;
    countEl.appendChild(el);
    el.addEventListener("animationend", () => el.remove(), { once: true });
    // Safety net in case animationend never fires (e.g. tab backgrounded)
    setTimeout(() => el.isConnected && el.remove(), FLOAT_DURATION + 200);
  }

  function startTimer() {
    stopTimer();
    const tick = () => {
      if (lastTs == null) return;
      timerValueEl.textContent = formatTimer(Date.now() - lastTs);
      timerRaf = requestAnimationFrame(tick);
    };
    timerRaf = requestAnimationFrame(tick);
  }

  function stopTimer() {
    if (timerRaf != null) {
      cancelAnimationFrame(timerRaf);
      timerRaf = null;
    }
  }

  function updateTimerDisplay() {
    if (lastTs == null) {
      timerEl.classList.add("idle");
      timerValueEl.textContent = "00.00s";
      stopTimer();
    } else {
      timerEl.classList.remove("idle");
      timerValueEl.textContent = formatTimer(Date.now() - lastTs);
      startTimer();
    }
  }

  function renderLaps() {
    if (laps.length === 0) {
      lapsCountEl.textContent = "";
      lapsEmptyEl.hidden = false;
      lapsScrollEl.hidden = true;
      lapsScrollEl.replaceChildren();
      return;
    }
    lapsCountEl.textContent = String(laps.length);
    lapsEmptyEl.hidden = true;
    lapsScrollEl.hidden = false;

    const frag = document.createDocumentFragment();
    laps.forEach((lap) => {
      const wrap = document.createElement("div");
      wrap.className = "lap";

      const top = document.createElement("div");
      top.className = "lap-top";
      const cnt = document.createElement("span");
      cnt.className = "lap-count";
      cnt.textContent = String(lap.count);
      top.appendChild(cnt);

      const time = document.createElement("div");
      time.className = "lap-time";
      time.textContent = formatDelta(lap.delta);

      wrap.appendChild(top);
      wrap.appendChild(time);
      frag.appendChild(wrap);
    });
    lapsScrollEl.replaceChildren(frag);
    lapsScrollEl.scrollLeft = 0;
  }

  function increment() {
    const nowTs = Date.now();
    const delta = lastTs == null ? null : nowTs - lastTs;
    lastTs = nowTs;
    count += 1;
    laps = [{ count, delta, t: nowTs }, ...laps];

    renderCount();
    bump(1);
    spawnFloat("+1", "right");
    updateTimerDisplay();
    renderLaps();
  }

  function decrement() {
    // Decrement undoes the most recent increment. No-op when nothing to undo.
    if (laps.length === 0) return;
    laps = laps.slice(1);
    count -= 1;
    lastTs = laps.length > 0 ? laps[0].t : null;

    renderCount();
    bump(-1);
    spawnFloat(`${MINUS}1`, "left");
    updateTimerDisplay();
    renderLaps();
  }

  function tap(dir) {
    if (dir > 0) increment();
    else decrement();
  }

  // Tap zones
  document.querySelectorAll(".half").forEach((el) => {
    el.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      tap(Number(el.dataset.dir));
    });
  });

  // Keyboard shortcuts
  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "+" || e.key === "=") {
      e.preventDefault();
      tap(1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown" || e.key === "-") {
      e.preventDefault();
      tap(-1);
    }
  });

  // Stop the timer rAF loop when the tab is hidden; resume on visible.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopTimer();
    else if (lastTs != null) startTimer();
  });

  // Initial paint
  renderCount();
  updateTimerDisplay();
  renderLaps();
})();
