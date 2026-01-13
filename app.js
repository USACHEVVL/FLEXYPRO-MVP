const el = (id) => document.getElementById(id);

/** Основные разделы (картинки у тебя в репо) */
const CATEGORIES = [
  { key: "Все", title: "Все", image: "./assets/categories/all.jpg" },
  { key: "Решения для натяжных потолков", title: "Решения для натяжных потолков", image: "./assets/categories/stretch.jpg" },
  { key: "Решения для гипсокартона", title: "Решения для гипсокартона", image: "./assets/categories/drywall.jpg" },
  { key: "Трековое освещение", title: "Трековое освещение", image: "./assets/categories/track.jpg" },
  { key: "Система IZI", title: "Система IZI", image: "./assets/categories/izi.jpg" },
  { key: "Вентиляционные решения", title: "Вентиляционные решения", image: "./assets/categories/vent.jpg" },
  { key: "Светильники", title: "Светильники", image: "./assets/categories/lights.jpg" },
  { key: "Декоративные перегородки", title: "Декоративные перегородки", image: "./assets/categories/partitions.jpg" },
  { key: "Люки", title: "Люки", image: "./assets/categories/hatches.jpg" },
  { key: "Комплектующие", title: "Комплектующие", image: "./assets/categories/components.jpg" },
  { key: "INTRA SERIES", title: "INTRA SERIES", image: "./assets/categories/intra.jpg" }
];

/** Подкатегории только для двух разделов */
const SUBCATEGORIES = {
  "Решения для натяжных потолков": [
    "Бесщелевые",
    "Теневые",
    "Классические",
    "Световые",
    "Контурные",
    "Карнизные",
    "Многоуровневые",
    "Трековые",
    "Нишевые",
    "Парящие",
    "Другие"
  ],
  "Решения для гипсокартона": [
    "Теневые",
    "Световые",
    "Плинтусы",
    "Контурные",
    "Парящие"
  ]
};

let products = [];
let currentCategory = "Все";
let currentSubcategory = null;

function setStatus(msg) {
  const s = el("status");
  if (!s) return;
  s.textContent = msg || "";
}

function show(viewId) {
  ["homeView", "subcategoriesView", "listView", "detailView"].forEach((id) =>
    el(id)?.classList.add("hidden")
  );
  el(viewId)?.classList.remove("hidden");

  // поиск показываем только в списке товаров
  el("search")?.classList.toggle("hidden", viewId !== "listView");
}

/* ---------- Главная: разделы ---------- */

function renderCategories() {
  const container = el("categoriesView");
  if (!container) return;

  container.innerHTML = CATEGORIES.map((c, idx) => `
    <button class="bg-white border rounded-2xl overflow-hidden text-left hover:shadow-md transition"
            data-cat="${escapeHtml(c.key)}">
      <img loading="lazy" src="${c.image}"
           class="w-full aspect-square object-contain bg-gray-100 p-3" alt="">
      <div class="p-4">
        <div class="font-semibold">${escapeHtml(c.title)}</div>
        <div class="text-xs text-gray-500 mt-1" data-count-idx="${idx}">Товаров: …</div>
      </div>
    </button>
  `).join("");

  container.querySelectorAll("button[data-cat]").forEach((btn) => {
    btn.addEventListener("click", () => onCategoryClick(btn.dataset.cat));
  });

  updateCategoryCounts();
}

function updateCategoryCounts() {
  const container = el("categoriesView");
  if (!container) return;

  CATEGORIES.forEach((c, idx) => {
    const countEl = container.querySelector(`[data-count-idx="${idx}"]`);
    if (!countEl) return;

    let count = 0;
    if (c.key === "Все") count = products.length;
    else count = products.filter((p) => (p.category || "") === c.key).length;

    countEl.textContent = `Товаров: ${count}`;
  });
}

function onCategoryClick(cat) {
  currentCategory = cat;
  currentSubcategory = null;

  // Если есть подкатегории — открываем экран подкатегорий
  if (SUBCATEGORIES[cat]) {
    openSubcategories(cat);
    return;
  }

  // Иначе открываем список товаров как раньше
  openProducts(cat, null);
}

/* ---------- Подкатегории ---------- */

function openSubcategories(cat) {
  el("currentCategoryTitle2").textContent = cat;

  const grid = el("subcategoriesGrid");
  if (!grid) return;

  const subs = SUBCATEGORIES[cat] || [];

  grid.innerHTML = subs.map((s) => `
    <button class="bg-white border rounded-2xl p-4 text-left hover:shadow-md transition"
            data-sub="${escapeHtml(s)}">
      <div class="font-semibold">${escapeHtml(s)}</div>
      <div class="text-xs text-gray-500 mt-1" data-sub-count="${escapeHtml(s)}">Товаров: …</div>
    </button>
  `).join("");

  // проставим количества
  subs.forEach((s) => {
    const countEl = grid.querySelector(`[data-sub-count="${cssAttrEscape(s)}"]`);
    if (!countEl) return;
    const count = products.filter((p) =>
      (p.category || "") === cat && (p.subcategory || "") === s
    ).length;
    countEl.textContent = `Товаров: ${count}`;
  });

  grid.querySelectorAll("button[data-sub]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const sub = btn.dataset.sub;
      openProducts(cat, sub);
    });
  });

  show("subcategoriesView");
}

/* ---------- Список товаров ---------- */

function openProducts(cat, sub) {
  currentCategory = cat;
  currentSubcategory = sub || null;

  const titleParts = [];
  if (cat === "Все") titleParts.push("Все товары");
  else titleParts.push(cat);
  if (sub) titleParts.push(sub);

  el("currentCategoryTitle").textContent = titleParts.join(" • ");

  const list = filterProducts(products, cat, sub);
  renderProducts(list);

  el("search").value = "";
  show("listView");
}

function filterProducts(items, cat, sub) {
  // "Все" — вообще без фильтра по категории
  let base = (cat === "Все") ? [...items] : items.filter((p) => (p.category || "") === cat);

  if (sub) {
    base = base.filter((p) => (p.subcategory || "") === sub);
  }
  return base;
}

function renderProducts(items) {
  const grid = el("productsGrid");
  if (!grid) return;

  if (!items.length) {
    grid.innerHTML = `<div class="text-sm text-gray-500">В этом разделе пока нет товаров.</div>`;
    return;
  }

  grid.innerHTML = items.map((p) => `
    <button class="bg-white border rounded-2xl p-4 text-left hover:shadow-md transition"
            data-id="${escapeHtml(p.id)}">
      <img loading="lazy" src="${p.cover || ''}"
           class="w-full aspect-square object-contain rounded-xl border bg-gray-100 p-3" alt="">
      <div class="mt-3 font-semibold">${escapeHtml(p.name || '')}</div>
      <div class="text-sm text-gray-500">${escapeHtml(p.sku || '')}</div>
      <div class="mt-2 text-lg font-bold">${formatPrice(p.price)} ${escapeHtml(p.currency || '')}</div>
    </button>
  `).join("");

  grid.querySelectorAll("button[data-id]").forEach((btn) => {
    btn.addEventListener("click", () => openProduct(btn.dataset.id));
  });
}

/* ---------- Деталка ---------- */

function openProduct(id) {
  const p = products.find((x) => x.id === id);
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
            data-tab="${t[0]}">${t[1]}</button>
  `).join("");

  window.currentProduct = p;

  el("tabs").querySelectorAll(".tab").forEach((btn) => {
    btn.addEventListener("click", () => setTab(btn.dataset.tab));
  });

  setTab("info");
}

function setTab(tab) {
  document.querySelectorAll(".tab").forEach((b) => {
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
           ${arr.map((u) => `
             <a href="${u}" target="_blank" rel="noopener">
               <img loading="lazy" src="${u}"
                    class="w-full aspect-square object-contain rounded-xl border bg-gray-100 p-3" alt="">
             </a>
           `).join("")}
         </div>`
      : `<div class="text-sm text-gray-500">Нет материалов</div>`;
  }

  if (tab === "drawings") {
    html = p.drawings
      ? `<a href="${p.drawings}" target="_blank" rel="noopener" class="text-blue-600 underline">
           Открыть чертёж (PDF)
         </a>`
      : `<div class="text-sm text-gray-500">Нет чертежей</div>`;
  }

  el("tabContent").innerHTML = html;
}

/* ---------- Handlers ---------- */

// Кнопки назад
el("backToCategoriesBtn")?.addEventListener("click", () => show("homeView"));
el("backToCategoriesBtn2")?.addEventListener("click", () => show("homeView"));

el("backBtn")?.addEventListener("click", () => show("listView"));

el("homeBtn")?.addEventListener("click", () => show("homeView"));

// Поиск — ищем в текущем (категория + подкатегория)
el("search")?.addEventListener("input", (e) => {
  const q = (e.target.value || "").toLowerCase().trim();
  const base = filterProducts(products, currentCategory, currentSubcategory);

  const items = !q
    ? base
    : base.filter((p) =>
        (p.name || "").toLowerCase().includes(q) ||
        (p.sku || "").toLowerCase().includes(q)
      );

  renderProducts(items);
});

/* ---------- Helpers ---------- */

function formatPrice(v) {
  if (typeof v !== "number") return "—";
  return v.toLocaleString("ru-RU");
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  }[m]));
}

// Для безопасного селектора по data-атрибуту
function cssAttrEscape(s) {
  return String(s).replace(/"/g, '\\"');
}

/* ---------- Init ---------- */

async function init() {
  setStatus("");
  renderCategories(); // разделы рисуем сразу
  show("homeView");

  try {
    const res = await fetch("./products.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`products.json: ${res.status} ${res.statusText}`);

    products = await res.json();
    updateCategoryCounts();
  } catch (err) {
    setStatus(`Не удалось загрузить products.json. Проверьте, что файл в корне репозитория и доступен по ссылке /products.json. Детали: ${err.message}`);
  }
}

init();
