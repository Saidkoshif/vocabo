import { useEffect, useState } from "react";
import { Loader2, Pencil, Trash, X } from "lucide-react";
import { supabase, type Word } from "../lib/supabase";

type Props = {
  open: boolean;
  languageCode: string | null;
  languageLabel: string;
  userId: string;
  onClose: () => void;
  onWordsChanged: () => void | Promise<void>;
};

function ManageLanguageModal({
  open,
  languageCode,
  languageLabel,
  userId,
  onClose,
  onWordsChanged,
}: Props) {
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editOriginal, setEditOriginal] = useState("");
  const [editTranslation, setEditTranslation] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);

  useEffect(() => {
    const fetchWords = async () => {
      if (!open || !languageCode) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("words")
        .select("*")
        .eq("user_id", userId)
        .or(`language_code.eq.${languageCode},target_language.eq.${languageCode}`)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to load words for language", error);
      }
      const normalized = (data ?? []).map((word) => ({
        ...word,
        language_code: (word as Word).language_code ?? (word as Word).target_language,
      })) as Word[];
      setWords(normalized);
      setLoading(false);
    };

    fetchWords();
  }, [open, languageCode, userId]);

  const startEdit = (word: Word) => {
    setEditingId(word.id);
    setEditOriginal(word.original_word);
    setEditTranslation(word.translation);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditOriginal("");
    setEditTranslation("");
  };

  const handleSave = async (wordId: string) => {
    if (!editOriginal.trim() || !editTranslation.trim()) return;
    setSavingId(wordId);
    const { error } = await supabase
      .from("words")
      .update({
        original_word: editOriginal.trim(),
        translation: editTranslation.trim(),
      })
      .eq("id", wordId)
      .eq("user_id", userId);

    if (error) {
      console.error("Failed to update word", error);
      setSavingId(null);
      return;
    }

    setWords((prev) =>
      prev.map((w) =>
        w.id === wordId
          ? { ...w, original_word: editOriginal.trim(), translation: editTranslation.trim() }
          : w,
      ),
    );
    setSavingId(null);
    cancelEdit();
    await onWordsChanged();
  };

  const handleDeleteWord = async (wordId: string) => {
    setDeletingId(wordId);
    const { error } = await supabase
      .from("words")
      .delete()
      .eq("id", wordId)
      .eq("user_id", userId);

    if (error) {
      console.error("Failed to delete word", error);
      setDeletingId(null);
      return;
    }

    setWords((prev) => prev.filter((w) => w.id !== wordId));
    setDeletingId(null);
    await onWordsChanged();
  };

  const handleDeleteLanguage = async () => {
    if (!languageCode) return;
    const confirmed = window.confirm(
      `Delete the entire ${languageLabel} deck? This removes all words for this language.`,
    );
    if (!confirmed) return;
    setDeletingAll(true);
    const { error } = await supabase
      .from("words")
      .delete()
      .eq("user_id", userId)
      .or(`language_code.eq.${languageCode},target_language.eq.${languageCode}`);

    if (error) {
      console.error("Failed to delete language deck", error);
      setDeletingAll(false);
      return;
    }

    setWords([]);
    setDeletingAll(false);
    await onWordsChanged();
    onClose();
  };

  if (!open || !languageCode) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl shadow-slate-200">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-sky-600">Manage deck</p>
            <h3 className="text-2xl font-extrabold text-slate-900">
              {languageLabel} ({languageCode.toUpperCase()})
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Edit or remove saved words, or delete the entire folder.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-2xl bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 max-h-[60vh] overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50/60">
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-10 text-slate-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading words…</span>
            </div>
          ) : words.length === 0 ? (
            <div className="py-10 text-center text-sm font-semibold text-slate-600">
              No words saved for this language yet.
            </div>
          ) : (
            <ul className="divide-y divide-slate-200">
              {words.map((word) => {
                const isEditing = editingId === word.id;
                const isSaving = savingId === word.id;
                const isDeleting = deletingId === word.id;
                return (
                  <li key={word.id} className="flex items-start gap-4 bg-white/70 px-5 py-4">
                    <div className="flex-1">
                      {isEditing ? (
                        <div className="grid gap-3 md:grid-cols-2">
                          <label className="text-xs font-semibold text-slate-600">
                            Original
                            <input
                              value={editOriginal}
                              onChange={(e) => setEditOriginal(e.target.value)}
                              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                            />
                          </label>
                          <label className="text-xs font-semibold text-slate-600">
                            Translation
                            <input
                              value={editTranslation}
                              onChange={(e) => setEditTranslation(e.target.value)}
                              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                            />
                          </label>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{word.original_word}</p>
                          <p className="text-sm text-slate-600">{word.translation}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => handleSave(word.id)}
                            disabled={isSaving}
                            className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-600 disabled:opacity-60"
                          >
                            {isSaving ? "Saving…" : "Save"}
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => startEdit(word)}
                          className="rounded-xl bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200"
                          aria-label="Edit word"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteWord(word.id)}
                        disabled={isDeleting}
                        className="rounded-xl bg-red-50 p-2 text-red-600 transition hover:bg-red-100 disabled:opacity-60"
                        aria-label="Delete word"
                      >
                        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash className="h-4 w-4" />}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
          >
            Close
          </button>
          <button
            onClick={handleDeleteLanguage}
            disabled={deletingAll}
            className="inline-flex items-center gap-2 rounded-2xl bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-red-600 disabled:opacity-70"
          >
            <Trash className="h-4 w-4" />
            {deletingAll ? "Deleting…" : `Delete ${languageLabel} deck`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ManageLanguageModal;
