const START = new Date('2026-01-14T11:13:00+09:00').getTime();

function pad(n) {
  return String(n).padStart(2, '0');
}

function update() {
  const diff = Date.now() - START;
  if (diff < 0) return;

  const totalSec = Math.floor(diff / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  document.getElementById('days').textContent = days;
  document.getElementById('hours').textContent = pad(hours);
  document.getElementById('minutes').textContent = pad(minutes);
  document.getElementById('seconds').textContent = pad(seconds);
  document.getElementById('total').textContent = totalSec.toLocaleString() + ' seconds';
}

function updateTooltip() {
  const now = new Date();
  const jst = new Date(now.getTime() + (now.getTimezoneOffset() + 540) * 60000);
  const y = jst.getFullYear();
  const mo = pad(jst.getMonth() + 1);
  const d = pad(jst.getDate());
  const h = pad(jst.getHours());
  const mi = pad(jst.getMinutes());
  const s = pad(jst.getSeconds());
  document.getElementById('tooltip-time').textContent =
    'As of ' + y + '/' + mo + '/' + d + ' ' + h + ':' + mi + ':' + s + ' JST';
}

const helpEl = document.getElementById('help');
helpEl.addEventListener('click', function(e) {
  e.stopPropagation();
  const active = helpEl.getAttribute('data-active') === 'true';
  helpEl.setAttribute('data-active', !active);
  if (!active) updateTooltip();
});
document.addEventListener('click', function() {
  helpEl.setAttribute('data-active', 'false');
});

function tick() { update(); updateTooltip(); }
tick();
setInterval(tick, 1000);
