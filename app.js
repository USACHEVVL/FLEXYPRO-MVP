const el = (id) => document.getElementById(id);

const CATEGORIES = [
  { key: "Все", title: "Все", image: "https://picsum.photos/seed/all/800/500" },
  { key: "Решения для натяжных потолков", title: "Решения для натяжных потолков", image: "https://picsum.photos/seed/stretch/800/500" },
  { key: "Решения для гипсокартона", title: "Решения для гипсокартона", image: "https://picsum.photos/seed/drywall/800/500" },
  { key: "Трековое освещение", title: "Трековое освещение", image: "https://picsum.photos/seed/track/800/500" },
  { key: "Система IZI", title: "Система IZI", image: "https://picsum.photos/seed/izi/800/500" },
  { key: "Вентиляционные решения", title: "Вентиляционные решения", image: "https://picsum.photos/seed/vent/800/500" },
  { key: "Светильники", title: "Светильники", image: "https://picsum.photos/seed/lights/800/500" },
  { key: "Декоративные перегородки", title: "Декоративные перегородки", image: "https://picsum.photos/seed/partitions/800/500" },
  { key: "Люки", title: "Люки", image: "https://picsum.photos/seed/hatches/800/500" },
  { key: "INTRA SERIES", title: "INTRA SERIES", image: "https://picsum.photos/seed/intra/800/500" },
  { key: "Комплектующие", title: "Комплектующие", image: "https://picsum.photos/seed/components/800/500" }
];

let products = [];
let filtered = [];
let currentCategory = "Все";

function show(viewId) {
  ["homeView", "listView", "detailView"].forEach(id => el(id).classList.add("hidden"));
  el(viewId).classList.remove("hidden");

  // поиск показываем только в списке товаров
  el("search").classList.toggle("hidden", viewId !== "listView");
}

async function loadProducts() {
  const res = await fetch("./products.json", { cache: "no-store" });
  products = await res.json();

  renderCategories();
  show("homeView");
}

function renderCategories() {
  const container = el("categoriesView");
  container.innerHTML = CATEGORIES.map(c => `
    <button class="bg-white border rounded-2xl overflow-hidden text-left hover:shadow-md transition"
            data-cat="${escapeHtml(c.key)}">
      <img loading="lazy" src="${c.image}" class="w-full h-36 object-cover bg-gray-100" alt="">
      <div class="p-4">
        <div class="font-semibold">${escapeHtml(c.title)}</div>
        <div class="text-xs text-gray-500 mt-1" data-count="${escapeHtml(c.key)}"></div>
      </div>
    </button>
  `).join("");

  // проставим количества
  CATEGORIES.forEach(c => {
    const countEl = container.querySelector(`[data-count="${cssEscape(c.key)}"]`);
    if (!countEl) return;
    const count = (c.key === "Все")
      ? products.length
      : products.filter(p => (p.category || "") === c.key).length;
    countEl.textContent = `Товаров: ${count}`;
  });

  container.querySelectorAll("button[data-cat]").forEach(btn => {
    btn.addEventListener("click", () => openCategory(btn.dataset.cat));
  });
}

function openCategory(cat) {
  currentCategory = cat;
  el("currentCategoryTitle").textContent = (cat === "Все") ? "Все товары" : cat;

  filtered = filterByCategory(products, cat);
  renderProducts(filtered);
  el("search").value = "";
  show("listView");
}

function filterByCategory(items, cat) {
  if (cat === "Все") return [...items];
  return items.filter(p => (p.category || "") === cat);
}

function renderProducts(items) {
  const grid = el("productsGrid");
  grid.innerHTML = items.map(p => `
    <button class="bg-white border rounded-2xl p-4 text-left hover:shadow-md transition"
            data-id="${escapeHtml(p.id)}">
      <img loading="lazy"
           src="${p.cover || ''}"
           class="w-full h-36 object-cover rounded-xl border bg-gray-100"
           alt="">
      <div class="mt-3 font-semibold">${escapeHtml(p.name || '')}</div>
      <div class="text-sm text-gray-500">${escapeHtml(p.sku || '')}</div>
      <div class="mt-2 text-lg font-bold">${formatPrice(p.price)} ${escapeHtml(p.currency || '')}</div>
    </button>
  `).join("");

  grid.querySelectorAll("button[data-id]").forEach(btn => {
    btn.addEventListener("click", () => openProduct(btn.dataset.id));
  });
}

function openProduct(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;

  el("cover").src = p.cover || "";
  el("name").textContent = p.name || "";
  el("sku").textContent = p.sku ? `Артикул: ${p.sku}` : "";
  el("price").textContent = formatPrice(p.price);
  el("currency").textContent = p.currency || "";
  el("updated").textContent = p.updatedAt || "—";

  renderTabs(p);
  show("detailView");
}

function renderTabs(p) {
  const tabs = [
    ["info", "Информация"],
    ["renders", "Рендеры"],
    ["photos", "Фото объектов"],
    ["drawings", "Чертежи"]
  ];

  el("tabs").innerHTML = tabs.map((t, i) => `
    <button class="tab px-3 py-2 rounded-xl border text-sm ${i === 0 ? "bg-gray-900 text-white" : ""}"
            data-tab="${t[0]}">
      ${t[1]}
    </button>
  `).join("");

  window.currentProduct = p;

  el("tabs").querySelectorAll(".tab").forEach(btn => {
    btn.addEventListener("click", () => setTab(btn.dataset.tab));
  });

  setTab("info");
}

function setTab(tab) {
  document.querySelectorAll(".tab").forEach(b => {
    const active = b.dataset.tab === tab;
    b.classList.toggle("bg-gray-900", active);
    b.classList.toggle("text-white", active);
  });

  const p = window.currentProduct;
  let html = "";

  if (tab === "info") {
    html = `<p class="text-sm whitespace-pre-wrap">${escapeHtml(p.info || "Нет описания")}</p>`;
  }

  if (tab === "renders" || tab === "photos") {
    const arr = p[tab] || [];
    html = arr.length
      ? `<div class="grid sm:grid-cols-2 gap-3">
           ${arr.map(u => `
             <a href="${u}" target="_blank" rel="noopener">
               <img loading="lazy" src="${u}"
                    class="w-full h-48 object-cover rounded-xl border bg-gray-100" alt="">
             </a>
           `).join("")}
         </div>`
      : `<div class="text-sm text-gray-500">Нет материалов</div>`;
  }

  if (tab === "drawings") {
    // drawings может быть строкой или null
    html = p.drawings
      ? `<a href="${p.drawings}" target="_blank" rel="noopener"
            class="text-blue-600 underline">Открыть чертёж (PDF)</a>`
      : `<div class="text-sm text-gray-500">Нет чертежей</div>`;
  }

  el("tabContent").innerHTML = html;
}

/* UI handlers */
el("backToCategoriesBtn").addEventListener("click", () => show("homeView"));
el("backBtn").addEventListener("click", () => show("listView"));
el("homeBtn").addEventListener("click", () => show("homeView"));

el("search").addEventListener("input", (e) => {
  const q = (e.target.value || "").toLowerCase().trim();
  const base = filterByCategory(products, currentCategory);

  if (!q) {
    filtered = base;
  } else {
    filtered = base.filter(p =>
      (p.name || "").toLowerCase().includes(q) ||
      (p.sku || "").toLowerCase().includes(q)
    );
  }

  renderProducts(filtered);
});

/* helpers */
function formatPrice(v) {
  if (typeof v !== "number") return "—";
  return v.toLocaleString("ru-RU");
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, m => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", "\"":"&quot;", "'":"&#039;"
  }[m]));
}

// чтобы нормально искать элементы по data-атрибутам
function cssEscape(s) {
  return String(s).replace(/"/g, '\\"');
}

loadProducts();
