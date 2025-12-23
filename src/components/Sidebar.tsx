import { BookOpen, Home, GraduationCap, Headphones, Mic, Plus } from "lucide-react";

type NavKey = "home" | "study" | "listen" | "speak" | "add";

type Props = {
  active: NavKey;
  onNavigate: (key: NavKey) => void;
};

const navItems: { key: NavKey; label: string; icon: typeof Home }[] = [
  { key: "home", label: "Home", icon: Home },
  { key: "study", label: "Study", icon: GraduationCap },
  { key: "listen", label: "Listening", icon: Headphones },
  { key: "speak", label: "Speaking", icon: Mic },
  { key: "add", label: "Add", icon: Plus },
];

function Sidebar({ active, onNavigate }: Props) {
  return (
    <aside className="flex h-screen w-[250px] flex-col bg-[#F5FAFC] px-5 py-6">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-600 shadow-sm">
          <BookOpen className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-cyan-600">Vocabo</p>
          <h1 className="text-lg font-extrabold text-slate-900">Learn faster</h1>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-2">
        {navItems.map(({ key, label, icon: Icon }) => {
          const isActive = key === active;
          const isAdd = key === "add";
          const buttonClasses = isAdd
            ? `group flex items-center gap-3 rounded-2xl px-4 py-4 text-left text-base font-bold transition ${
                isActive
                  ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg ring-2 ring-orange-200/70"
                  : "bg-gradient-to-r from-orange-400 to-pink-400 text-white shadow-md hover:scale-[1.01] hover:shadow-lg"
              }`
            : `flex items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                isActive
                  ? "border-sky-400 bg-white text-slate-900 shadow-sm"
                  : "border-transparent bg-transparent text-slate-700 hover:border-sky-200 hover:bg-white"
              }`;
          const iconWrapperClasses = isAdd
            ? "flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 text-white transition group-hover:bg-white/25"
            : `flex h-9 w-9 items-center justify-center rounded-xl ${
                isActive ? "bg-sky-50 text-sky-500" : "bg-slate-100 text-slate-500"
              }`;

          return (
            <button
              key={key}
              onClick={() => onNavigate(key)}
              className={buttonClasses}
            >
              <span className={iconWrapperClasses}>
                <Icon className={isAdd ? "h-6 w-6" : "h-5 w-5"} />
              </span>
              <span>{label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

export type { NavKey };
export default Sidebar;
