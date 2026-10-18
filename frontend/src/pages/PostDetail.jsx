import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { mediaUrl } from '../utils/mediaUrl';

export default function PostDetail() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [postRes, commRes] = await Promise.all([
          api.get(`/community/${id}`),
          api.get(`/community/${id}/comments`),
        ]);
        setPost(postRes.data);
        setComments(commRes.data);
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    load();
  }, [id]);

  const toggleLike = async () => {
    if (!isAuthenticated) return;
    try {
      const { data } = await api.post(`/community/${id}/like`);
      setPost(p => ({ ...p, isLiked: data.liked, likeCount: data.likeCount }));
    } catch (err) { console.error(err); }
  };

  const toggleBookmark = async () => {
    if (!isAuthenticated) return;
    try {
      const { data } = await api.post(`/community/${id}/bookmark`);
      setPost(p => ({ ...p, isBookmarked: data.bookmarked }));
    } catch (err) { console.error(err); }
  };

  const addComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await api.post(`/community/${id}/comments`, { text: newComment.trim() });
      setComments(prev => [...prev, data]);
      setPost(p => ({ ...p, commentCount: (p.commentCount || 0) + 1 }));
      setNewComment('');
    } catch (err) { console.error(err); }
    setSubmitting(false);
  };

  const deleteComment = async (commentId) => {
    try {
      await api.delete(`/community/comments/${commentId}`);
      setComments(prev => prev.filter(c => c._id !== commentId));
      setPost(p => ({ ...p, commentCount: Math.max(0, (p.commentCount || 0) - 1) }));
    } catch (err) { console.error(err); }
  };

  if (loading) return <main className="page-content"><div className="loader-page"><div className="spinner" /></div></main>;
  if (!post) return <main className="page-content"><div className="container"><div className="empty-state"><h3>Post not found</h3></div></div></main>;

  return (
    <main className="page-content">
      <div className="container" style={{ maxWidth: 800 }}>
        {/* Post header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <span className="user-avatar">
            {post.author?.avatarUrl 
              ? <img src={post.author.avatarUrl} alt="" />
              : <span>{post.author?.name?.charAt(0) || '?'}</span>}
          </span>
          <div>
            <div style={{ fontWeight: 600 }}>{post.author?.displayName || post.author?.name}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {new Date(post.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              {' · '}{post.category}
            </div>
          </div>
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', marginBottom: 16, fontSize: '1.8rem' }}>{post.title}</h1>

        {/* Media */}
        {post.type === 'photo' && post.imageUrls?.map((url, i) => (
          <div key={i} style={{ marginBottom: 16, borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--paper-dark)' }}>
            <img src={url} alt={post.title} style={{ width: '100%', maxHeight: 600, objectFit: 'contain' }} />
          </div>
        ))}

        {post.type === 'youtube' && post.youtubeVideoId && (
          <div style={{ marginBottom: 16, borderRadius: 'var(--radius-lg)', overflow: 'hidden', aspectRatio: '16/9' }}>
            <iframe
              width="100%" height="100%"
              src={`https://www.youtube.com/embed/${post.youtubeVideoId}`}
              title={post.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ border: 0 }}
            />
          </div>
        )}

        {/* Caption */}
        {post.caption && (
          <p style={{ fontSize: '1.05rem', lineHeight: 1.7, color: 'var(--text-light)', marginBottom: 20, whiteSpace: 'pre-wrap' }}>
            {post.caption}
          </p>
        )}

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
            {post.tags.map((tag, i) => (
              <span key={i} className="badge badge-sage">#{tag}</span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 16, padding: '16px 0', borderTop: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)', marginBottom: 32 }}>
          <button className={`action-btn${post.isLiked ? ' active' : ''}`} onClick={toggleLike} style={{ fontSize: '1rem' }}>
            {post.isLiked ? '❤️' : '🤍'} {post.likeCount || 0} Likes
          </button>
          <span className="action-btn" style={{ fontSize: '1rem' }}>💬 {post.commentCount || 0} Comments</span>
          <button className={`action-btn${post.isBookmarked ? ' active' : ''}`} onClick={toggleBookmark} style={{ fontSize: '1rem', marginLeft: 'auto' }}>
            {post.isBookmarked ? '🔖 Saved' : '📑 Save'}
          </button>
        </div>

        {/* Comments */}
        <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 16 }}>Comments</h3>

        {isAuthenticated && (
          <form onSubmit={addComment} style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            <input className="form-input" value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Add a comment..." maxLength={1000} style={{ flex: 1 }} />
            <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>Send</button>
          </form>
        )}

        {comments.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 24 }}>No comments yet. Be the first!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {comments.map(c => (
              <div key={c._id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span className="user-avatar user-avatar-sm">
                  {c.user?.avatarUrl
                    ? <img src={c.user.avatarUrl} alt="" />
                    : <span>{c.user?.name?.charAt(0) || '?'}</span>}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.user?.name}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                    {user && (String(c.user?._id) === user._id || user.isAdmin) && (
                      <button onClick={() => deleteComment(c._id)} className="btn btn-ghost" style={{ padding: '2px 6px', fontSize: '0.75rem', marginLeft: 'auto' }}>🗑️</button>
                    )}
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginTop: 2 }}>{c.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
