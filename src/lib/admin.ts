import { createServerFn } from "@tanstack/react-start";
import type { PublicProfile } from "@/lib/profile";

const TOKEN_KEY = "sv-admin-token";

export function getAdminToken(): string {
  try {
    return sessionStorage.getItem(TOKEN_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setAdminToken(token: string): void {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* ignore */
  }
}

export function clearAdminToken(): void {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export const getPublicProfile = createServerFn({ method: "GET" }).handler(
  async () => {
    const { readProfile } = await import("./admin.server");
    try {
      return await readProfile();
    } catch {
      const { PROFILE } = await import("./profile");
      return {
        displayName: PROFILE.displayName,
        description: PROFILE.description,
        location: PROFILE.location,
        avatar: PROFILE.avatar,
        background: PROFILE.background,
        poster: PROFILE.poster,
        socials: PROFILE.socials.map((s) => ({ ...s })),
        youtubeTracks: [],
      } satisfies PublicProfile;
    }
  },
);

export const getAdminSession = createServerFn({ method: "POST" })
  .validator((token: string) => String(token ?? ""))
  .handler(async ({ data: token }) => {
    const { isAdmin } = await import("./admin.server");
    return { ok: await isAdmin(token) };
  });

export const adminLogin = createServerFn({ method: "POST" })
  .validator((password: string) => String(password ?? "").slice(0, 200))
  .handler(async ({ data: password }) => {
    const { verifyPassword, createAdminSession } = await import("./admin.server");
    if (!verifyPassword(password)) return { ok: false as const, token: "" };
    const token = await createAdminSession();
    return { ok: true as const, token };
  });

export const adminLogout = createServerFn({ method: "POST" })
  .validator((token: string) => String(token ?? ""))
  .handler(async ({ data: token }) => {
    const { destroyAdminSession } = await import("./admin.server");
    await destroyAdminSession(token);
    return { ok: true as const };
  });

export const saveProfile = createServerFn({ method: "POST" })
  .validator((input: { token: string; profile: PublicProfile }) => input)
  .handler(async ({ data }) => {
    const { requireAdmin, writeProfile } = await import("./admin.server");
    await requireAdmin(data.token);
    const profile = await writeProfile(data.profile);
    return { ok: true as const, profile };
  });
