/**
 * Magic-byte validation for uploaded image files.
 *
 * File-type detection based on the first bytes of the binary content is the
 * only reliable server-side check because the MIME type declared in the
 * multipart form-data Content-Type field is entirely client-controlled.
 *
 * Supported formats and their signatures:
 *
 *   JPEG  FF D8 FF          (first 3 bytes)
 *   PNG   89 50 4E 47       (first 4 bytes, i.e. \x89PNG)
 *   WebP  52 49 46 46 .. .. .. .. 57 45 42 50
 *         bytes 0-3 = "RIFF", bytes 8-11 = "WEBP"
 *
 * References:
 *   https://www.garykessler.net/library/file_sigs.html
 *   https://developers.google.com/speed/webp/docs/riff_container
 */

/**
 * Returns true when `buf` begins with the magic-byte signature of a JPEG,
 * PNG, or WebP image.  The buffer must contain at least 12 bytes; anything
 * shorter is rejected.
 */
export function hasSupportedImageMagicBytes(buf: Buffer): boolean {
    if (buf.length < 12) return false;

    // JPEG: starts with FF D8 FF
    if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true;

    // PNG: starts with 89 50 4E 47 (i.e. \x89PNG)
    if (
        buf[0] === 0x89 &&
        buf[1] === 0x50 &&
        buf[2] === 0x4e &&
        buf[3] === 0x47
    )
        return true;

    // WebP: bytes 0-3 are "RIFF" and bytes 8-11 are "WEBP"
    const isRiff =
        buf[0] === 0x52 && // R
        buf[1] === 0x49 && // I
        buf[2] === 0x46 && // F
        buf[3] === 0x46;   // F
    const isWebp =
        buf[8] === 0x57 && // W
        buf[9] === 0x45 && // E
        buf[10] === 0x42 && // B
        buf[11] === 0x50;  // P
    if (isRiff && isWebp) return true;

    return false;
}
