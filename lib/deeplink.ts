// lib/deeplink.ts

export type Platform =
  | "instagram"
  | "youtube"
  | "x"
  | "twitter"
  | "github"
  | "linkedin"
  | "facebook"
  | "twitch"
  | "discord"
  | "tiktok";

/**
 * Detects if a User-Agent string belongs to Android or iOS environments.
 */
export function getMobileOS(userAgent: string): "android" | "ios" | "unknown" {
  if (/android/i.test(userAgent)) return "android";
  if (/iphone|ipad|ipod/i.test(userAgent)) return "ios";
  return "unknown";
}

/**
 * Given a web URL and a target platform, compiles custom native app deep-link URIs 
 * for Android and iOS devices. Returns null if unsupported.
 */
export function getDeepLink(
  platform: string,
  webUrl: string
): { android: string | null; ios: string | null } {
  try {
    // Ensure protocol safety during instantiation
    let safeUrl = webUrl.trim();
    if (!/^https?:/i.test(safeUrl)) safeUrl = "https://" + safeUrl;

    const url = new URL(safeUrl);
    const cleanPath = url.pathname.replace(/^\/|\/$/g, "");
    
    // Splitting paths through filter(Boolean) eliminates empty structural indices
    const segments = cleanPath.split("/").filter(Boolean);
    const searchParams = url.search; // Retains parameters like tracking markers, analytics, etc.

    switch (platform.toLowerCase()) {
      case "instagram": {
        const firstSegment = segments[0];

        // Process profile requests safely while preserving explicit query parameters
        if (firstSegment && firstSegment !== "p" && firstSegment !== "reel" && firstSegment !== "reels" && firstSegment !== "stories") {
          const querySuffix = searchParams ? `&${searchParams.substring(1)}` : "";
          const appLink = `instagram://user?username=${firstSegment}${querySuffix}`;
          return { android: appLink, ios: appLink };
        }

        // Parse shortcode routes securely to avoid single specific numeric ID breakdowns
        if (firstSegment === "p" || firstSegment === "reel" || firstSegment === "reels") {
          const shortcode = segments[1];
          if (shortcode) {
            const pathType = firstSegment.startsWith("reel") ? "reel" : "p";
            return {
              android: `instagram://${pathType}/${shortcode}`,
              ios: `instagram://${pathType}/${shortcode}`
            };
          }
        }

        const genericLink = safeUrl.replace(/^https?:\/\/(www\.)?instagram\.com/i, "instagram://");
        return { android: genericLink, ios: genericLink };
      }

      case "youtube": {
        if (url.hostname.includes("youtu.be")) {
          const id = segments[0];
          return { 
             android: `vnd.youtube://${id}${searchParams}`, 
             ios: `https://www.youtube.com/watch?v=${id}${searchParams}` 
           };
        }

        if (segments[0] === "shorts" && segments[1]) {
          const shortVideoId = segments[1];
          return {
            android: `vnd.youtube://${shortVideoId}${searchParams}`,
            ios: `https://www.youtube.com/shorts/${shortVideoId}${searchParams}`
          };
        }

        const videoId = url.searchParams.get("v");
        if (videoId) {
          return {
            android: `vnd.youtube://${videoId}${searchParams}`,
            ios: `https://www.youtube.com/watch?v=${videoId}${searchParams}`,
          };
        }

        return {
          android: `vnd.youtube://www.youtube.com/${cleanPath}${searchParams}`,
          ios: safeUrl,
        };
      }

      case "x":
      case "twitter": {
        const handle = segments[0];
        if (handle && handle !== "home" && handle !== "explore") {
          if (segments[1] === "status") {
            const genericX = safeUrl.replace(/^https?:\/\/(www\.)?(x|twitter)\.com/i, "twitter://");
            return { android: genericX, ios: genericX };
          }
          const appLink = `twitter://user?screen_name=${handle}`;
          return { android: appLink, ios: appLink };
        }
        return { android: "twitter://", ios: "twitter://" };
      }

      case "linkedin": {
        return {
          android: `intent://www.linkedin.com/${cleanPath}${searchParams}#Intent;package=com.linkedin.android;scheme=https;end`,
          ios: safeUrl,
        };
      }

      case "facebook": {
        // Utilizing facewebmodal uniformly resolves both alphanumeric handles and tracking suffixes safely
        const fbScheme = `fb://facewebmodal/f?href=${encodeURIComponent(safeUrl)}`;
        return {
          android: fbScheme,
          ios: fbScheme,
        };
      }

      case "twitch": {
        const channel = segments[0];
        if (channel) {
          const appLink = `twitch://stream/${channel}`;
          return { android: appLink, ios: appLink };
        }
        return { android: null, ios: null };
      }

      case "tiktok": {
        if (/(vt|vm)\.tiktok\.com/i.test(url.hostname)) {
          return { android: null, ios: null }; 
        }

        const username = segments[0]?.replace(/^@/, "");
        if (username && username !== "share") {
          return {
            android: `snssdk1128://user/profile/${username}${searchParams}`,
            ios: `snssdk1233://user/profile/${username}${searchParams}`
          };
        }
        return { android: null, ios: null };
      }

      case "discord": {
        if (url.hostname.includes("discord.gg")) {
          const inviteCode = segments[0];
          return {
            android: `discord://discord.com/invite/${inviteCode}`,
            ios: `discord://discord.com/invite/${inviteCode}`
          };
        }
        const discordScheme = safeUrl.replace(/^https?:\/\//i, "discord://");
        return { android: discordScheme, ios: discordScheme };
      }

      case "github": {
        const githubScheme = safeUrl.replace(/^https?:\/\//i, "github://");
        return { android: githubScheme, ios: githubScheme };
      }

      default:
        return { android: null, ios: null };
    }
  } catch {
    return { android: null, ios: null };
  }
}