import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { mediaUrl } from '../utils/mediaUrl';

const STATUS_LABELS = {
  awaiting_payment: '⏳ Awaiting Payment',
  awaiting_verification: '🔍 Verifying',
  payment_confirmed: '✅ Confirmed',
  processing: '📦 Processing',
  shipped: '🚚 Shipped',
  completed: '✅ Done',
  cancelled: '❌ Cancelled',
};

const CRAFT_CATEGORIES = [
  { id: 'Origami', label: 'Origami', emoji: '🦢' },
  { id: 'Paintings', label: 'Paintings', emoji: '🎨' },
  { id: 'Drawings', label: 'Drawings', emoji: '✏️' },
  { id: 'Handmade Cards', label: 'Handmade Cards', emoji: '💌' },
  { id: 'Crochet', label: 'Crochet & Knit', emoji: '🧶' },
  { id: 'Pottery', label: 'Clay & Pottery', emoji: '🏺' },
  { id: 'Gift Items', label: 'Gift Items', emoji: '🎁' },
  { id: 'Other', label: 'Other Crafts', emoji: '✨' },
];

const PRICE_PRESETS = [50, 100, 150, 200, 300, 500];

export default function AdminDashboard() {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'overview';
  const autoOpenNew = searchParams.get('new') === '1';

  const [tab, setTab] = useState(initialTab);
  const [stats, setStats] = useState({});
  const [products, setProducts] = useState([]);
  const [pendingPosts, setPendingPosts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Kid-friendly craft creation state
  const [showAddCraft, setShowAddCraft] = useState(autoOpenNew || initialTab === 'products');

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t) setTab(t);
    if (searchParams.get('new') === '1') {
      setTab('products');
      setShowAddCraft(true);
    }
  }, [searchParams]);
  const [craftTitle, setCraftTitle] = useState('');
  const [craftCategory, setCraftCategory] = useState('Origami');
  const [craftPrice, setCraftPrice] = useState('100');
  const [craftDescription, setCraftDescription] = useState('');
  const [craftImages, setCraftImages] = useState([]); // [{ file, preview }]
  const [craftLoading, setCraftLoading] = useState(false);
  const [craftError, setCraftError] = useState('');
  const [craftSuccess, setCraftSuccess] = useState('');
  const fileInputRef = useRef(null);

  // Creator & Site Settings state
  const [settingsData, setSettingsData] = useState({
    creatorName: '',
    siteTagline: '',
    creatorBio: '',
    creatorAvatarUrl: '',
    whatsappNumber: '',
    youtubeChannelUrl: '',
    youtubeChannelName: '',
    instagramUrl: '',
    shippingInfo: '',
    returnPolicy: '',
    upiQrImageUrl: '',
    paymentInstructions: '',
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState('');
  const [settingsError, setSettingsError] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [qrUploading, setQrUploading] = useState(false);
  const avatarInputRef = useRef(null);
  const qrInputRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes] = await Promise.all([api.get('/admin/stats')]);
        setStats(statsRes.data);
      } catch (e) {
        console.error('Failed to fetch stats:', e);
      }
      setLoading(false);
    };
    load();
  }, []);

  const loadProducts = async () => {
    try {
      const { data } = await api.get('/admin/products');
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to fetch products:', e);
    }
  };

  const loadSettings = async () => {
    setSettingsLoading(true);
    setSettingsError('');
    try {
      const { data } = await api.get('/settings/admin');
      if (data) {
        setSettingsData({
          creatorName: data.creatorName || '',
          siteTagline: data.siteTagline || '',
          creatorBio: data.creatorBio || '',
          creatorAvatarUrl: data.creatorAvatarUrl || '/images/owner.png',
          whatsappNumber: data.whatsappNumber || '',
          youtubeChannelUrl: data.youtubeChannelUrl || '',
          youtubeChannelName: data.youtubeChannelName || '',
          instagramUrl: data.instagramUrl || '',
          shippingInfo: data.shippingInfo || '',
          returnPolicy: data.returnPolicy || '',
          upiQrImageUrl: data.upiQrImageUrl || '',
          paymentInstructions: data.paymentInstructions || '',
        });
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
      setSettingsError('Could not load current settings. Please try again.');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    setSettingsError('');
    setSettingsSuccess('');
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const { data } = await api.post('/settings/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSettingsData(prev => ({ ...prev, creatorAvatarUrl: data.creatorAvatarUrl }));
      setSettingsSuccess('🎉 Creator photo updated successfully!');
    } catch (err) {
      console.error('Failed to upload avatar:', err);
      setSettingsError(err.response?.data?.message || 'Could not upload photo. Try another image.');
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleQrUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setQrUploading(true);
    setSettingsError('');
    setSettingsSuccess('');
    const formData = new FormData();
    formData.append('qrImage', file);
    try {
      const { data } = await api.post('/settings/qr', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSettingsData(prev => ({ ...prev, upiQrImageUrl: data.upiQrImageUrl }));
      setSettingsSuccess('🎉 UPI QR Code uploaded successfully! Customers can now scan this QR to pay during checkout.');
    } catch (err) {
      console.error('Failed to upload QR code:', err);
      setSettingsError(err.response?.data?.message || 'Could not upload QR image. Please try again.');
    } finally {
      setQrUploading(false);
      if (qrInputRef.current) qrInputRef.current.value = '';
    }
  };

  const handleRemoveQr = async () => {
    if (!window.confirm('Are you sure you want to remove the current UPI QR code?')) return;
    setSettingsError('');
    setSettingsSuccess('');
    try {
      await api.patch('/settings', { upiQrImageUrl: '' });
      setSettingsData(prev => ({ ...prev, upiQrImageUrl: '' }));
      setSettingsSuccess('UPI QR Code removed successfully.');
    } catch (err) {
      setSettingsError('Failed to remove UPI QR code.');
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSettingsSaving(true);
    setSettingsError('');
    setSettingsSuccess('');
    try {
      const { data } = await api.patch('/settings', settingsData);
      setSettingsData(prev => ({ ...prev, ...data }));
      setSettingsSuccess('✅ Your creator details and site settings were saved successfully! Live changes are now visible across the website.');
    } catch (err) {
      console.error('Failed to save settings:', err);
      setSettingsError(err.response?.data?.message || 'Failed to save settings. Please try again.');
    } finally {
      setSettingsSaving(false);
    }
  };

  useEffect(() => {
    if (tab === 'products') {
      loadProducts();
    } else if (tab === 'settings') {
      loadSettings();
    } else if (tab === 'moderation') {
      api.get('/admin/community/pending').then(({ data }) => setPendingPosts(data)).catch(() => {});
    } else if (tab === 'orders') {
      api.get('/admin/orders').then(({ data }) => setOrders(data)).catch(() => {});
    } else if (tab === 'reports') {
      api.get('/admin/reports').then(({ data }) => setReports(data)).catch(() => {});
    }
  }, [tab]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      craftImages.forEach(img => URL.revokeObjectURL(img.preview));
    };
  }, [craftImages]);

  const handleAddPhotos = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setCraftError('');
    const room = 5 - craftImages.length;
    if (room <= 0) {
      setCraftError('You can upload up to 5 photos for each craft! 📸');
      return;
    }

    const selected = files.slice(0, room).map(f => ({
      file: f,
      preview: URL.createObjectURL(f),
    }));

    setCraftImages(prev => [...prev, ...selected]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemovePhoto = (index) => {
    setCraftImages(prev => {
      const target = prev[index];
      if (target?.preview) URL.revokeObjectURL(target.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleCreateCraft = async (e) => {
    e.preventDefault();
    setCraftError('');
    setCraftSuccess('');

    if (!craftTitle.trim()) {
      setCraftError('Please give your craft a friendly title! 🎨');
      return;
    }
    if (!craftPrice || Number(craftPrice) < 0) {
      setCraftError('Please set a valid price in ₹ (e.g. 100) 💰');
      return;
    }
    if (!craftImages.length) {
      setCraftError('Please add at least 1 photo of your craft so customers can see it! 📸');
      return;
    }

    const formData = new FormData();
    formData.append('title', craftTitle.trim());
    formData.append('category', craftCategory);
    formData.append('price', String(craftPrice));
    formData.append('description', craftDescription.trim() || `Handmade ${craftCategory} created with love by ParthCraft12!`);

    craftImages.forEach(img => {
      formData.append('images', img.file);
    });

    setCraftLoading(true);
    try {
      const { data } = await api.post('/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setCraftSuccess(`🎉 Awesome! "${data.title}" has been published to your shop!`);
      // Reset form
      setCraftTitle('');
      setCraftDescription('');
      setCraftPrice('100');
      craftImages.forEach(img => URL.revokeObjectURL(img.preview));
      setCraftImages([]);
      // Reload products list
      loadProducts();
      setStats(prev => ({ ...prev, products: (prev.products || 0) + 1 }));
    } catch (err) {
      console.error('Error creating craft:', err);
      setCraftError(err.response?.data?.message || 'Could not publish craft. Please try again!');
    } finally {
      setCraftLoading(false);
    }
  };

  const toggleProductStatus = async (productId, currentStatus) => {
    const nextStatus = currentStatus === 'available' ? 'sold' : 'available';
    try {
      await api.patch(`/products/${productId}/status`, { status: nextStatus });
      setProducts(prev => prev.map(p => (p._id === productId ? { ...p, status: nextStatus } : p)));
    } catch (err) {
      console.error('Failed to update product status:', err);
      alert('Could not update product status.');
    }
  };

  const handleDeleteProduct = async (productId, title) => {
    if (!window.confirm(`Are you sure you want to remove "${title}" from the shop?`)) return;
    try {
      await api.delete(`/admin/products/${productId}`);
      setProducts(prev => prev.filter(p => p._id !== productId));
      setStats(prev => ({ ...prev, products: Math.max(0, (prev.products || 0) - 1) }));
    } catch (err) {
      console.error('Failed to delete product:', err);
      alert('Could not delete product.');
    }
  };

  const moderatePost = async (postId, action) => {
    try {
      await api.patch(`/admin/community/${postId}/moderate`, { action });
      setPendingPosts(prev => prev.filter(p => p._id !== postId));
      setStats(s => ({ ...s, pendingPosts: Math.max(0, (s.pendingPosts || 0) - 1) }));
    } catch (err) { console.error(err); }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const { data } = await api.patch(`/admin/orders/${orderId}/status`, { status });
      setOrders(prev => prev.map(o => o._id === orderId ? data : o));
    } catch (err) { console.error(err); }
  };

  if (loading) return <main className="page-content"><div className="loader-page"><div className="spinner" /></div></main>;

  return (
    <main className="page-content">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>⚙️ Admin Studio</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: '4px 0 0' }}>
              Manage your craft store, list new creations, review orders, and moderate posts.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setTab('products');
              setShowAddCraft(true);
            }}
          >
            ➕ List a New Craft ✨
          </button>
        </div>

        {/* Stats */}
        <div className="admin-stats-grid">
          <div className="stat-card" onClick={() => setTab('products')} style={{ cursor: 'pointer' }}>
            <div className="stat-number">{stats.products || products.length || 0}</div>
            <div className="stat-label">🎨 Listed Crafts</div>
          </div>
          <div className="stat-card" onClick={() => setTab('orders')} style={{ cursor: 'pointer' }}>
            <div className="stat-number">{stats.totalOrders || 0}</div>
            <div className="stat-label">📦 Total Orders</div>
          </div>
          <div className="stat-card" onClick={() => setTab('orders')} style={{ cursor: 'pointer' }}>
            <div className="stat-number" style={{ color: 'var(--danger)' }}>{stats.awaitingVerification || 0}</div>
            <div className="stat-label">🔍 Payments to Verify</div>
          </div>
          <div className="stat-card" onClick={() => setTab('moderation')} style={{ cursor: 'pointer' }}>
            <div className="stat-number" style={{ color: 'var(--warning)' }}>{stats.pendingPosts || 0}</div>
            <div className="stat-label">⏳ Pending Posts</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.users || 0}</div>
            <div className="stat-label">👥 Users</div>
          </div>
          <div className="stat-card" onClick={() => setTab('reports')} style={{ cursor: 'pointer' }}>
            <div className="stat-number">{stats.pendingReports || 0}</div>
            <div className="stat-label">🚩 Reports</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="admin-tabs">
          {[
            { id: 'overview', label: '📊 Overview' },
            { id: 'products', label: '🎨 Crafts & Products' },
            { id: 'orders', label: '📦 Orders' },
            { id: 'settings', label: '⚙️ Creator Profile & Site' },
            { id: 'moderation', label: '🛡️ Moderation' },
            { id: 'reports', label: '🚩 Reports' },
          ].map(t => (
            <button
              key={t.id}
              className={`admin-tab${tab === t.id ? ' active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {tab === 'overview' && (
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 12 }}>🚀 Quick Actions</h3>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => { setTab('products'); setShowAddCraft(true); }}
              >
                ✨ Add New Craft to Shop
              </button>
              <button className="btn btn-accent btn-sm" onClick={() => setTab('settings')}>
                ⚙️ Edit Creator Profile & Bio
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => setTab('settings')}>
                💳 UPI Payment QR Code
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => setTab('products')}>
                🎨 View All Products ({stats.products || 0})
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => setTab('orders')}>
                📦 Manage Orders ({stats.awaitingVerification || 0} pending payment verification)
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => setTab('moderation')}>
                🛡️ Review Community Posts ({stats.pendingPosts || 0})
              </button>
              <Link to="/community/new" className="btn btn-secondary btn-sm">
                📸 Share Post to Community
              </Link>
            </div>
            <div style={{ padding: '16px', background: 'var(--paper-dark)', borderRadius: 'var(--radius-md)' }}>
              <strong>💡 Kid Creator Tip:</strong> Take bright, clear photos of your origami, drawings, or crafts in natural light! Buyers love seeing different angles and close-up details.
            </div>
          </div>
        )}

        {/* Crafts & Products Tab (Kid-Friendly Creator Experience) */}
        {tab === 'products' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', margin: 0 }}>
                  🎨 Craft Studio & Listings
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '4px 0 0' }}>
                  Manage items in your store or publish a new handmade piece!
                </p>
              </div>
              <button
                type="button"
                className={`btn ${showAddCraft ? 'btn-secondary' : 'btn-primary'}`}
                onClick={() => setShowAddCraft(prev => !prev)}
              >
                {showAddCraft ? '✕ Close Form' : '➕ Add a New Craft ✨'}
              </button>
            </div>

            {/* Kid-Friendly Craft Creation Card */}
            {showAddCraft && (
              <div className="kid-creator-card">
                <div className="kid-creator-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '1.8rem' }}>✨</span>
                    <div>
                      <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>
                        Add Your New Craft to the Shop
                      </h3>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Fill in these quick details and your creation will immediately show up in the shop!
                      </p>
                    </div>
                  </div>
                  <span className="kid-creator-badge">🎨 Creator Studio</span>
                </div>

                {craftSuccess && (
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--sage-light)',
                    color: 'var(--sage-dark)',
                    fontWeight: 600,
                    marginBottom: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 8,
                  }}>
                    <span>{craftSuccess}</span>
                    <Link to="/shop" className="btn btn-secondary btn-sm" style={{ padding: '4px 12px' }}>
                      👁️ View in Shop
                    </Link>
                  </div>
                )}

                {craftError && (
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(196,75,75,0.15)',
                    color: 'var(--danger)',
                    fontWeight: 600,
                    marginBottom: 16,
                  }}>
                    {craftError}
                  </div>
                )}

                <form onSubmit={handleCreateCraft}>
                  {/* 1. Craft Name */}
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.95rem' }}>
                      🌟 What is your craft called?
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Golden Paper Crane, Ocean Sunset Acrylic, Cute Crochet Bear..."
                      value={craftTitle}
                      onChange={e => setCraftTitle(e.target.value)}
                      required
                    />
                  </div>

                  {/* 2. Craft Category */}
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.95rem' }}>
                      🏷️ Pick a Category:
                    </label>
                    <div className="category-chip-grid">
                      {CRAFT_CATEGORIES.map(cat => (
                        <button
                          key={cat.id}
                          type="button"
                          className={`category-chip${craftCategory === cat.id ? ' active' : ''}`}
                          onClick={() => setCraftCategory(cat.id)}
                        >
                          <span>{cat.emoji}</span>
                          <span>{cat.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. Price (in ₹) with quick buttons */}
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.95rem' }}>
                      💰 Price in Rupees (₹):
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ position: 'relative', width: '160px' }}>
                        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--clay)' }}>
                          ₹
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          className="form-input"
                          style={{ paddingLeft: '30px', fontWeight: 700, fontSize: '1.1rem' }}
                          value={craftPrice}
                          onChange={e => setCraftPrice(e.target.value)}
                          required
                        />
                      </div>
                      <div className="price-presets">
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
                          Quick pick:
                        </span>
                        {PRICE_PRESETS.map(p => (
                          <button
                            key={p}
                            type="button"
                            className={`price-preset-btn${Number(craftPrice) === p ? ' active' : ''}`}
                            onClick={() => setCraftPrice(String(p))}
                          >
                            ₹{p}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 4. Photos */}
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.95rem' }}>
                      📸 Photos of your craft (Up to 5):
                    </label>

                    <input
                      ref={fileInputRef}
                      type="file"
                      id="craft-photos-input"
                      accept="image/*"
                      multiple
                      style={{ display: 'none' }}
                      onChange={handleAddPhotos}
                    />

                    <div
                      className="craft-upload-zone"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div style={{ fontSize: '2rem', marginBottom: 4 }}>📷</div>
                      <div style={{ fontWeight: 600, color: 'var(--text)' }}>
                        Click to choose photos from your phone or computer
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        Add clear photos from the front, back, or side ({craftImages.length}/5 added)
                      </div>
                    </div>

                    {craftImages.length > 0 && (
                      <div className="craft-preview-grid">
                        {craftImages.map((img, idx) => (
                          <div key={idx} className="craft-preview-item">
                            <img src={img.preview} alt={`preview ${idx}`} />
                            {idx === 0 && (
                              <span className="craft-preview-cover-badge">⭐ Cover</span>
                            )}
                            <button
                              type="button"
                              className="craft-preview-remove"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemovePhoto(idx);
                              }}
                              title="Remove photo"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 5. Story / Description */}
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.95rem' }}>
                      📝 Tell people about your craft:
                    </label>
                    <textarea
                      className="form-textarea"
                      placeholder="e.g. Made using imported paper and took 2 hours to fold. Dimensions: 15cm x 10cm. Packed safely in a gift box!"
                      value={craftDescription}
                      onChange={e => setCraftDescription(e.target.value)}
                      rows={3}
                    />
                  </div>

                  {/* Submit Button */}
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 24, flexWrap: 'wrap' }}>
                    <button
                      type="submit"
                      className="btn btn-primary btn-lg"
                      disabled={craftLoading}
                    >
                      {craftLoading ? '⏳ Uploading Craft...' : '✨ Publish Craft to Shop! 🚀'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => setShowAddCraft(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* List of Products */}
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: 4 }}>
                📦 All Store Crafts ({products.length})
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Toggle availability or view live shop listings.
              </p>
            </div>

            {products.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 20px', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎨</div>
                <h3>No crafts listed yet!</h3>
                <p>Click "Add a New Craft" above to publish your first creation to the shop.</p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setShowAddCraft(true)}
                  style={{ marginTop: 16 }}
                >
                  ➕ Add First Craft Now
                </button>
              </div>
            ) : (
              <div className="product-manage-grid">
                {products.map(product => {
                  const cover = product.imageUrls?.[0] || product.imageUrl || '';
                  const isAvailable = product.status === 'available';

                  return (
                    <div key={product._id} className="product-manage-card">
                      {cover ? (
                        <img src={cover} alt={product.title} className="product-manage-img" />
                      ) : (
                        <div className="product-manage-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                          🎨
                        </div>
                      )}
                      <div className="product-manage-body">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                          <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)' }}>
                            {product.title}
                          </h4>
                          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--clay)', whiteSpace: 'nowrap' }}>
                            ₹{product.price}
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                          <span className="badge badge-marigold">{product.category}</span>
                          <span className={`badge ${isAvailable ? 'badge-green' : 'badge-gray'}`}>
                            {isAvailable ? '🟢 In Stock' : '🔴 Sold Out'}
                          </span>
                        </div>

                        <div className="product-manage-actions">
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => toggleProductStatus(product._id, product.status)}
                            title="Toggle in-stock or sold"
                            style={{ flex: 1, minWidth: '120px' }}
                          >
                            {isAvailable ? 'Mark as Sold' : 'Mark Available'}
                          </button>
                          <Link
                            to={`/product/${product._id}`}
                            className="btn btn-ghost btn-sm"
                            target="_blank"
                            rel="noopener noreferrer"
                            title="View product in shop"
                          >
                            👁️ View
                          </Link>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleDeleteProduct(product._id, product.title)}
                            style={{ color: 'var(--danger)' }}
                            title="Delete this craft"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Moderation Tab */}
        {tab === 'moderation' && (
          pendingPosts.length === 0 ? (
            <div className="empty-state"><h3>🎉 All caught up!</h3><p>No pending posts to review.</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {pendingPosts.map(post => (
                <div key={post._id} className="card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                    {(post.imageUrls?.[0] || post.youtubeThumbnail) && (
                      <img src={post.imageUrls?.[0] || post.youtubeThumbnail} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{post.title}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        by {post.author?.name} · {post.type} · {post.category}
                      </div>
                      {post.caption && <p style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginTop: 4 }}>{post.caption.slice(0, 200)}</p>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary btn-sm" onClick={() => moderatePost(post._id, 'approve')}>✅ Approve</button>
                    <button className="btn btn-danger btn-sm" onClick={() => moderatePost(post._id, 'reject')}>❌ Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Orders Tab */}
        {tab === 'orders' && (
          orders.length === 0 ? (
            <div className="empty-state"><h3>No orders yet</h3></div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Screenshot</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order._id}>
                      <td>
                        <strong>#{order.orderRef}</strong><br />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {new Date(order.createdAt).toLocaleDateString('en-IN')}
                        </span>
                      </td>
                      <td>{order.customer?.name || order.customerName}</td>
                      <td style={{ fontWeight: 600 }}>₹{order.totalAmount?.toLocaleString('en-IN')}</td>
                      <td><span className="badge badge-marigold">{STATUS_LABELS[order.status] || order.status}</span></td>
                      <td>
                        {order.paymentScreenshotUrl ? (
                          <a href={order.paymentScreenshotUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">📸 View</a>
                        ) : '—'}
                      </td>
                      <td>
                        <select
                          className="form-select"
                          value={order.status}
                          onChange={e => updateOrderStatus(order._id, e.target.value)}
                          style={{ fontSize: '0.8rem', padding: '4px 8px', minWidth: 140 }}
                        >
                          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* Reports Tab */}
        {tab === 'reports' && (
          reports.length === 0 ? (
            <div className="empty-state"><h3>No pending reports</h3></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {reports.map(report => (
                <div key={report._id} className="card" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span className="badge badge-clay">{report.reason}</span>
                      <span style={{ marginLeft: 8, fontSize: '0.85rem' }}>by {report.reporter?.name}</span>
                      <span style={{ marginLeft: 8, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{report.targetType}</span>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={async () => {
                      await api.patch(`/admin/reports/${report._id}`, { status: 'dismissed' });
                      setReports(prev => prev.filter(r => r._id !== report._id));
                    }}>Dismiss</button>
                  </div>
                  {report.details && <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: 6 }}>{report.details}</p>}
                </div>
              ))}
            </div>
          )
        )}

        {/* Settings Tab — Creator Profile & Site Personalization */}
        {tab === 'settings' && (
          <div style={{ maxWidth: 860, margin: '0 auto' }}>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', margin: 0 }}>
                ⚙️ Creator Profile & Site Settings
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '4px 0 0' }}>
                Customize your name, photo, bio story, YouTube channel, WhatsApp number, and store policies. Everything updates instantly across your website!
              </p>
            </div>

            {settingsSuccess && (
              <div style={{
                background: 'rgba(46, 125, 50, 0.12)',
                border: '1.5px solid #2e7d32',
                color: 'var(--text-main)',
                padding: '14px 18px',
                borderRadius: 'var(--radius-md)',
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontWeight: 600,
                fontSize: '0.95rem'
              }}>
                <span style={{ fontSize: '1.3rem' }}>🎉</span>
                <span>{settingsSuccess}</span>
              </div>
            )}

            {settingsError && (
              <div style={{
                background: 'rgba(211, 47, 47, 0.12)',
                border: '1.5px solid #d32f2f',
                color: 'var(--danger)',
                padding: '14px 18px',
                borderRadius: 'var(--radius-md)',
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontWeight: 600,
                fontSize: '0.95rem'
              }}>
                <span>⚠️</span>
                <span>{settingsError}</span>
              </div>
            )}

            {settingsLoading ? (
              <div className="card" style={{ padding: 40, textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto 12px' }} />
                <p style={{ color: 'var(--text-muted)' }}>Loading your creator profile & settings...</p>
              </div>
            ) : (
              <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* 1. Creator Photo & Avatar */}
                <div className="card" style={{ padding: 24 }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                    📸 Creator Photo (Personalization)
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 20 }}>
                    This photo represents you (the owner/artisan) across the entire store — appearing on the homepage "Meet the Creator" spotlight and the About page hero banner.
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                    <div style={{
                      width: 130,
                      height: 130,
                      borderRadius: 'var(--radius-xl)',
                      overflow: 'hidden',
                      border: '3px solid var(--clay)',
                      background: 'var(--paper-dark)',
                      boxShadow: '0 8px 20px rgba(198, 91, 61, 0.25)',
                      flexShrink: 0,
                      position: 'relative'
                    }}>
                      <img
                        src={settingsData.creatorAvatarUrl || '/images/owner.png'}
                        alt={settingsData.creatorName || 'Owner'}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.target.src = '/images/owner.png'; }}
                      />
                      {avatarUploading && (
                        <div style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'rgba(0,0,0,0.6)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontSize: '0.8rem',
                          fontWeight: 600
                        }}>
                          Uploading...
                        </div>
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 240, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <input
                        type="file"
                        accept="image/*"
                        ref={avatarInputRef}
                        style={{ display: 'none' }}
                        onChange={handleAvatarUpload}
                      />
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          disabled={avatarUploading}
                          onClick={() => avatarInputRef.current?.click()}
                        >
                          {avatarUploading ? '⏳ Uploading...' : '📁 Upload New Owner Photo'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => setSettingsData(prev => ({ ...prev, creatorAvatarUrl: '/images/owner.png' }))}
                        >
                          🔄 Reset to Default Photo
                        </button>
                      </div>

                      <div style={{ marginTop: 8 }}>
                        <label className="form-label" style={{ fontSize: '0.8rem' }}>Or Direct Image URL:</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="/images/owner.png or https://..."
                          value={settingsData.creatorAvatarUrl}
                          onChange={e => setSettingsData(prev => ({ ...prev, creatorAvatarUrl: e.target.value }))}
                          style={{ fontSize: '0.85rem' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Creator Identity & Tagline */}
                <div className="card" style={{ padding: 24 }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    🎨 Creator Identity & Bio
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 16 }}>
                    <div>
                      <label className="form-label">Creator / Owner Name *</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Parth"
                        value={settingsData.creatorName}
                        onChange={e => setSettingsData(prev => ({ ...prev, creatorName: e.target.value }))}
                        required
                      />
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Shown in greetings, about cards, and headers.</span>
                    </div>

                    <div>
                      <label className="form-label">Craft Tagline / Title</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Young Artist, Paper Crafter & YouTuber"
                        value={settingsData.siteTagline}
                        onChange={e => setSettingsData(prev => ({ ...prev, siteTagline: e.target.value }))}
                      />
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Appears directly under your name.</span>
                    </div>
                  </div>

                  <div>
                    <label className="form-label">About the Creator / Story Bio</label>
                    <textarea
                      className="form-input"
                      rows={4}
                      placeholder="Share your story! How you started crafting, what inspires you, and what makes your creations special..."
                      value={settingsData.creatorBio}
                      onChange={e => setSettingsData(prev => ({ ...prev, creatorBio: e.target.value }))}
                    />
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      This story is displayed on your Homepage and About page for buyers and craft fans to read!
                    </span>
                  </div>
                </div>

                {/* 3. Channels & Contact */}
                <div className="card" style={{ padding: 24 }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    📱 Social Links & Contact Channels
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                    <div>
                      <label className="form-label">💬 WhatsApp Contact Number</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. 8877396175"
                        value={settingsData.whatsappNumber}
                        onChange={e => setSettingsData(prev => ({ ...prev, whatsappNumber: e.target.value }))}
                      />
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Customers can tap "Chat on WhatsApp" to message you directly about orders or custom crafts.
                      </span>
                    </div>

                    <div>
                      <label className="form-label">▶️ YouTube Channel URL</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. https://www.youtube.com/@parthcraft12"
                        value={settingsData.youtubeChannelUrl}
                        onChange={e => setSettingsData(prev => ({ ...prev, youtubeChannelUrl: e.target.value }))}
                      />
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Links your tutorials and videos directly.</span>
                    </div>

                    <div>
                      <label className="form-label">▶️ YouTube Display Handle</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. @parthcraft12"
                        value={settingsData.youtubeChannelName}
                        onChange={e => setSettingsData(prev => ({ ...prev, youtubeChannelName: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="form-label">📷 Instagram URL (Optional)</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. https://instagram.com/your_handle"
                        value={settingsData.instagramUrl}
                        onChange={e => setSettingsData(prev => ({ ...prev, instagramUrl: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Payment & UPI QR Code Setup */}
                <div className="card" style={{ padding: 24 }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    💳 UPI Payment QR Code & Instructions
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 20 }}>
                    Upload your UPI QR code (Google Pay, PhonePe, Paytm, or BHIM) so buyers can scan and pay directly on the website during checkout!
                  </p>

                  <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 16 }}>
                    {/* QR Code Preview Box */}
                    <div style={{
                      width: 180,
                      minHeight: 180,
                      borderRadius: 'var(--radius-lg)',
                      border: '2px dashed var(--border)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 12,
                      background: 'var(--paper-dark)',
                      position: 'relative',
                      textAlign: 'center'
                    }}>
                      {settingsData.upiQrImageUrl ? (
                        <>
                          <img
                            src={mediaUrl(settingsData.upiQrImageUrl)}
                            alt="UPI QR Code"
                            style={{ width: '100%', height: 'auto', maxHeight: 155, objectFit: 'contain', borderRadius: 'var(--radius-md)' }}
                          />
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6, fontWeight: 600 }}>Active QR Code</div>
                        </>
                      ) : (
                        <div style={{ padding: 8 }}>
                          <div style={{ fontSize: '2.5rem', marginBottom: 6 }}>📱</div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>No QR Uploaded</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tap upload to add</div>
                        </div>
                      )}

                      {qrUploading && (
                        <div style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'rgba(0,0,0,0.65)',
                          borderRadius: 'var(--radius-lg)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontSize: '0.85rem',
                          fontWeight: 600
                        }}>
                          Uploading...
                        </div>
                      )}
                    </div>

                    {/* QR Upload Actions & Controls */}
                    <div style={{ flex: 1, minWidth: 260, display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <input
                        type="file"
                        accept="image/*"
                        ref={qrInputRef}
                        style={{ display: 'none' }}
                        onChange={handleQrUpload}
                      />
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          disabled={qrUploading}
                          onClick={() => qrInputRef.current?.click()}
                        >
                          {qrUploading ? '⏳ Uploading...' : '📁 Upload New UPI QR Code'}
                        </button>
                        {settingsData.upiQrImageUrl && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={handleRemoveQr}
                          >
                            🗑️ Remove QR Code
                          </button>
                        )}
                      </div>

                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, background: 'var(--paper-dark)', padding: '10px 14px', borderRadius: 'var(--radius-md)' }}>
                        💡 <strong>Tip for Parth:</strong> Open Google Pay or PhonePe on your phone, open "My QR / Receive Money", take a screenshot, and upload it here! Customers will see it at checkout.
                      </div>

                      <div>
                        <label className="form-label" style={{ fontSize: '0.85rem' }}>Or Direct QR Image URL (Optional):</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="https://..."
                          value={settingsData.upiQrImageUrl}
                          onChange={e => setSettingsData(prev => ({ ...prev, upiQrImageUrl: e.target.value }))}
                          style={{ fontSize: '0.85rem' }}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <label className="form-label">Payment Instructions for Buyers</label>
                    <textarea
                      className="form-input"
                      rows={2}
                      placeholder="e.g. Scan the QR code using Google Pay, PhonePe, or Paytm, pay the exact amount, and upload the payment screenshot!"
                      value={settingsData.paymentInstructions}
                      onChange={e => setSettingsData(prev => ({ ...prev, paymentInstructions: e.target.value }))}
                    />
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Displayed to buyers on the payment screen right below the QR code.
                    </span>
                  </div>
                </div>

                {/* 5. Store Policies & Shipping */}
                <div className="card" style={{ padding: 24 }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    🚚 Shipping & Store Policies
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <label className="form-label">Shipping & Delivery Info</label>
                      <textarea
                        className="form-input"
                        rows={2}
                        placeholder="e.g. Shipping charges may apply. Delivery typically takes 5-7 business days."
                        value={settingsData.shippingInfo}
                        onChange={e => setSettingsData(prev => ({ ...prev, shippingInfo: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="form-label">Return & Exchange Policy</label>
                      <textarea
                        className="form-input"
                        rows={2}
                        placeholder="e.g. Handmade items are non-returnable unless damaged during transit. Contact within 48h."
                        value={settingsData.returnPolicy}
                        onChange={e => setSettingsData(prev => ({ ...prev, returnPolicy: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Action Save Bar */}
                <div className="admin-save-bar">
                  <div>
                    <strong>Ready to publish your updates?</strong>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      All changes will take effect live on the website immediately.
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 12 }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={loadSettings}
                      disabled={settingsSaving}
                    >
                      Discard Unsaved
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={settingsSaving}
                      style={{ minWidth: 160 }}
                    >
                      {settingsSaving ? '💾 Saving...' : '💾 Save Changes Live ✨'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
