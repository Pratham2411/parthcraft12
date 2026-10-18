import { useState, useEffect } from 'react';
import api from '../api/axios';

const STATUS_LABELS = {
  awaiting_payment: '⏳ Awaiting Payment',
  awaiting_verification: '🔍 Verifying',
  payment_confirmed: '✅ Confirmed',
  processing: '📦 Processing',
  shipped: '🚚 Shipped',
  completed: '✅ Done',
  cancelled: '❌ Cancelled',
};

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState({});
  const [pendingPosts, setPendingPosts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes] = await Promise.all([api.get('/admin/stats')]);
        setStats(statsRes.data);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (tab === 'moderation') {
      api.get('/admin/community/pending').then(({ data }) => setPendingPosts(data)).catch(() => {});
    } else if (tab === 'orders') {
      api.get('/admin/orders').then(({ data }) => setOrders(data)).catch(() => {});
    } else if (tab === 'reports') {
      api.get('/admin/reports').then(({ data }) => setReports(data)).catch(() => {});
    }
  }, [tab]);

  const moderatePost = async (postId, action) => {
    try {
      await api.patch(`/admin/community/${postId}/moderate`, { action });
      setPendingPosts(prev => prev.filter(p => p._id !== postId));
      setStats(s => ({ ...s, pendingPosts: Math.max(0, (s.pendingPosts || 0) - 1) }));
    } catch (err) { console.error(err); }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const { data } = await api.patch(`/admin/orders/${orderId}/status`, { status });
      setOrders(prev => prev.map(o => o._id === orderId ? data : o));
    } catch (err) { console.error(err); }
  };

  if (loading) return <main className="page-content"><div className="loader-page"><div className="spinner" /></div></main>;

  return (
    <main className="page-content">
      <div className="container">
        <h1 style={{ fontFamily: 'var(--font-display)', marginBottom: 24 }}>⚙️ Admin Dashboard</h1>

        {/* Stats */}
        <div className="admin-stats-grid">
          <div className="stat-card"><div className="stat-number">{stats.users || 0}</div><div className="stat-label">Users</div></div>
          <div className="stat-card"><div className="stat-number">{stats.products || 0}</div><div className="stat-label">Products</div></div>
          <div className="stat-card"><div className="stat-number">{stats.totalOrders || 0}</div><div className="stat-label">Orders</div></div>
          <div className="stat-card"><div className="stat-number" style={{ color: 'var(--warning)' }}>{stats.pendingPosts || 0}</div><div className="stat-label">Pending Posts</div></div>
          <div className="stat-card"><div className="stat-number" style={{ color: 'var(--danger)' }}>{stats.awaitingVerification || 0}</div><div className="stat-label">Payments to Verify</div></div>
          <div className="stat-card"><div className="stat-number">{stats.pendingReports || 0}</div><div className="stat-label">Reports</div></div>
        </div>

        {/* Tabs */}
        <div className="admin-tabs">
          {['overview', 'moderation', 'orders', 'reports'].map(t => (
            <button key={t} className={`admin-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === 'overview' && (
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 12 }}>Quick Actions</h3>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button className="btn btn-primary btn-sm" onClick={() => setTab('moderation')}>
                Review Posts ({stats.pendingPosts || 0})
              </button>
              <button className="btn btn-accent btn-sm" onClick={() => setTab('orders')}>
                Manage Orders ({stats.awaitingVerification || 0} pending)
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => setTab('reports')}>
                Reports ({stats.pendingReports || 0})
              </button>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 16 }}>
              Use Admin → Settings to configure QR code, WhatsApp number, shipping rates, and product categories.
            </p>
          </div>
        )}

        {/* Moderation */}
        {tab === 'moderation' && (
          pendingPosts.length === 0 ? (
            <div className="empty-state"><h3>🎉 All caught up!</h3><p>No pending posts to review.</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {pendingPosts.map(post => (
                <div key={post._id} className="card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                    {(post.imageUrls?.[0] || post.youtubeThumbnail) && (
                      <img src={post.imageUrls?.[0] || post.youtubeThumbnail} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{post.title}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        by {post.author?.name} · {post.type} · {post.category}
                      </div>
                      {post.caption && <p style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginTop: 4 }}>{post.caption.slice(0, 200)}</p>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary btn-sm" onClick={() => moderatePost(post._id, 'approve')}>✅ Approve</button>
                    <button className="btn btn-danger btn-sm" onClick={() => moderatePost(post._id, 'reject')}>❌ Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Orders */}
        {tab === 'orders' && (
          orders.length === 0 ? (
            <div className="empty-state"><h3>No orders yet</h3></div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Screenshot</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order._id}>
                      <td>
                        <strong>#{order.orderRef}</strong><br />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {new Date(order.createdAt).toLocaleDateString('en-IN')}
                        </span>
                      </td>
                      <td>{order.customer?.name || order.customerName}</td>
                      <td style={{ fontWeight: 600 }}>₹{order.totalAmount?.toLocaleString('en-IN')}</td>
                      <td><span className="badge badge-marigold">{STATUS_LABELS[order.status] || order.status}</span></td>
                      <td>
                        {order.paymentScreenshotUrl ? (
                          <a href={order.paymentScreenshotUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">📸 View</a>
                        ) : '—'}
                      </td>
                      <td>
                        <select
                          className="form-select"
                          value={order.status}
                          onChange={e => updateOrderStatus(order._id, e.target.value)}
                          style={{ fontSize: '0.8rem', padding: '4px 8px', minWidth: 140 }}
                        >
                          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* Reports */}
        {tab === 'reports' && (
          reports.length === 0 ? (
            <div className="empty-state"><h3>No pending reports</h3></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {reports.map(report => (
                <div key={report._id} className="card" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span className="badge badge-clay">{report.reason}</span>
                      <span style={{ marginLeft: 8, fontSize: '0.85rem' }}>by {report.reporter?.name}</span>
                      <span style={{ marginLeft: 8, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{report.targetType}</span>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={async () => {
                      await api.patch(`/admin/reports/${report._id}`, { status: 'dismissed' });
                      setReports(prev => prev.filter(r => r._id !== report._id));
                    }}>Dismiss</button>
                  </div>
                  {report.details && <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: 6 }}>{report.details}</p>}
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </main>
  );
}
