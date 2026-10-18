export function getApiErrorMessage(err, fallback) {
  if (err.response?.data?.message) return err.response.data.message;

  // Specific check: Missing VITE_API_URL in production
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && !import.meta.env.VITE_API_URL) {
    return 'Backend URL not configured on Vercel. Please set VITE_API_URL in Vercel Settings → Environment Variables to your Render URL (e.g. https://parthcraft12-backend.onrender.com) and click Redeploy.';
  }

  if (err.response?.status === 404) {
    return 'API not found (404). Ensure VITE_API_URL on Vercel points to your Render backend and redeploy.';
  }

  if (err.code === 'ERR_NETWORK' || !err.response) {
    return 'Cannot reach backend server. Free Render servers take ~45s to wake up on first load. Please wait 30 seconds and try again, and verify FRONTEND_URL in Render environment variables.';
  }

  return fallback || 'An unexpected error occurred. Please try again.';
}
