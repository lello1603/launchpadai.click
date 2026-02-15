
import { StartupQuiz, PrototypeData } from "../types";
import { supabase } from "./supabaseService";

/** Remove internal branding so users only see their own idea and prototype. */
const sanitizeBriefForUser = (text: string): string =>
  text
    .replace(/\bNomadGate\b/gi, "Your prototype")
    .replace(/\bNOMADGATE[^\n\-]*/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

/** Run a promise with a timeout; on timeout reject so caller can fall back. */
const withTimeout = <T>(promise: Promise<T>, ms: number, label: string): Promise<T> =>
  Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);

/** Parse brief text into structured fields for dynamic templates. */
const parseBrief = (brief: string): { valueProposition: string; targetAudience: string; essentialFeature: string; appFeel: string } => {
  const getSection = (key: string): string => {
    const re = new RegExp(`${key}:\\s*([\\s\\S]*?)(?=\\n\\n[A-Z]|\\n---|$)`, "i");
    const m = brief.match(re);
    return (m ? m[1].trim() : "") || "";
  };
  return {
    valueProposition: getSection("VALUE PROPOSITION") || "Your idea",
    targetAudience: getSection("TARGET AUDIENCE") || "Your audience",
    essentialFeature: getSection("ESSENTIAL FEATURE") || "Key feature",
    appFeel: getSection("APP FEEL") || getSection("VIBE") || "Clean and modern",
  };
};

const escapeForJs = (s: string): string =>
  s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/`/g, "\\`").replace(/\$/g, "\\$").replace(/\n/g, "\\n");

// --- Fallback: dynamic local template built from quiz/brief (used when Gemini fails or is unavailable) ---
const buildLocalBrief = (quiz: StartupQuiz, imageData: string | null): string => {
  const imgNote = imageData ? "User provided a visual moodboard reference." : "No image reference was provided.";
  const brief = `
--- YOUR PROTOTYPE BRIEF ---
VALUE PROPOSITION:
${quiz.valueProposition || "A playful experimental app prototype."}

TARGET AUDIENCE:
${quiz.targetAudience || "Early adopters and indie builders who love bold UI."}

ESSENTIAL FEATURE:
${quiz.essentialFeatures || "A single hero interaction that feels premium and animated."}

APP FEEL / VIBE (tone, style, mood):
${quiz.appFeel || "Professional but approachable; clean and modern."}

VISUAL NOTES:
- Mobile‑first, 9:16 layout. Soft cards, clear hierarchy.
- ${imgNote}

TECHNICAL NOTES:
- Use a clear primary action at the top. Fake data must match the value proposition and audience.
--- END BRIEF ---
`.trim();
  return sanitizeBriefForUser(brief);
};

const buildLocalPrototype = (refinedBrief: string): PrototypeData => {
  const p = parseBrief(refinedBrief);
  const vp = p.valueProposition.slice(0, 80) + (p.valueProposition.length > 80 ? "…" : "");
  const audience = p.targetAudience.slice(0, 60) + (p.targetAudience.length > 60 ? "…" : "");
  const feature = p.essentialFeature.slice(0, 100) + (p.essentialFeature.length > 100 ? "…" : "");
  const feel = p.appFeel.slice(0, 50) + (p.appFeel.length > 50 ? "…" : "");
  const headline = vp || "Your idea";
  const subtitle = audience || "Built for you";
  const featureLabel = feature || "Key feature";
  const cardTitles = [
    headline.split(/[.!?]/)[0]?.trim() || "Main benefit",
    feature.split(/[.!?]/)[0]?.trim() || "Feature one",
    audience.split(/[.!?]/)[0]?.trim() || "For you",
  ].slice(0, 3);
  const safe = (s: string) => escapeForJs(s.replace(/[\r\n]+/g, " ").trim());

  return {
    title: headline.slice(0, 50) || "Your Prototype",
    code: `
function AppDemo() {
  const headline = "${safe(headline)}";
  const subtitle = "${safe(subtitle)}";
  const featureLabel = "${safe(featureLabel)}";
  const vibe = "${safe(feel)}";
  const cards = [
    { title: "${safe(cardTitles[0])}", desc: "${safe(p.valueProposition.slice(0, 90))}", emoji: "✨" },
    { title: "${safe(cardTitles[1])}", desc: "${safe(p.essentialFeature.slice(0, 90))}", emoji: "🎯" },
    { title: "${safe(cardTitles[2])}", desc: "${safe(p.targetAudience.slice(0, 90))}", emoji: "👥" },
  ];

  return (
    <div className="max-w-[430px] mx-auto min-h-screen bg-[#F6F9FC] relative border-x border-gray-100 shadow-2xl overflow-x-hidden pb-24">
      <header className="bg-gradient-to-br from-indigo-600 to-indigo-800 h-64 pt-12 px-6 rounded-b-[3rem] relative shadow-lg text-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] uppercase text-indigo-200/80">Your idea</p>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight mt-1 leading-tight">{headline}</h1>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/30 flex items-center justify-center text-lg shadow-lg">
            ⚡
          </div>
        </div>
        <p className="text-sm text-indigo-100/90 leading-relaxed max-w-xs">{subtitle}</p>
        <div className="absolute -bottom-10 left-0 right-0 px-6">
          <div className="bg-white text-slate-900 rounded-2xl shadow-xl p-3 flex items-center gap-3 text-xs">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-lg">🧬</div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold uppercase tracking-[0.2em] text-[10px] text-slate-500">Vibe</p>
              <p className="text-[11px] line-clamp-2 text-slate-700">{vibe}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 mt-16 space-y-8">
        <section className="bg-white rounded-3xl shadow-sm p-5 border border-slate-100">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 mb-3">The idea</h2>
          <p className="text-sm text-slate-700 leading-relaxed">{headline}</p>
          <p className="text-xs text-slate-500 mt-2">For: {subtitle}</p>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-black uppercase tracking-[0.18em] text-slate-600">{featureLabel}</h3>
          <div className="space-y-3">
            {cards.map((card, index) => (
              <div key={index} className="bg-white rounded-2xl border border-slate-100 shadow-[0_10px_30px_rgba(15,23,42,0.05)] p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-lg">{card.emoji}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-slate-900 truncate">{card.title}</p>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-6 pb-6">
        <div className="bg-white rounded-full shadow-[0_18px_40px_rgba(15,23,42,0.35)] border border-slate-100 px-5 py-3 flex items-center justify-between text-slate-500 text-xs">
          <button className="flex flex-col items-center gap-1 text-indigo-600"><span className="text-lg">🔍</span><span className="text-[9px] font-semibold uppercase">Explore</span></button>
          <button className="flex flex-col items-center gap-1"><span className="text-lg">📋</span><span className="text-[9px] font-semibold uppercase">Idea</span></button>
          <button className="flex flex-col items-center gap-1"><span className="text-lg">⭐</span><span className="text-[9px] font-semibold uppercase">Saved</span></button>
          <button className="flex flex-col items-center gap-1"><span className="text-lg">👤</span><span className="text-[9px] font-semibold uppercase">Profile</span></button>
        </div>
      </nav>
    </div>
  );
}
`.trim(),
    theme: { primary: "#6366f1", secondary: "#10b981", font: "Inter" },
  };
};

// --- Gemini via Supabase Functions (CORS‑safe) ---

async function callGeminiProxy(
  model: string,
  contents: Array<{ parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> }>
): Promise<string> {
  if (!supabase) {
    console.warn("[LaunchPad] Supabase client not initialized, falling back to local template.");
    return "";
  }

  const { data, error } = await supabase.functions.invoke("gemini-proxy", {
    body: { model, contents },
  });

  if (error) {
    console.error("[LaunchPad] Gemini proxy error:", error);
    return "";
  }

  // Edge function returns { text }
  return (data as any)?.text ?? "";
}

// Extract code from Gemini response into a clean AppDemo component
const extractPureCode = (rawResponse: string): string => {
  if (!rawResponse) return "";

  const codeBlockRegex = /```(?:jsx|tsx|javascript|typescript|js)?([\s\S]*?)```/gi;
  const matches = [...rawResponse.matchAll(codeBlockRegex)];
  let code = matches.length > 0 ? matches.map((m) => m[1].trim()).join("\n\n") : rawResponse;

  // strip imports
  code = code.replace(/^import\s+[\s\S]*?from\s+['"].*?['"];?\s*$/gm, "");
  code = code.replace(/import\s+.*?from\s+['"].*?['"];?/g, "");

  // normalize exports around AppDemo
  code = code.replace(/export\s+default\s+function\s+AppDemo/g, "function AppDemo");
  code = code.replace(/export\s+default\s+function/g, "function AppDemo");
  code = code.replace(/export\s+default\s+class\s+AppDemo/g, "class AppDemo");
  code = code.replace(/export\s+default\s+class/g, "class AppDemo");
  code = code.replace(/export\s+default\s+AppDemo;?/g, "");

  if (code.includes("export default")) {
    code = code.replace(/export\s+default\s+/g, "const AppDemo = ");
  }

  code = code.replace(/\bexport\s+/g, "");

  return code.trim();
};

// --- Public API ---

export const refineProjectBrief = async (
  quiz: StartupQuiz,
  imageData: string | null
): Promise<string> => {
  const localBrief = buildLocalBrief(quiz, imageData);

  const BRIEF_TIMEOUT_MS = 14_000;

  try {
    const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
      {
        text: `ROLE: Lead product strategist.
TASK: Rewrite the following into a single, sharp YOUR PROTOTYPE BRIEF. Keep the exact structure below and preserve all user answers. Do not use the word NomadGate anywhere. Enrich only where it helps clarity. Output MUST include clear sections: VALUE PROPOSITION, TARGET AUDIENCE, ESSENTIAL FEATURE, APP FEEL/VIBE, and short VISUAL/TECHNICAL NOTES. Do not drop or rename any section.

USER INPUT:
${localBrief}`,
      },
    ];

    if (imageData) {
      const base64Data = imageData.includes(",") ? imageData.split(",")[1] : imageData;
      parts.push({ inlineData: { mimeType: "image/jpeg", data: base64Data } });
    }

    const text = await withTimeout(
      callGeminiProxy("gemini-3-flash-preview", [{ parts }]),
      BRIEF_TIMEOUT_MS,
      "refineProjectBrief"
    );
    if (!text) return localBrief;
    return sanitizeBriefForUser(text.trim());
  } catch (err) {
    console.warn("[LaunchPad] refineProjectBrief fell back to local brief:", err);
    return localBrief;
  }
};

export const generatePrototypeFromBrief = async (
  refinedBrief: string
): Promise<PrototypeData> => {
  const PROTOTYPE_TIMEOUT_MS = 28_000;

  try {
    const systemPrompt = `
You are a senior React + Tailwind engineer. Generate ONE mobile AppDemo component (max-w-[430px], 9:16 feel) that is a direct prototype of the idea in the brief—not a generic template.

STRICT RULES:
1. Main headline or hero text MUST be the brief's VALUE PROPOSITION (or a short punchy version of it). Do not use "Your Prototype" or "Signal Scanner" or generic titles.
2. Subtitle or supporting copy MUST reflect TARGET AUDIENCE (who it's for) and/or ESSENTIAL FEATURE.
3. The primary UI (cards, list, dashboard) MUST showcase the ESSENTIAL FEATURE—e.g. if the feature is "habit tracker", show habit-related items; if "recipe finder", show recipe cards. No placeholder labels like "Signal Scout" or "Deal Flow" unless the brief is about signals/deals.
4. Colors, typography, and mood MUST follow APP FEEL / VIBE (e.g. "playful" → rounded, bright; "minimal" → lots of whitespace; "dark" → dark theme).
5. Every visible string in the UI must come from the brief sections above—no lorem ipsum, no generic "Your idea" or "Feature one". Extract real phrases from VALUE PROPOSITION, TARGET AUDIENCE, ESSENTIAL FEATURE, and APP FEEL.
6. Return ONLY the AppDemo function body as raw JSX. No import/export. Use React, Tailwind, optional Framer Motion. Do not use the word NomadGate anywhere.

BRIEF:
${refinedBrief}
`.trim();

    const text = await withTimeout(
      callGeminiProxy("gemini-3-pro-preview", [{ parts: [{ text: systemPrompt }] }]),
      PROTOTYPE_TIMEOUT_MS,
      "generatePrototypeFromBrief"
    );

    let code = extractPureCode(text);
    if (!code) {
      console.warn("[LaunchPad] Gemini returned empty code, using local template.");
      return buildLocalPrototype(refinedBrief);
    }
    code = code.replace(/\bNomadGate\b/gi, "Your prototype");

    const parsed = parseBrief(refinedBrief);
    const title = parsed.valueProposition.slice(0, 50) || "Your Prototype";

    return {
      title,
      code,
      theme: { primary: "#6366f1", secondary: "#10b981", font: "Inter" },
    };
  } catch (err) {
    console.warn("[LaunchPad] generatePrototypeFromBrief failed, using local template:", err);
    return buildLocalPrototype(refinedBrief);
  }
};

export const debugCode = async (errorCode: string, logs: string): Promise<string> => {
  try {
    const prompt = `Fix the React component named AppDemo.\nLogs:\n${logs}\n\nCurrent Code:\n${errorCode}`;
    const text = await callGeminiProxy("gemini-3-pro-preview", [
      { parts: [{ text: prompt }] },
    ]);
    const code = extractPureCode(text);
    return code || errorCode;
  } catch (err) {
    console.error("[LaunchPad] debugCode failed, returning original code:", err);
    return errorCode;
  }
};

export const modifyPrototype = async (
  currentCode: string,
  _originalBrief: string,
  changeRequest: string
): Promise<string> => {
  try {
    const prompt = `You are updating a React component named AppDemo.\nApply this change request while keeping the structure clean:\n${changeRequest}\n\nCurrent Code:\n${currentCode}`;
    const text = await callGeminiProxy("gemini-3-pro-preview", [
      { parts: [{ text: prompt }] },
    ]);
    const code = extractPureCode(text);
    return code || currentCode;
  } catch (err) {
    console.error("[LaunchPad] modifyPrototype failed, returning original code:", err);
    return currentCode;
  }
};
