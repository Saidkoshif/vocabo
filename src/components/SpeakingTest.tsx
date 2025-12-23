import { useEffect, useMemo, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { supabase, type Word, type TestResult } from "../lib/supabase";

export type SpeechResult = TestResult;

type Props = {
  words: Word[];
  sessionId: string;
  onComplete: (results: SpeechResult[]) => void;
};

function getRecognition(): SpeechRecognition | null {
  const SpeechRecognition =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition ||
    (window as any).mozSpeechRecognition ||
    (window as any).msSpeechRecognition;
  if (!SpeechRecognition) return null;
  return new SpeechRecognition();
}

function SpeakingTest({ words, sessionId, onComplete }: Props) {
  const deck = useMemo(() => words.slice(0, 20), [words]);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<SpeechResult[]>([]);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const current = deck[index];

  useEffect(() => {
    recognitionRef.current = getRecognition();
    if (recognitionRef.current) {
      recognitionRef.current.lang = current?.target_language || "en";
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
    }
  }, [current]);

  const handleStart = () => {
    const recognition = recognitionRef.current;
    if (!recognition || !current) {
      alert("Speech Recognition not supported in this browser.");
      return;
    }
    recognition.lang = current.target_language;
    setListening(true);
    recognition.start();

    recognition.onresult = async (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      recognition.stop();
      setListening(false);

      const isCorrect = transcript.trim().toLowerCase() === current.original_word.trim().toLowerCase();
      const payload = {
        session_id: sessionId,
        word_id: current.id,
        test_type: "read_speak" as const,
        correct: isCorrect,
        user_answer: transcript.trim(),
      };

      try {
        const { data, error } = await supabase.from("test_results").insert(payload).select();
        if (error) throw error;
        const saved = (data ?? []) as SpeechResult[];
        const updated = [...results, saved[0]];
        setResults(updated);

        if (index === deck.length - 1) {
          await supabase.from("learning_sessions").update({ completed: true }).eq("id", sessionId);
          onComplete(updated);
        } else {
          setIndex((prev) => prev + 1);
        }
      } catch (err) {
        console.error("Failed to store speaking test result", err);
      }
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.onerror = () => {
      setListening(false);
    };
  };

  return (
    <div className="rounded-3xl bg-white p-8 shadow-lg shadow-emerald-100/60">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-emerald-600">Speaking test</p>
          <h2 className="text-3xl font-extrabold text-slate-900">Read aloud and get instant score</h2>
          <p className="mt-2 text-sm text-slate-600">
            Speak the word you see. We use Web Speech API to capture and score your pronunciation.
          </p>
        </div>
        <Mic className="h-10 w-10 text-emerald-400" />
      </div>

      <div className="mt-6 rounded-3xl bg-gradient-to-br from-orange-50 via-white to-emerald-50 p-8 shadow-inner">
        <div className="flex items-center justify-between text-sm font-semibold text-emerald-700">
          <span>
            Word {index + 1} / {deck.length}
          </span>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-700">
            Session {sessionId.slice(0, 8)}
          </span>
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm text-slate-500">Say this word in {current.target_language.toUpperCase()}</p>
          <div className="mt-3 text-4xl font-extrabold text-slate-900">{current.original_word}</div>
          <div className="mt-2 text-sm text-slate-500">Translation: {current.translation}</div>

          <button
            type="button"
            onClick={handleStart}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-base font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-600"
          >
            {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            {listening ? "Listening..." : "Start speaking"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SpeakingTest;
