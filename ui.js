// ============================================================
// UI RENDERING — Expense Tracker
// ============================================================

const UI = {

  // ---- Dashboard Summary Cards ----
  renderSummaryCards() {
    const txs = DB.getTransactions();
    const curMonth = getCurrentMonth();
    const monthly = txs.filter(t => t.date && t.date.startsWith(curMonth));

    const income  = monthly.filter(t => t.type === 'income').reduce((s,t) => s + t.amount, 0);
    const expense = monthly.filter(t => t.type === 'expense').reduce((s,t) => s + t.amount, 0);
    const balance = income - expense;
    const savings = income > 0 ? Math.max(0, Math.round((balance / income) * 100)) : 0;

    document.getElementById('totalIncome').textContent  = formatCurrency(income);
    document.getElementById('totalExpense').textContent = formatCurrency(expense);
    document.getElementById('netBalance').textContent   = formatCurrency(balance);
    document.getElementById('savingsRate').textContent  = savings + '%';

    const badgeEl = document.getElementById('balanceBadge');
    if (balance >= 0) { badgeEl.textContent = '✓ Positive'; badgeEl.style.color = 'var(--income)'; }
    else              { badgeEl.textContent = '✗ Deficit';  badgeEl.style.color = 'var(--expense)'; }
  },

  // ---- Recent Transactions (Dashboard) ----
  renderRecentTransactions() {
    const txs = DB.getTransactions().slice(0, 8);
    const container = document.getElementById('recentTransactions');
    if (!container) return;
    container.innerHTML = txs.length
      ? txs.map(t => this.txItemHTML(t)).join('')
      : '<div class="empty-state">No transactions yet. Add your first one!</div>';
  },

  txItemHTML(t) {
    const cat = getCategoryInfo(t.category, t.type);
    const sign = t.type === 'income' ? '+' : '-';
    return `
      <div class="tx-item" data-id="${t.id}">
        <div class="tx-icon" style="background:${cat.color}22;color:${cat.color}">${cat.icon}</div>
        <div class="tx-info">
          <div class="tx-desc">${escHtml(t.description)}</div>
          <div class="tx-meta">${escHtml(t.category)} · ${formatDate(t.date)}</div>
        </div>
        <div class="tx-amount ${t.type}">${sign}${formatCurrency(t.amount)}</div>
      </div>`;
  },

  // ---- Category Breakdown (Dashboard) ----
  renderCategoryBreakdown() {
    const txs = DB.getTransactions().filter(t => t.type === 'expense');
    const curMonth = getCurrentMonth();
    const monthly  = txs.filter(t => t.date && t.date.startsWith(curMonth));
    const catMap   = {};
    monthly.forEach(t => { catMap[t.category] = (catMap[t.category] || 0) + t.amount; });
    const sorted = Object.entries(catMap).sort((a,b) => b[1]-a[1]).slice(0, 6);
    const max = sorted[0]?.[1] || 1;

    const container = document.getElementById('categoryBreakdown');
    if (!container) return;
    container.innerHTML = sorted.length
      ? sorted.map(([name, val]) => {
          const cat = getCategoryInfo(name, 'expense');
          const pct = Math.round((val / max) * 100);
          return `
            <div class="cat-item">
              <div class="cat-header">
                <span class="cat-name">${cat.icon} ${name}</span>
                <span class="cat-amount">${formatCurrency(val)}</span>
              </div>
              <div class="cat-bar">
                <div class="cat-fill" style="width:${pct}%;background:${cat.color}"></div>
              </div>
            </div>`;
        }).join('')
      : '<div class="empty-state">No expenses this month</div>';
  },

  // ---- Transactions Table ----
  renderTable(filtered) {
    const txs = filtered !== undefined ? filtered : DB.getTransactions();
    const body = document.getElementById('txTableBody');
    const countEl = document.getElementById('txCount');
    if (countEl) countEl.textContent = txs.length + ' record' + (txs.length !== 1 ? 's' : '');

    if (!body) return;
    body.innerHTML = txs.length ? txs.map(t => {
      const cat = getCategoryInfo(t.category, t.type);
      const sign = t.type === 'income' ? '+' : '-';
      return `
        <tr>
          <td>${formatDate(t.date)}</td>
          <td>
            <div style="font-weight:500">${escHtml(t.description)}</div>
            ${t.note ? `<div style="font-size:0.77rem;color:var(--text-muted)">${escHtml(t.note)}</div>` : ''}
          </td>
          <td><span class="cat-chip">${cat.icon} ${escHtml(t.category)}</span></td>
          <td><span class="type-chip ${t.type}">${t.type}</span></td>
          <td style="font-weight:700;font-family:var(--font-display);color:var(--${t.type})">${sign}${formatCurrency(t.amount)}</td>
          <td>
            <div class="action-btns">
              <button class="action-btn" onclick="App.editTx('${t.id}')">✏️ Edit</button>
              <button class="action-btn delete" onclick="App.deleteTx('${t.id}')">🗑️</button>
            </div>
          </td>
        </tr>`;
    }).join('')
    : '<tr><td colspan="6" class="empty-cell">No transactions found</td></tr>';
  },

  // ---- Analytics: Top Categories ----
  renderTopCategories() {
    const txs = DB.getTransactions().filter(t => t.type === 'expense');
    const catMap = {};
    txs.forEach(t => { catMap[t.category] = (catMap[t.category] || 0) + t.amount; });
    const sorted = Object.entries(catMap).sort((a,b) => b[1]-a[1]).slice(0, 6);
    const max = sorted[0]?.[1] || 1;
    const colors = ['#7c6aff','#ff5b7a','#22d99a','#ffb547','#22aaff','#ff79c6'];

    const el = document.getElementById('topCategories');
    if (!el) return;
    el.innerHTML = sorted.length
      ? sorted.map(([name, val], i) => {
          const cat = getCategoryInfo(name, 'expense');
          const pct = Math.round((val / max) * 100);
          return `
            <div class="top-cat-item">
              <div class="top-cat-rank">${i+1}</div>
              <div class="top-cat-info">
                <div class="top-cat-name">${cat.icon} ${name}</div>
                <div class="top-cat-bar-wrap">
                  <div class="top-cat-bar" style="width:${pct}%;background:${colors[i%colors.length]}"></div>
                </div>
              </div>
              <div class="top-cat-amount">${formatCurrency(val)}</div>
            </div>`;
        }).join('')
      : '<div class="empty-state">No expense data</div>';
  },

  // ---- Budget ----
  renderBudgets() {
    const budgets = DB.getBudgets();
    const curMonth = getCurrentMonth();
    const txs = DB.getTransactions().filter(t => t.type === 'expense');
    const el = document.getElementById('budgetList');
    if (!el) return;

    if (!budgets.length) {
      el.innerHTML = '<div class="empty-state">No budgets set. Start by adding one!</div>';
      return;
    }

    el.innerHTML = budgets.map(b => {
      const cat = getCategoryInfo(b.category, 'expense');
      const spent = txs
        .filter(t => t.category === b.category && t.date && t.date.startsWith(b.month))
        .reduce((s,t) => s+t.amount, 0);
      const pct = Math.min(100, Math.round((spent / b.amount) * 100));
      const status = pct >= 100 ? 'over' : pct >= 75 ? 'warn' : 'safe';
      const statusLabel = pct >= 100 ? '⚠ Over budget!' : pct >= 75 ? '🔶 Nearing limit' : '✓ On track';
      return `
        <div class="budget-card">
          <div class="budget-card-header">
            <span class="budget-cat-name">${cat.icon} ${escHtml(b.category)}</span>
            <button class="budget-delete" onclick="App.deleteBudget('${b.key}')">✕</button>
          </div>
          <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:10px">${getMonthLabel(b.month)}</div>
          <div class="budget-amounts">
            <span class="budget-spent">Spent: <span>${formatCurrency(spent)}</span></span>
            <span class="budget-limit">Limit: ${formatCurrency(b.amount)}</span>
          </div>
          <div class="budget-bar">
            <div class="budget-fill ${status}" style="width:${pct}%"></div>
          </div>
          <div class="budget-status ${status}">${statusLabel} (${pct}%)</div>
        </div>`;
    }).join('');
  },

  // ---- Populate Category Selects ----
  populateCategorySelect(selectId, type) {
    const el = document.getElementById(selectId);
    if (!el) return;
    const cats = type ? CATEGORIES[type] : getAllCategories();
    el.innerHTML = cats.map(c => `<option value="${c.name}">${c.icon} ${c.name}</option>`).join('');
  },

  populateFilterCategories() {
    const el = document.getElementById('filterCategory');
    if (!el) return;
    const txs = DB.getTransactions();
    const cats = [...new Set(txs.map(t => t.category))].sort();
    const opts = ['<option value="all">All Categories</option>'];
    cats.forEach(c => {
      const info = getCategoryInfo(c);
      opts.push(`<option value="${c}">${info.icon} ${c}</option>`);
    });
    el.innerHTML = opts.join('');
  },

  populateFilterMonths() {
    const el = document.getElementById('filterMonth');
    if (!el) return;
    const txs = DB.getTransactions();
    const months = [...new Set(txs.map(t => t.date ? t.date.substring(0,7) : null).filter(Boolean))].sort().reverse();
    const opts = ['<option value="all">All Months</option>'];
    months.forEach(m => opts.push(`<option value="${m}">${getMonthLabel(m)}</option>`));
    el.innerHTML = opts.join('');
  },

  // ---- Toast ----
  showToast(msg, type = 'info') {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className = `toast show ${type}`;
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => { el.classList.remove('show'); }, 3000);
  }
};

function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
