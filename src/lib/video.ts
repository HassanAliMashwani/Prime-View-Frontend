/**
 * Check whether a media URL points to a real video stream or video file.
 * Returns true ONLY for YouTube, Vimeo, or video files (.mp4, .webm, .mov).
 * Returns false if empty, null/undefined, or if the media is an image (.jpg, .jpeg, .png, .webp, .gif).
 */
export function isRealVideo(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;

  // Extract path without query parameters or hash fragments
  const cleanUrl = trimmed.split('?')[0].split('#')[0].toLowerCase();

  // If the media has an image extension, it is a picture, not a video
  if (/\.(jpg|jpeg|png|webp|gif)$/i.test(cleanUrl)) {
    return false;
  }

  // Check for supported video providers
  if (
    trimmed.includes('youtube.com') ||
    trimmed.includes('youtu.be') ||
    trimmed.includes('vimeo.com')
  ) {
    return true;
  }

  // Check for supported video file extensions
  if (/\.(mp4|webm|mov)$/i.test(cleanUrl)) {
    return true;
  }

  return false;
}
