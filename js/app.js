// ============================================================
// KATALOG PRODUK — DIANA KOSMETIK
// Baca dari view public_catalog_products (read-only, kolom aman saja)
// ============================================================

function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount || 0);
}

// Harga lusin dibulatkan ke kelipatan 100 (konvensi StokManager)
function hargaLusin(price) {
  return Math.round((price * 12) / 100) * 100;
}

let allProducts = [];
let categories = [];
let activeCategory = 'all';
let searchTerm = '';

const grid = document.getElementById('product-grid');
const emptyState = document.getElementById('empty-state');
const searchInput = document.getElementById('search-input');
const categoryTabs = document.getElementById('category-tabs');

async function loadCatalog() {
  grid.innerHTML = '<div class="loading">Memuat produk...</div>';

  // Bypass limit 1000 baris PostgREST
  let all = [], from = 0;
  const CHUNK = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('public_catalog_products')
      .select('*')
      .order('name', { ascending: true })
      .range(from, from + CHUNK - 1);

    if (error) {
      console.error(error);
      grid.innerHTML = '<div class="loading">Gagal memuat produk. Coba refresh halaman.</div>';
      return;
    }
    if (!data?.length) break;
    all = all.concat(data);
    if (data.length < CHUNK) break;
    from += CHUNK;
  }

  allProducts = all;
  categories = [...new Map(
    all.filter(p => p.category_id).map(p => [p.category_id, p.category_name])
  ).entries()].sort((a, b) => a[1].localeCompare(b[1]));

  renderCategoryTabs();
  renderProducts();
}

function renderCategoryTabs() {
  const tabs = [`<button class="cat-tab active" data-cat="all">Semua</button>`]
    .concat(categories.map(([id, name]) =>
      `<button class="cat-tab" data-cat="${id}">${escapeHtml(name)}</button>`
    ));
  categoryTabs.innerHTML = tabs.join('');

  categoryTabs.querySelectorAll('.cat-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.dataset.cat === activeCategory ? 'all' : btn.dataset.cat;
      categoryTabs.querySelectorAll('.cat-tab').forEach(b => b.classList.remove('active'));
      categoryTabs.querySelector(`[data-cat="${cat}"]`).classList.add('active');
      activeCategory = cat;
      renderProducts();
    });
  });
}

function renderProducts() {
  let list = allProducts;

  if (activeCategory !== 'all') {
    list = list.filter(p => p.category_id === activeCategory);
  }

  if (searchTerm) {
    const q = searchTerm.toLowerCase();
    list = list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  }

  if (!list.length) {
    grid.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }
  emptyState.style.display = 'none';

  grid.innerHTML = list.map(p => `
    <div class="product-card">
      <div class="product-thumb">🧴</div>
      <div class="product-body">
        ${p.category_name ? `<div class="product-category">${escapeHtml(p.category_name)}</div>` : ''}
        <div class="product-name">${escapeHtml(p.name)}</div>
        ${p.description ? `<div class="product-desc">${escapeHtml(p.description)}</div>` : ''}
        <div class="product-prices">
          <div class="price-row">
            <span class="price-label">Harga satuan</span>
            <span class="price-value">${formatCurrency(p.price)}</span>
          </div>
          <div class="price-row">
            <span class="price-label">Harga lusin (12 pcs)</span>
            <span class="price-value price-value-lusin">${formatCurrency(hargaLusin(p.price))}</span>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

let searchDebounce;
searchInput.addEventListener('input', () => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    searchTerm = searchInput.value.trim();
    renderProducts();
  }, 250);
});

loadCatalog();
