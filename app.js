const el = id => document.getElementById(id);

let products = [];
let filtered = [];

async function loadProducts() {
  const res = await fetch('products.json', { cache: 'no-store' });
  products = await res.json();
  filtered = products;
  renderList(filtered);
}

function renderList(items) {
  const list = el('listView');
  list.innerHTML = items.map(p => `
    <button onclick="openProduct('${p.id}')"
            class="bg-white border rounded-2xl p-4 text-left hover:shadow-md transition">
      <img loading="lazy"
           src="${p.cover}"
           class="w-full h-36 object-cover rounded-xl border bg-gray-100">
      <div class="mt-3 font-semibold">${p.name}</div>
      <div class="text-sm text-gray-500">${p.sku}</div>
      <div class="mt-2 text-lg font-bold">${formatPrice(p.price)} ${p.currency}</div>
    </button>
  `).join('');
}

function openProduct(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;

  el('cover').src = p.cover;
  el('name').textContent = p.name;
  el('sku').textContent = `Артикул: ${p.sku}`;
  el('price').textContent = formatPrice(p.price);
  el('currency').textContent = p.currency;
  el('updated').textContent = p.updatedAt;

  renderTabs(p);
  showDetail();
}

function renderTabs(p) {
  const tabs = [
    ['info', 'Информация'],
    ['renders', 'Рендеры'],
    ['photos', 'Фото объектов'],
    ['drawings', 'Чертежи']
  ];

  el('tabs').innerHTML = tabs.map((t, i) => `
    <button onclick="setTab('${t[0]}')"
            class="tab px-3 py-2 rounded-xl border text-sm
            ${i === 0 ? 'bg-gray-900 text-white' : ''}"
            data-tab="${t[0]}">
      ${t[1]}
    </button>
  `).join('');

  window.currentProduct = p;
  setTab('info');
}

function setTab(tab) {
  document.querySelectorAll('.tab').forEach(b => {
    b.classList.toggle('bg-gray-900', b.dataset.tab === tab);
    b.classList.toggle('text-white', b.dataset.tab === tab);
  });

  const p = window.currentProduct;
  let html = '';

  if (tab === 'info') {
    html = `<p class="text-sm whitespace-pre-wrap">${p.info}</p>`;
  }

  if (tab === 'renders' || tab === 'photos') {
    const arr = p[tab] || [];
    html = arr.length
      ? `<div class="grid sm:grid-cols-2 gap-3">
           ${arr.map(u => `
             <a href="${u}" target="_blank">
               <img loading="lazy"
                    src="${u}"
                    class="w-full h-48 object-cover rounded-xl border bg-gray-100">
             </a>`).join('')}
         </div>`
      : `<div class="text-sm text-gray-500">Нет материалов</div>`;
  }

  if (tab === 'drawings') {
    html = p.drawings
      ? `<a href="${p.drawings}" target="_blank"
            class="text-blue-600 underline">Открыть чертёж (PDF)</a>`
      : `<div class="text-sm text-gray-500">Нет чертежей</div>`;
  }

  el('tabContent').innerHTML = html;
}

function showDetail() {
  el('listView').classList.add('hidden');
  el('detailView').classList.remove('hidden');
}

el('backBtn').onclick = () => {
  el('detailView').classList.add('hidden');
  el('listView').classList.remove('hidden');
};

el('search').oninput = e => {
  const q = e.target.value.toLowerCase();
  filtered = products.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.sku.toLowerCase().includes(q)
  );
  renderList(filtered);
};

function formatPrice(v) {
  return v.toLocaleString('ru-RU');
}

loadProducts();
