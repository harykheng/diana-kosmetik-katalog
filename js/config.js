// ============================================================
// SUPABASE CONFIG
// Supabase project sama dengan StokManager (uddiana), tapi katalog ini
// HANYA baca dari view `public_catalog_products` (read-only, kolom aman
// saja — lihat supabase_migration26.sql di repo uddiana).
// ============================================================

const SUPABASE_URL = 'https://fxdvnnxdiufymwqxtgxm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4ZHZubnhkaXVmeW13cXh0Z3htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0OTYzMzMsImV4cCI6MjA5NDA3MjMzM30.rZo1gGw-3MkCMTbJKwT_ARZqVJw7ZfxWg1q2VAjlXKw';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
