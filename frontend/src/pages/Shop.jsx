import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';

const DEFAULT_CATEGORIES = [
  'All', 'Paintings', 'Drawings', 'Origami', 'Handmade Cards',
  'Crochet', 'Knitting', 'Pottery', 'Calligraphy',
  'Home Decor', 'Jewelry', 'Gift Items', 'Other'
];

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (category !== 'All') params.category = category;
      if (sortBy) params.sortBy = sortBy;
      const { data } = await api.get('/products', { params });
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
    setLoading(false);
  }, [search, category, sortBy]);

  useEffect(() => {
    const t = setTimeout(fetchProducts, 350);
    return () => clearTimeout(t);
  }, [fetchProducts]);

  return (
    <main className="page-content">
      <div className="container">
        <section className="hero" style={{ paddingBottom: 16 }}>
          <h1 className="hero-title" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)' }}>
            🛍️ Handmade Shop
          </h1>
          <p className="hero-subtitle">
            Unique handmade creations you can own. Every piece is crafted with care.
          </p>
        </section>

        <div id="listings" className="filters-bar">
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input
              id="search-input"
              className="form-input"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            id="category-filter"
            className="form-select filter-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {DEFAULT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>

          <select
            className="form-select filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="lowest">Price: Low to High</option>
            <option value="highest">Price: High to Low</option>
          </select>
        </div>

        {loading ? (
          <div className="loader-page"><div className="spinner" /></div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎨</div>
            <h3>No products found</h3>
            <p>Try adjusting your search or check back soon for new creations!</p>
          </div>
        ) : (
          <div className="product-grid">
            {products.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        )}
      </div>
    </main>
  );
}
