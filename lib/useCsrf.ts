"use client";

import { useEffect, useState } from "react";

import { getCsrfToken } from "@/lib/csrfClient";

export function useCsrf(): string {
    const [csrfToken, setCsrfToken] = useState("");

    useEffect(() => {
        let isMounted = true;

        void getCsrfToken()
            .then((token) => {
                if (isMounted) {
                    setCsrfToken(token);
                }
            })
            .catch(() => {
                if (isMounted) {
                    setCsrfToken("");
                }
            });

        return () => {
            isMounted = false;
        };
    }, []);

    return csrfToken;
}
