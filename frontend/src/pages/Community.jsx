import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const CATEGORIES = [
  'All', 'Painting', 'Drawing', 'Origami', 'Craft', 'DIY',
  'Crochet', 'Knitting', 'Pottery', 'Calligraphy',
  'Mixed Media', 'Tutorial', 'Other'
];

export default function Community() {
  const { isAuthenticated } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const params = { page, limit: 20 };
        if (category !== 'All') params.category = category;
        if (type) params.type = type;
        const { data } = await api.get('/community', { params });
        setPosts(data.posts || []);
        setTotalPages(data.totalPages || 1);
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    fetchPosts();
  }, [category, type, page]);

  const toggleLike = async (postId) => {
    if (!isAuthenticated) return;
    try {
      const { data } = await api.post(`/community/${postId}/like`);
      setPosts(prev => prev.map(p => p._id === postId 
        ? { ...p, isLiked: data.liked, likeCount: data.likeCount } 
        : p
      ));
    } catch (err) { console.error(err); }
  };

  const toggleBookmark = async (postId) => {
    if (!isAuthenticated) return;
    try {
      const { data } = await api.post(`/community/${postId}/bookmark`);
      setPosts(prev => prev.map(p => p._id === postId 
        ? { ...p, isBookmarked: data.bookmarked } 
        : p
      ));
    } catch (err) { console.error(err); }
  };

  return (
    <main className="page-content">
      <div className="container">
        <section className="hero" style={{ paddingBottom: 16 }}>
          <h1 className="hero-title" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)' }}>
            🎨 Craft Community
          </h1>
          <p className="hero-subtitle">
            Share your creations, discover inspiration, and connect with fellow craft lovers.
          </p>
          {isAuthenticated && (
            <div style={{ marginTop: 16 }}>
              <Link to="/community/new" className="btn btn-primary">➕ Share Your Creation</Link>
            </div>
          )}
        </section>

        <div className="filters-bar">
          <select
            className="form-select filter-select"
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          >
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <select
            className="form-select filter-select"
            value={type}
            onChange={(e) => { setType(e.target.value); setPage(1); }}
          >
            <option value="">All Types</option>
            <option value="photo">📸 Photos</option>
            <option value="youtube">▶️ YouTube</option>
          </select>
        </div>

        {loading ? (
          <div className="loader-page"><div className="spinner" /></div>
        ) : posts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎨</div>
            <h3>No posts yet</h3>
            <p>Be the first to share your craft creation!</p>
            {isAuthenticated && (
              <Link to="/community/new" className="btn btn-primary" style={{ marginTop: 16 }}>Share Now</Link>
            )}
          </div>
        ) : (
          <>
            <div className="community-grid">
              {posts.map((post) => (
                <div key={post._id} className="community-card">
                  <Link to={`/community/post/${post._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="community-card-image">
                      <img 
                        src={post.type === 'youtube' ? post.youtubeThumbnail : post.imageUrls?.[0]} 
                        alt={post.title} 
                        loading="lazy" 
                      />
                      {post.type === 'youtube' && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: '3rem', opacity: 0.9 }}>▶️</span>
                        </div>
                      )}
                      {post.featured && (
                        <div className="card-badge">
                          <span className="badge badge-marigold">⭐ Featured</span>
                        </div>
                      )}
                    </div>
                    <div className="community-card-body">
                      <div className="community-card-header">
                        <span className="user-avatar user-avatar-sm">
                          {post.author?.avatarUrl
                            ? <img src={post.author.avatarUrl} alt="" />
                            : <span>{post.author?.name?.charAt(0) || '?'}</span>}
                        </span>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{post.author?.displayName || post.author?.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{post.category}</div>
                        </div>
                      </div>
                      <div className="community-card-title">{post.title}</div>
                      {post.caption && <div className="community-card-caption">{post.caption}</div>}
                    </div>
                  </Link>
                  <div className="community-card-actions" style={{ padding: '0 16px 16px' }}>
                    <button className={`action-btn${post.isLiked ? ' active' : ''}`} onClick={() => toggleLike(post._id)}>
                      {post.isLiked ? '❤️' : '🤍'} {post.likeCount || 0}
                    </button>
                    <Link to={`/community/post/${post._id}`} className="action-btn" style={{ textDecoration: 'none' }}>
                      💬 {post.commentCount || 0}
                    </Link>
                    <button className={`action-btn${post.isBookmarked ? ' active' : ''}`} onClick={() => toggleBookmark(post._id)} style={{ marginLeft: 'auto' }}>
                      {post.isBookmarked ? '🔖' : '📑'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 32 }}>
                {page > 1 && <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => p - 1)}>← Previous</button>}
                <span style={{ padding: '8px 16px', color: 'var(--text-muted)' }}>Page {page} of {totalPages}</span>
                {page < totalPages && <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => p + 1)}>Next →</button>}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
