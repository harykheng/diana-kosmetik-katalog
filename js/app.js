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
let currentPage = 1;
const PAGE_SIZE = 50;

const grid = document.getElementById('product-grid');
const emptyState = document.getElementById('empty-state');
const searchInput = document.getElementById('search-input');
const categoryTabs = document.getElementById('category-tabs');
const pagination = document.getElementById('pagination');

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
      currentPage = 1;
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
    pagination.innerHTML = '';
    return;
  }
  emptyState.style.display = 'none';

  const totalPages = Math.ceil(list.length / PAGE_SIZE);
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = list.slice(start, start + PAGE_SIZE);

  grid.innerHTML = pageItems.map(p => `
    <div class="product-card">
      <div class="product-body">
        ${p.category_name ? `<div class="product-category">${escapeHtml(p.category_name)}</div>` : ''}
        <div class="product-name">${escapeHtml(p.name)}</div>
        ${p.description ? `<div class="product-desc">${escapeHtml(p.description)}</div>` : ''}
        <div class="product-prices">
          <span class="price-label">Harga satuan</span>
          <span class="price-value">${p.price ? formatCurrency(p.price) : 'Tanyakan ke Sales'}</span>
          <span class="price-label">Harga lusin (12 pcs)</span>
          <span class="price-value price-value-lusin">${p.price ? formatCurrency(hargaLusin(p.price)) : 'Tanyakan ke Sales'}</span>
        </div>
      </div>
    </div>
  `).join('');

  renderPagination(totalPages);
}

function renderPagination(totalPages) {
  if (totalPages <= 1) {
    pagination.innerHTML = '';
    return;
  }

  let buttons = `<button class="page-btn" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>‹</button>`;
  for (let i = 1; i <= totalPages; i++) {
    buttons += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
  }
  buttons += `<button class="page-btn" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}>›</button>`;

  pagination.innerHTML = buttons;

  pagination.querySelectorAll('.page-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = parseInt(btn.dataset.page, 10);
      if (page === currentPage || page < 1 || page > totalPages) return;
      currentPage = page;
      renderProducts();
      grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
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
    currentPage = 1;
    renderProducts();
  }, 250);
});

loadCatalog();
