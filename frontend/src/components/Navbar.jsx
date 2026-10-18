import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { mediaUrl } from '../utils/mediaUrl';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
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

        <Link to="/" className="mobile-nav-link" onClick={closeMobile}>🏠 Home</Link>
        <Link to="/shop" className="mobile-nav-link" onClick={closeMobile}>🛍️ Shop</Link>
        <Link to="/community" className="mobile-nav-link" onClick={closeMobile}>🎨 Community</Link>
        <Link to="/about" className="mobile-nav-link" onClick={closeMobile}>✨ About</Link>

        {user ? (
          <>
            <Link to="/profile" className="mobile-nav-link" onClick={closeMobile}>👤 Profile</Link>
            <Link to="/my-orders" className="mobile-nav-link" onClick={closeMobile}>📦 My Orders</Link>
            <Link to="/bookmarks" className="mobile-nav-link" onClick={closeMobile}>🔖 Bookmarks</Link>
            <Link to="/community/new" className="mobile-nav-link" onClick={closeMobile}>➕ Share Creation</Link>
            {isAdmin && (
              <Link to="/admin" className="mobile-nav-link" onClick={closeMobile}>⚙️ Admin</Link>
            )}
            <button type="button" className="mobile-nav-link" onClick={handleLogout}>🚪 Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="mobile-nav-link" onClick={closeMobile}>🔑 Login</Link>
            <Link to="/register" className="mobile-nav-link" onClick={closeMobile}>✨ Join Free</Link>
          </>
        )}
      </div>
    </>
  );
}
