import OpenAI from "openai";

export const runtime = "nodejs";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, meta } = body as { prompt: string; meta?: Record<string, any> };

    const system = `You are an LSAT Socratic tutor. Keep timing discipline, require prediction-before-choices, and log takeaways. If the user requests copyrighted questions verbatim, refuse and provide original drills instead.`;

    // Use the chat completions API with streaming enabled to avoid using the
    // deprecated `responses.stream` method. The OpenAI Node client exposes
    // a `chat.completions.create` method that returns a stream when
    // `stream: true` is passed. This mirrors the Chat Completions API
    // behaviour and is supported in modern versions of the SDK.
    const stream = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: `User meta: ${JSON.stringify(meta || {})}` },
        { role: "user", content: prompt },
      ],
      stream: true,
    });

    return new Response(stream.toReadableStream(), {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
      },
    });
  } catch (err:any) {
    console.error(err);
    return new Response(JSON.stringify({ ok:false, error: err?.message || "unknown" }), { status: 500 });
  }
}
