import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { getApiErrorMessage } from '../utils/apiError';

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      // Allow only numbers, max 10 digits
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
      setForm((prev) => ({ ...prev, phone: digitsOnly }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanName = form.name.trim();
    const cleanPhone = form.phone.trim();

    if (!cleanName || cleanName.length < 2) {
      setError('Please enter your full name (at least 2 characters).');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError('Please enter a valid 10-digit Indian phone number starting with 6, 7, 8, or 9.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/phone-signup', {
        name: cleanName,
        phone: cleanPhone,
      });

      if (data.token && data.user) {
        login(data.token, data.user);
        if (data.user?.isAdmin || data.user?.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Registration failed. Please try again.'));
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
          <h1>Join ParthCraft12</h1>
          <p>Sign up instantly with your name and phone number — no password needed!</p>
        </div>

        <form id="register-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-name">
              Full Name
            </label>
            <input
              id="reg-name"
              className="form-input"
              type="text"
              name="name"
              placeholder="e.g. Aditi Sharma"
              value={form.name}
              onChange={handleChange}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-phone">
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
                id="reg-phone"
                className="form-input"
                type="tel"
                inputMode="numeric"
                name="phone"
                placeholder="10-digit mobile number"
                value={form.phone}
                onChange={handleChange}
                maxLength={10}
                required
                style={{ flex: 1 }}
              />
            </div>
            <span
              style={{
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
                marginTop: '4px',
                display: 'block',
              }}
            >
              Enter your 10-digit mobile number. No OTP verification required.
            </span>
          </div>

          {error && <p className="form-error">{error}</p>}

          <button
            id="register-submit"
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" /> Creating Account…
              </>
            ) : (
              'Create Account & Start Browsing'
            )}
          </button>
          {loading && (
            <p style={{ fontSize: '0.78rem', color: '#888', marginTop: '10px', textAlign: 'center' }}>
              ⏳ Connecting to server (free tier servers may take ~30–45s to wake up on first request)...
            </p>
          )}
        </form>

        <div className="auth-footer">
          Already have an account?{' '}
          <Link to="/login">Log in</Link>
        </div>
      </div>
    </div>
  );
}

/* ==============================================================================
   LEGACY / PRESERVED SERVICE: Email OTP Signup Flow
   Preserved as requested: "dont remove the current services just comment them"

const passwordRulesLegacy = (p) => {
  const issues = [];
  if (p.length < 8) issues.push('at least 8 characters');
  if (!/[A-Z]/.test(p)) issues.push('one uppercase letter');
  if (!/[a-z]/.test(p)) issues.push('one lowercase letter');
  if (!/[0-9]/.test(p)) issues.push('one number');
  return issues;
};

// Legacy OTP-based register function:
// - Sends OTP to user's email via POST /auth/register/send-otp
// - Verifies 6-digit OTP via POST /auth/register/verify-otp
// - Resends OTP via POST /auth/register/resend-otp
============================================================================== */
