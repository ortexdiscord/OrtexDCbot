import { Jimp, rgbaToInt } from "jimp";

/**
 * Generate a gradient-tinted version of a remote artwork image.
 * Returns a PNG buffer, or null if the image cannot be processed.
 */
export async function gradientArtwork(
  url: string,
  color: number
): Promise<Buffer | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const input = Buffer.from(await res.arrayBuffer());
    const img = await Jimp.read(input);

    const width = img.width;
    const height = img.height;
    const r = (color >> 16) & 0xff;
    const g = (color >> 8) & 0xff;
    const b = color & 0xff;

    // Build a top-to-bottom gradient overlay in the source color.
    // Fully transparent at the top, ~30% opaque at the bottom.
    const overlay = new Jimp({ width, height, color: 0x00000000 });
    for (let y = 0; y < height; y++) {
      const alpha = Math.floor((y / height) * 80); // 0 -> 80
      const pixel = rgbaToInt(r, g, b, alpha);
      for (let x = 0; x < width; x++) {
        overlay.setPixelColor(pixel, x, y);
      }
    }

    img.composite(overlay, 0, 0);
    return await img.getBuffer("image/png");
  } catch (err) {
    console.error("[Gradient] Failed to generate gradient artwork:", err);
    return null;
  }
}
