import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Volume2, CheckCircle } from "lucide-react";
import { Word } from "../lib/supabase";

type Props = {
  words: Word[];
  onComplete: () => void;
  selectedLanguage?: string | null;
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

function StudyMode({ words, onComplete, selectedLanguage }: Props) {
  const orderedWords = useMemo(() => words.slice(0, 30), [words]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const current = orderedWords[index];
  const total = orderedWords.length;

  const learningLang = selectedLanguage ?? current?.target_language ?? current?.language_code ?? "";
  const isLearningTarget = current?.target_language === learningLang;
  const front = isLearningTarget ? current?.translation : current?.original_word;
  const back = isLearningTarget ? current?.original_word : current?.translation;
  const audioText = front ?? "";
  const audioLang = isLearningTarget ? current?.target_language : current?.source_language;

  const next = () => {
    setRevealed(false);
    setIndex((prev) => Math.min(total - 1, prev + 1));
  };

  const prev = () => {
    setRevealed(false);
    setIndex((prev) => Math.max(0, prev - 1));
  };

  return (
    <div className="rounded-3xl bg-white p-8 shadow-lg shadow-emerald-100/60">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-emerald-600">Study mode</p>
          <h2 className="text-3xl font-extrabold text-slate-900">Flashcards with speech</h2>
          <p className="mt-2 text-sm text-slate-600">
            Tap play to hear the word. Reveal translations, practice aloud, and move to the next
            card.
          </p>
        </div>
        <Volume2 className="h-10 w-10 text-emerald-400" />
      </div>

      <div className="mt-6 rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-8 text-center shadow-inner">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          Card {index + 1} / {total}
        </p>
        <div className="mt-4 text-4xl font-extrabold text-slate-900">{front}</div>
        <div className="mt-2 text-sm text-slate-500">
          {current.source_language} → {current.target_language}
        </div>

        <div className="mt-4 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => speak(audioText, audioLang || "en")}
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-emerald-700 shadow shadow-emerald-100 transition hover:bg-emerald-50"
          >
            <Volume2 className="h-5 w-5" />
            Play
          </button>
          <button
            type="button"
            onClick={() => setRevealed((r) => !r)}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2 text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-600"
          >
            {revealed ? "Hide" : "Reveal"} translation
          </button>
        </div>

        {revealed && (
          <div className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-lg font-semibold text-slate-900 shadow">
            <CheckCircle className="h-5 w-5 text-emerald-500" />
            {back}
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          {index + 1} of {total} cards
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={prev}
            disabled={index === 0}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2 text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ArrowLeft className="h-5 w-5" />
            Previous
          </button>
          <button
            type="button"
            onClick={next}
            disabled={index === total - 1}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2 text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Next
            <ArrowRight className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onComplete}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-2 text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-600"
          >
            Ready for listening test
          </button>
        </div>
      </div>
    </div>
  );
}

export default StudyMode;
