import { useEffect, useState, type MouseEvent } from "react";
import { Eye, MapPin } from "lucide-react";
import { toast } from "sonner";
import { SocialGlyph } from "@/components/social-icons";
import { Snowflakes } from "@/components/snowflakes";
import { PROFILE, type PublicProfile, type SocialLink } from "@/lib/profile";
import { recordVisit } from "@/lib/views";
import { YoutubePlayer } from "@/components/youtube-player";

let visitRecorded = false;

function isVideoSrc(src: string) {
  return src.startsWith("data:video") || /\.(mp4|webm|ogg)(\?|$)/i.test(src);
}

export function ProfileView({ profile }: { profile?: PublicProfile }) {
  const data = profile
    ? { ...profile, youtubeTracks: profile.youtubeTracks ?? [] }
    : {
        displayName: PROFILE.displayName,
        description: PROFILE.description,
        location: PROFILE.location,
        avatar: PROFILE.avatar,
        background: PROFILE.background,
        poster: PROFILE.poster,
        socials: PROFILE.socials.map((s) => ({ ...s })),
        youtubeTracks: [...PROFILE.youtubeTracks],
      };
  const [views, setViews] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (visitRecorded) return;
    visitRecorded = true;
    void recordVisit()
      .then((n) => setViews(n))
      .catch(() => setViews(0));
  }, []);

  useEffect(() => {
    const base = data.displayName;
    const frames = [`${base}`, `${base}.`, `${base}..`, `${base}...`, `✦ ${base}`];
    let i = 0;
    const id = window.setInterval(() => {
      document.title = frames[i % frames.length];
      i += 1;
    }, 900);
    return () => {
      window.clearInterval(id);
      document.title = base;
    };
  }, [data.displayName]);

  function handleSocial(social: SocialLink, event: MouseEvent) {
    if (social.mode === "text" || !social.href) {
      event.preventDefault();
      void navigator.clipboard.writeText(social.value).then(() => {
        setCopiedId(social.id);
        toast.success(`Copied ${social.label}`, { description: social.value });
        window.setTimeout(
          () => setCopiedId((id) => (id === social.id ? null : id)),
          1600,
        );
      });
      return;
    }
    if (social.social === "email") {
      void navigator.clipboard.writeText(social.value);
    }
  }

  function renderSocial(social: SocialLink) {
    const inner = (
      <>
        <SocialGlyph
          name={social.social}
          className="size-7 drop-shadow-[0_0_10px_rgba(255,255,255,0.45)] sm:size-8"
        />
        <span className="sr-only">{social.label}</span>
        {copiedId === social.id && (
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 rounded-full bg-fg px-2 py-0.5 text-[10px] font-medium whitespace-nowrap text-bg">
            Copied
          </span>
        )}
      </>
    );
    const className =
      "social-btn relative grid size-9 place-items-center text-fg transition-transform duration-150 hover:scale-110 active:scale-95 sm:size-11";
    if (social.href && social.mode === "link") {
      return (
        <a
          href={social.href}
          target={social.href.startsWith("mailto:") ? undefined : "_blank"}
          rel="noreferrer"
          title={social.label}
          aria-label={social.label}
          className={className}
          onClick={(e) => handleSocial(social, e)}
        >
          {inner}
        </a>
      );
    }
    return (
      <button
        type="button"
        title={`${social.label}: ${social.value}`}
        aria-label={`Copy ${social.label}`}
        className={className}
        onClick={(e) => handleSocial(social, e)}
      >
        {inner}
      </button>
    );
  }

  const video = isVideoSrc(data.background);

  return (
    <div className="relative min-h-dvh overflow-hidden text-fg">
      {video ? (
        <video
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          poster={data.poster}
          aria-hidden="true"
        >
          <source src={data.background} type="video/mp4" />
        </video>
      ) : (
        <img
          src={data.background}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div className="pointer-events-none absolute inset-0 scene-veil" />
      <Snowflakes />

      <main className="relative z-20 mx-auto flex min-h-dvh w-full max-w-lg flex-col items-center justify-center px-5 py-10 text-center">
        <div className="avatar-wrap relative mb-5">
          <img
            src={data.avatar}
            alt=""
            width={128}
            height={128}
            className="avatar-img relative z-10 size-[7.25rem] rounded-full object-cover sm:size-32"
          />
        </div>

        <div className="relative mb-3">
          <span className="sparkle sparkle-a" />
          <span className="sparkle sparkle-b" />
          <span className="sparkle sparkle-c" />
          <h1 className="name-glow font-display text-[2rem] leading-tight font-medium tracking-tight text-balance sm:text-[2.4rem]">
            {data.displayName}
          </h1>
        </div>

        <p className="mb-4 max-w-md text-[15px] leading-relaxed text-pretty text-muted whitespace-pre-line">
          {data.description}
        </p>

        <p className="mb-7 flex items-center gap-1.5 text-sm text-muted">
          <MapPin className="size-3.5 text-fg/80" strokeWidth={2} />
          {data.location}
        </p>

        <div className="mb-8 flex w-full max-w-[22.5rem] flex-col items-center gap-4 sm:max-w-sm">
          <ul className="flex w-full flex-wrap items-center justify-center gap-x-2 gap-y-3 sm:gap-x-3.5">
            {data.socials.slice(0, 8).map((social) => (
              <li key={social.id}>{renderSocial(social)}</li>
            ))}
          </ul>
          {data.socials.length > 8 ? (
            <ul className="flex flex-wrap items-center justify-center gap-x-3 gap-y-3 sm:gap-x-4">
              {data.socials.slice(8).map((social) => (
                <li key={social.id}>{renderSocial(social)}</li>
              ))}
            </ul>
          ) : null}
        </div>

        <p className="absolute bottom-6 left-5 flex items-center gap-1.5 text-sm text-muted tabular-nums">
          <Eye className="size-4" strokeWidth={1.75} />
          {views ?? "—"}
        </p>
      </main>
      {data.youtubeTracks.length ? (
        <YoutubePlayer tracks={data.youtubeTracks} />
      ) : null}
    </div>
  );
}
