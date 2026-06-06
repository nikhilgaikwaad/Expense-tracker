# 💸 Spendly — Expense Tracker

A sleek, fully-featured personal expense tracker built with **pure HTML, CSS & JavaScript** — no frameworks, no dependencies, works offline.

![Spendly Screenshot](https://via.placeholder.com/900x500/0e0e12/7c6aff?text=Spendly+Expense+Tracker)

---

## ✨ Features

| Feature | Description |
|---|---|
| 📊 **Dashboard** | Summary cards (income, expenses, balance, savings rate) + recent transactions |
| 💳 **Transactions** | Add, edit, delete transactions with category, type, date, notes |
| 🔍 **Filters** | Search, filter by type/category/month |
| 📈 **Analytics** | Monthly bar chart, category donut chart, top spending categories |
| 💰 **Budget Planner** | Set monthly budgets per category with progress bars |
| 🌙 **Dark / Light Theme** | Toggle between themes, preference saved locally |
| 💾 **Persistent Storage** | All data saved to `localStorage` — works offline |
| 📱 **Responsive** | Mobile-first design with collapsible sidebar |
| 🌱 **Demo Data** | Pre-loaded sample transactions on first launch |

---

## 🚀 Getting Started

### Option 1: Open directly
Just clone and open `index.html` in any browser — no build step needed!

```bash
git clone https://github.com/YOUR_USERNAME/expense-tracker.git
cd expense-tracker
# Open index.html in your browser
```

### Option 2: Use Live Server (VS Code)
1. Install the **Live Server** extension in VS Code
2. Right-click `index.html` → **Open with Live Server**

### Option 3: Python local server
```bash
cd expense-tracker
python -m http.server 8000
# Open http://localhost:8000
```

---

## 📁 Project Structure

```
expense-tracker/
│
├── index.html          # Main HTML — all pages (SPA structure)
│
├── css/
│   └── style.css       # All styles — design tokens, components, responsive
│
├── js/
│   ├── data.js         # Data layer (localStorage CRUD + category config)
│   ├── charts.js       # Pure Canvas charts (bar + donut, no libraries)
│   ├── ui.js           # UI rendering functions
│   └── app.js          # App controller (navigation, events, modals)
│
└── README.md
```

---

## 🏗️ Architecture

- **Single Page Application (SPA)** — All pages in one HTML file, shown/hidden via CSS
- **Data Layer (`data.js`)** — All `localStorage` reads/writes isolated here
- **UI Layer (`ui.js`)** — Pure rendering functions, receive data and write DOM
- **Charts (`charts.js`)** — Vanilla Canvas API charts, no external dependencies
- **Controller (`app.js`)** — Binds events, orchestrates navigation and state

---

## 📊 Categories

**Expense:** Food · Housing · Transport · Utilities · Entertainment · Health · Shopping · Education · Personal Care · Travel · Savings · Other

**Income:** Salary · Freelance · Investment · Business · Gift · Rental Income · Other

---

## 🌐 Browser Support

Works in all modern browsers (Chrome, Firefox, Safari, Edge). Requires JavaScript enabled.

---

## 📝 License

MIT — free to use and modify.

---

## 🤝 Contributing

Pull requests welcome! For major changes, please open an issue first.

1. Fork the repo
2. Create your branch: `git checkout -b feature/AmazingFeature`
3. Commit: `git commit -m 'Add AmazingFeature'`
4. Push: `git push origin feature/AmazingFeature`
5. Open a Pull Request
