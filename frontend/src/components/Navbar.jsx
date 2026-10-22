import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { mediaUrl } from '../utils/mediaUrl';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleLogout = useCallback(() => {
    logout();
    setMobileOpen(false);
    navigate('/');
  }, [logout, navigate]);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const isActive = (path) => location.pathname === path ? ' active' : '';

  return (
    <>
      <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
        <div className="container navbar-inner">
          <Link to="/" className="navbar-logo">
            🎨 ParthCraft12
          </Link>

          <div className="navbar-links">
            <Link to="/" className={`nav-link${isActive('/')}`}>Home</Link>
            <Link to="/shop" className={`nav-link${isActive('/shop')}`}>Shop</Link>
            <Link to="/community" className={`nav-link${isActive('/community')}`}>Community</Link>
            <Link to="/about" className={`nav-link${isActive('/about')}`}>About</Link>

            {user ? (
              <>
                <Link to="/profile" className="nav-user-info" title="Profile">
                  <span className="nav-user-avatar" aria-hidden="true">
                    {user?.avatarUrl ? (
                      <img src={mediaUrl(user.avatarUrl)} alt="" />
                    ) : (
                      <span>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                    )}
                  </span>
                  <span className="nav-user-name">{user?.displayName || user?.name?.split(' ')[0]}</span>
                  {isAdmin && <span className="admin-badge">Admin</span>}
                </Link>

                <Link to="/my-orders" className={`nav-link${isActive('/my-orders')}`}>Orders</Link>
                {isAdmin && <Link to="/admin" className={`nav-link${isActive('/admin')}`}>Admin</Link>}

                {isAdmin ? (
                  <>
                    <Link to="/admin?tab=products&new=1" className="btn btn-primary btn-sm" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
                      ➕ List Craft
                    </Link>
                    <Link to="/community/new" className="btn btn-secondary btn-sm" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                      📸 Post
                    </Link>
                  </>
                ) : (
                  <Link to="/community/new" className="btn btn-primary btn-sm" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                    ➕ Share Craft
                  </Link>
                )}

                <button type="button" onClick={handleLogout} className="btn btn-ghost btn-sm">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link">Login</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Join Free</Link>
              </>
            )}

            <button
              type="button"
              className="nav-theme-btn"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              ☰
            </button>
          </div>
        </div>
      </nav>

      <div
        className={`mobile-drawer-overlay${mobileOpen ? ' open' : ''}`}
        onClick={closeMobile}
        aria-hidden="true"
      />

      <div className={`mobile-drawer${mobileOpen ? ' open' : ''}`}>
        <div className="mobile-drawer-header">
          <Link to="/" className="navbar-logo" onClick={closeMobile}>
            🎨 ParthCraft12
          </Link>
          <button type="button" className="mobile-drawer-close" onClick={closeMobile} aria-label="Close menu">
            ✕
          </button>
        </div>

        {user && (
          <div className="mobile-drawer-user-card">
            <div className="mobile-drawer-avatar">
              {user.avatarUrl ? (
                <img src={mediaUrl(user.avatarUrl)} alt="" />
              ) : (
                <span>{user.name?.charAt(0)?.toUpperCase() || 'U'}</span>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="mobile-drawer-user-name">{user.displayName || user.name}</div>
              <div className="mobile-drawer-user-sub">
                {isAdmin ? <span className="admin-badge">👑 Admin</span> : (user.phone ? `📱 +91 ${user.phone}` : '✨ Artisan Member')}
              </div>
            </div>
          </div>
        )}

        <div className="mobile-drawer-links">
          <Link to="/" className={`mobile-nav-link${isActive('/')}`} onClick={closeMobile}>🏠 Home</Link>
          <Link to="/shop" className={`mobile-nav-link${isActive('/shop')}`} onClick={closeMobile}>🛍️ Shop</Link>
          <Link to="/community" className={`mobile-nav-link${isActive('/community')}`} onClick={closeMobile}>🎨 Community</Link>
          <Link to="/about" className={`mobile-nav-link${isActive('/about')}`} onClick={closeMobile}>✨ About Creator</Link>

          {user ? (
            <>
              <div className="mobile-drawer-divider" />
              <Link to="/profile" className={`mobile-nav-link${isActive('/profile')}`} onClick={closeMobile}>👤 My Profile</Link>
              <Link to="/my-orders" className={`mobile-nav-link${isActive('/my-orders')}`} onClick={closeMobile}>📦 My Orders</Link>
              <Link to="/bookmarks" className={`mobile-nav-link${isActive('/bookmarks')}`} onClick={closeMobile}>🔖 Saved Crafts</Link>
              
              {isAdmin ? (
                <>
                  <Link to="/admin?tab=products&new=1" className="mobile-nav-link" onClick={closeMobile} style={{ color: 'var(--clay)', fontWeight: 700 }}>
                    ✨ List Craft to Shop
                  </Link>
                  <Link to="/community/new" className="mobile-nav-link" onClick={closeMobile}>
                    📸 Share Craft to Community
                  </Link>
                  <Link to="/admin" className={`mobile-nav-link mobile-nav-admin${location.pathname.startsWith('/admin') ? ' active' : ''}`} onClick={closeMobile}>
                    ⚙️ Admin Studio
                  </Link>
                </>
              ) : (
                <Link to="/community/new" className={`mobile-nav-link${isActive('/community/new')}`} onClick={closeMobile}>➕ Share a Craft</Link>
              )}
              <button type="button" className="mobile-nav-link mobile-nav-logout" onClick={handleLogout}>🚪 Logout</button>
            </>
          ) : (
            <>
              <div className="mobile-drawer-divider" />
              <Link to="/login" className={`mobile-nav-link${isActive('/login')}`} onClick={closeMobile}>🔑 Login</Link>
              <Link to="/register" className={`mobile-nav-link${isActive('/register')}`} onClick={closeMobile}>✨ Join Free</Link>
            </>
          )}

          <div className="mobile-drawer-divider" />
          <button type="button" className="mobile-nav-link mobile-theme-toggle" onClick={toggleTheme}>
            {theme === 'dark' ? '☀️ Switch to Light Mode' : '🌙 Switch to Dark Mode'}
          </button>
        </div>
      </div>
    </>
  );
}
