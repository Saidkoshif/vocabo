import { X } from "lucide-react";

type LanguageOption = {
  code: string;
  name: string;
  count?: number;
};

type Props = {
  open: boolean;
  title?: string;
  languages: LanguageOption[];
  onClose: () => void;
  onSelect: (code: string) => void;
  showCounts?: boolean;
};

function LanguagePickerModal({
  open,
  title = "Choose a language",
  languages,
  onClose,
  onSelect,
  showCounts = true,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl shadow-emerald-100/70">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-emerald-600">Language</p>
            <h3 className="text-2xl font-extrabold text-slate-900">{title}</h3>
            <p className="mt-1 text-sm text-slate-600">Pick the deck to use for this action.</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-2xl bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => onSelect(lang.code)}
              className="flex items-center justify-between rounded-2xl border border-sky-200 bg-sky-50 px-5 py-4 text-left transition hover:-translate-y-0.5 hover:border-sky-300 hover:bg-white"
            >
              <div>
                <p className="text-sm font-semibold text-slate-700">{lang.name}</p>
                <p className="text-xs text-slate-500 uppercase tracking-wide">{lang.code}</p>
              </div>
              {showCounts && (
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-600 shadow">
                  {lang.count ?? 0} words
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default LanguagePickerModal;
