import assert from "node:assert/strict";
import test from "node:test";

import { hasSupportedImageMagicBytes } from "@/lib/imageValidation";

// Helper to build a Buffer from a hex string ("FF D8 FF" etc.)
function fromHex(hex: string): Buffer {
    return Buffer.from(hex.replace(/\s/g, ""), "hex");
}

// Pad a buffer to at least 12 bytes so the length guard does not interfere.
function pad(buf: Buffer): Buffer {
    if (buf.length >= 12) return buf;
    return Buffer.concat([buf, Buffer.alloc(12 - buf.length)]);
}

test("hasSupportedImageMagicBytes accepts a valid JPEG header", () => {
    const jpeg = pad(fromHex("FF D8 FF E0 00 10 4A 46 49 46 00 01"));
    assert.equal(hasSupportedImageMagicBytes(jpeg), true);
});

test("hasSupportedImageMagicBytes accepts a valid PNG header", () => {
    const png = pad(fromHex("89 50 4E 47 0D 0A 1A 0A 00 00 00 0D"));
    assert.equal(hasSupportedImageMagicBytes(png), true);
});

test("hasSupportedImageMagicBytes accepts a valid WebP header", () => {
    // RIFF....WEBP where .... is 4 arbitrary size bytes
    const webp = Buffer.from([
        0x52, 0x49, 0x46, 0x46, // RIFF
        0x24, 0x00, 0x00, 0x00, // file size (arbitrary)
        0x57, 0x45, 0x42, 0x50, // WEBP
    ]);
    assert.equal(hasSupportedImageMagicBytes(webp), true);
});

test("hasSupportedImageMagicBytes rejects a plain text file", () => {
    const txt = Buffer.from("Hello, world! This is not an image.");
    assert.equal(hasSupportedImageMagicBytes(txt), false);
});

test("hasSupportedImageMagicBytes rejects a PDF file header", () => {
    const pdf = pad(fromHex("25 50 44 46 2D")); // %PDF-
    assert.equal(hasSupportedImageMagicBytes(pdf), false);
});

test("hasSupportedImageMagicBytes rejects a GIF file header", () => {
    const gif = pad(Buffer.from("GIF89a"));
    assert.equal(hasSupportedImageMagicBytes(gif), false);
});

test("hasSupportedImageMagicBytes rejects a buffer shorter than 12 bytes", () => {
    const short = Buffer.from([0xff, 0xd8, 0xff]); // valid JPEG prefix but too short
    assert.equal(hasSupportedImageMagicBytes(short), false);
});

test("hasSupportedImageMagicBytes rejects an empty buffer", () => {
    assert.equal(hasSupportedImageMagicBytes(Buffer.alloc(0)), false);
});

test("hasSupportedImageMagicBytes rejects a RIFF container that is not WebP", () => {
    // RIFF....AVI  -- a valid RIFF container but not a WebP image
    const avi = Buffer.from([
        0x52, 0x49, 0x46, 0x46, // RIFF
        0x00, 0x00, 0x00, 0x00, // size
        0x41, 0x56, 0x49, 0x20, // AVI (not WEBP)
    ]);
    assert.equal(hasSupportedImageMagicBytes(avi), false);
});
