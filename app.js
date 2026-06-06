// ============================================================
// APP — Main Controller
// ============================================================

const App = {

  currentPage: 'dashboard',
  filters: { search: '', type: 'all', category: 'all', month: 'all' },

  // ---- Init ----
  init() {
    // Seed demo data on first visit
    DB.seedDemo();

    // Apply saved theme
    const theme = DB.getTheme();
    document.documentElement.setAttribute('data-theme', theme);

    // Set today's date as default in form
    const today = new Date().toISOString().split('T')[0];
    const txDateEl = document.getElementById('txDate');
    if (txDateEl) txDateEl.value = today;

    // Populate budget month default
    const budgetMonthEl = document.getElementById('budgetMonth');
    if (budgetMonthEl) budgetMonthEl.value = getCurrentMonth();

    // Set current date display
    const dateEl = document.getElementById('currentDate');
    if (dateEl) dateEl.textContent = new Date().toLocaleDateString('en-IN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    this.bindEvents();
    this.navigateTo('dashboard');
  },

  // ---- Navigation ----
  navigateTo(page) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    // Show target
    const pageEl = document.getElementById('page-' + page);
    if (pageEl) pageEl.classList.add('active');
    document.querySelectorAll(`[data-page="${page}"]`).forEach(n => n.classList.add('active'));

    this.currentPage = page;
    this.renderPage(page);

    // Close mobile sidebar
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
  },

  renderPage(page) {
    if (page === 'dashboard') {
      UI.renderSummaryCards();
      UI.renderRecentTransactions();
      UI.renderCategoryBreakdown();
    }
    if (page === 'transactions') {
      UI.populateFilterCategories();
      UI.populateFilterMonths();
      this.applyFilters();
    }
    if (page === 'analytics') {
      UI.renderTopCategories();
      setTimeout(() => {
        Charts.renderMonthly('monthlyChart');
        Charts.renderDonut('donutChart', 'donutLegend');
      }, 50);
    }
    if (page === 'budget') {
      UI.renderBudgets();
    }
  },

  // ---- Event Bindings ----
  bindEvents() {
    // Sidebar nav
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', e => {
        e.preventDefault();
        const pg = item.dataset.page;
        if (pg) this.navigateTo(pg);
      });
    });

    // View all link
    document.querySelectorAll('.view-all').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        const pg = a.dataset.page;
        if (pg) this.navigateTo(pg);
      });
    });

    // Sidebar mobile
    const menuBtn = document.getElementById('menuBtn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    overlay.id = 'sidebarOverlay';
    document.body.appendChild(overlay);

    menuBtn?.addEventListener('click', () => {
      sidebar?.classList.toggle('open');
      overlay.classList.toggle('open');
    });
    overlay.addEventListener('click', () => {
      sidebar?.classList.remove('open');
      overlay.classList.remove('open');
    });

    // Mobile add button
    document.getElementById('addBtnMobile')?.addEventListener('click', () => this.openTxModal());

    // Theme toggle
    document.getElementById('themeToggle')?.addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme');
      const next = cur === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      DB.setTheme(next);
      // Re-render charts with new theme
      if (this.currentPage === 'analytics') {
        Charts.renderMonthly('monthlyChart');
        Charts.renderDonut('donutChart', 'donutLegend');
      }
    });

    // Add buttons (dashboard + transactions page)
    document.getElementById('openAddModal')?.addEventListener('click',  () => this.openTxModal());
    document.getElementById('openAddModal2')?.addEventListener('click', () => this.openTxModal());

    // Modal close
    document.getElementById('closeTxModal')?.addEventListener('click', () => this.closeTxModal());
    document.getElementById('cancelTx')?.addEventListener('click',     () => this.closeTxModal());
    document.getElementById('txModal')?.addEventListener('click', e => {
      if (e.target.id === 'txModal') this.closeTxModal();
    });

    // Type toggle buttons
    document.querySelectorAll('.type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('txType').value = btn.dataset.type;
        UI.populateCategorySelect('txCategory', btn.dataset.type);
      });
    });

    // Save transaction
    document.getElementById('saveTx')?.addEventListener('click', () => this.saveTx());

    // Filter events
    document.getElementById('searchInput')?.addEventListener('input',  () => this.applyFilters());
    document.getElementById('filterType')?.addEventListener('change',  () => this.applyFilters());
    document.getElementById('filterCategory')?.addEventListener('change', () => this.applyFilters());
    document.getElementById('filterMonth')?.addEventListener('change', () => this.applyFilters());
    document.getElementById('clearFilters')?.addEventListener('click', () => this.clearFilters());

    // Budget modal
    document.getElementById('openBudgetModal')?.addEventListener('click', () => this.openBudgetModal());
    document.getElementById('closeBudgetModal')?.addEventListener('click', () => this.closeBudgetModal());
    document.getElementById('cancelBudget')?.addEventListener('click', () => this.closeBudgetModal());
    document.getElementById('budgetModal')?.addEventListener('click', e => {
      if (e.target.id === 'budgetModal') this.closeBudgetModal();
    });
    document.getElementById('saveBudget')?.addEventListener('click', () => this.saveBudget());

    // Keyboard: ESC to close modals
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        this.closeTxModal();
        this.closeBudgetModal();
      }
    });

    // Window resize: re-render charts
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (this.currentPage === 'analytics') {
          Charts.renderMonthly('monthlyChart');
          Charts.renderDonut('donutChart', 'donutLegend');
        }
      }, 200);
    });
  },

  // ---- Transaction Modal ----
  openTxModal(tx = null) {
    const modal = document.getElementById('txModal');
    const title = document.getElementById('modalTitle');
    const editId = document.getElementById('editId');

    if (tx) {
      title.textContent = 'Edit Transaction';
      editId.value = tx.id;
      document.getElementById('txType').value = tx.type;
      document.getElementById('txAmount').value = tx.amount;
      document.getElementById('txDate').value = tx.date;
      document.getElementById('txDesc').value = tx.description;
      document.getElementById('txNote').value = tx.note || '';

      // Set type button state
      document.querySelectorAll('.type-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.type === tx.type);
      });

      UI.populateCategorySelect('txCategory', tx.type);
      document.getElementById('txCategory').value = tx.category;
    } else {
      title.textContent = 'Add Transaction';
      editId.value = '';
      document.getElementById('txType').value = 'expense';
      document.getElementById('txAmount').value = '';
      document.getElementById('txDate').value = new Date().toISOString().split('T')[0];
      document.getElementById('txDesc').value = '';
      document.getElementById('txNote').value = '';

      document.querySelectorAll('.type-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.type === 'expense');
      });

      UI.populateCategorySelect('txCategory', 'expense');
    }

    modal?.classList.add('open');
    document.getElementById('txAmount')?.focus();
  },

  closeTxModal() {
    document.getElementById('txModal')?.classList.remove('open');
  },

  saveTx() {
    const type   = document.getElementById('txType').value;
    const amount = document.getElementById('txAmount').value;
    const date   = document.getElementById('txDate').value;
    const desc   = document.getElementById('txDesc').value.trim();
    const cat    = document.getElementById('txCategory').value;
    const note   = document.getElementById('txNote').value.trim();
    const editId = document.getElementById('editId').value;

    if (!amount || parseFloat(amount) <= 0) { UI.showToast('Please enter a valid amount', 'error'); return; }
    if (!date)   { UI.showToast('Please select a date', 'error'); return; }
    if (!desc)   { UI.showToast('Please enter a description', 'error'); return; }

    if (editId) {
      DB.updateTransaction(editId, { type, amount, date, description: desc, category: cat, note });
      UI.showToast('Transaction updated', 'success');
    } else {
      DB.addTransaction({ type, amount, date, description: desc, category: cat, note });
      UI.showToast('Transaction added', 'success');
    }

    this.closeTxModal();
    this.renderPage(this.currentPage);

    // If on a different page, still refresh dashboard data
    if (this.currentPage !== 'dashboard') UI.renderSummaryCards();
  },

  editTx(id) {
    const tx = DB.getTransactions().find(t => t.id === id);
    if (tx) this.openTxModal(tx);
  },

  deleteTx(id) {
    if (!confirm('Delete this transaction?')) return;
    DB.deleteTransaction(id);
    UI.showToast('Transaction deleted', 'info');
    this.renderPage(this.currentPage);
  },

  // ---- Filters ----
  applyFilters() {
    const search = (document.getElementById('searchInput')?.value || '').toLowerCase();
    const type   = document.getElementById('filterType')?.value || 'all';
    const cat    = document.getElementById('filterCategory')?.value || 'all';
    const month  = document.getElementById('filterMonth')?.value || 'all';

    let txs = DB.getTransactions();
    if (search) txs = txs.filter(t => t.description.toLowerCase().includes(search) || (t.note || '').toLowerCase().includes(search) || t.category.toLowerCase().includes(search));
    if (type !== 'all')  txs = txs.filter(t => t.type === type);
    if (cat  !== 'all')  txs = txs.filter(t => t.category === cat);
    if (month !== 'all') txs = txs.filter(t => t.date && t.date.startsWith(month));

    UI.renderTable(txs);
  },

  clearFilters() {
    const ids = ['searchInput','filterType','filterCategory','filterMonth'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = el.tagName === 'INPUT' ? '' : 'all';
    });
    this.applyFilters();
  },

  // ---- Budget Modal ----
  openBudgetModal() {
    UI.populateCategorySelect('budgetCategory', 'expense');
    document.getElementById('budgetAmount').value = '';
    document.getElementById('budgetMonth').value = getCurrentMonth();
    document.getElementById('budgetModal')?.classList.add('open');
  },

  closeBudgetModal() {
    document.getElementById('budgetModal')?.classList.remove('open');
  },

  saveBudget() {
    const cat    = document.getElementById('budgetCategory').value;
    const amount = document.getElementById('budgetAmount').value;
    const month  = document.getElementById('budgetMonth').value;

    if (!amount || parseFloat(amount) <= 0) { UI.showToast('Enter a valid budget amount', 'error'); return; }
    if (!month) { UI.showToast('Select a month', 'error'); return; }

    DB.setBudget(cat, amount, month);
    UI.showToast(`Budget set for ${cat}`, 'success');
    this.closeBudgetModal();
    UI.renderBudgets();
  },

  deleteBudget(key) {
    if (!confirm('Remove this budget?')) return;
    DB.deleteBudget(key);
    UI.showToast('Budget removed', 'info');
    UI.renderBudgets();
  }
};

// Boot
document.addEventListener('DOMContentLoaded', () => App.init());
