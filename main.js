const pad2 = (n) => String(n).padStart(2, '0');

function computeElapsed(targetISO, now) {
  const target = new Date(targetISO).getTime();
  const diff = Math.max(0, now - target);
  const totalSec = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSec / 86400),
    hours: Math.floor((totalSec % 86400) / 3600),
    minutes: Math.floor((totalSec % 3600) / 60),
    seconds: totalSec % 60,
  };
}

const blocks = document.querySelectorAll('[data-elapsed]');

function tick() {
  const now = Date.now();
  blocks.forEach((block) => {
    const iso = block.getAttribute('data-target');
    const { days, hours, minutes, seconds } = computeElapsed(iso, now);
    block.querySelector('[data-elapsed-days]').textContent = days;
    block.querySelector('[data-elapsed-hours]').textContent = pad2(hours);
    block.querySelector('[data-elapsed-minutes]').textContent = pad2(minutes);
    block.querySelector('[data-elapsed-seconds]').textContent = pad2(seconds);
  });
}

tick();
setInterval(tick, 1000);

// Tooltip wiring for ? buttons
document.querySelectorAll('.help').forEach((btn) => {
  const tooltip = btn.parentElement.querySelector('.tooltip');
  if (!tooltip) return;
  const open = () => {
    tooltip.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
  };
  const close = () => {
    tooltip.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
  };
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
