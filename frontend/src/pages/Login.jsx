import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { getApiErrorMessage } from '../utils/apiError';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Mode: 'phone' (default for users) | 'admin' (email+password for site admins)
  const [mode, setMode] = useState('phone');

  // Phone login form state
  const [phoneForm, setPhoneForm] = useState({ phone: '', name: '' });

  // Admin login form state
  const [adminForm, setAdminForm] = useState({ email: '', password: '' });

  const [error, setError] = useState('');
  const [nameMismatch, setNameMismatch] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePhoneChange = (e) => {
    const { name, value } = e.target;
    setNameMismatch(false);
    if (name === 'phone') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
      setPhoneForm((prev) => ({ ...prev, phone: digitsOnly }));
    } else {
      setPhoneForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAdminChange = (e) => {
    setAdminForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNameMismatch(false);

    const cleanPhone = phoneForm.phone.trim();
    const cleanName = phoneForm.name.trim();

    if (!cleanPhone || cleanPhone.length !== 10) {
      setError('Please enter your 10-digit mobile number.');
      return;
    }

    if (!cleanName) {
      setError('Please enter your full name as registered.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/phone-login', {
        phone: cleanPhone,
        name: cleanName,
      });

      login(data.token, data.user);
      if (data.user?.isAdmin || data.user?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      if (err.response?.data?.nameMismatch) {
        setNameMismatch(true);
      }
      setError(getApiErrorMessage(err, 'Login failed. Please check your credentials.'));
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/login', {
        email: adminForm.email.trim().toLowerCase(),
        password: adminForm.password,
      });

      login(data.token, data.user);
      if (data.user?.isAdmin || data.user?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Admin login failed. Check email and password.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card-header">
          <div className="auth-logo">
            <img
              src="/icon-192.png"
              alt="ParthCraft12 Logo"
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }}
            />
          </div>
          <h1>{mode === 'phone' ? 'Welcome back' : 'Admin Portal'}</h1>
          <p>
            {mode === 'phone'
              ? 'Log in with your phone number and full name'
              : 'Sign in with administrator credentials'}
          </p>
        </div>

        {mode === 'phone' ? (
          /* ─── Phone + Name Login (Default) ─────────────────────────── */
          <form id="login-form" onSubmit={handlePhoneSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="login-phone">
                Phone Number
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    padding: '10px 12px',
                    background: 'var(--surface-sunken, rgba(255,255,255,0.06))',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    fontSize: '0.95rem',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                  }}
                >
                  🇮🇳 +91
                </span>
                <input
                  id="login-phone"
                  className="form-input"
                  type="tel"
                  inputMode="numeric"
                  name="phone"
                  placeholder="10-digit mobile number"
                  value={phoneForm.phone}
                  onChange={handlePhoneChange}
                  maxLength={10}
                  required
                  autoFocus
                  style={{ flex: 1 }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="login-name">
                Full Name
              </label>
              <input
                id="login-name"
                className="form-input"
                type="text"
                name="name"
                placeholder="Enter your registered name"
                value={phoneForm.name}
                onChange={handlePhoneChange}
                required
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                <Link
                  to={`/forgot-password${phoneForm.phone ? `?phone=${phoneForm.phone}` : ''}`}
                  style={{ fontSize: '0.85rem', color: 'var(--accent)' }}
                >
                  Forgot your name?
                </Link>
              </div>
            </div>

            {error && <p className="form-error">{error}</p>}

            {nameMismatch && (
              <div
                style={{
                  background: 'rgba(255, 179, 0, 0.1)',
                  border: '1px solid #ffb300',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  marginBottom: '16px',
                  fontSize: '0.88rem',
                }}
              >
                <p style={{ margin: 0, color: 'var(--text)' }}>
                  💡 Forgot what name you used? You can update your name with your phone number:{' '}
                  <Link
                    to={`/forgot-password?phone=${phoneForm.phone}`}
                    style={{ color: '#ffb300', fontWeight: 'bold', textDecoration: 'underline' }}
                  >
                    Change / Recover Name →
                  </Link>
                </p>
              </div>
            )}

            <button
              id="login-submit"
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" /> Logging in…
                </>
              ) : (
                'Log in'
              )}
            </button>

            {loading && (
              <p style={{ fontSize: '0.78rem', color: '#888', marginTop: '10px', textAlign: 'center' }}>
                ⏳ Connecting to server (free tier servers may take ~30–45s to wake up on first request)...
              </p>
            )}

            <div style={{ textAlign: 'center', marginTop: '18px' }}>
              <button
                type="button"
                onClick={() => {
                  setMode('admin');
                  setError('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                🔐 Administrator Login (Email & Password)
              </button>
            </div>
          </form>
        ) : (
          /* ─── Admin Login (Email + Password) ───────────────────────── */
          <form id="admin-login-form" onSubmit={handleAdminSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="admin-email">
                Admin Email
              </label>
              <input
                id="admin-email"
                className="form-input"
                type="email"
                name="email"
                placeholder="prathamraj2411@gmail.com"
                value={adminForm.email}
                onChange={handleAdminChange}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="admin-password">
                Admin Password
              </label>
              <input
                id="admin-password"
                className="form-input"
                type="password"
                name="password"
                placeholder="••••••••"
                value={adminForm.password}
                onChange={handleAdminChange}
                required
              />
            </div>

            {error && <p className="form-error">{error}</p>}

            <button
              id="admin-login-submit"
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" /> Logging in as Admin…
                </>
              ) : (
                'Log in to Admin Dashboard'
              )}
            </button>

            <div style={{ textAlign: 'center', marginTop: '18px' }}>
              <button
                type="button"
                onClick={() => {
                  setMode('phone');
                  setError('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent)',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                ← Back to Phone Login
              </button>
            </div>
          </form>
        )}

        <div className="auth-footer">
          Don&apos;t have an account? <Link to="/register">Sign up free</Link>
        </div>
      </div>
    </div>
  );
}

/* ==============================================================================
   LEGACY / PRESERVED SERVICE: Direct Email + Password Login
   Preserved as requested: "dont remove the current services just comment them"

// Legacy email login handler:
// const handleEmailLogin = async (email, password) => {
//   const { data } = await api.post('/auth/login', {
//     email: email.trim().toLowerCase(),
//     password: password,
//   });
//   login(data.token, data.user);
// };
============================================================================== */
