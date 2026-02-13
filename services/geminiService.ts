
import { StartupQuiz, PrototypeData } from "../types";
import { SUPABASE_ANON_KEY } from "./supabaseService";

const SUPABASE_URL = "https://fiviwjynxfhfepwflkdx.supabase.co";
const GEMINI_PROXY_URL = `${SUPABASE_URL}/functions/v1/gemini-proxy`;

/**
 * Calls the secure Gemini proxy (Supabase Edge Function).
 * Your API key stays on the server and is never sent to the browser.
 */
async function callGeminiProxy(
  model: string,
  parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>
): Promise<string> {
  const res = await fetch(GEMINI_PROXY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      model,
      contents: [{ parts }],
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error || `Gemini proxy error (${res.status})`);
  }

  return data.text ?? "";
}

/**
 * CLEAN-ROOM EXTRACTION:
 * Ensures the model output is transformed into a single, valid 'AppDemo' component.
 * Prevents "AppDemo has already been declared" by normalizing all export patterns.
 */
const extractPureCode = (rawResponse: string): string => {
  if (!rawResponse) return "";
  const codeBlockRegex = /```(?:jsx|tsx|javascript|typescript|js)?([\s\S]*?)```/gi;
  const matches = [...rawResponse.matchAll(codeBlockRegex)];
  let code = matches.length > 0 ? matches.map((m) => m[1].trim()).join("\n\n") : rawResponse;

  // 1. Strip all imports
  code = code.replace(/^import\s+[\s\S]*?from\s+['"].*?['"];?\s*$/gm, "");
  code = code.replace(/import\s+.*?from\s+['"].*?['"];?/g, "");

  // 2. Handle Export Patterns to ensure one stable 'AppDemo' reference
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

export const refineProjectBrief = async (
  quiz: StartupQuiz,
  imageData: string | null
): Promise<string> => {
  const prompt = `
    ROLE: Lead UI/UX Strategist.
    TASK: Translate user input into a "NomadGate Visual DNA Brief".
    
    [INPUT]
    VALUE: ${quiz.valueProposition}
    AUDIENCE: ${quiz.targetAudience}
    FEATURES: ${quiz.essentialFeatures}
    
    [REQUIREMENTS]
    1. Identify Niche Industry.
    2. Choose a Primary/Accent color palette matching the industry.
    3. Generate 5 realistic data points (names/prices/labels).
    4. Define 3 technical scanning steps for the Trust Engine.
  `;

  const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
    { text: prompt },
  ];
  if (imageData) {
    const base64Data = imageData.includes(",") ? imageData.split(",")[1] : imageData;
    parts.push({ inlineData: { mimeType: "image/jpeg", data: base64Data } });
  }

  return callGeminiProxy("gemini-3-flash-preview", parts);
};

export const generatePrototypeFromBrief = async (
  refinedBrief: string
): Promise<PrototypeData> => {
  const prompt = `
    🟢 MASTER SYSTEM INSTRUCTION FOR THE AI APP GENERATOR
    Role: World-Class Senior Full-Stack Engineer and Lead UI/UX Designer.
    Task: Generate high-fidelity React component 'AppDemo' in a strict 9:16 mobile aspect ratio.

    1. STRUCTURAL RULES (NomadGate Standard)
    - Root Container: <div className="max-w-[430px] mx-auto min-h-screen bg-[#F6F9FC] relative border-x border-gray-100 shadow-2xl overflow-x-hidden pb-24">.
    - Sky-Drop Header: A vibrant <header className="bg-gradient-to-br from-indigo-600 to-indigo-800 h-64 pt-12 px-6 rounded-b-[3rem] relative shadow-lg text-white">.
    - Soft Minimalism: Background #F6F9FC. Cards are Pure White (#FFFFFF), rounded-2xl, shadow-sm, p-6. Cards overlap header (mt-[-3rem]).
    - Navigation: Fixed-bottom nav bar with 4 icons (Search, Action, Saved, Profile). Use Lucide-React.

    2. FUNCTIONAL WORKFLOW (The Trust Engine)
    - Phase 1 (Input): Clean form/search to collect user intent.
    - Phase 2 (ScanningOverlay): On action, show 3.5s animated overlay. Cycle mock technical steps (e.g., "Analyzing Data").
    - Phase 3 (Results): High-fidelity staggered cards with "arbitrage" or "deal" badges.

    3. TECHNICAL
    - Use React, Tailwind, Lucide-React, Framer Motion.
    - Component Name: 'AppDemo'.
    - NO LOREM IPSUM.
    - RETURN ONLY RAW JSX. NO IMPORTS. NO EXPORTS.

    [CONTEXT]
    ${refinedBrief}
  `;

  const text = await callGeminiProxy("gemini-3-pro-preview", [{ text: prompt }]);

  return {
    title: "NomadGate Prototype",
    code: extractPureCode(text),
    theme: { primary: "#6366f1", secondary: "#10b981", font: "Inter" },
  };
};

export const debugCode = async (errorCode: string, logs: string): Promise<string> => {
  const prompt = `FIX 'AppDemo' and maintain NomadGate Standard.\nLOGS: ${logs}\nCODE: ${errorCode}`;
  const text = await callGeminiProxy("gemini-3-pro-preview", [{ text: prompt }]);
  return extractPureCode(text);
};

export const modifyPrototype = async (
  currentCode: string,
  _originalBrief: string,
  changeRequest: string
): Promise<string> => {
  const prompt = `MODIFY 'AppDemo' while maintaining NomadGate Standard.\nREQUEST: ${changeRequest}\nCODE: ${currentCode}`;
  const text = await callGeminiProxy("gemini-3-pro-preview", [{ text: prompt }]);
  return extractPureCode(text);
};
