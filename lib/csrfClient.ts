"use client";

let cachedCsrfToken: string | null = null;
let csrfTokenPromise: Promise<string> | null = null;

export async function getCsrfToken(): Promise<string> {
    if (cachedCsrfToken) {
        return cachedCsrfToken;
    }

    if (!csrfTokenPromise) {
        csrfTokenPromise = fetch("/api/csrf", {
            cache: "no-store",
            credentials: "same-origin",
            method: "GET",
        })
            .then(async (response) => {
            .catch(err => console.error(err))