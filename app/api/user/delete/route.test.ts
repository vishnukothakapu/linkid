import assert from "node:assert/strict";
import { mock, test, before, beforeEach } from "node:test";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
let session: unknown = null;
let user: unknown = null;
let allowed = true, otpValid = true, fail = false;
const calls: string[] = [];
const profiles = [{ id: "ws", usernames: ["primary", "alias"] }];
mock.module("next-auth", { namedExports: { getServerSession: async () => session } });
mock.module("@/lib/auth", { namedExports: { authOptions: {} } });
mock.module("@/lib/prisma", { defaultExport: { user: { findUnique: async () => user } } });
mock.module("@/lib/deleteOtpStore", { namedExports: { verifyOtp: async () => ({ valid: otpValid }) } });
mock.module("@/lib/rateLimit", { namedExports: { checkRateLimit: async () => allowed } });
mock.module("@/lib/accountDeletion", { namedExports: { deleteAccountWorkspaces: async (_client: unknown, id: string) => {
 calls.push(`delete:${id}`); if (fail) throw new Error("transaction failed"); return profiles;
} } });
mock.module("@/lib/profileCache", { namedExports: {
 invalidateProfileCache: async (id: string) => { calls.push(`cache:${id}`); },
 invalidateProfileUsername: async (name: string) => { calls.push(`username:${name}`); },
} });
mock.module("next/cache", { namedExports: { revalidateTag: (tag: string) => { calls.push(`tag:${tag}`); } } });
mock.method(bcrypt, "compare", async () => true);
let DELETE: typeof import("@/app/api/user/delete/route").DELETE;
before(async () => { DELETE = (await import("@/app/api/user/delete/route")).DELETE; });
beforeEach(() => { session = { user: { id: "owner" } }; user = { id: "owner", password: "hash" }; allowed = true; otpValid = true; fail = false; calls.length = 0; });
const request = (body: unknown) => new NextRequest("http://localhost/api/user/delete", { method: "DELETE", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } });
test("unauthenticated requests do not start cleanup", async () => { session = null; assert.equal((await DELETE(request({}))).status,401); assert.deepEqual(calls,[]); });
test("rate limited and invalid OTP requests cannot delete", async () => {
 allowed = false; assert.equal((await DELETE(request({}))).status,429); allowed = true; otpValid = false;
 assert.equal((await DELETE(request({password:"p",otp:"123456"}))).status,400); assert.deepEqual(calls,[]);
});
test("missing password cannot delete", async () => { assert.equal((await DELETE(request({otp:"123456"}))).status,400); assert.deepEqual(calls,[]); });
test("successful transaction invalidates profile, primary username, aliases and Next tag", async () => {
 const response = await DELETE(request({password:"p",otp:"123456"})); assert.equal(response.status,200);
 assert.deepEqual(calls,["delete:owner","cache:ws","username:primary","username:alias","tag:public-profile"]);
});
test("transaction failure does not invalidate cache or report success", async () => { fail = true; assert.equal((await DELETE(request({password:"p",otp:"123456"}))).status,500); assert.deepEqual(calls,["delete:owner"]); });
