const UNITS = [
  { label: 'days', pad: false },
  { label: 'hour', pad: true },
  { label: 'min',  pad: true },
  { label: 'sec',  pad: true },
];

const pad2 = (n) => String(n).padStart(2, '0');

function buildRow(rowEl) {
  const nums = [];
  UNITS.forEach((u, i) => {
    if (i > 0) {
      const sep = document.createElement('span');
      sep.className = 'sep';
      sep.textContent = ':';
      rowEl.appendChild(sep);
    }
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.innerHTML = `<span class="num">${u.pad ? '00' : '0'}</span><span class="cell-label">${u.label}</span>`;
    rowEl.appendChild(cell);
    nums.push(cell.querySelector('.num'));
  });
  return nums;
}

const blocks = [...document.querySelectorAll('[data-elapsed]')].map((block) => ({
  target: new Date(block.dataset.target).getTime(),
  nums: buildRow(block.querySelector('.row')),
}));

function tick() {
  const now = Date.now();
  blocks.forEach(({ target, nums }) => {
    const totalSec = Math.max(0, Math.floor((now - target) / 1000));
    const days    = Math.floor(totalSec / 86400);
    const hours   = Math.floor((totalSec % 86400) / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    nums[0].textContent = days;
    nums[1].textContent = pad2(hours);
    nums[2].textContent = pad2(minutes);
    nums[3].textContent = pad2(seconds);
  });
}

tick();
setInterval(tick, 1000);

// Tooltip wiring for ? buttons
document.querySelectorAll('.help').forEach((btn) => {
  const tooltip = btn.parentElement.querySelector('.tooltip');
  if (!tooltip) return;
  const open  = () => { tooltip.hidden = false; btn.setAttribute('aria-expanded', 'true');  };
  const close = () => { tooltip.hidden = true;  btn.setAttribute('aria-expanded', 'false'); };
  btn.addEventListener('mouseenter', open);
  btn.addEventListener('mouseleave', close);
  btn.addEventListener('focus', open);
  btn.addEventListener('blur', close);
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    tooltip.hidden ? open() : close();
  });
  document.addEventListener('click', (e) => {
    if (!btn.parentElement.contains(e.target)) close();
  });
});

// Preload background then fade in
const bg = new Image();
bg.onload = () => {
  setTimeout(() => document.body.classList.add('bg-loaded'), 500);
};
bg.src = 'bg.gif';
