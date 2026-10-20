import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Footer() {
  const { user, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-inner">
          <div className="footer-brand">
            <h3>🎨 ParthCraft12</h3>
            <p>Handmade art & craft creations. Inspired by creativity, made with love. Discover unique paintings, origami, drawings, and more.</p>
            <div style={{ marginTop: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <a href="https://www.youtube.com/@parthcraft12" target="_blank" rel="noopener noreferrer" title="YouTube" style={{ fontSize: '1.4rem' }}>▶️</a>
              <button
                type="button"
                className="footer-theme-toggle"
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              >
                {theme === 'dark' ? '☀️ Switch to Light' : '🌙 Switch to Dark'}
              </button>
            </div>
          </div>

          <div className="footer-links">
            <h4>Explore</h4>
            <Link to="/shop">🛍️ Shop</Link>
            <Link to="/community">🎨 Community</Link>
            <Link to="/about">✨ About Creator</Link>
          </div>

          <div className="footer-links">
            <h4>Account</h4>
            {user ? (
              <>
                <Link to="/profile">👤 My Profile</Link>
                <Link to="/my-orders">📦 My Orders</Link>
                <Link to="/bookmarks">🔖 Saved Crafts</Link>
                <Link to="/community/new">➕ Share Creation</Link>
                {isAdmin && <Link to="/admin">⚙️ Admin Studio</Link>}
                <button type="button" onClick={handleLogout} title="Log out of your account">
                  🚪 Log Out
                </button>
              </>
            ) : (
              <>
                <Link to="/login">🔑 Log In</Link>
                <Link to="/register">✨ Join Free</Link>
                <Link to="/shop">🛍️ Browse Shop</Link>
              </>
            )}
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} ParthCraft12. All rights reserved. Handmade with ❤️</p>
        </div>
      </div>
    </footer>
  );
}
