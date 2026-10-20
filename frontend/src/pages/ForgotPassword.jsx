import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { getApiErrorMessage } from '../utils/apiError';

export default function ForgotPassword() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Steps: 'phone' (enter phone to lookup) | 'changeName' (enter new name) | 'done'
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [currentName, setCurrentName] = useState('');
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Pre-fill phone if provided in URL query string (e.g. /forgot-password?phone=9876543210)
  useEffect(() => {
    const qPhone = searchParams.get('phone');
    if (qPhone) {
      setPhone(qPhone.replace(/\D/g, '').slice(0, 10));
    }
  }, [searchParams]);

  const handlePhoneLookup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const cleanPhone = phone.replace(/\D/g, '').slice(0, 10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/lookup-phone', { phone: cleanPhone });
      setCurrentName(data.currentName || '');
      setNewName(data.currentName || '');
      setSuccess(`Account found! You can keep or update your name below.`);
      setStep('changeName');
    } catch (err) {
      setError(getApiErrorMessage(err, 'No account found with this phone number. Please check the number or sign up.'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateName = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const trimmedName = newName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setError('Name must be at least 2 characters.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/change-name', {
        phone: phone.replace(/\D/g, '').slice(0, 10),
        newName: trimmedName,
      });

      if (data.token && data.user) {
        login(data.token, data.user);
        setSuccess('Name updated successfully! Redirecting...');
        setTimeout(() => {
          if (data.user?.isAdmin || data.user?.role === 'admin') {
            navigate('/admin');
          } else {
            navigate('/');
          }
        }, 800);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to update name. Please try again.'));
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
          <h1>{step === 'phone' ? 'Recover Account' : 'Update Your Name'}</h1>
          <p>
            {step === 'phone'
              ? 'Forgot your name? Enter your phone number to find your account and update your name.'
              : 'Enter your correct or new name to log in.'}
          </p>
        </div>

        {error && <p className="form-error">{error}</p>}
        {success && <p className="form-success">{success}</p>}

        {/* ─── Step 1: Phone Lookup ─────────────────────────────────── */}
        {step === 'phone' && (
          <form onSubmit={handlePhoneLookup}>
            <div className="form-group">
              <label className="form-label" htmlFor="lookup-phone">
                Registered Phone Number
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
                  id="lookup-phone"
                  className="form-input"
                  type="tel"
                  inputMode="numeric"
                  placeholder="10-digit mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  maxLength={10}
                  required
                  autoFocus
                  style={{ flex: 1 }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" /> Finding Account…
                </>
              ) : (
                'Find My Account'
              )}
            </button>
          </form>
        )}

        {/* ─── Step 2: Change Name & Log In ─────────────────────────── */}
        {step === 'changeName' && (
          <form onSubmit={handleUpdateName}>
            <div
              style={{
                background: 'var(--surface-sunken, rgba(255,255,255,0.05))',
                borderRadius: '8px',
                padding: '12px 14px',
                marginBottom: '16px',
                fontSize: '0.88rem',
              }}
            >
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                Phone:{' '}
                <strong style={{ color: 'var(--text)' }}>
                  +91 {phone}
                </strong>
              </p>
              {currentName && (
                <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)' }}>
                  Current registered name:{' '}
                  <strong style={{ color: 'var(--accent)' }}>
                    {currentName}
                  </strong>
                </p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="new-name">
                Your Full Name (or New Name)
              </label>
              <input
                id="new-name"
                className="form-input"
                type="text"
                placeholder="Enter your name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                autoFocus
              />
              <span
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                  marginTop: '4px',
                  display: 'block',
                }}
              >
                You can change this anytime or use it to log in next time.
              </span>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" /> Updating…
                </>
              ) : (
                'Update Name & Log In Now'
              )}
            </button>

            <div style={{ textAlign: 'center', marginTop: '14px' }}>
              <button
                type="button"
                onClick={() => {
                  setStep('phone');
                  setError('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                ← Try a different phone number
              </button>
            </div>
          </form>
        )}

        <div className="auth-footer">
          Remembered your name? <Link to="/login">Back to Login</Link>
        </div>
      </div>
    </div>
  );
}

/* ==============================================================================
   LEGACY / PRESERVED SERVICE: Email OTP Password Reset Flow
   Preserved as requested: "dont remove the current services just comment them"

// Legacy email OTP reset steps:
// const STEPS = { EMAIL: 'email', OTP: 'otp', PASSWORD: 'password', DONE: 'done' };
// - Step 1: POST /auth/forgot-password with { email }
// - Step 2: Enter 6-digit code sent to email
// - Step 3: POST /auth/reset-password with { email, otp, newPassword }
============================================================================== */
