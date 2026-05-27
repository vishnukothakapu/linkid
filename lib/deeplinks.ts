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
 * Detects if a User-Agent string belongs to Android or iOS.
 */
export function getMobileOS(userAgent: string): "android" | "ios" | "unknown" {
  if (/android/i.test(userAgent)) return "android";
  if (/iphone|ipad|ipod/i.test(userAgent)) return "ios";
  return "unknown";
}

/**
 * Given a web URL and a platform name, returns the deep link URI
 * (custom app scheme) for Android/iOS if supported, else returns null.
 *
 * Examples:
 *   instagram.com/p/abc → instagram://media?id=abc  (simplified)
 *   youtube.com/watch?v=XYZ → vnd.youtube://XYZ
 */
export function getDeepLink(
  platform: string,
  webUrl: string
): { android: string | null; ios: string | null } {
  try {
    const url = new URL(webUrl);
    const path = url.pathname; // e.g. /reels/abc123

    switch (platform.toLowerCase()) {
      case "instagram": {
        // instagram://user?username=USERNAME
        const igUser = path.replace(/^\//, "").split("/")[0];
        const appLink = igUser
          ? `instagram://user?username=${igUser}`
          : "instagram://";
        return { android: appLink, ios: appLink };
      }

      case "youtube": {
        // Channel: youtube.com/@handle or /channel/ID
        // Video:   youtube.com/watch?v=VIDEO_ID
        const videoId = url.searchParams.get("v");
        if (videoId) {
          return {
            android: `vnd.youtube://${videoId}`,
            ios: `vnd.youtube://${videoId}`,
          };
        }
        const channelHandle = path.replace(/^\/@?/, "").split("/")[0];
        return {
          android: `vnd.youtube://www.youtube.com${path}`,
          ios: `vnd.youtube://www.youtube.com${path}`,
        };
      }

      case "x":
      case "twitter": {
        // twitter://user?screen_name=USERNAME
        const handle = path.replace(/^\//, "").split("/")[0];
        if (handle) {
          const appLink = `twitter://user?screen_name=${handle}`;
          return { android: appLink, ios: appLink };
        }
        return { android: "twitter://", ios: "twitter://" };
      }

      case "linkedin": {
        // linkedin://in/USERNAME (iOS) | intent://linkedin.com/in/USERNAME (Android)
        const liPath = path; // e.g. /in/vishnukothakapu
        return {
          android: `intent://linkedin.com${liPath}#Intent;package=com.linkedin.android;scheme=https;end`,
          ios: `linkedin://${liPath}`,
        };
      }

      case "facebook": {
        const fbPath = path.replace(/^\//, "").split("/")[0];
        return {
          android: `fb://facewebmodal/f?href=${encodeURIComponent(webUrl)}`,
          ios: `fb://profile`,
        };
      }

      case "twitch": {
        const channel = path.replace(/^\//, "").split("/")[0];
        if (channel) {
          const appLink = `twitch://stream/${channel}`;
          return { android: appLink, ios: appLink };
        }
        return { android: null, ios: null };
      }

      case "tiktok": {
        // TikTok deep links are restricted; fallback to web
        return { android: null, ios: null };
      }

      default:
        return { android: null, ios: null };
    }
  } catch {
    return { android: null, ios: null };
  }
}