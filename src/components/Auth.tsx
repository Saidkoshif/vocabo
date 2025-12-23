import { useState } from "react";
import { Mail, Lock, LogIn, UserPlus } from "lucide-react";
import { supabase, type AuthUser } from "../lib/supabase";

type Props = {
  onAuthSuccess: (user: AuthUser) => void;
};

type Mode = "signin" | "signup";

function Auth({ onAuthSuccess }: Props) {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (evt: React.FormEvent) => {
    evt.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "signin") {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        if (data.session?.user) onAuthSuccess(data.session.user);
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;
        if (data.session?.user) onAuthSuccess(data.session.user);
      }
    } catch (err: any) {
      setError(err?.message ?? "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg rounded-3xl bg-white p-10 shadow-xl shadow-emerald-100/50">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            📚
          </div>
          <div>
            <p className="text-sm uppercase tracking-wide text-emerald-600">Vocabo</p>
            <h1 className="text-2xl font-extrabold text-slate-900">
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </h1>
          </div>
        </div>

        <p className="mb-6 text-sm text-slate-600">
          Learn smarter with personalized vocabulary practice. Sign in to manage your words, study,
          and track your listening and speaking progress.
        </p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="relative block">
            <span className="absolute left-3 top-3 text-slate-400">
              <Mail className="h-5 w-5" />
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pl-11 text-slate-800 shadow-inner focus:border-emerald-400 focus:bg-white focus:shadow-emerald-100"
            />
          </label>

          <label className="relative block">
            <span className="absolute left-3 top-3 text-slate-400">
              <Lock className="h-5 w-5" />
            </span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pl-11 text-slate-800 shadow-inner focus:border-emerald-400 focus:bg-white focus:shadow-emerald-100"
            />
          </label>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-base font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {mode === "signin" ? (
              <>
                <LogIn className="h-5 w-5" /> Sign in
              </>
            ) : (
              <>
                <UserPlus className="h-5 w-5" /> Create account
              </>
            )}
          </button>
        </form>

        <div className="mt-5 flex items-center justify-center gap-2 text-sm text-slate-600">
          <span>{mode === "signin" ? "New to Vocabo?" : "Already have an account?"}</span>
          <button
            className="font-semibold text-emerald-600 hover:text-emerald-700"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            type="button"
          >
            {mode === "signin" ? "Sign up" : "Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Auth;
