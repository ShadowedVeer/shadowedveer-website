import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  clearAdminToken,
  getAdminToken,
  saveProfile,
} from "@/lib/admin";
import {
  SOCIAL_TYPES,
  type PublicProfile,
  type SocialLink,
  type YoutubeTrack,
} from "@/lib/profile";
import { SocialGlyph } from "@/components/social-icons";

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > 8 * 1024 * 1024) {
      reject(new Error("Max 8 MB — host larger files and paste a URL"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-left">
      <span className="mb-1.5 block text-xs tracking-wide text-muted uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-glass-border bg-bg/50 px-3 py-2.5 text-sm text-fg outline-none focus:border-fg/40";

export function AdminEditor({ initial }: { initial: PublicProfile }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PublicProfile>({
    ...initial,
    youtubeTracks: initial.youtubeTracks ?? [],
  });
  const [busy, setBusy] = useState(false);

  function patch(partial: Partial<PublicProfile>) {
    setProfile((p) => ({ ...p, ...partial }));
  }

  function updateSocial(index: number, partial: Partial<SocialLink>) {
    setProfile((p) => ({
      ...p,
      socials: p.socials.map((s, i) => (i === index ? { ...s, ...partial } : s)),
    }));
  }

  async function onFile(
    kind: "avatar" | "background",
    file: File | undefined,
  ) {
    if (!file) return;
    try {
      const dataUrl = await readFile(file);
      patch({ [kind]: dataUrl });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not read file");
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await saveProfile({
        data: { token: getAdminToken(), profile },
      });
      setProfile(result.profile);
      toast.success("Saved — live on the profile");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Save failed";
      if (msg === "Unauthorized") {
        clearAdminToken();
        toast.error("Session expired — log in again");
        await navigate({ to: "/admin" });
        return;
      }
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-6">
      <section className="space-y-4 rounded-2xl border border-glass-border bg-glass p-5 backdrop-blur-xl">
        <h2 className="text-sm font-medium">Identity</h2>
        <Field label="Name">
          <input
            className={inputClass}
            value={profile.displayName}
            onChange={(e) => patch({ displayName: e.target.value })}
            maxLength={40}
          />
        </Field>
        <Field label="Bio">
          <textarea
            className={`${inputClass} min-h-24 resize-y`}
            value={profile.description}
            onChange={(e) => patch({ description: e.target.value })}
            maxLength={500}
          />
        </Field>
        <Field label="Location">
          <input
            className={inputClass}
            value={profile.location}
            onChange={(e) => patch({ location: e.target.value })}
            maxLength={80}
          />
        </Field>
      </section>

      <section className="space-y-4 rounded-2xl border border-glass-border bg-glass p-5 backdrop-blur-xl">
        <h2 className="text-sm font-medium">Profile picture</h2>
        <div className="flex items-center gap-4">
          <img
            src={profile.avatar}
            alt=""
            className="size-16 rounded-full object-cover ring-1 ring-fg/30"
          />
          <div className="min-w-0 flex-1 space-y-2">
            <input
              className={inputClass}
              placeholder="https://… or /media/avatar.gif"
              value={profile.avatar.startsWith("data:") ? "" : profile.avatar}
              onChange={(e) => patch({ avatar: e.target.value })}
            />
            <input
              type="file"
              accept="image/*"
              className="block w-full text-xs text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-fg file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-bg"
              onChange={(e) => void onFile("avatar", e.target.files?.[0])}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-glass-border bg-glass p-5 backdrop-blur-xl">
        <h2 className="text-sm font-medium">Background</h2>
        <input
          className={inputClass}
          placeholder="Video or image URL"
          value={profile.background.startsWith("data:") ? "" : profile.background}
          onChange={(e) => patch({ background: e.target.value })}
        />
        <input
          type="file"
          accept="image/*,video/mp4,video/webm"
          className="block w-full text-xs text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-fg file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-bg"
          onChange={(e) => void onFile("background", e.target.files?.[0])}
        />
        <p className="text-xs text-subtle">
          Image or short mp4. Max 8 MB, or paste a hosted URL.
        </p>
      </section>

      <section className="space-y-4 rounded-2xl border border-glass-border bg-glass p-5 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">YouTube player</h2>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-full border border-glass-border px-3 py-1.5 text-xs text-muted hover:text-fg"
            onClick={() =>
              setProfile((p) => ({
                ...p,
                youtubeTracks: [
                  ...p.youtubeTracks,
                  {
                    id: crypto.randomUUID(),
                    url: "",
                    videoId: "",
                    title: "",
                  } satisfies YoutubeTrack,
                ],
              }))
            }
          >
            <Plus className="size-3.5" />
            Add link
          </button>
        </div>
        <p className="text-xs text-subtle">
          Paste YouTube links. They play on the public page — tap anywhere to start.
        </p>
        <ul className="space-y-3">
          {profile.youtubeTracks.map((track, index) => (
            <li
              key={track.id}
              className="space-y-2 rounded-xl border border-glass-border bg-bg/40 p-3"
            >
              <div className="flex items-center gap-2">
                <input
                  className={inputClass}
                  placeholder="https://youtu.be/… or youtube.com/watch?v="
                  value={track.url}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      youtubeTracks: p.youtubeTracks.map((t, i) =>
                        i === index ? { ...t, url: e.target.value } : t,
                      ),
                    }))
                  }
                />
                <button
                  type="button"
                  className="grid size-10 shrink-0 place-items-center rounded-lg text-muted hover:text-danger"
                  onClick={() =>
                    setProfile((p) => ({
                      ...p,
                      youtubeTracks: p.youtubeTracks.filter((_, i) => i !== index),
                    }))
                  }
                  aria-label="Remove track"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              <input
                className={inputClass}
                placeholder="Title (optional — fetched from YouTube)"
                value={track.title}
                onChange={(e) =>
                  setProfile((p) => ({
                    ...p,
                    youtubeTracks: p.youtubeTracks.map((t, i) =>
                      i === index ? { ...t, title: e.target.value } : t,
                    ),
                  }))
                }
              />
            </li>
          ))}
        </ul>
        {profile.youtubeTracks.length === 0 ? (
          <p className="text-sm text-muted">No tracks yet. Add a YouTube link to show the player.</p>
        ) : null}
      </section>

      <section className="space-y-4 rounded-2xl border border-glass-border bg-glass p-5 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Socials</h2>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-full border border-glass-border px-3 py-1.5 text-xs text-muted hover:text-fg"
            onClick={() =>
              setProfile((p) => ({
                ...p,
                socials: [
                  ...p.socials,
                  {
                    id: crypto.randomUUID(),
                    social: "discord",
                    label: "Discord",
                    value: "",
                    href: "",
                    mode: "link",
                  },
                ],
              }))
            }
          >
            <Plus className="size-3.5" />
            Add
          </button>
        </div>
        <ul className="space-y-3">
          {profile.socials.map((social, index) => (
            <li
              key={social.id}
              className="rounded-xl border border-glass-border bg-bg/40 p-3"
            >
              <div className="mb-2 flex items-center gap-2">
                <SocialGlyph name={social.social} className="size-5 shrink-0" />
                <select
                  className={`${inputClass} py-2`}
                  value={social.social}
                  onChange={(e) => {
                    const id = e.target.value;
                    const meta = SOCIAL_TYPES.find((t) => t.id === id);
                    updateSocial(index, {
                      social: id,
                      label: meta?.label ?? id,
                    });
                  }}
                >
                  {SOCIAL_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="grid size-10 shrink-0 place-items-center rounded-lg text-muted hover:text-danger"
                  onClick={() =>
                    setProfile((p) => ({
                      ...p,
                      socials: p.socials.filter((_, i) => i !== index),
                    }))
                  }
                  aria-label="Remove social"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              <input
                className={`${inputClass} mb-2`}
                placeholder="URL, username, or text"
                value={social.value}
                onChange={(e) => {
                  const value = e.target.value;
                  updateSocial(index, {
                    value,
                    href: social.mode === "text" ? null : value,
                  });
                }}
              />
              <label className="flex items-center gap-2 text-xs text-muted">
                <input
                  type="checkbox"
                  checked={social.mode === "text"}
                  onChange={(e) =>
                    updateSocial(index, {
                      mode: e.target.checked ? "text" : "link",
                      href: e.target.checked ? null : social.value,
                    })
                  }
                />
                Copy text instead of opening a link
              </label>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-wrap items-center gap-3 pb-8">
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-fg px-5 py-2.5 text-sm font-medium text-bg disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save changes"}
        </button>
        <Link to="/" className="text-sm text-muted underline-offset-4 hover:text-fg hover:underline">
          View profile
        </Link>
      </div>
    </form>
  );
}
