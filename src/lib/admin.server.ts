import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  deleteCookie,
  getCookie,
  setCookie,
} from "@tanstack/react-start/server";
import { getSql } from "@/lib/db";
import { PROFILE, parseYoutubeId, type PublicProfile, type SocialLink, type YoutubeTrack } from "@/lib/profile";

const COOKIE = "sv_admin";
const SALT = Buffer.from("2656911ee17572156078c19cba157351", "hex");
const HASH = Buffer.from(
  "1358a29640d85fa3e2cd5317ae6cb55d2d5cdce0920d8befbdfb6f1ad3f713d2785fa662b60632f56095a7afe56e27ca2ffc12295bb148d806100ec0d78f50ec",
  "hex",
);

function defaults(): PublicProfile {
  return {
    displayName: PROFILE.displayName,
    description: PROFILE.description,
    location: PROFILE.location,
    avatar: PROFILE.avatar,
    background: PROFILE.background,
    poster: PROFILE.poster,
    socials: PROFILE.socials.map((s) => ({ ...s })),
    youtubeTracks: [],
  };
}

export function verifyPassword(password: string): boolean {
  const got = scryptSync(password, SALT, 64);
  if (got.length !== HASH.length) return false;
  return timingSafeEqual(got, HASH);
}

function cookieOpts() {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === "production",
  };
}

export async function createAdminSession(): Promise<string> {
  const sql = await getSql();
  const token = randomBytes(32).toString("hex");
  await sql`
    insert into admin_sessions (token, expires_at)
    values (${token}, now() + interval '30 days')
  `;
  setCookie(COOKIE, token, cookieOpts());
  return token;
}

export async function destroyAdminSession(token?: string): Promise<void> {
  const sql = await getSql();
  const cookie = getCookie(COOKIE);
  const t = token || cookie;
  if (t) {
    await sql`delete from admin_sessions where token = ${t}`;
  }
  deleteCookie(COOKIE, { path: "/" });
}

export async function isAdmin(token?: string): Promise<boolean> {
  const sql = await getSql();
  const t = (token || getCookie(COOKIE) || "").trim();
  if (!t) return false;
  const rows = await sql<{ token: string }>`
    select token from admin_sessions
    where token = ${t} and expires_at > now()
    limit 1
  `;
  return rows.length > 0;
}

export async function requireAdmin(token?: string): Promise<void> {
  if (!(await isAdmin(token))) {
    throw new Error("Unauthorized");
  }
}

function parseSocials(raw: string): SocialLink[] {
  try {
    const parsed = JSON.parse(raw) as SocialLink[];
    if (!Array.isArray(parsed)) return defaults().socials;
    return parsed.filter((s) => s && typeof s.id === "string");
  } catch {
    return defaults().socials;
  }
}

function parseTracks(raw: string | null | undefined): YoutubeTrack[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as YoutubeTrack[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((t) => t && typeof t.videoId === "string" && t.videoId);
  } catch {
    return [];
  }
}

async function youtubeTitle(url: string, fallback: string): Promise<string> {
  if (fallback.trim()) return fallback.trim();
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
    );
    if (!res.ok) return "YouTube";
    const data = (await res.json()) as { title?: string };
    return data.title?.trim() || "YouTube";
  } catch {
    return "YouTube";
  }
}

export async function readProfile(): Promise<PublicProfile> {
  const sql = await getSql();
  const rows = await sql<{
    display_name: string;
    description: string;
    location: string;
    avatar: string;
    background: string;
    poster: string;
    socials: string;
    youtube_tracks: string | null;
  }>`
    select display_name, description, location, avatar, background, poster, socials,
           youtube_tracks
    from profile_content
    where id = 'main'
    limit 1
  `;
  if (!rows[0]) {
    const seed = defaults();
    await sql`
      insert into profile_content (
        id, display_name, description, location, avatar, background, poster, socials, youtube_tracks
      ) values (
        'main',
        ${seed.displayName},
        ${seed.description},
        ${seed.location},
        ${seed.avatar},
        ${seed.background},
        ${seed.poster},
        ${JSON.stringify(seed.socials)},
        ${JSON.stringify(seed.youtubeTracks)}
      )
      on conflict (id) do nothing
    `;
    return seed;
  }
  const row = rows[0];
  return {
    displayName: row.display_name,
    description: row.description,
    location: row.location,
    avatar: row.avatar,
    background: row.background,
    poster: row.poster,
    socials: parseSocials(row.socials),
    youtubeTracks: parseTracks(row.youtube_tracks),
  };
}

const MAX_UPLOAD = 8 * 1024 * 1024;

function extForMime(mime: string): string {
  if (mime.includes("gif")) return "gif";
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("mp4")) return "mp4";
  if (mime.includes("webm")) return "webm";
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  return "bin";
}

async function persistMedia(value: string, kind: "avatar" | "background"): Promise<string> {
  const match = /^data:([^;]+);base64,(.+)$/.exec(value);
  if (!match) return value;
  const mime = match[1];
  const buf = Buffer.from(match[2], "base64");
  if (buf.length > MAX_UPLOAD) {
    throw new Error("File is too large (max 8 MB). Host it and paste a URL instead.");
  }
  try {
    const dir = join(process.cwd(), "public/media/custom");
    await mkdir(dir, { recursive: true });
    const name = `${kind}-${Date.now()}.${extForMime(mime)}`;
    await writeFile(join(dir, name), buf);
    return `/media/custom/${name}`;
  } catch {
    if (buf.length > 1_500_000) {
      throw new Error("Could not save that file. Paste a public URL instead.");
    }
    return value;
  }
}

export async function writeProfile(next: PublicProfile): Promise<PublicProfile> {
  const current = await readProfile();
  const avatar = await persistMedia(next.avatar || current.avatar, "avatar");
  const background = await persistMedia(
    next.background || current.background,
    "background",
  );
  const isVid =
    background.startsWith("data:video") ||
    /\.(mp4|webm|ogg)(\?|$)/i.test(background);
  const poster = isVid ? current.poster : background;
  const socials = (next.socials ?? [])
    .filter((s) => s.label.trim() || s.value.trim())
    .map((s, i) => ({
      id: s.id || `s${i}`,
      social: s.social || "email",
      label: s.label.trim() || s.social,
      value: s.value.trim(),
      href: s.mode === "text" ? null : s.href?.trim() || s.value.trim() || null,
      mode: s.mode === "text" ? ("text" as const) : ("link" as const),
    }));
  const youtubeTracks: YoutubeTrack[] = [];
  for (const track of next.youtubeTracks ?? []) {
    const url = track.url.trim();
    const videoId = parseYoutubeId(url) || parseYoutubeId(track.videoId);
    if (!videoId) continue;
    const canonical = `https://www.youtube.com/watch?v=${videoId}`;
    youtubeTracks.push({
      id: track.id || videoId,
      url: canonical,
      videoId,
      title: await youtubeTitle(canonical, track.title || ""),
    });
  }
  const saved: PublicProfile = {
    displayName: next.displayName.trim() || current.displayName,
    description: next.description,
    location: next.location.trim() || current.location,
    avatar,
    background,
    poster,
    socials: socials.length ? socials : current.socials,
    youtubeTracks,
  };
  const sql = await getSql();
  await sql`
    insert into profile_content (
      id, display_name, description, location, avatar, background, poster, socials, youtube_tracks
    ) values (
      'main',
      ${saved.displayName},
      ${saved.description},
      ${saved.location},
      ${saved.avatar},
      ${saved.background},
      ${saved.poster},
      ${JSON.stringify(saved.socials)},
      ${JSON.stringify(saved.youtubeTracks)}
    )
    on conflict (id) do update set
      display_name = excluded.display_name,
      description = excluded.description,
      location = excluded.location,
      avatar = excluded.avatar,
      background = excluded.background,
      poster = excluded.poster,
      socials = excluded.socials,
      youtube_tracks = excluded.youtube_tracks
  `;
  return saved;
}
