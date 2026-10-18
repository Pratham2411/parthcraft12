import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-inner">
          <div className="footer-brand">
            <h3>🎨 ParthCraft12</h3>
            <p>Handmade art & craft creations. Inspired by creativity, made with love. Discover unique paintings, origami, drawings, and more.</p>
            <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
              <a href="https://www.youtube.com/@parthcraft12" target="_blank" rel="noopener noreferrer" title="YouTube" style={{ fontSize: '1.4rem' }}>▶️</a>
            </div>
          </div>

          <div className="footer-links">
            <h4>Explore</h4>
            <Link to="/shop">Shop</Link>
            <Link to="/community">Community</Link>
            <Link to="/about">About</Link>
          </div>

          <div className="footer-links">
            <h4>Account</h4>
            <Link to="/login">Login</Link>
            <Link to="/register">Join Free</Link>
            <Link to="/my-orders">My Orders</Link>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} ParthCraft12. All rights reserved. Handmade with ❤️</p>
        </div>
      </div>
    </footer>
  );
}
