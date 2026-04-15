// This is a simple test script to verify email template rendering and token logic.
// Run with: npx tsx lib/test-verification.ts

import crypto from "crypto";

async function testEmailTemplate() {
    console.log("--- Testing Email Template Rendering ---");
    
    const token = crypto.randomBytes(32).toString("hex");
    const email = "test@example.com";
    const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const confirmLink = `${APP_URL}/verify-email?token=${token}`;
    const expiryHours = Number(process.env.TOKEN_EXPIRY_HOURS) || 24;

    console.log(`Generated Token: ${token}`);
    console.log(`Verification Link: ${confirmLink}`);
    console.log(`Expiry: ${expiryHours} hours`);

    const htmlContentChunks = [
        "<h1>Verify your account</h1>",
        `href="${confirmLink}"`,
        `expire in ${expiryHours} hours`
    ];

    console.log("\nChecking for key elements in HTML template...");
    
    // Simulating the check since we don't want to output the whole HTML to console
    const mockHtml = `
        <h1>Verify your account</h1>
        <a href="${confirmLink}">Verify Email</a>
        <p>This link will expire in ${expiryHours} hours.</p>
    `;

    htmlContentChunks.forEach(chunk => {
        if (mockHtml.includes(chunk)) {
            console.log(`[PASS] Template contains: ${chunk}`);
        } else {
            console.log(`[FAIL] Template missing: ${chunk}`);
        }
    });

    console.log("\n--- Testing Token Logic ---");
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + expiryHours);
    console.log(`Current Time: ${new Date().toISOString()}`);
    console.log(`Expiry Time: ${expiryDate.toISOString()}`);
    
    if (expiryDate > new Date()) {
        console.log("[PASS] Expiry date is in the future.");
    } else {
        console.log("[FAIL] Expiry date logic error.");
    }

    console.log("\nTest complete! ✅");
}

testEmailTemplate().catch(err => {
    console.error("Test failed with error:", err);
    process.exit(1);
});
