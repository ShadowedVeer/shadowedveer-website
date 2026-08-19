import { createFileRoute, Link } from "@tanstack/react-router";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-bg px-6 text-fg">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgb(255_255_255_/_6%),transparent_55%)]" />
      <div className="relative w-full max-w-sm space-y-5 rounded-2xl border border-glass-border bg-glass p-6 backdrop-blur-xl">
        <div>
          <p className="text-xs tracking-[0.2em] text-subtle uppercase">ShadowedVeer</p>
          <h1 className="mt-1 text-xl font-medium">Sign in</h1>
          <p className="mt-1 text-sm text-muted">
            Optional — the profile is public. Sign in to save your visit.
          </p>
        </div>
        {authEnabled ? (
          <div className="space-y-2">
            {GROK_PROVIDERS.map((p) => (
              <button
                key={p.providerId}
                type="button"
                onClick={() => signIn(p.providerId, { callbackURL: "/" })}
                className="w-full rounded-xl border border-glass-border bg-fg/5 px-4 py-2.5 text-sm font-medium transition-colors duration-150 hover:bg-fg/10"
              >
                Continue with {p.label}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-subtle">Sign-in is disabled.</p>
        )}
        <Link
          to="/"
          className="block text-center text-sm text-muted underline decoration-fg/30 underline-offset-4 hover:text-fg"
        >
          Back to profile
        </Link>
      </div>
    </main>
  );
}
