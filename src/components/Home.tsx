import { useEffect, useMemo, useState } from "react";
import { Headphones, Mic, GraduationCap, MoreVertical } from "lucide-react";
import { supabase } from "../lib/supabase";

type LanguageRow = {
  language_code: string | null;
  count: number | null;
};

type Props = {
  userId: string;
  refreshKey: number;
  onStudy: (languageCode: string) => void;
  onListen: (languageCode: string) => void;
  onSpeak: (languageCode: string) => void;
  onAddWords: (languageCode: string) => void;
  onManageLanguage: (languageCode: string, label: string) => void;
};

const LABELS: Record<string, string> = {
  de: "German",
  ko: "Korean",
  ja: "Japanese",
  es: "Spanish",
  en: "English",
  fr: "French",
  pt: "Portuguese",
};

function Home({
  userId,
  refreshKey,
  onStudy,
  onListen,
  onSpeak,
  onAddWords,
  onManageLanguage,
}: Props) {
  const [languages, setLanguages] = useState<LanguageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);

  useEffect(() => {
    const fetchLanguages = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .rpc("get_languages_with_count", { uid: userId });

      if (!error && data) {
        setLanguages(data as LanguageRow[]);
      }

      setLoading(false);
    };

    if (userId) fetchLanguages();
  }, [userId, refreshKey]);

  const actionButtonClass =
    "flex h-10 w-10 items-center justify-center rounded-full bg-white/25 text-white transition hover:-translate-y-0.5 hover:bg-white/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:translate-y-0";

  useEffect(() => {
    const closeMenu = () => setMenuOpenFor(null);
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);

  const sortedLanguages = useMemo(
    () =>
      [...languages].sort((a, b) => (b.count ?? 0) - (a.count ?? 0)),
    [languages],
  );

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <p className="text-sm uppercase tracking-wide text-cyan-600">Your languages</p>
        <h2 className="text-3xl font-extrabold text-slate-900">Pick a deck to study</h2>
        <p className="mt-1 text-sm text-slate-600">
          Words are grouped by language. Cards and actions are coming next.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 rounded-3xl bg-white px-5 py-4 shadow-sm">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
          <span className="text-sm text-slate-600">Loading languages…</span>
        </div>
      ) : sortedLanguages.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
          <p className="text-lg font-semibold text-slate-800">No words yet</p>
          <p className="mt-1 text-sm text-slate-500">Add some words to start building decks.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sortedLanguages.map((lang) => {
            const code = lang.language_code ?? "";
            const count = lang.count ?? 0;
            const displayCode = code ? code.toUpperCase() : "—";
            const languageLabel = LABELS[code] ?? displayCode;

            return (
              <div
                key={code}
                className="relative flex items-center justify-between rounded-full bg-cyan-400/80 px-6 py-4 text-white shadow-md"
              >
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-white/20 px-4 py-2 text-lg font-extrabold">
                    {languageLabel}
                  </span>
                  <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
                    {displayCode}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-white/30 px-3 py-1 text-xs font-semibold">
                    {count} words
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => code && onStudy(code)}
                      className={actionButtonClass}
                      aria-label={`Study ${languageLabel}`}
                      title="Study"
                    >
                      <GraduationCap className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => code && onListen(code)}
                      className={actionButtonClass}
                      aria-label={`Listening test for ${languageLabel}`}
                      title="Listening"
                    >
                      <Headphones className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => code && onSpeak(code)}
                      className={actionButtonClass}
                      aria-label={`Speaking test for ${languageLabel}`}
                      title="Speaking"
                    >
                      <Mic className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenFor((prev) => (prev === code ? null : code));
                      }}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-white/25 text-white transition hover:bg-white/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                      aria-label={`More options for ${languageLabel}`}
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>
                    {menuOpenFor === code && (
                      <div className="absolute right-0 top-12 z-20 w-56 rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-lg">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenFor(null);
                            onAddWords(code);
                          }}
                          className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold transition hover:bg-slate-50"
                        >
                          Add or edit words
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenFor(null);
                            onManageLanguage(code, languageLabel);
                          }}
                          className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold transition hover:bg-slate-50"
                        >
                          Manage / delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Home;
