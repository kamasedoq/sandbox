(() => {
  const MINUS = "−";
  const BUMP_DURATION = 180;
  const FLOAT_DURATION = 700;
  const STORAGE_KEY = "gacha-counts";

  const PICKUP_ID = "PICKUP";
  const DUMMY_ID = "ダミー";
  const CHARACTERS = ["ディルック", "ジン", "モナ", "刻晴", "七七", "ティナリ", "ディシア", "夢見月瑞希"];
  const GRID_IDS = [...CHARACTERS, DUMMY_ID];

  const SKIN_KEY = "gacha-skins";
  const SLIME_VARIANTS = ["electric", "fire", "water", "ice", "rock", "wind", "grass"];
  const DEFAULT_SKIN = "water";
  const SKINNABLE = new Set([PICKUP_ID, DUMMY_ID]);

  function loadSkins() {
    try {
      const raw = localStorage.getItem(SKIN_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  function saveSkins() {
    try {
      localStorage.setItem(SKIN_KEY, JSON.stringify(skins));
    } catch {
      // storage full 等は保存を諦めて動作継続
    }
  }

  const skins = loadSkins();

  function skinOf(id) {
    return SLIME_VARIANTS.includes(skins[id]) ? skins[id] : DEFAULT_SKIN;
  }

  function iconOf(id) {
    return SKINNABLE.has(id) ? `icons/slime-${skinOf(id)}.webp` : `icons/${id}.webp`;
  }

  /** id -> ダミー画像 img 要素 */
  const skinImgEls = {};

  function cycleSkin(id, step) {
    const i = SLIME_VARIANTS.indexOf(skinOf(id));
    skins[id] = SLIME_VARIANTS[(i + step + SLIME_VARIANTS.length) % SLIME_VARIANTS.length];
    saveSkins();
    skinImgEls[id].src = iconOf(id);
  }

  // 2週間更新がなければ次回オープン時に保存データを破棄する
  const EXPIRY_MS = 14 * 24 * 60 * 60 * 1000;

  function loadCounts() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return {};

      // 旧形式（カウントだけの平坦なオブジェクト）は updatedAt なしの新形式として扱う
      const isNewShape = parsed.counts && typeof parsed.counts === "object";
      const counts = isNewShape ? parsed.counts : parsed;

      const updatedAt = Date.parse(parsed.updatedAt);
      if (!Number.isNaN(updatedAt) && Date.now() - updatedAt > EXPIRY_MS) {
        localStorage.removeItem(STORAGE_KEY);
        return {};
      }
      return counts;
    } catch {
      return {};
    }
  }

  function saveCounts() {
    try {
      if (Object.keys(counts).length === 0) {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ counts, updatedAt: new Date().toISOString() }),
        );
      }
    } catch {
      // storage full 等は保存を諦めて動作継続
    }
  }

  let counts = loadCounts();

  /** id -> count 外枠要素（bump・float のアンカー） */
  const countEls = {};
  /** id -> 数字テキスト要素（render が書き換えるのはここだけ。float を巻き込まない） */
  const numEls = {};

  function buildTile(id) {
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "tile unit";
    tile.dataset.id = id;
    tile.setAttribute("aria-label", `${id} のカウント`);

    const body = document.createElement("div");
    body.className = "tile-body";

    const img = document.createElement("img");
    img.src = iconOf(id);
    img.alt = id;

    const count = document.createElement("span");
    count.className = "count tile-count";
    count.dataset.count = "";
    const num = document.createElement("span");
    num.dataset.countNum = "";
    count.appendChild(num);

    if (SKINNABLE.has(id)) {
      tile.classList.add("skinnable");
      const wrap = document.createElement("span");
      wrap.className = "unit-tip-wrap";
      const tip = document.createElement("span");
      tip.className = "unit-tip";
      tip.setAttribute("role", "tooltip");
      tip.textContent = "狙っている星4キャラ";
      wrap.appendChild(img);
      wrap.appendChild(tip);
      body.appendChild(wrap);
    } else {
      body.appendChild(img);
    }
    body.appendChild(count);
    tile.appendChild(body);
    return tile;
  }

  function render(id) {
    numEls[id].textContent = String(counts[id] || 0);
  }

  function bump(id, dir) {
    const el = countEls[id];
    const cls = dir > 0 ? "bump-up" : "bump-down";
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), BUMP_DURATION);
  }

  function spawnFloat(id, dir) {
    const el = document.createElement("span");
    el.className = `float ${dir > 0 ? "right" : "left"}`;
    el.textContent = dir > 0 ? "+1" : `${MINUS}1`;
    countEls[id].appendChild(el);
    el.addEventListener("animationend", () => el.remove(), { once: true });
    // animationend は背景タブ等で発火しないことがあるための保険
    setTimeout(() => el.isConnected && el.remove(), FLOAT_DURATION + 200);
  }

  function tap(id, dir) {
    const current = counts[id] || 0;
    if (dir === -1 && current === 0) return;
    const next = current + dir;
    if (next === 0) {
      delete counts[id];
    } else {
      counts[id] = next;
    }
    saveCounts();
    render(id);
    bump(id, dir);
    spawnFloat(id, dir);
  }

  function resetAll() {
    counts = {};
    saveCounts();
    Object.keys(countEls).forEach(render);
  }

  // ---- setup ----

  const grid = document.getElementById("grid");
  GRID_IDS.forEach((id) => grid.appendChild(buildTile(id)));

  let editing = false;
  const lockButton = document.getElementById("lock");
  const resetDialog = document.getElementById("reset-dialog");

  function setEditing(next) {
    editing = next;
    document.body.classList.toggle("editing", editing);
    lockButton.setAttribute("aria-pressed", String(editing));
  }

  lockButton.addEventListener("click", () => setEditing(!editing));

  document.querySelectorAll(".unit").forEach((unit) => {
    const id = unit.dataset.id;
    countEls[id] = unit.querySelector("[data-count]");
    numEls[id] = unit.querySelector("[data-count-num]");

    if (SKINNABLE.has(id)) {
      const img = unit.querySelector("img");
      skinImgEls[id] = img;
      img.src = iconOf(id);
    }

    // 通常時 click: +1 / ⌘(Ctrl)+click: −1。編集モード中はスライム画像の切り替え
    unit.addEventListener("click", (e) => {
      const back = e.metaKey || e.ctrlKey;
      if (editing) {
        if (SKINNABLE.has(id)) cycleSkin(id, back ? -1 : 1);
        return;
      }
      tap(id, back ? -1 : 1);
    });

    render(id);
  });

  window.addEventListener("keydown", (e) => {
    // モーダル表示中は <dialog> 標準の Esc クローズに任せる（編集モードは抜けない）
    if (resetDialog.open) return;
    if (editing) {
      if (e.key === "Escape") setEditing(false);
      return;
    }
    if (e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "+" || e.key === "=") {
      e.preventDefault();
      tap(PICKUP_ID, 1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown" || e.key === "-") {
      e.preventDefault();
      tap(PICKUP_ID, -1);
    }
  });

  const helpWrap = document.getElementById("help-wrap");
  const helpButton = document.getElementById("help");

  function closeHelp() {
    helpWrap.classList.remove("open");
    helpButton.setAttribute("aria-expanded", "false");
  }

  // ポップアップは同時に1つだけ: 鍵側のポップが出る時は ? 側を閉じる
  document.getElementById("lock-wrap").addEventListener("mouseenter", closeHelp);

  helpButton.addEventListener("click", (e) => {
    e.stopPropagation();
    const open = helpWrap.classList.toggle("open");
    helpButton.setAttribute("aria-expanded", String(open));
  });

  document.addEventListener("click", (e) => {
    if (helpWrap.classList.contains("open") && !helpWrap.contains(e.target)) {
      closeHelp();
    }
  });

  // リンクは PICKUP 内にあるためカウント加算を発火させない
  document.getElementById("ref-links").addEventListener("click", (e) => e.stopPropagation());

  document.getElementById("trash").addEventListener("click", () => resetDialog.showModal());
  document.getElementById("reset-cancel").addEventListener("click", () => resetDialog.close());
  document.getElementById("reset-confirm").addEventListener("click", () => {
    resetAll();
    resetDialog.close();
  });
})();
