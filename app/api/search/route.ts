export const runtime_search = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { query, max_results = 5 } = body as { query: string; max_results?: number };
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) return new Response(JSON.stringify({ ok:false, error:"Missing TAVILY_API_KEY" }), { status: 500 });

    const r = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ api_key: apiKey, query, search_depth: "basic", max_results }),
    });
    const data = await r.json();
    return new Response(JSON.stringify({ ok:true, data }), { status: 200, headers: { "content-type":"application/json" }});
  } catch (e:any) {
    return new Response(JSON.stringify({ ok:false, error: e?.message||"unknown" }), { status: 500 });
  }
}
