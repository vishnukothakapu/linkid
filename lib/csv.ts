/**
 * Escape a value for a CSV cell.
 *
 * Besides normal quoting, spreadsheet applications treat a cell that starts
 * with =, +, -, @, a tab, or a carriage return as a formula. Prefix those
 * values with an apostrophe so an exported file cannot execute content that
 * came from a visitor-controlled header.
 */
export function escapeCsv(value: unknown): string {
    const text = value == null ? "" : String(value);
    const neutralized = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;

    if (/[",\n\r]/.test(neutralized)) {
        return `"${neutralized.replace(/"/g, '""')}"`;
    }

    return neutralized;
}
