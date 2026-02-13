
import { StartupQuiz, PrototypeData } from "../types";

export const refineProjectBrief = async (
  quiz: StartupQuiz,
  imageData: string | null
): Promise<string> => {
  // FAST LOCAL BRIEF (no network): template based on quiz answers.
  const imgNote = imageData ? "User provided a visual moodboard reference." : "No image reference was provided.";

  return `
--- NOMADGATE VISUAL DNA BRIEF ---
VALUE PROPOSITION:
${quiz.valueProposition || "A playful experimental app prototype."}

TARGET AUDIENCE:
${quiz.targetAudience || "Early adopters and indie builders who love bold UI."}

ESSENTIAL FEATURE:
${quiz.essentialFeatures || "A single hero interaction that feels premium and animated."}

VISUAL NOTES:
- High‑contrast dashboard with soft cards and subtle gradients.
- Mobile‑first, 9:16 layout inspired by creator dashboards.
- ${imgNote}

TECHNICAL NOTES:
- Use a clear primary action at the top.
- Use fake data, but keep copy specific and fun.
--- END BRIEF ---
`.trim();
};

export const generatePrototypeFromBrief = async (
  refinedBrief: string
): Promise<PrototypeData> => {
  return {
    title: "NomadGate Prototype",
    // NOTE: This is a fast, local template so users see instant results.
    // It still respects the "NomadGate" 9:16 layout and uses the refined brief text.
    code: `
function AppDemo() {
  const brief = \`${refinedBrief.replace(/`/g, "\\`")}\`;

  const fakeDeals = [
    { title: "Signal Scout Dashboard", badge: "HOT ROUTE", price: "$24 / mo", desc: "Live feed of high‑intent signals from your niche." },
    { title: "Creator Radar Screen", badge: "SOCIAL PROOF", price: "$39 / mo", desc: "Tracks who is talking about your brand in real time." },
    { title: "Deal Flow Inbox", badge: "ARBITRAGE", price: "Beta", desc: "Auto‑groups leads into qualified, warm, and cold lanes." },
  ];

  return (
    <div className="max-w-[430px] mx-auto min-h-screen bg-[#F6F9FC] relative border-x border-gray-100 shadow-2xl overflow-x-hidden pb-24">
      <header className="bg-gradient-to-br from-indigo-600 to-indigo-800 h-64 pt-12 px-6 rounded-b-[3rem] relative shadow-lg text-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] uppercase text-indigo-200/80">NomadGate Standard</p>
            <h1 className="text-3xl font-black tracking-tight mt-1">Signal Scanner</h1>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/30 flex items-center justify-center text-lg shadow-lg">
            ⚡
          </div>
        </div>
        <p className="text-sm text-indigo-100/90 leading-relaxed max-w-xs">
          Paste a hunch, press scan, and watch us surface the spiciest opportunities hiding in your idea.
        </p>
        <div className="absolute -bottom-10 left-0 right-0 px-6">
          <div className="bg-white text-slate-900 rounded-2xl shadow-xl p-3 flex items-center gap-3 text-xs">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-lg">🧬</div>
            <div className="flex-1">
              <p className="font-semibold uppercase tracking-[0.2em] text-[10px] text-slate-500">Brief Snapshot</p>
              <p className="text-[11px] line-clamp-2 text-slate-700">
                {brief.split("\\n").find(line => line.toLowerCase().includes("value")) || "High‑signal prototype generated from your idea."}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 mt-16 space-y-8">
        <section className="bg-white rounded-3xl shadow-sm p-5 border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Input Stream</h2>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-100">
              LIVE
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            This is the exact text we wired your generator around. Flip it later, keep the engine.
          </p>
          <div className="bg-slate-50 rounded-2xl border border-slate-100 p-3 max-h-28 overflow-auto text-[11px] text-slate-700 whitespace-pre-wrap">
            {brief}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-[0.18em] text-slate-600">Scan Results</h3>
            <span className="text-[10px] font-semibold text-indigo-500 uppercase tracking-[0.18em]">3 SURFACING</span>
          </div>
          <div className="space-y-3">
            {fakeDeals.map((deal, index) => (
              <div key={deal.title} className="bg-white rounded-2xl border border-slate-100 shadow-[0_10px_30px_rgba(15,23,42,0.05)] p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-lg">
                  {index === 0 ? "📡" : index === 1 ? "👁️" : "📥"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="font-semibold text-sm text-slate-900 truncate">{deal.title}</p>
                    <span className="ml-3 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-[0.18em] bg-indigo-50 text-indigo-600 border border-indigo-100">
                      {deal.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-2 line-clamp-2">{deal.desc}</p>
                  <p className="text-[11px] font-semibold text-slate-900">{deal.price}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-6 pb-6">
        <div className="bg-white rounded-full shadow-[0_18px_40px_rgba(15,23,42,0.35)] border border-slate-100 px-5 py-3 flex items-center justify-between text-slate-500 text-xs">
          <button className="flex flex-col items-center gap-1 text-indigo-600">
            <span className="text-lg">🔍</span>
            <span className="text-[9px] font-semibold tracking-[0.16em] uppercase">Scan</span>
          </button>
          <button className="flex flex-col items-center gap-1">
            <span className="text-lg">📊</span>
            <span className="text-[9px] font-semibold tracking-[0.16em] uppercase">Signals</span>
          </button>
          <button className="flex flex-col items-center gap-1">
            <span className="text-lg">⭐</span>
            <span className="text-[9px] font-semibold tracking-[0.16em] uppercase">Saved</span>
          </button>
          <button className="flex flex-col items-center gap-1">
            <span className="text-lg">👤</span>
            <span className="text-[9px] font-semibold tracking-[0.16em] uppercase">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
`.trim(),
    theme: { primary: "#6366f1", secondary: "#10b981", font: "Inter" },
  };
};

export const debugCode = async (errorCode: string, logs: string): Promise<string> => {
  // Fast stub: just return the existing code while we stabilise the generator.
  console.warn("[LaunchPad] debugCode stubbed – returning original code.");
  return errorCode;
};

export const modifyPrototype = async (
  currentCode: string,
  _originalBrief: string,
  changeRequest: string
): Promise<string> => {
  console.warn("[LaunchPad] modifyPrototype stubbed – returning original code.");
  return currentCode;
};
