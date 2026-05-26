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
  /** Newest first. Each entry: { count, delta, t }. */
  let laps = [];
  let lastTs = null;
  let timerRaf = null;

  function padFloor(n, len) {
    return String(Math.floor(n)).padStart(len, "0");
  }

  function formatDelta(ms) {
    if (ms == null) return "—";
    if (ms < 1000) return `0.${padFloor(ms / 10, 2)}s`;
    const totalSec = ms / 1000;
    if (totalSec < 60) return `${totalSec.toFixed(2)}s`;
    const m = Math.floor(totalSec / 60);
    const s = totalSec - m * 60;
    if (m < 60) return `${m}:${s.toFixed(1).padStart(4, "0")}`;
    const h = Math.floor(m / 60);
    return `${h}:${padFloor(m - h * 60, 2)}:${padFloor(s, 2)}`;
  }

  function formatTimer(ms) {
    const value = ms == null || ms < 0 ? 0 : ms;
    const totalSec = value / 1000;
    if (totalSec < 60) return `${totalSec.toFixed(2)}s`;
    const m = Math.floor(totalSec / 60);
    const s = totalSec - m * 60;
    if (m < 60) return `${m}:${s.toFixed(2).padStart(5, "0")}`;
    const h = Math.floor(m / 60);
    return `${h}:${padFloor(m - h * 60, 2)}:${padFloor(s, 2)}`;
  }

  function renderCount() {
    countNumEl.textContent = String(count);
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
    // animationend は背景タブ等で発火しないことがあるための保険
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

  function refreshTimer() {
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

  function createLapNode(lap) {
    const li = document.createElement("li");
    li.className = "lap";

    const cnt = document.createElement("span");
    cnt.className = "lap-count";
    cnt.textContent = String(lap.count);

    const time = document.createElement("span");
    time.className = "lap-time";
    time.textContent = formatDelta(lap.delta);

    li.appendChild(cnt);
    li.appendChild(time);
    return li;
  }

  function setLapsCount() {
    lapsCountEl.textContent = laps.length === 0 ? "" : String(laps.length);
    const empty = laps.length === 0;
    lapsEmptyEl.hidden = !empty;
    lapsScrollEl.hidden = empty;
  }

  function prependLap(lap) {
    lapsScrollEl.prepend(createLapNode(lap));
    lapsScrollEl.scrollLeft = 0;
  }

  function popFirstLap() {
    lapsScrollEl.firstElementChild?.remove();
  }

  function increment() {
    const nowTs = Date.now();
    const delta = lastTs == null ? null : nowTs - lastTs;
    const lap = { count: count + 1, delta, t: nowTs };

    count += 1;
    laps = [lap, ...laps];
    lastTs = nowTs;

    renderCount();
    bump(1);
    spawnFloat("+1", "right");
    refreshTimer();
    prependLap(lap);
    setLapsCount();
  }

  function decrement() {
    // 直近の increment を巻き戻す。何もない時は no-op。
    if (laps.length === 0) return;
    laps = laps.slice(1);
    count -= 1;
    lastTs = laps.length > 0 ? laps[0].t : null;

    renderCount();
    bump(-1);
    spawnFloat(`${MINUS}1`, "left");
    refreshTimer();
    popFirstLap();
    setLapsCount();
  }

  function tap(dir) {
    if (dir === 1) increment();
    else if (dir === -1) decrement();
  }

  document.querySelectorAll(".half").forEach((el) => {
    const dir = el.dataset.dir === "1" ? 1 : -1;
    el.addEventListener("click", () => tap(dir));
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "+" || e.key === "=") {
      e.preventDefault();
      tap(1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown" || e.key === "-") {
      e.preventDefault();
      tap(-1);
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopTimer();
    else if (lastTs != null) startTimer();
  });

  renderCount();
  refreshTimer();
  setLapsCount();
})();
