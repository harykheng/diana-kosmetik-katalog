# diana-kosmetik-katalog

Katalog produk publik **DIANA KOSMETIK** — static site (HTML + CSS + Vanilla JS), tanpa build step. Dideploy terpisah dari StokManager (repo `uddiana`) di domain sendiri.

## Cara kerja

Katalog membaca data lewat view Supabase read-only `public_catalog_products` (dibuat oleh `supabase_migration26.sql` di repo `uddiana`), yang hanya mengekspos kolom aman: nama, SKU, deskripsi, harga, unit, kategori. Kolom sensitif (`cost`, `stock_quantity`, `min_stock`) **tidak** pernah ikut ter-expose lewat katalog ini.

## Setup

1. Pastikan migration `supabase_migration26.sql` (di repo `uddiana`) sudah dijalankan di Supabase SQL Editor project yang sama.
2. `js/config.js` sudah diisi `SUPABASE_URL` + `SUPABASE_ANON_KEY` project yang sama dengan StokManager — anon key ini publik dan aman karena katalog hanya query view read-only di atas.
3. Buka `index.html` langsung di browser untuk develop lokal, atau deploy sebagai static site (mis. Vercel) dan arahkan domain baru ke situ.

## Struktur

```
index.html      ← Halaman katalog (search, filter kategori, grid produk)
css/style.css   ← Styling
js/config.js    ← Supabase client (URL + anon key)
js/app.js       ← Fetch produk dari view public_catalog_products, render, search, filter
```
