import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { mediaUrl } from '../utils/mediaUrl';
import { resolveProductImageSrc } from '../utils/productImage';

const STEPS = ['Details', 'Payment', 'Confirm'];

export default function OrderFlow() {
  const { productId } = useParams();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [product, setProduct] = useState(null);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form fields
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('');
  const [deliveryPincode, setDeliveryPincode] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [variant, setVariant] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Order result
  const [order, setOrder] = useState(null);
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [prodRes, settRes] = await Promise.all([
          api.get(`/products/${productId}`),
          api.get('/settings'),
        ]);
        setProduct(prodRes.data);
        setSettings(settRes.data);
      } catch (err) {
        setError('Product not found');
      }
      setLoading(false);
    };
    load();
  }, [productId]);

  const calcTotal = () => {
    if (!product) return { subtotal: 0, shipping: 0, total: 0 };
    const subtotal = product.price * quantity;
    const shipping = (settings.freeShippingAbove > 0 && subtotal >= settings.freeShippingAbove) ? 0 : (settings.shippingCharge || 0);
    return { subtotal, shipping, total: subtotal + shipping };
  };

  const handlePlaceOrder = async () => {
    setError('');
    if (!customerName.trim() || !customerPhone.trim()) {
      return setError('Name and phone number are required');
    }
    setSubmitting(true);
    try {
      const { data } = await api.post('/orders', {
        items: [{ productId: product._id, quantity, variant }],
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim(),
        deliveryAddress: deliveryAddress.trim(),
        deliveryCity: deliveryCity.trim(),
        deliveryPincode: deliveryPincode.trim(),
        orderNotes: orderNotes.trim(),
        variant,
      });
      setOrder(data.order);
      setWhatsappUrl(data.whatsappUrl);
      setStep(1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create order');
    }
    setSubmitting(false);
  };

  const handleUploadScreenshot = async () => {
    if (!screenshotFile) return setError('Please select a screenshot');
    setUploadingScreenshot(true);
    setError('');
    try {
      const form = new FormData();
      form.append('screenshot', screenshotFile);
      const { data } = await api.post(`/orders/${order._id}/screenshot`, form);
      setOrder(data.order);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload screenshot');
    }
    setUploadingScreenshot(false);
  };

  if (loading) return <main className="page-content"><div className="loader-page"><div className="spinner" /></div></main>;
  if (!product) return <main className="page-content"><div className="container"><div className="empty-state"><h3>Product not found</h3></div></div></main>;

  if (isAdmin) {
    return (
      <main className="page-content">
        <div className="container" style={{ maxWidth: 600 }}>
          <div className="card" style={{ padding: 32, textAlign: 'center' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: 12 }}>👑</div>
            <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: 8 }}>Owner View: ParthCraft12</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: '1.05rem', lineHeight: 1.5 }}>
              You are logged in as Parth (Store Owner). You do not need to purchase your own crafts! You can manage listings, update photos, or change prices directly in Admin Studio.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/admin?tab=products" className="btn btn-primary btn-lg">
                ⚙️ Manage Products in Admin Studio
              </Link>
              <Link to={`/products/${productId}`} className="btn btn-secondary btn-lg">
                👁️ View Product Page
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const { subtotal, shipping, total } = calcTotal();

  return (
    <main className="page-content">
      <div className="container" style={{ maxWidth: 640 }}>
        {/* Progress Steps */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 32 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: i <= step ? 'var(--clay)' : 'var(--border)', color: i <= step ? 'white' : 'var(--text-muted)',
                fontWeight: 700, fontSize: '0.8rem'
              }}>{i + 1}</span>
              <span style={{ fontWeight: i === step ? 700 : 400, color: i <= step ? 'var(--ink)' : 'var(--text-muted)', fontSize: '0.9rem' }}>{s}</span>
            </div>
          ))}
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Step 0: Order Details */}
        {step === 0 && (
          <>
            {/* Product Summary */}
            <div className="card" style={{ display: 'flex', gap: 16, padding: 16, marginBottom: 24 }}>
              {product.imageUrl && (
                <img
                  src={resolveProductImageSrc(product.imageUrl)}
                  alt={product.title}
                  style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 'var(--radius-md)' }}
                />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>{product.title}</div>
                <div style={{ color: 'var(--clay)', fontWeight: 700, fontSize: '1.1rem' }}>₹{product.price.toLocaleString('en-IN')}</div>
                {product.madeToOrder && <span className="badge badge-marigold" style={{ marginTop: 4 }}>Made to Order</span>}
              </div>
            </div>

            {/* Variant selection */}
            {product.variants?.length > 0 && (
              <div className="form-group">
                <label className="form-label">Variant</label>
                <select className="form-select" value={variant} onChange={e => setVariant(e.target.value)}>
                  <option value="">Select variant</option>
                  {product.variants.map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Quantity</label>
              <input type="number" className="form-input" value={quantity} onChange={e => setQuantity(Math.max(1, Math.min(10, Number(e.target.value))))} min={1} max={10} style={{ maxWidth: 100 }} />
            </div>

            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-input" value={customerName} onChange={e => setCustomerName(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <input className="form-input" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="+91..." />
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Delivery Address</label>
              <textarea className="form-textarea" value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} rows={2} placeholder="Full address..." />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">City</label>
                <input className="form-input" value={deliveryCity} onChange={e => setDeliveryCity(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Pincode</label>
                <input className="form-input" value={deliveryPincode} onChange={e => setDeliveryPincode(e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Order Notes</label>
              <textarea className="form-textarea" value={orderNotes} onChange={e => setOrderNotes(e.target.value)} rows={2} placeholder="Any customization or special instructions..." maxLength={500} />
            </div>

            {/* Order Summary */}
            <div className="card" style={{ padding: 20, marginBottom: 24 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 12 }}>Order Summary</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>Shipping</span>
                <span>{shipping === 0 ? 'Free' : `₹${shipping.toLocaleString('en-IN')}`}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem', borderTop: '1px solid var(--border-light)', paddingTop: 12 }}>
                <span>Total</span><span style={{ color: 'var(--clay)' }}>₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button className="btn btn-primary btn-lg" onClick={handlePlaceOrder} disabled={submitting} style={{ width: '100%' }}>
              {submitting ? 'Placing Order...' : `Proceed to Payment — ₹${total.toLocaleString('en-IN')}`}
            </button>

            {(() => {
              const raw = settings?.whatsappNumber || '8877396175';
              let clean = raw.replace(/[^0-9]/g, '');
              if (clean.length === 10) clean = '91' + clean;
              const msg = `Hi Parth! I would like to order "${product.title}" (Qty: ${quantity}, Total: ₹${total.toLocaleString('en-IN')}) from ParthCraft12. Can you assist me?`;
              const directWaUrl = `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
              return (
                <div style={{ marginTop: 12 }}>
                  <a
                    href={directWaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-whatsapp btn-lg"
                    style={{
                      width: '100%',
                      background: '#25D366',
                      color: '#ffffff',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      textDecoration: 'none',
                      fontWeight: 600,
                    }}
                  >
                    💬 Or Buy / Inquire via WhatsApp
                  </a>
                </div>
              );
            })()}
          </>
        )}

        {/* Step 1: Payment */}
        {step === 1 && order && (
          <div style={{ textAlign: 'center' }}>
            <div className="alert alert-success">✅ Order #{order.orderRef} created!</div>
            <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: 8 }}>Pay ₹{order.totalAmount.toLocaleString('en-IN')}</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>{settings.paymentInstructions}</p>

            {settings.upiQrImageUrl ? (
              <div style={{ marginBottom: 24 }}>
                <img
                  src={mediaUrl(settings.upiQrImageUrl)}
                  alt="UPI QR Code"
                  style={{
                    maxWidth: 260,
                    margin: '0 auto',
                    borderRadius: 'var(--radius-lg)',
                    border: '2px solid var(--border)',
                    display: 'block',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
                  }}
                />
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 8 }}>
                  📱 Scan using Google Pay, PhonePe, Paytm, or any UPI app
                </p>
              </div>
            ) : (
              <div className="card" style={{ padding: 20, marginBottom: 24, background: 'var(--paper-dark)' }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>💳</div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Pay via UPI or WhatsApp</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  Send payment to <strong>+91 {settings.whatsappNumber || '8877396175'}</strong> or message Parth on WhatsApp for instant confirmation.
                </div>
              </div>
            )}

            <div style={{ marginBottom: 24, textAlign: 'left' }}>
              <label className="form-label">Upload Payment Screenshot</label>
              <input type="file" accept="image/*" className="form-input" onChange={e => setScreenshotFile(e.target.files?.[0])} />
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
              <button className="btn btn-primary btn-lg" onClick={handleUploadScreenshot} disabled={uploadingScreenshot || !screenshotFile}>
                {uploadingScreenshot ? 'Uploading...' : '📸 Upload Screenshot'}
              </button>
              {whatsappUrl && (
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp btn-lg">
                  💬 Chat on WhatsApp
                </a>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Confirmation */}
        {step === 2 && order && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: 8 }}>Order Submitted!</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 8 }}>
              Order <strong>#{order.orderRef}</strong> is awaiting payment verification.
            </p>
            <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>
              We'll confirm your payment and start preparing your order shortly.
            </p>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={() => navigate('/my-orders')}>📦 View My Orders</button>
              <button className="btn btn-secondary" onClick={() => navigate('/shop')}>🛍️ Continue Shopping</button>
              {whatsappUrl && (
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
                  💬 WhatsApp
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
