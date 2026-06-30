/**
 * Format milliseconds into mm:ss or hh:mm:ss
 */
export function formatDuration(ms: number): string {
  if (!ms || ms <= 0) return "0:00";
  const seconds = Math.floor(ms / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

/**
 * Parse a timestamp string (mm:ss or hh:mm:ss) into milliseconds
 */
export function parseTimestamp(input: string): number | null {
  const parts = input.split(":").map(Number);
  if (parts.some(isNaN)) return null;

  if (parts.length === 2) {
    const [m, s] = parts;
    return ((m ?? 0) * 60 + (s ?? 0)) * 1000;
  } else if (parts.length === 3) {
    const [h, m, s] = parts;
    return ((h ?? 0) * 3600 + (m ?? 0) * 60 + (s ?? 0)) * 1000;
  }
  return null;
}

/**
 * Build a visual progress bar using block characters
 * e.g.  ▬▬▬▬🔘▬▬▬▬▬▬▬▬▬▬
 */
export function progressBar(current: number, total: number, size = 16): string {
  if (!total || total <= 0) return `🔘${"▬".repeat(size)}`;
  const ratio = Math.min(current / total, 1);
  const filled = Math.floor(ratio * size);
  return "▬".repeat(filled) + "🔘" + "▬".repeat(size - filled);
}

/**
 * Truncate a string to max length, appending ellipsis if needed
 */
export function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max - 1) + "…";
}
