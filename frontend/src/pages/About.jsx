import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

export default function About() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/settings')
      .then(({ data }) => setSettings(data))
      .catch((err) => console.error('Failed to load settings:', err))
      .finally(() => setLoading(false));
  }, []);

  const avatarSrc = settings.creatorAvatarUrl || '/images/owner.png';

  return (
    <main className="page-content">
      <div className="container" style={{ maxWidth: 860 }}>
        {/* Creator Hero Card */}
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-xl)',
          border: '1.5px solid var(--border-light)',
          padding: '36px 32px',
          marginBottom: 32,
          display: 'flex',
          gap: 32,
          alignItems: 'center',
          flexWrap: 'wrap',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{
            width: 190,
            height: 190,
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            border: '3px solid var(--clay)',
            boxShadow: '0 8px 24px rgba(198,91,61,0.25)',
            flexShrink: 0,
            margin: '0 auto',
            background: 'var(--paper-dark)'
          }}>
            <img
              src={avatarSrc}
              alt={settings.creatorName || 'Parth'}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => { e.target.src = '/images/owner.png'; }}
            />
          </div>

          <div style={{ flex: 1, minWidth: 280 }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--marigold-light)',
              color: 'var(--ink)',
              fontSize: '0.8rem',
              fontWeight: 700,
              marginBottom: 10
            }}>
              🎨 Meet the Creator & Artisan
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', margin: '0 0 6px', color: 'var(--ink)' }}>
              {settings.creatorName || 'Parth'}
            </h1>
            <p style={{ color: 'var(--clay)', fontWeight: 600, fontSize: '1rem', margin: '0 0 14px' }}>
              {settings.siteTagline || 'Young Artist, Paper Crafter & YouTuber'}
            </p>
            <p style={{ color: 'var(--text-light)', lineHeight: 1.7, margin: '0 0 20px', fontSize: '0.95rem' }}>
              {settings.creatorBio || 'Welcome to my craft studio! I am Parth, a passionate young creator making origami, paintings, drawings, and unique handmade crafts with love and patience.'}
            </p>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {settings.youtubeChannelUrl && (
                <a
                  href={settings.youtubeChannelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-sm"
                >
                  ▶️ YouTube ({settings.youtubeChannelName || '@parthcraft12'})
                </a>
              )}
              {settings.whatsappNumber && (
                <a
                  href={`https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}?text=Hi%20${encodeURIComponent(settings.creatorName || 'Parth')}!%20I%20love%20your%20crafts%20on%20ParthCraft12`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                >
                  💬 WhatsApp Contact
                </a>
              )}
              <Link to="/shop" className="btn btn-accent btn-sm">
                🛍️ Browse My Crafts
              </Link>
            </div>
          </div>
        </div>

        {/* The Story & Craft Philosophy */}
        <div style={{ 
          background: 'var(--bg-elevated)', 
          borderRadius: 'var(--radius-xl)', 
          border: '1px solid var(--border-light)',
          padding: 36,
          marginBottom: 32 
        }}>
          <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: 16 }}>🎨 The Story Behind ParthCraft12</h2>
          <p style={{ color: 'var(--text-light)', lineHeight: 1.8, marginBottom: 16 }}>
            Welcome to ParthCraft12! This platform is the personal home for handmade art, paper crafts, origami, and creative inspiration.
            Created by Parth, a young craft enthusiast with a passion for transforming simple sheets of paper and colors into stunning works of art.
          </p>
          <p style={{ color: 'var(--text-light)', lineHeight: 1.8, marginBottom: 16 }}>
            Every product in the shop is handcrafted with care. From intricate 3D origami sculptures and vibrant watercolor paintings to greeting cards and home decor, each piece tells a story. The community section is open for all craft lovers to showcase their own creations and inspire one another!
          </p>
          <p style={{ color: 'var(--text-light)', lineHeight: 1.8 }}>
            Check out tutorials and time-lapses on YouTube to learn how these crafts are made step-by-step. Let's make something beautiful together! ✨
          </p>
        </div>

        {/* Quick Links Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 32 }}>
          {settings.youtubeChannelUrl && (
            <a href={settings.youtubeChannelUrl} target="_blank" rel="noopener noreferrer" className="card" style={{ padding: 24, textAlign: 'center', textDecoration: 'none' }}>
              <div style={{ fontSize: '2.2rem', marginBottom: 8 }}>▶️</div>
              <div style={{ fontWeight: 700, color: 'var(--ink)' }}>YouTube Channel</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{settings.youtubeChannelName || '@parthcraft12'}</div>
            </a>
          )}

          {settings.instagramUrl ? (
            <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="card" style={{ padding: 24, textAlign: 'center', textDecoration: 'none' }}>
              <div style={{ fontSize: '2.2rem', marginBottom: 8 }}>📷</div>
              <div style={{ fontWeight: 700, color: 'var(--ink)' }}>Instagram</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Follow for daily crafts</div>
            </a>
          ) : (
            <div className="card" style={{ padding: 24, textAlign: 'center' }}>
              <div style={{ fontSize: '2.2rem', marginBottom: 8 }}>✨</div>
              <div style={{ fontWeight: 700 }}>Handmade with Care</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>100% original designs</div>
            </div>
          )}

          <Link to="/shop" className="card" style={{ padding: 24, textAlign: 'center', textDecoration: 'none' }}>
            <div style={{ fontSize: '2.2rem', marginBottom: 8 }}>🛍️</div>
            <div style={{ fontWeight: 700, color: 'var(--ink)' }}>Handmade Shop</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Own unique physical crafts</div>
          </Link>
        </div>

        {/* Policies */}
        {(settings.returnPolicy || settings.shippingInfo) && (
          <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-light)', padding: 36 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: 16 }}>📋 Order & Craft Policies</h2>

            {settings.shippingInfo && (
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: '1rem', marginBottom: 6 }}>🚚 Shipping & Delivery</h3>
                <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', lineHeight: 1.6 }}>{settings.shippingInfo}</p>
              </div>
            )}

            {settings.returnPolicy && (
              <div>
                <h3 style={{ fontSize: '1rem', marginBottom: 6 }}>🔄 Returns & Exchanges</h3>
                <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', lineHeight: 1.6 }}>{settings.returnPolicy}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
