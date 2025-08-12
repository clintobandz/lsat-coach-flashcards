# LSAT Coach (Next.js 14, Flashcards)

Clean student-friendly LSAT app:
- Dashboard: original LR/RC drills, timing tools, CSV export
- Mentor Chat: streaming via OpenAI Responses API (server-side)
- Flashcards: Leitner scheduling, tags, import/export JSON, sample deck

## Quickstart
```bash
npm install
cp .env.example .env.local
# edit .env.local with your keys
npm run dev
```

Open http://localhost:3000

## Deploy
Push to GitHub → Import on Vercel → add env vars:
- OPENAI_API_KEY
- (optional) TAVILY_API_KEY for /api/search
