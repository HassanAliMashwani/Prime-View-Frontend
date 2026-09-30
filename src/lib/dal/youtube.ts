/**
 * Accept youtube.com/watch?v=, youtu.be/, youtube.com/embed/, and youtube.com/shorts/.
 * Save metadata.videoUrl as https://www.youtube.com/embed/VIDEO_ID.
 */
export function formatYouTubeEmbedUrl(input?: string): string | null {
  if (!input || !input.trim()) return null;
  const trimmed = input.trim();

  // youtube.com/watch?v=VIDEO_ID
  const watchMatch = trimmed.match(/(?:youtube\.com\/watch\?.*?v=)([a-zA-Z0-9_-]+)/i);
  if (watchMatch && watchMatch[1]) return `https://www.youtube.com/embed/${watchMatch[1]}`;

  // youtu.be/VIDEO_ID
  const shortMatch = trimmed.match(/(?:youtu\.be\/)([a-zA-Z0-9_-]+)/i);
  if (shortMatch && shortMatch[1]) return `https://www.youtube.com/embed/${shortMatch[1]}`;

  // youtube.com/embed/VIDEO_ID
  const embedMatch = trimmed.match(/(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/i);
  if (embedMatch && embedMatch[1]) return `https://www.youtube.com/embed/${embedMatch[1]}`;

  // youtube.com/shorts/VIDEO_ID
  const shortsMatch = trimmed.match(/(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]+)/i);
  if (shortsMatch && shortsMatch[1]) return `https://www.youtube.com/embed/${shortsMatch[1]}`;

  return null;
}
