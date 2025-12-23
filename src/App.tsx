import { useEffect, useMemo, useState } from "react";
import Auth from "./components/Auth";
import AddWords from "./components/AddWords";
import StudyMode from "./components/StudyMode";
import ListeningTest, { TestResultData } from "./components/ListeningTest";
import SpeakingTest from "./components/SpeakingTest";
import TestResults from "./components/TestResults";
import LanguagePickerModal from "./components/LanguagePickerModal";
import Sidebar, { type NavKey } from "./components/Sidebar";
import ManageLanguageModal from "./components/ManageLanguageModal";
import Home from "./components/Home";
import { supabase, type AuthUser, type Word } from "./lib/supabase";

type Mode = "home" | "add" | "study" | "listening-test" | "speaking-test" | "results";
type PickerContext = "add" | "study" | "listen" | "speak" | null;
type LanguageOption = { code: string; name: string; count?: number };

const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "de", name: "German" },
  { code: "ko", name: "Korean" },
  { code: "ja", name: "Japanese" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "pt", name: "Portuguese" },
  { code: "en", name: "English" },
];

function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [mode, setMode] = useState<Mode>("home");
  const [words, setWords] = useState<Word[]>([]);
  const [languageWords, setLanguageWords] = useState<Word[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState("");
  const [loading, setLoading] = useState(true);
  const [testResults, setTestResults] = useState<TestResultData[]>([]);
  const [currentTestType, setCurrentTestType] = useState<"listen_write" | "read_speak">(
    "listen_write",
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerContext, setPickerContext] = useState<PickerContext>(null);
  const [manageLanguage, setManageLanguage] = useState<{ code: string; label: string } | null>(
    null,
  );

  useEffect(() => {
    const fetchSession = async () => {
      const { data } = await supabase.auth.getSession();
      const activeUser = data.session?.user ?? null;
      setUser(activeUser);
      if (activeUser) {
        loadWords(activeUser.id);
      }
      setLoading(false);
    };

    fetchSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      if (nextUser) {
        loadWords(nextUser.id);
      } else {
        setWords([]);
        setLanguageWords([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadWords = async (userId: string) => {
    const { data, error } = await supabase
      .from("words")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load words", error);
      return;
    }

    const normalized = (data ?? []).map((word) => ({
      ...word,
      language_code: (word as Word).language_code ?? (word as Word).target_language,
    })) as Word[];
    setWords(normalized);
  };

  const loadWordsByLanguage = async (userId: string, languageCode: string) => {
    const { data, error } = await supabase
      .from("words")
      .select("*")
      .eq("user_id", userId)
      .or(`language_code.eq.${languageCode},target_language.eq.${languageCode}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load language-specific words", error);
      return [];
    }

    const normalized = (data ?? []).map((word) => ({
      ...word,
      language_code: (word as Word).language_code ?? (word as Word).target_language,
    })) as Word[];
    setLanguageWords(normalized);
    return normalized;
  };

  const createSession = async (type: "study" | "test", selectedWords: Word[]) => {
    if (!user) throw new Error("No user");
    const wordIds = selectedWords.slice(0, 20).map((w) => w.id);
    const { data, error } = await supabase
      .from("learning_sessions")
      .insert({
        user_id: user.id,
        word_ids: wordIds,
        session_type: type,
        completed: false,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data.id as string;
  };

  const startStudySession = async (languageCode: string) => {
    if (!user) return;
    const filtered = await loadWordsByLanguage(user.id, languageCode);
    if (filtered.length === 0) {
      alert("No words saved for this language yet. Add some first.");
      return;
    }
    try {
      const id = await createSession("study", filtered);
      setSessionId(id);
      setLanguageWords(filtered);
      setMode("study");
    } catch (err) {
      console.error("Failed to start study session", err);
    }
  };

  const startTest = async (testType: "listen_write" | "read_speak", languageCode: string) => {
    if (!user) return;
    const filtered = await loadWordsByLanguage(user.id, languageCode);
    if (filtered.length === 0) {
      alert("No words saved for this language yet. Add some first.");
      return;
    }
    try {
      const id = await createSession("test", filtered);
      setSessionId(id);
      setLanguageWords(filtered);
      setCurrentTestType(testType);
      setMode(testType === "listen_write" ? "listening-test" : "speaking-test");
    } catch (err) {
      console.error("Failed to start test", err);
    }
  };

  const handleTestComplete = (results: TestResultData[]) => {
    setTestResults(results);
    setMode("results");
  };

  const handleRestart = () => {
    setMode("home");
    setTestResults([]);
    setLanguageWords([]);
    setSelectedLanguage(null);
    if (user) loadWords(user.id);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setMode("home");
    setWords([]);
    setLanguageWords([]);
    setSessionId("");
    setTestResults([]);
  };

  const languageCounts = useMemo(() => {
    return words.reduce<Record<string, number>>((acc, word) => {
      const code = word.language_code ?? word.target_language;
      if (!code) return acc;
      acc[code] = (acc[code] || 0) + 1;
      return acc;
    }, {});
  }, [words]);

  const learningLanguages = useMemo(() => {
    return SUPPORTED_LANGUAGES.map((lang) => ({
      ...lang,
      count: languageCounts[lang.code] ?? 0,
    })).filter((lang) => lang.count > 0);
  }, [languageCounts]);

  const openPicker = (context: PickerContext) => {
    setPickerContext(context);
    setPickerOpen(true);
  };

  const handleLanguageSelect = async (code: string) => {
    setPickerOpen(false);
    setSelectedLanguage(code);

    if (pickerContext === "add") {
      setMode("add");
      return;
    }

    if (!user) return;

    if (pickerContext === "study") {
      await startStudySession(code);
    } else if (pickerContext === "listen") {
      await startTest("listen_write", code);
    } else if (pickerContext === "speak") {
      await startTest("read_speak", code);
    }
  };

  const handleLanguageAction = async (
    action: "study" | "listen" | "speak",
    languageCode: string,
  ) => {
    setSelectedLanguage(languageCode);

    if (action === "study") {
      await startStudySession(languageCode);
      return;
    }

    if (action === "listen") {
      await startTest("listen_write", languageCode);
      return;
    }

    await startTest("read_speak", languageCode);
  };

  const handleAddForLanguage = (languageCode: string) => {
    setSelectedLanguage(languageCode);
    setMode("add");
  };

  const handleManageLanguage = (code: string, label: string) => {
    setManageLanguage({ code, label });
  };

  const refreshUserWords = async () => {
    if (!user) return;
    await loadWords(user.id);
    if (selectedLanguage) {
      await loadWordsByLanguage(user.id, selectedLanguage);
    }
  };

  const activeNav: NavKey = useMemo(() => {
    if (mode === "study") return "study";
    if (mode === "listening-test") return "listen";
    if (mode === "speaking-test") return "speak";
    if (mode === "add") return "add";
    return "home";
  }, [mode]);

  const handleNav = (key: NavKey) => {
    if (key === "home") {
      setMode("home");
      return;
    }
    if (key === "study") {
      openPicker("study");
    } else if (key === "listen") {
      openPicker("listen");
    } else if (key === "speak") {
      openPicker("speak");
    } else if (key === "add") {
      openPicker("add");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5FAFC]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <Auth
        onAuthSuccess={(signedInUser) => {
          setUser(signedInUser);
          setMode("home");
          loadWords(signedInUser.id);
        }}
      />
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F5FAFC] text-slate-900">
      <Sidebar active={activeNav} onNavigate={handleNav} />
      <div className="h-screen w-px bg-slate-200/80" aria-hidden />

      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-end px-6 py-4">
          <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm">
            {user.email}
          </div>
          <button
            onClick={handleSignOut}
            className="ml-3 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
          >
            Sign out
          </button>
        </div>

        <main className="flex-1 overflow-y-auto px-8 pb-10">
          {mode === "home" && (
            <Home
              userId={user.id}
              refreshKey={words.length}
              onStudy={(code) => handleLanguageAction("study", code)}
              onListen={(code) => handleLanguageAction("listen", code)}
              onSpeak={(code) => handleLanguageAction("speak", code)}
              onAddWords={handleAddForLanguage}
              onManageLanguage={handleManageLanguage}
            />
          )}

          {mode === "add" && (
            <div className="mx-auto max-w-5xl">
              <AddWords
                userId={user.id}
                defaultLanguageCode={selectedLanguage ?? undefined}
                onWordsAdded={(inserted) => {
                  setWords((prev) => {
                    const normalized = inserted.map((word) => ({
                      ...word,
                      language_code: (word as Word).language_code ?? (word as Word).target_language,
                    })) as Word[];
                    return [...normalized, ...prev];
                  });
                  setMode("home");
                }}
              />
            </div>
          )}

          {mode === "study" && (
            <div className="mx-auto max-w-5xl">
              <StudyMode
                words={languageWords.slice(0, 20)}
                selectedLanguage={selectedLanguage}
                onComplete={() => selectedLanguage && startTest("listen_write", selectedLanguage)}
              />
            </div>
          )}

          {mode === "listening-test" && (
            <div className="mx-auto max-w-5xl">
              <ListeningTest
                words={languageWords.slice(0, 20)}
                sessionId={sessionId}
                onComplete={(results) => handleTestComplete(results)}
              />
            </div>
          )}

          {mode === "speaking-test" && (
            <div className="mx-auto max-w-5xl">
              <SpeakingTest
                words={languageWords.slice(0, 20)}
                sessionId={sessionId}
                onComplete={(results) => handleTestComplete(results)}
              />
            </div>
          )}

          {mode === "results" && (
            <div className="mx-auto max-w-5xl">
              <TestResults
                results={testResults}
                testType={currentTestType}
                onRestart={handleRestart}
              />
            </div>
          )}
        </main>
      </div>

      <LanguagePickerModal
        open={pickerOpen}
        languages={
          pickerContext === "add"
            ? SUPPORTED_LANGUAGES
            : learningLanguages.length > 0
              ? learningLanguages
              : SUPPORTED_LANGUAGES
        }
        onClose={() => setPickerOpen(false)}
        onSelect={handleLanguageSelect}
        showCounts={pickerContext !== "add"}
        title={
          pickerContext === "add"
            ? "Which language are you adding?"
            : "Choose a language to study"
        }
      />
      <ManageLanguageModal
        open={!!manageLanguage}
        languageCode={manageLanguage?.code ?? null}
        languageLabel={manageLanguage?.label ?? ""}
        userId={user.id}
        onClose={() => setManageLanguage(null)}
        onWordsChanged={refreshUserWords}
      />
    </div>
  );
}

export default App;
