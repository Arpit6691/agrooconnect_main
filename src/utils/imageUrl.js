const DEFAULT_CROP_IMAGE = 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=500&q=80';

/**
 * Resolves crop image URLs properly across both local dev and production (Vercel/Render)
 * and provides a fallback if image is missing or cannot be reached.
 */
export function getCropImageUrl(crop) {
  if (!crop || !crop.images || crop.images.length === 0 || !crop.images[0]) {
    return DEFAULT_CROP_IMAGE;
  }

  let img = crop.images[0];

  // Resolve active backend base URL
  const backendBase = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
    : '';

  // If saved with localhost:5000 in production, replace with live Render backend domain
  if (img.includes('localhost:5000') && backendBase && !window.location.hostname.includes('localhost')) {
    img = img.replace(/http:\/\/localhost:5000/g, backendBase);
  } else if (img.startsWith('/uploads') && backendBase) {
    img = `${backendBase}${img}`;
  }

  return img;
}

export const handleImageError = (e) => {
  e.target.onerror = null;
  e.target.src = DEFAULT_CROP_IMAGE;
};
