// ============================================================
// CHARTS — Pure Canvas (no external library)
// ============================================================

const Charts = {
  monthly: null,
  donut: null,

  // ---- Bar Chart: Monthly Income vs Expense ----
  renderMonthly(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const txs = DB.getTransactions();

    // Group by month (last 6 months)
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      months.push({ key, label: d.toLocaleDateString('en-IN', { month: 'short' }), income: 0, expense: 0 });
    }

    txs.forEach(t => {
      const m = t.date ? t.date.substring(0, 7) : null;
      const slot = months.find(mo => mo.key === m);
      if (!slot) return;
      if (t.type === 'income') slot.income += t.amount;
      else slot.expense += t.amount;
    });

    const maxVal = Math.max(...months.flatMap(m => [m.income, m.expense]), 1000);
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const textColor = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = 280 * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = '280px';
    ctx.scale(dpr, dpr);

    const W = rect.width, H = 280;
    const padL = 55, padR = 20, padT = 20, padB = 40;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;
    const barGroupW = chartW / months.length;
    const barW = Math.min(barGroupW * 0.3, 28);

    ctx.clearRect(0, 0, W, H);

    // Grid lines
    for (let i = 0; i <= 4; i++) {
      const y = padT + (chartH / 4) * i;
      ctx.beginPath();
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      ctx.moveTo(padL, y); ctx.lineTo(W - padR, y);
      ctx.stroke();
      const val = maxVal - (maxVal / 4) * i;
      ctx.fillStyle = textColor;
      ctx.font = '11px DM Sans, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('₹' + (val >= 1000 ? Math.round(val/1000)+'k' : Math.round(val)), padL - 6, y + 4);
    }

    // Bars
    months.forEach((m, i) => {
      const cx = padL + barGroupW * i + barGroupW / 2;

      // Income bar
      const inH = (m.income / maxVal) * chartH;
      const inX = cx - barW - 2;
      const inY = padT + chartH - inH;
      ctx.beginPath();
      ctx.fillStyle = '#22d99a';
      roundRect(ctx, inX, inY, barW, inH, 4);
      ctx.fill();

      // Expense bar
      const exH = (m.expense / maxVal) * chartH;
      const exX = cx + 2;
      const exY = padT + chartH - exH;
      ctx.beginPath();
      ctx.fillStyle = '#ff5b7a';
      roundRect(ctx, exX, exY, barW, exH, 4);
      ctx.fill();

      // Label
      ctx.fillStyle = textColor;
      ctx.font = '11px DM Sans, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(m.label, cx, H - padB + 16);
    });

    // Legend
    ctx.font = '12px DM Sans, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#22d99a';
    ctx.fillRect(W - 120, 8, 10, 10);
    ctx.fillStyle = textColor;
    ctx.fillText('Income', W - 106, 18);
    ctx.fillStyle = '#ff5b7a';
    ctx.fillRect(W - 55, 8, 10, 10);
    ctx.fillStyle = textColor;
    ctx.fillText('Expense', W - 41, 18);
  },

  // ---- Donut Chart: Category Breakdown ----
  renderDonut(canvasId, legendId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const txs = DB.getTransactions().filter(t => t.type === 'expense');

    // Group by category
    const catMap = {};
    txs.forEach(t => {
      catMap[t.category] = (catMap[t.category] || 0) + t.amount;
    });
    const sorted = Object.entries(catMap).sort((a,b) => b[1]-a[1]).slice(0, 7);
    const total = sorted.reduce((s,[,v]) => s+v, 0) || 1;
    const colors = ['#7c6aff','#ff5b7a','#22d99a','#ffb547','#22aaff','#ff79c6','#50fa7b'];

    const SIZE = 200;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    canvas.style.width = SIZE + 'px';
    canvas.style.height = SIZE + 'px';
    ctx.scale(dpr, dpr);

    const cx = SIZE/2, cy = SIZE/2, r = 78, innerR = 46;
    let startAngle = -Math.PI / 2;

    if (sorted.length === 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fill();
    } else {
      sorted.forEach(([, val], i) => {
        const slice = (val / total) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, startAngle, startAngle + slice);
        ctx.closePath();
        ctx.fillStyle = colors[i % colors.length];
        ctx.fill();
        startAngle += slice;
      });

      // Inner circle (donut hole)
      ctx.beginPath();
      ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
      const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
      ctx.fillStyle = isDark ? '#22222e' : '#ffffff';
      ctx.fill();

      // Center text
      ctx.fillStyle = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)';
      ctx.font = 'bold 11px DM Sans';
      ctx.textAlign = 'center';
      ctx.fillText('Expenses', cx, cy - 4);
      ctx.font = 'bold 14px Syne';
      ctx.fillStyle = isDark ? '#f0f0f6' : '#0e0e12';
      ctx.fillText('₹' + (total >= 1000 ? Math.round(total/1000)+'k' : total), cx, cy + 14);
    }

    // Legend
    const legendEl = document.getElementById(legendId);
    if (legendEl) {
      legendEl.innerHTML = sorted.length ? sorted.map(([name, val], i) => `
        <div class="legend-item">
          <span class="legend-dot" style="background:${colors[i%colors.length]}"></span>
          <span class="legend-label">${name}</span>
          <span class="legend-val">₹${Math.round(val/1000*10)/10}k</span>
        </div>`).join('') : '<div class="empty-state">No expense data</div>';
    }
  }
};

function roundRect(ctx, x, y, w, h, r) {
  if (h <= 0) return;
  r = Math.min(r, h/2, w/2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
