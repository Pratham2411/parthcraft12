import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

export default function Bookmarks() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/community/bookmarks')
      .then(({ data }) => setPosts(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <main className="page-content"><div className="loader-page"><div className="spinner" /></div></main>;

  return (
    <main className="page-content">
      <div className="container">
        <h1 style={{ fontFamily: 'var(--font-display)', marginBottom: 24 }}>🔖 Bookmarks</h1>

        {posts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔖</div>
            <h3>No bookmarks yet</h3>
            <p>Save community posts to view them here later.</p>
            <Link to="/community" className="btn btn-primary" style={{ marginTop: 16 }}>Explore Community</Link>
          </div>
        ) : (
          <div className="community-grid">
            {posts.map(post => (
              <Link to={`/community/post/${post._id}`} key={post._id} className="community-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="community-card-image">
                  <img src={post.type === 'youtube' ? post.youtubeThumbnail : post.imageUrls?.[0]} alt={post.title} loading="lazy" />
                </div>
                <div className="community-card-body">
                  <div className="community-card-title">{post.title}</div>
                  <div className="community-card-actions">
                    <span className="action-btn">❤️ {post.likeCount || 0}</span>
                    <span className="action-btn">💬 {post.commentCount || 0}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
