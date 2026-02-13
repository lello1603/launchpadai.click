// Supabase Edge Function: Gemini API Proxy
// Keeps your API key secure on the server - never exposed to the browser

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";

Deno.serve(async (req) => {
  // Only allow POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set in Supabase Edge Function secrets");
    return new Response(
      JSON.stringify({ error: "Server misconfigured: API key missing" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const { model, contents } = body as {
      model: string;
      contents: Array<{ role?: string; parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> }>;
    };

    if (!model || !contents || !Array.isArray(contents)) {
      return new Response(
        JSON.stringify({ error: "Missing model or contents" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
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
    const geminiRes = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({ contents: normalizedContents }),
    });

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      const msg = data?.error?.message || geminiRes.statusText || "Gemini API error";
      return new Response(
        JSON.stringify({ error: msg }),
        { status: geminiRes.status, headers: { "Content-Type": "application/json" } }
      );
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
