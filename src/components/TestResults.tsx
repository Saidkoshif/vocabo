import { CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { TestResultData } from "./ListeningTest";

type Props = {
  results: TestResultData[];
  testType: "listen_write" | "read_speak";
  onRestart: () => void;
};

function TestResults({ results, testType, onRestart }: Props) {
  const correctCount = results.filter((r) => r.correct).length;
  const accuracy = results.length ? Math.round((correctCount / results.length) * 100) : 0;

  return (
    <div className="rounded-3xl bg-white p-8 shadow-lg shadow-emerald-100/60">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-emerald-600">Results</p>
          <h2 className="text-3xl font-extrabold text-slate-900">Your performance</h2>
          <p className="mt-2 text-sm text-slate-600">
            Test type: {testType === "listen_write" ? "Listening" : "Speaking"}
          </p>
        </div>
        <div className="rounded-2xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
          Accuracy {accuracy}%
        </div>
      </div>

      <div className="mt-6 grid gap-3">
        {results.map((result) => (
          <div
            key={result.id}
            className="flex items-start justify-between rounded-2xl border border-slate-100 bg-gradient-to-r from-white to-emerald-50 px-5 py-4"
          >
            <div>
              <p className="text-sm font-semibold text-slate-700">Word ID: {result.word_id}</p>
              <p className="text-sm text-slate-600">Your answer: {result.user_answer}</p>
            </div>
            {result.correct ? (
              <div className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" /> Correct
              </div>
            ) : (
              <div className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700">
                <XCircle className="h-4 w-4" /> Needs work
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between rounded-2xl bg-slate-50 px-5 py-4">
        <div>
          <p className="text-xl font-extrabold text-slate-900">{accuracy}%</p>
          <p className="text-sm text-slate-600">
            {correctCount} / {results.length} correct
          </p>
        </div>
        <button
          onClick={onRestart}
          className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2 text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-600"
        >
          <RotateCcw className="h-5 w-5" />
          Restart
        </button>
      </div>
    </div>
  );
}

export default TestResults;
