import { useState } from "react";
import { Languages, Save, Sparkles } from "lucide-react";
import { supabase, type Word } from "../lib/supabase";

type Props = {
  userId: string;
  onWordsAdded: (inserted: Word[]) => void;
  defaultLanguageCode?: string;
};

type TranslateResponse = {
  translation: string;
  error?: string;
};

function AddWords({ userId, onWordsAdded, defaultLanguageCode }: Props) {
  const [original, setOriginal] = useState("");
  const [translation, setTranslation] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState("en");
  const [targetLanguage, setTargetLanguage] = useState(defaultLanguageCode ?? "es");
  const [languageCode, setLanguageCode] = useState(defaultLanguageCode ?? "es");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] =
    useState<"idle" | "translated" | "saved" | "error">("idle");
  const [error, setError] = useState("");

  const translateWord = async () => {
    setError("");
    setStatus("idle");

    if (!original.trim()) return;

    setLoading(true);

    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
        original.trim(),
      )}&langpair=${sourceLanguage}|${targetLanguage}`;

      const res = await fetch(url);
      const json = await res.json();

      const translated = json?.responseData?.translatedText;

      if (!translated) {
        throw new Error("No translation returned");
      }

      setTranslation(translated);
      setStatus("translated");
      return translated;
    } catch (err: any) {
      setError("Translation failed (free API limit)");
      setStatus("error");
      return "";
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // SAVE WORD TO DATABASE
  // -----------------------------
  const handleSubmit = async (evt: React.FormEvent) => {
    evt.preventDefault();
    setError("");
    setStatus("idle");

    let translated = translation.trim();
    if (!translated) {
      translated = (await translateWord()) ?? "";
      if (!translated) return;
    }

    setLoading(true);
    try {
      const { data, error: insertError } = await supabase
        .from("words")
        .insert({
          user_id: userId,
          original_word: original.trim(),
          translation: translated,
          source_language: sourceLanguage,
          target_language: targetLanguage,
          language_code: languageCode,
        })
        .select();

      if (insertError) throw insertError;

      if (data) {
        onWordsAdded(data as Word[]);
        setStatus("saved");
        setOriginal("");
        setTranslation("");
      }
    } catch (err: any) {
      setError(err?.message ?? "Could not save word.");
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl bg-white p-8 shadow-lg shadow-emerald-100/60">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-emerald-600">
            Add words
          </p>
          <h2 className="text-3xl font-extrabold text-slate-900">
            Grow your vocabulary
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Translate instantly with your Supabase Edge Function and save to
            your personal deck.
          </p>
        </div>
        <Languages className="h-10 w-10 text-emerald-400" />
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block text-sm font-semibold text-slate-700">
            Source language
            <select
              value={sourceLanguage}
              onChange={(e) => setSourceLanguage(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-emerald-400 focus:bg-white"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="pt">Portuguese</option>
              <option value="ja">Japanese</option>
              <option value="ko">Korean</option>
            </select>
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Target language
            <select
              value={targetLanguage}
              onChange={(e) => {
                const next = e.target.value;
                setTargetLanguage(next);
                setLanguageCode(next);
              }}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-emerald-400 focus:bg-white"
            >
              <option value="es">Spanish</option>
              <option value="en">English</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="pt">Portuguese</option>
              <option value="ja">Japanese</option>
              <option value="ko">Korean</option>
            </select>
            <p className="mt-1 text-xs text-slate-500">
              Saved to your <span className="font-semibold text-emerald-600">{languageCode}</span>{" "}
              folder
            </p>
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="block text-sm font-semibold text-slate-700">
            Word or phrase
            <input
              value={original}
              onChange={(e) => setOriginal(e.target.value)}
              placeholder="Hola"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              required
            />
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Translation
            <div className="mt-2 flex gap-2">
              <input
                value={translation}
                onChange={(e) => setTranslation(e.target.value)}
                placeholder="Hello"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                required
              />
              <button
                type="button"
                onClick={translateWord}
                disabled={loading || !original.trim()}
                className="inline-flex items-center justify-center rounded-2xl bg-emerald-100 px-4 text-emerald-700 hover:bg-emerald-200"
              >
                <Sparkles className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Uses your Supabase Edge Function “translate”
            </p>
          </label>
        </div>

        {error && (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}
        {status === "saved" && (
          <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Saved to your deck! Add another or return home.
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-base font-semibold text-white shadow-lg hover:bg-emerald-600"
          >
            <Save className="h-5 w-5" />
            Save word
          </button>

          {status === "translated" && (
            <span className="inline-flex items-center gap-2 rounded-2xl bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
              <Sparkles className="h-4 w-4" />
              Translated
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

export default AddWords;
