import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers });
  }

  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openaiKey) {
    return new Response(JSON.stringify({ error: "Missing OpenAI API key" }), {
      status: 500,
      headers,
    });
  }

  try {
    const { text, source_language, target_language } = await req.json();

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0,
        messages: [
          {
            role: "system",
            content:
              "You are a translation engine. Only return the translated text, no explanations, no quotes, no extra words.",
          },
          {
            role: "user",
            content: `Translate this from ${source_language} to ${target_language}: ${text}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI error", response.status, errorText);
      return new Response(JSON.stringify({ error: "Translation failed" }), {
        status: 500,
        headers,
      });
    }

    const openaiData = await response.json();
    const translation = openaiData.choices?.[0]?.message?.content?.trim() ?? "";

    if (!translation) {
      return new Response(JSON.stringify({ error: "No translation returned" }), {
        status: 500,
        headers,
      });
    }

    return new Response(JSON.stringify({ translation }), {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Unexpected error", error);
    return new Response(JSON.stringify({ error: "Translation failed" }), {
      status: 500,
      headers,
    });
  }
});
