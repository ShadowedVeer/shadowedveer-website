export type SocialMode = "link" | "text";

export type SocialLink = {
  id: string;
  social: string;
  label: string;
  value: string;
  href: string | null;
  mode: SocialMode;
};

export type YoutubeTrack = {
  id: string;
  url: string;
  videoId: string;
  title: string;
};

export type PublicProfile = {
  displayName: string;
  description: string;
  location: string;
  avatar: string;
  background: string;
  poster: string;
  socials: SocialLink[];
  youtubeTracks: YoutubeTrack[];
};

export const SOCIAL_TYPES = [
  { id: "discord", label: "Discord" },
  { id: "youtube", label: "YouTube" },
  { id: "steam", label: "Steam" },
  { id: "roblox", label: "Roblox" },
  { id: "spotify", label: "Spotify" },
  { id: "playstation", label: "PlayStation" },
  { id: "xbox", label: "Xbox" },
  { id: "onlyfans", label: "OnlyFans" },
  { id: "pinterest", label: "Pinterest" },
  { id: "snapchat", label: "Snapchat" },
  { id: "paypal", label: "PayPal" },
  { id: "email", label: "Email" },
] as const;

export const PROFILE = {
  username: "shadowedveer",
  displayName: "ShadowedVeer",
  description:
    "16 May 15th ADHD/Depression Diagnosed\nLife does really suck you know if you ever thought about it, people treat u as shit even if ur nice...",
  location: "My momma stomach",
  verified: true,
  discord: {
    username: "__veer",
    id: "603150263913545729",
    globalName: "Veer",
    idleText: "Maybe dying in peace",
  },
  email: "shadowedveer@windowsxp.fyi",
  avatar: "/media/avatar.gif",
  avatarStill: "/media/avatar.png",
  background: "/media/bg.mp4",
  poster: "/media/bg-poster.jpg",
  cursor: "/media/cursor.png",
  socials: [
    {
      id: "discord",
      social: "discord",
      label: "Discord",
      value: "__veer",
      href: "https://discord.com/users/603150263913545729",
      mode: "link",
    },
    {
      id: "youtube",
      social: "youtube",
      label: "YouTube",
      value: "https://youtube.com/@Shadowed_Veer",
      href: "https://youtube.com/@Shadowed_Veer",
      mode: "link",
    },
    {
      id: "steam",
      social: "steam",
      label: "Steam",
      value: "veerwal",
      href: "https://steamcommunity.com/id/veerwal",
      mode: "link",
    },
    {
      id: "roblox",
      social: "roblox",
      label: "Roblox",
      value: "Shadowed_Veer",
      href: "https://www.roblox.com/users/1602172915/profile",
      mode: "link",
    },
    {
      id: "spotify",
      social: "spotify",
      label: "Spotify",
      value: "https://open.spotify.com/user/31j4pghm6y7cz7bfi6kbivedrwq4",
      href: "https://open.spotify.com/user/31j4pghm6y7cz7bfi6kbivedrwq4",
      mode: "link",
    },
    {
      id: "playstation",
      social: "playstation",
      label: "PlayStation",
      value: "S3_Veer",
      href: "https://psnprofiles.com/S3_Veer",
      mode: "link",
    },
    {
      id: "xbox",
      social: "xbox",
      label: "Xbox",
      value: "veerjersey",
      href: "https://www.xbox.com/en-US/play/user/veerjersey",
      mode: "link",
    },
    {
      id: "onlyfans",
      social: "onlyfans",
      label: "OnlyFans",
      value: "LMAO HAHA U THOUGHT BOZO",
      href: null,
      mode: "text",
    },
    {
      id: "pinterest",
      social: "pinterest",
      label: "Pinterest",
      value: "https://pinterest.com/shadowedveer",
      href: "https://pinterest.com/shadowedveer",
      mode: "link",
    },
    {
      id: "snapchat",
      social: "snapchat",
      label: "Snapchat",
      value: "shadowedveer",
      href: "https://www.snapchat.com/add/shadowedveer",
      mode: "link",
    },
    {
      id: "paypal",
      social: "paypal",
      label: "PayPal",
      value: "https://paypal.me/veerinter",
      href: "https://paypal.me/veerinter",
      mode: "link",
    },
    {
      id: "email",
      social: "email",
      label: "Email",
      value: "shadowedveer@windowsxp.fyi",
      href: "mailto:shadowedveer@windowsxp.fyi",
      mode: "link",
    },
  ] satisfies SocialLink[],
  youtubeTracks: [] as YoutubeTrack[],
} as const;

const YT_ID = /^[\w-]{11}$/;

export function parseYoutubeId(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  if (YT_ID.test(value)) return value;
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "").replace(/^m\./, "");
    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0]?.slice(0, 11);
      return id && YT_ID.test(id) ? id : null;
    }
    if (
      host === "youtube.com" ||
      host === "music.youtube.com" ||
      host === "youtube-nocookie.com"
    ) {
      const v = url.searchParams.get("v");
      if (v && YT_ID.test(v)) return v;
      const parts = url.pathname.split("/").filter(Boolean);
      if (
        (parts[0] === "embed" ||
          parts[0] === "shorts" ||
          parts[0] === "live" ||
          parts[0] === "v") &&
        parts[1] &&
        YT_ID.test(parts[1])
      ) {
        return parts[1];
      }
    }
  } catch {
    return null;
  }
  return null;
}

