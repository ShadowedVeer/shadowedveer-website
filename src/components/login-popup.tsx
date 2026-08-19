import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { KeyRound, LogOut, X } from "lucide-react";
import {
  adminLogin,
  adminLogout,
  clearAdminToken,
  getAdminSession,
  getAdminToken,
  setAdminToken,
} from "@/lib/admin";

export function LoginPopup() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void getAdminSession({ data: getAdminToken() })
      .then((r) => setAuthed(r.ok))
      .catch(() => setAuthed(false));
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
      setAuthed(true);
      setOpen(false);
      await navigate({ to: "/admin" });
    } catch {
      setError("Could not sign in");
    } finally {
      setBusy(false);
    }
  }

  async function onLogout() {
    await adminLogout({ data: getAdminToken() }).catch(() => undefined);
    clearAdminToken();
    setAuthed(false);
    setOpen(false);
  }

  return (
    <div className="fixed right-4 bottom-5 z-40 sm:right-6">
      {open ? (
        <div className="w-72 rounded-2xl border border-glass-border bg-glass p-4 shadow-2xl backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium">
              {authed ? "Admin" : "Login with password"}
            </p>
            <button
              type="button"
              className="grid size-8 place-items-center rounded-full text-muted hover:text-fg"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>
          {authed ? (
            <div className="space-y-2">
              <button
                type="button"
                className="w-full rounded-xl bg-fg px-3 py-2.5 text-sm font-medium text-bg"
                onClick={() => navigate({ to: "/admin" })}
              >
                Edit profile
              </button>
              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-glass-border px-3 py-2.5 text-sm text-muted hover:text-fg"
                onClick={() => void onLogout()}
              >
                <LogOut className="size-4" />
                Log out
              </button>
            </div>
          ) : (
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
              {error ? <p className="text-xs text-danger">{error}</p> : null}
              <button
                type="submit"
                disabled={busy || !password}
                className="w-full rounded-xl bg-fg px-3 py-2.5 text-sm font-medium text-bg disabled:opacity-50"
              >
                {busy ? "Checking…" : "Enter"}
              </button>
            </form>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-full border border-glass-border bg-glass px-3.5 py-2 text-xs font-medium text-fg shadow-lg backdrop-blur-xl hover:bg-fg/10"
        >
          <KeyRound className="size-3.5" />
          Login with password
        </button>
      )}
    </div>
  );
}
