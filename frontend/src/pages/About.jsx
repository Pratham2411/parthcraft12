import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function About() {
  const [settings, setSettings] = useState({});

  useEffect(() => {
    api.get('/settings').then(({ data }) => setSettings(data)).catch(() => {});
  }, []);

  return (
    <main className="page-content">
      <div className="container" style={{ maxWidth: 800 }}>
        <section className="hero">
          <h1 className="hero-title">
            About <span className="clay">{settings.creatorName || 'ParthCraft12'}</span>
          </h1>
          <p className="hero-subtitle">
            {settings.creatorBio || 'A passionate art & craft creator sharing handmade creations with the world. Every piece is made with love, patience, and creativity.'}
          </p>
        </section>

        <div style={{ 
          background: 'var(--bg-elevated)', 
          borderRadius: 'var(--radius-xl)', 
          border: '1px solid var(--border-light)',
          padding: 40,
          marginBottom: 32 
        }}>
          <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: 16 }}>🎨 The Story</h2>
          <p style={{ color: 'var(--text-light)', lineHeight: 1.8, marginBottom: 16 }}>
            Welcome to ParthCraft12! This platform is a home for handmade art and craft — a place where creativity meets 
            community. Whether you're here to discover unique handmade products, share your own artwork, or find 
            inspiration for your next project, you're in the right place.
          </p>
          <p style={{ color: 'var(--text-light)', lineHeight: 1.8, marginBottom: 16 }}>
            Every product in the shop is handcrafted with care. From paintings and origami to handmade cards and 
            home decor, each piece tells a story. The community section is open for all craft enthusiasts to showcase 
            their creations and connect with like-minded people.
          </p>
          <p style={{ color: 'var(--text-light)', lineHeight: 1.8 }}>
            Follow the journey on YouTube for tutorials, time-lapses, and behind-the-scenes content. Let's create 
            something beautiful together! ✨
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 32 }}>
          {settings.youtubeChannelUrl && (
            <a href={settings.youtubeChannelUrl} target="_blank" rel="noopener noreferrer" className="card" style={{ padding: 24, textAlign: 'center', textDecoration: 'none' }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>▶️</div>
              <div style={{ fontWeight: 600, color: 'var(--ink)' }}>YouTube</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{settings.youtubeChannelName || 'ParthCraft12'}</div>
            </a>
          )}

          {settings.instagramUrl && (
            <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="card" style={{ padding: 24, textAlign: 'center', textDecoration: 'none' }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>📷</div>
              <div style={{ fontWeight: 600, color: 'var(--ink)' }}>Instagram</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Follow us</div>
            </a>
          )}

          <div className="card" style={{ padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>🛍️</div>
            <div style={{ fontWeight: 600 }}>Handmade Shop</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Unique crafts to own</div>
          </div>
        </div>

        {/* Policies */}
        {(settings.returnPolicy || settings.shippingInfo) && (
          <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-light)', padding: 40 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: 16 }}>📋 Policies</h2>

            {settings.shippingInfo && (
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: '1rem', marginBottom: 6 }}>Shipping</h3>
                <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>{settings.shippingInfo}</p>
              </div>
            )}

            {settings.returnPolicy && (
              <div>
                <h3 style={{ fontSize: '1rem', marginBottom: 6 }}>Returns</h3>
                <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>{settings.returnPolicy}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
