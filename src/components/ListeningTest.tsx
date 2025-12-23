import { FormEvent, useMemo, useState } from "react";
import { Ear, Volume2 } from "lucide-react";
import { supabase, type Word, type TestResult } from "../lib/supabase";

export type TestResultData = TestResult;

type Props = {
  words: Word[];
  sessionId: string;
  onComplete: (results: TestResultData[]) => void;
};

function speak(text: string, lang: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang || "en";
  utterance.rate = 0.95;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

function normalize(text: string) {
  return text.trim().toLowerCase();
}

function ListeningTest({ words, sessionId, onComplete }: Props) {
  const deck = useMemo(() => words.slice(0, 20), [words]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [results, setResults] = useState<TestResultData[]>([]);
  const [saving, setSaving] = useState(false);
  const current = deck[index];

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!current) return;
    setSaving(true);

    const isCorrect = normalize(answer) === normalize(current.translation);
    const resultPayload = {
      session_id: sessionId,
      word_id: current.id,
      test_type: "listen_write" as const,
      correct: isCorrect,
      user_answer: answer.trim(),
    };

    try {
      const { data, error } = await supabase.from("test_results").insert(resultPayload).select();
      if (error) throw error;
      const saved = (data ?? []) as TestResultData[];

      const updated = [...results, saved[0]];
      setResults(updated);
      setAnswer("");

      if (index === deck.length - 1) {
        await supabase.from("learning_sessions").update({ completed: true }).eq("id", sessionId);
        onComplete(updated);
      } else {
        setIndex((prev) => prev + 1);
      }
    } catch (err) {
      console.error("Failed to save listening test result", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-3xl bg-white p-8 shadow-lg shadow-emerald-100/60">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-emerald-600">Listening test</p>
          <h2 className="text-3xl font-extrabold text-slate-900">Hear and type what you hear</h2>
          <p className="mt-2 text-sm text-slate-600">
            Press play to listen, then write the correct translation.
          </p>
        </div>
        <Ear className="h-10 w-10 text-emerald-400" />
      </div>

      <div className="mt-6 rounded-3xl bg-gradient-to-br from-cyan-50 via-white to-emerald-50 p-8 shadow-inner">
        <div className="flex items-center justify-between text-sm font-semibold text-emerald-700">
          <span>
            Word {index + 1} / {deck.length}
          </span>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-700">
            Session {sessionId.slice(0, 8)}
          </span>
        </div>

        <div className="mt-4 flex flex-col items-center gap-4 text-center">
          <button
            type="button"
            onClick={() => speak(current.translation, current.target_language)}
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-emerald-700 shadow shadow-emerald-100 transition hover:bg-emerald-50"
          >
            <Volume2 className="h-5 w-5" />
            Play prompt
          </button>
          <p className="text-sm text-slate-500">
            Language: {current.target_language.toUpperCase()} • Answer in {current.source_language.toUpperCase()}
          </p>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-semibold text-slate-700">
            Your answer
            <input
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-lg text-slate-800 focus:border-emerald-400 focus:bg-white"
              placeholder="Type what you heard"
              required
            />
          </label>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-base font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ListeningTest;
