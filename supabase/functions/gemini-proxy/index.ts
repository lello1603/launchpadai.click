// Supabase Edge Function: Gemini API Proxy
// Keeps your API key secure on the server - never exposed to the browser

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";

const corsHeaders: HeadersInit = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
};

const jsonResponse = (body: any, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Only allow POST for actual work
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set in Supabase Edge Function secrets");
    return jsonResponse({ error: "Server misconfigured: API key missing" }, 500);
  }

  try {
    const body = await req.json();
    const { model, contents } = body as {
      model: string;
      contents: Array<{ role?: string; parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> }>;
    };

    if (!model || !contents || !Array.isArray(contents)) {
      return jsonResponse({ error: "Missing model or contents" }, 400);
    }

    // Convert camelCase (JS) to snake_case (Gemini REST API)
    const normalizedContents = contents.map((c: { parts?: Array<Record<string, unknown>> }) => ({
      ...c,
      parts: (c.parts || []).map((p: Record<string, unknown>) => {
        const part: Record<string, unknown> = {};
        if (p.text) part.text = p.text;
        if (p.inlineData) {
          const id = p.inlineData as { mimeType?: string; data?: string };
          part.inline_data = { mime_type: id.mimeType || "image/jpeg", data: id.data };
        }
        return part;
      }),
    }));

    const url = `${GEMINI_BASE}/models/${model}:generateContent`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 85_000);
    const geminiRes = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({ contents: normalizedContents }),
    });
    clearTimeout(timeoutId);

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      const msg = data?.error?.message || geminiRes.statusText || "Gemini API error";
      return jsonResponse({ error: msg }, geminiRes.status);
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return jsonResponse({ text }, 200);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonResponse({ error: message }, 500);
  }
});
