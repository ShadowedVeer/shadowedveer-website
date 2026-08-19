import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { KeyRound } from "lucide-react";
import { AdminEditor } from "@/components/admin-editor";
import {
  adminLogin,
  getAdminSession,
  getAdminToken,
  getPublicProfile,
  setAdminToken,
} from "@/lib/admin";
import type { PublicProfile } from "@/lib/profile";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

function AdminPage() {
  const [state, setState] = useState<"loading" | "guest" | "admin">("loading");
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const session = await getAdminSession({ data: getAdminToken() });
        if (!session.ok) {
          setState("guest");
          return;
        }
        const data = await getPublicProfile();
        setProfile(data);
        setState("admin");
      } catch {
        setState("guest");
      }
    })();
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await adminLogin({ data: password });
      setPassword("");
      if (!result.ok) {
        setError("Wrong password");
        return;
      }
      setAdminToken(result.token);
      const data = await getPublicProfile();
      setProfile(data);
      setState("admin");
    } catch {
      setError("Could not sign in");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative min-h-dvh overflow-x-hidden bg-bg px-4 py-10 text-fg sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgb(255_255_255_/_6%),transparent_50%)]" />
      <div className="relative mx-auto w-full max-w-lg">
        <p className="text-xs tracking-[0.2em] text-subtle uppercase">
          shadowedveer.lol/admin
        </p>
        {state === "loading" ? (
          <div className="mt-8 h-40 animate-pulse rounded-2xl bg-fg/5" />
        ) : state === "guest" ? (
          <div className="mt-6 rounded-2xl border border-glass-border bg-glass p-6 backdrop-blur-xl">
            <div className="mb-5 flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-fg/10">
                <KeyRound className="size-5" />
              </span>
              <div>
                <h1 className="text-xl font-medium">Login with password</h1>
                <p className="text-sm text-muted">Owner access only.</p>
              </div>
            </div>
            <form onSubmit={(e) => void onSubmit(e)} className="space-y-3">
              <label className="block text-left text-xs text-muted">
                Password
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-glass-border bg-bg/60 px-3 py-2.5 text-sm text-fg outline-none focus:border-fg/40"
                />
              </label>
              {error ? <p className="text-sm text-danger">{error}</p> : null}
              <button
                type="submit"
                disabled={busy || !password}
                className="w-full rounded-xl bg-fg px-3 py-2.5 text-sm font-medium text-bg disabled:opacity-50"
              >
                {busy ? "Checking…" : "Enter"}
              </button>
            </form>
            <Link
              to="/"
              className="mt-4 block text-center text-sm text-muted underline-offset-4 hover:text-fg hover:underline"
            >
              Back to profile
            </Link>
          </div>
        ) : profile ? (
          <div className="mt-6">
            <h1 className="mb-5 text-2xl font-medium">Edit profile</h1>
            <AdminEditor initial={profile} />
          </div>
        ) : null}
      </div>
    </main>
  );
}
