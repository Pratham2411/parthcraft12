import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { resolveProductImageSrc, getPrimaryProductImage, handleProductImageError } from '../utils/productImage';
import ProductSocial from '../components/ProductSocial';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, updateUser } = useAuth();
  const [product, setProduct] = useState(null);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    Promise.all([
      api.get(`/products/${id}`),
      api.get('/settings').catch(() => ({ data: {} })),
    ])
      .then(([prodRes, settRes]) => {
        setProduct(prodRes.data);
        if (settRes?.data) setSettings(settRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <main className="page-content"><div className="loader-page"><div className="spinner" /></div></main>;
  if (!product) return <main className="page-content"><div className="container"><div className="empty-state"><h3>Product not found</h3></div></div></main>;

  const images = product.imageUrls?.length ? product.imageUrls : [product.imageUrl].filter(Boolean);
  const inWishlist = user?.wishlist?.includes(product._id);

  const toggleWishlist = async () => {
    if (!isAuthenticated) return navigate('/login');
    try {
      const isAdding = !inWishlist;
      const newWishlist = isAdding
        ? [...(user.wishlist || []), product._id]
        : (user.wishlist || []).filter(wid => wid !== product._id);
      updateUser({ ...user, wishlist: newWishlist });
      if (isAdding) await api.post(`/auth/wishlist/${product._id}`);
      else await api.delete(`/auth/wishlist/${product._id}`);
    } catch (err) { console.error(err); }
  };

  return (
    <main className="page-content">
      <div className="container">
        <div className="product-detail">
          {/* Gallery */}
          <div className="product-gallery">
            <div className="product-main-image">
              <img
                src={resolveProductImageSrc(images[selectedImage])}
                alt={product.title}
                onError={handleProductImageError}
              />
            </div>
            {images.length > 1 && (
              <div className="product-thumbnails">
                {images.map((img, i) => (
                  <div
                    key={i}
                    className={`product-thumb${i === selectedImage ? ' active' : ''}`}
                    onClick={() => setSelectedImage(i)}
                  >
                    <img src={resolveProductImageSrc(img)} alt="" onError={handleProductImageError} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="product-info">
            <h1>{product.title}</h1>
            <div className="product-price-tag">₹{Number(product.price).toLocaleString('en-IN')}</div>

            <div className="product-meta-row">
              <span className="product-meta-pill">{product.category}</span>
              {product.madeToOrder && <span className="product-meta-pill">🎨 Made to Order</span>}
              {product.prepTime && <span className="product-meta-pill">⏱️ {product.prepTime}</span>}
              {product.status === 'sold' && <span className="badge badge-gray">Sold Out</span>}
              {product.status === 'available' && <span className="badge badge-sage">Available</span>}
            </div>

            {/* Variants */}
            {product.variants?.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 6, display: 'block' }}>Variants:</span>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {product.variants.map(v => (
                    <span key={v} className="badge badge-clay">{v}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Customization */}
            {product.customization && (
              <div className="alert alert-info" style={{ marginBottom: 16 }}>
                ✏️ <strong>Customization:</strong> {product.customization}
              </div>
            )}

            <div className="product-description">{product.description}</div>

            {/* Actions */}
            <div className="product-action-group" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              {isAdmin ? (
                <Link to="/admin?tab=products" className="btn btn-primary btn-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  ⚙️ Manage in Admin Studio
                </Link>
              ) : (
                <>
                  {product.status === 'available' && (
                    <Link to={`/order/${product._id}`} className="btn btn-primary btn-lg">
                      🛒 Buy Now
                    </Link>
                  )}
                  {(() => {
                    const raw = settings?.whatsappNumber || '8877396175';
                    let clean = raw.replace(/[^0-9]/g, '');
                    if (clean.length === 10) clean = '91' + clean;
                    const msg = `Hi Parth! I'm interested in buying "${product.title}" (₹${product.price}) from ParthCraft12. Is it available?`;
                    const waUrl = `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
                    return (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-whatsapp btn-lg"
                        style={{
                          background: '#25D366',
                          color: '#ffffff',
                          border: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          textDecoration: 'none',
                          fontWeight: 600,
                        }}
                      >
                        💬 Buy via WhatsApp
                      </a>
                    );
                  })()}
                </>
              )}
              <button className={`btn btn-secondary btn-lg`} onClick={toggleWishlist}>
                {inWishlist ? '❤️ In Wishlist' : '🤍 Add to Wishlist'}
              </button>
            </div>

            <ProductSocial product={product} />
          </div>
        </div>
      </div>
    </main>
  );
}
