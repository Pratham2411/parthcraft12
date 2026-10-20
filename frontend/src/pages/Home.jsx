import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [featured, setFeatured] = useState([]);
  const [communityPosts, setCommunityPosts] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [prodRes, commRes, settRes] = await Promise.allSettled([
          api.get('/products', { params: { sortBy: 'newest', limit: 8 } }),
          api.get('/community', { params: { limit: 6 } }),
          api.get('/settings'),
        ]);
        if (prodRes.status === 'fulfilled') setFeatured(prodRes.value.data?.slice?.(0, 8) || prodRes.value.data || []);
        if (commRes.status === 'fulfilled') setCommunityPosts(commRes.value.data?.posts || []);
        if (settRes.status === 'fulfilled') setSettings(settRes.value.data || {});
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  return (
    <main className="page-content">
      <div className="container">
        {/* Hero */}
        <section className="hero">
          <div className="hero-eyebrow">🎨 Handmade Art & Craft</div>
          <h1 className="hero-title">
            Creative Crafts<br />
            <span className="clay">Made With Love</span>
          </h1>
          <p className="hero-subtitle">
            Discover unique handmade creations, share your own artwork with the community, 
            and shop one-of-a-kind craft products by ParthCraft12.
          </p>
          <div className="hero-cta">
            <Link to="/shop" className="btn btn-primary btn-lg">🛍️ Browse Shop</Link>
            <Link to="/community" className="btn btn-secondary btn-lg">🎨 Explore Community</Link>
            {!isAuthenticated && (
              <Link to="/register" className="btn btn-accent btn-lg">✨ Join Free</Link>
            )}
          </div>
        </section>

        {/* Featured Products */}
        {!loading && featured.length > 0 && (
          <section className="section">
            <div className="section-header">
              <div>
                <h2 className="section-title">✨ From the Shop</h2>
                <p className="section-subtitle">Handmade creations you can own</p>
              </div>
              <Link to="/shop" className="btn btn-secondary btn-sm">View All →</Link>
            </div>
            <div className="product-grid">
              {featured.map((p) => <ProductCard key={p._id} product={p} />)}
            </div>
          </section>
        )}

        {/* Community Highlights */}
        {!loading && communityPosts.length > 0 && (
          <section className="section">
            <div className="section-header">
              <div>
                <h2 className="section-title">🎨 Community Creations</h2>
                <p className="section-subtitle">Inspiration from fellow craft lovers</p>
              </div>
              <Link to="/community" className="btn btn-secondary btn-sm">See All →</Link>
            </div>
            <div className="community-grid">
              {communityPosts.slice(0, 6).map((post) => (
                <Link to={`/community/post/${post._id}`} key={post._id} className="community-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="community-card-image">
                    <img 
                      src={post.type === 'youtube' ? post.youtubeThumbnail : post.imageUrls?.[0]} 
                      alt={post.title} 
                      loading="lazy" 
                    />
                  </div>
                  <div className="community-card-body">
                    <div className="community-card-title">{post.title}</div>
                    <div className="community-card-caption">{post.caption}</div>
                    <div className="community-card-actions">
                      <span className="action-btn">❤️ {post.likeCount || 0}</span>
                      <span className="action-btn">💬 {post.commentCount || 0}</span>
                      <span style={{ marginLeft: 'auto' }} className="badge badge-sage">{post.category}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Meet the Creator Section */}
        <section className="section">
          <div style={{
            background: 'var(--bg-elevated)',
            border: '1.5px solid var(--border-light)',
            borderRadius: 'var(--radius-xl)',
            padding: '36px 32px',
            display: 'flex',
            alignItems: 'center',
            gap: '32px',
            flexWrap: 'wrap',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{
              width: 140,
              height: 140,
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
              border: '3px solid var(--clay)',
              flexShrink: 0,
              margin: '0 auto',
              background: 'var(--paper-dark)',
              boxShadow: '0 8px 20px rgba(198,91,61,0.2)'
            }}>
              <img
                src={settings.creatorAvatarUrl || '/images/owner.png'}
                alt={settings.creatorName || 'Parth'}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { e.target.src = '/images/owner.png'; }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--marigold-light)',
                color: 'var(--ink)',
                fontSize: '0.78rem',
                fontWeight: 700,
                marginBottom: 8
              }}>
                🌟 Meet the Creator
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', margin: '0 0 4px', color: 'var(--ink)' }}>
                {settings.creatorName || 'Parth'}
              </h2>
              <div style={{ color: 'var(--clay)', fontWeight: 600, fontSize: '0.9rem', marginBottom: 10 }}>
                {settings.siteTagline || 'Young Artist, Paper Crafter & YouTuber'}
              </div>
              <p style={{ color: 'var(--text-light)', fontSize: '0.92rem', lineHeight: 1.6, margin: '0 0 16px' }}>
                {settings.creatorBio || 'Every piece is folded, painted, or crafted by hand with creativity and love. Check out the story or watch how crafts are made!'}
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Link to="/about" className="btn btn-secondary btn-sm">
                  📖 Read Creator Story
                </Link>
                {settings.youtubeChannelUrl && (
                  <a
                    href={settings.youtubeChannelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-sm"
                  >
                    ▶️ Watch on YouTube
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* YouTube Channel CTA */}
        <section className="section" style={{ textAlign: 'center' }}>
          <div style={{ 
            background: 'var(--marigold-light)', 
            borderRadius: 'var(--radius-xl)', 
            padding: '48px 32px',
            maxWidth: 700,
            margin: '0 auto'
          }}>
            <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: 12 }}>📺 Watch on YouTube</h2>
            <p style={{ color: 'var(--text-light)', marginBottom: 24 }}>
              Tutorials, time-lapses, and behind-the-scenes of every creation. 
              Subscribe to ParthCraft12 on YouTube!
            </p>
            <a 
              href={settings.youtubeChannelUrl || 'https://www.youtube.com/@parthcraft12'} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn btn-primary btn-lg"
            >
              ▶️ Visit Channel
            </a>
          </div>
        </section>

        {loading && (
          <div className="loader-page"><div className="spinner" /></div>
        )}
      </div>
    </main>
  );
}
