const root = document.documentElement;

const grid = document.getElementById("grid");
const year = document.getElementById("year");
const resultHint = document.getElementById("resultHint");
const searchInput = document.getElementById("searchInput");
const categorySelect = document.getElementById("categorySelect");
const themeBtn = document.getElementById("themeBtn");
const resetBtn = document.getElementById("resetBtn");
const shuffleBtn = document.getElementById("shuffleBtn");

year.textContent = new Date().getFullYear();

let allProducts = [];
let filtered = [];

function normalize(s) {
  return (s ?? "").toString().toLowerCase().trim();
}

function uniqueCategories(items) {
  const set = new Set(items.map(p => p.category).filter(Boolean));
  return ["all", ...Array.from(set).sort((a,b)=>a.localeCompare(b))];
}

function renderCategoryOptions(items) {
  const cats = uniqueCategories(items);
  categorySelect.innerHTML = "";
  for (const c of cats) {
    const opt = document.createElement("option");
    opt.value = c === "all" ? "all" : c;
    opt.textContent = c === "all" ? "All categories" : c;
    categorySelect.appendChild(opt);
  }
}

function productMatches(p, query, cat) {
  const q = normalize(query);
  const inCat = (cat === "all") || (p.category === cat);
  if (!inCat) return false;
  if (!q) return true;

  const hay = normalize([p.title, p.description, p.category, p.id].join(" "));
  return hay.includes(q);
}

function applyFilters() {
  const q = searchInput.value;
  const cat = categorySelect.value;

  filtered = allProducts.filter(p => productMatches(p, q, cat));
  resultHint.textContent = `${filtered.length} result${filtered.length === 1 ? "" : "s"} shown`;
  renderGrid(filtered);
}

function escapeHtml(str) {
  return (str ?? "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;"
  }[m]));
}

function renderGrid(items) {
  grid.innerHTML = "";

  for (const p of items) {
    const card = document.createElement("article");
    card.className = "card";

    const img = document.createElement("img");
    img.className = "thumb";
    img.alt = p.title || "Product image";
    img.loading = "lazy";
    img.src = p.image || "";
    img.onerror = () => { img.style.display = "none"; };

    const body = document.createElement("div");
    body.className = "card-body";

    body.innerHTML = `
      <div class="card-top">
        <h3>${escapeHtml(p.title || "Untitled product")}</h3>
        ${p.category ? `<span class="kicker">${escapeHtml(p.category)}</span>` : ""}
      </div>
      <p class="desc">${escapeHtml(p.description || "")}</p>
      <div class="card-actions">
        <a class="link" href="${escapeHtml(p.affiliateUrl || "#")}" target="_blank" rel="noreferrer">
          <span aria-hidden="true">↗</span> Amazon
        </a>
        <button class="copy" type="button" data-copy="${escapeHtml(p.affiliateUrl || "")}">
          Copy link
        </button>
      </div>
    `;

    card.appendChild(img);
    card.appendChild(body);
    grid.appendChild(card);
  }

  // copy handlers
  grid.querySelectorAll("button.copy").forEach(btn => {
    btn.addEventListener("click", async () => {
      const link = btn.getAttribute("data-copy") || "";
      if (!link || link === "#") return;

      try {
        await navigator.clipboard.writeText(link);
        const old = btn.textContent;
        btn.textContent = "Copied ✓";
        setTimeout(() => (btn.textContent = old), 900);
      } catch {
        // Fallback: prompt
        window.prompt("Copy this affiliate link:", link);
      }
    });
  });
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Theme
const saved = localStorage.getItem("theme");
if (saved === "light") root.classList.add("light");
themeBtn.addEventListener("click", () => {
  root.classList.toggle("light");
  localStorage.setItem("theme", root.classList.contains("light") ? "light" : "dark");
});

// Controls
searchInput.addEventListener("input", applyFilters);
categorySelect.addEventListener("change", applyFilters);

resetBtn.addEventListener("click", () => {
  searchInput.value = "";
  categorySelect.value = "all";
  applyFilters();
});

shuffleBtn.addEventListener("click", () => {
  filtered = shuffleArray(filtered.length ? filtered : allProducts);
  resultHint.textContent = `${filtered.length} result${filtered.length === 1 ? "" : "s"} shown (shuffled)`;
  renderGrid(filtered);
});

// Load products
async function init() {
  try {
    const res = await fetch("assets/products.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to load products.json (${res.status})`);
    allProducts = await res.json();

    renderCategoryOptions(allProducts);
    filtered = [...allProducts];
    applyFilters();
  } catch (e) {
    resultHint.textContent = "Could not load products.";
    grid.innerHTML = `<div class="muted">Error: ${escapeHtml(String(e.message || e))}</div>`;
  }
}
init();