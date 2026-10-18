import { useState, useEffect } from 'react';
import api from '../api/axios';

const STATUS_LABELS = {
  awaiting_payment: '⏳ Awaiting Payment',
  awaiting_verification: '🔍 Awaiting Verification',
  payment_confirmed: '✅ Payment Confirmed',
  processing: '📦 Processing',
  shipped: '🚚 Shipped',
  completed: '✅ Completed',
  cancelled: '❌ Cancelled',
};

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders/my').then(({ data }) => setOrders(data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <main className="page-content"><div className="loader-page"><div className="spinner" /></div></main>;

  return (
    <main className="page-content">
      <div className="container" style={{ maxWidth: 800 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', marginBottom: 24 }}>📦 My Orders</h1>

        {orders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h3>No orders yet</h3>
            <p>Your order history will appear here.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {orders.map(order => (
              <div key={order._id} className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  <div>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>#{order.orderRef}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: 12 }}>
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <span className={`badge ${order.status === 'completed' ? 'badge-sage' : order.status === 'cancelled' ? 'badge-gray' : 'badge-marigold'}`}>
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                </div>

                {order.items?.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
                    {item.imageUrl && <img src={item.imageUrl} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500 }}>{item.title}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Qty: {item.quantity} {item.variant && `· ${item.variant}`}
                      </div>
                    </div>
                    <div style={{ fontWeight: 600 }}>₹{(item.price * item.quantity).toLocaleString('en-IN')}</div>
                  </div>
                ))}

                <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 12, marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Total</span>
                  <span style={{ fontWeight: 700, color: 'var(--clay)', fontSize: '1.1rem' }}>₹{order.totalAmount?.toLocaleString('en-IN')}</span>
                </div>

                {order.trackingId && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 8 }}>
                    📦 Tracking: <strong>{order.courierName}</strong> — {order.trackingId}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
