import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const CATEGORIES = [
  'Painting', 'Drawing', 'Origami', 'Craft', 'DIY',
  'Crochet', 'Knitting', 'Pottery', 'Calligraphy',
  'Mixed Media', 'Tutorial', 'Other'
];

export default function CreatePost() {
  const navigate = useNavigate();
  const [type, setType] = useState('photo');
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState('Other');
  const [tags, setTags] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files).slice(0, 5);
    setFiles(selected);
    setPreviews(selected.map(f => URL.createObjectURL(f)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!title.trim()) return setError('Title is required');
    if (type === 'photo' && !files.length) return setError('At least one image is required');
    if (type === 'youtube' && !youtubeUrl.trim()) return setError('YouTube URL is required');

    setLoading(true);
    try {
      const form = new FormData();
      form.append('type', type);
      form.append('title', title.trim());
      form.append('caption', caption.trim());
      form.append('category', category);
      form.append('tags', tags);

      if (type === 'photo') {
        files.forEach(f => form.append('images', f));
      } else {
        form.append('youtubeUrl', youtubeUrl.trim());
      }

      await api.post('/community', form);
      navigate('/community');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create post');
    }
    setLoading(false);
  };

  return (
    <main className="page-content">
      <div className="container" style={{ maxWidth: 640 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', marginBottom: 8 }}>Share Your Creation</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>
          Upload craft photos or share a YouTube video. Posts will be visible after admin approval.
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Post Type */}
          <div className="form-group">
            <label className="form-label">Post Type</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className={`btn ${type === 'photo' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setType('photo')}>
                📸 Photo
              </button>
              <button type="button" className={`btn ${type === 'youtube' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setType('youtube')}>
                ▶️ YouTube Link
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. My First Origami Crane" maxLength={200} />
          </div>

          <div className="form-group">
            <label className="form-label">Caption</label>
            <textarea className="form-textarea" value={caption} onChange={e => setCaption(e.target.value)} placeholder="Tell us about this creation..." maxLength={2000} rows={4} />
          </div>

          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-select" value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Tags</label>
            <input className="form-input" value={tags} onChange={e => setTags(e.target.value)} placeholder="e.g. origami, paper, crane (comma separated)" />
            <div className="form-help">Comma-separated, up to 10 tags</div>
          </div>

          {type === 'photo' ? (
            <div className="form-group">
              <label className="form-label">Images * (up to 5)</label>
              <input type="file" accept="image/*" multiple onChange={handleFiles} className="form-input" />
              {previews.length > 0 && (
                <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  {previews.map((src, i) => (
                    <img key={i} src={src} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label">YouTube URL *</label>
              <input className="form-input" value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." />
              <div className="form-help">We'll extract the thumbnail — no video files are stored</div>
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Submitting...' : '✨ Submit for Review'}
          </button>
        </form>
      </div>
    </main>
  );
}
