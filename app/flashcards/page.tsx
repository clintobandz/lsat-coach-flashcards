."use client";
import { useEffect, useMemo, useState } from "react";

type Card = { id: string; front: string; back: string; tag?: string; level: number; dueISO: string };

function useLocal<T>(key: string, initial: T): [T, (v: any)=>void] {
  const [val, setVal] = useState<T>(() => {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : initial; } catch { return initial; }
  });
  useEffect(() => { localStorage.setItem(key, JSON.stringify(val)); }, [key, val]);
  return [val, setVal];
}

const DAY = 24*60*60*1000;
const intervals = [0, 1, 3, 7, 14, 30];

function scheduleNext(level: number, quality: "again"|"good") {
  let newLevel = quality === "good" ? Math.min(level + 1, 5) : 1;
  const days = intervals[newLevel];
  return { newLevel, due: new Date(Date.now() + days*DAY).toISOString() };
}

function buildSampleDeck(): Card[] {
  const now = new Date().toISOString();
  const mk = (front:string, back:string, tag?:string): Card => ({ id: Math.random().toString(36).slice(2), front, back, tag, level: 1, dueISO: now });
  return [
    mk("Translate: 'only if'", "A only if B ⇒ A → B (B is necessary).", "Logic"),
    mk("Translate: 'if'", "A if B ⇒ B → A (B is sufficient).", "Logic"),
    mk("Translate: 'unless'", "A unless B ⇒ ¬B → A (equivalently A ∨ B).", "Logic"),
    mk("Flaw: Affirming the consequent", "If P→Q; Q; therefore P. Invalid; could be other cause.", "Flaws"),
    mk("Flaw: Causal – alternative cause", "Assumes X→Y without ruling out other causes.", "Flaws"),
    mk("RC: Author attitude words", "lauds/approves (positive); skeptical/concerned (negative); neutral/analytical.", "RC"),
    mk("RC: Topic vs Scope", "Topic=general subject; Scope=the specific slice the author addresses.", "RC"),
  ];
}
export default function FlashcardsPage(){
  const [deck, setDeck] = useLocal<Card[]>("ls.flashcards.deck", []);
  const [showBack, setShowBack] = useState(false);
  const [filter, setFilter] = useState<string>("All");

  useEffect(() => {
    if (!deck || deck.length === 0) setDeck(buildSampleDeck());
  }, []); // eslint-disable-line

  const now = Date.now();
  const due = useMemo(() => deck.filter(c => new Date(c.dueISO).getTime() <= now), [deck, now]);
  const total = deck.length;
  const tags = useMemo(() => Array.from(new Set(["All", ...deck.map(c => c.tag||"Untagged") ])), [deck]);

  const [idx, setIdx] = useState(0);
  const queue = useMemo(() => {
    const pool = (filter==="All"? due : due.filter(c => (c.tag||"Untagged")===filter));
    return pool;
  }, [due, filter]);
  const current = queue[idx] || null;

  function rate(quality: "again"|"good"){
    if(!current) return;
    const { newLevel, due } = scheduleNext(current.level, quality);
    // Explicitly type the previous deck as an array of Card to satisfy
    // TypeScript when noImplicitAny is enabled. Without this annotation,
    // `prev` defaults to `any` causing a compilation error on Vercel.
    setDeck((prev: Card[]) => prev.map(c => c.id===current.id ? { ...c, level: newLevel, dueISO: due } : c));
    setShowBack(false);
   setIdx((i: number) => (i + 1) % Math.max(queue.length, 1));



  const [front, setFront] = useState("");
  const [back, setBack] = useState("");

    
    const [tag, setTag] = useState("");

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Flashcards</h1>
          <div className="flex items-center gap-2 text-sm">
            <select className="border rounded-xl px-2 py-1" value={filter} onChange={e=>setFilter(e.target.value)}>
              {tags.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <button onClick={exportJSON} className="px-3 py-2 rounded-xl border bg-white">Export</button>
            <label className="px-3 py-2 rounded-xl border bg-white cursor-pointer">
              Import<input type="file" accept="application/json" className="hidden" onChange={e=>{const f=e.target.files?.[0]; if(f) importJSON(f);}} />
            </label>
          </div>
        </header>

        <div className="grid sm:grid-cols-3 gap-4">
          <Stat label="Due now" value={queue.length} />
          <Stat label="Total cards" value={total} />
          <Stat label="Avg level" value={total? Math.round(deck.reduce((a,c)=>a+c.level,0)/total*10)/10 : 0} />
        </div>

        <section className="rounded-2xl border bg-white p-4">
          {!current ? (
            <div className="text-sm opacity-70">Nothing due right now. Add cards below or change the filter.</div>
          ) : (
            <div className="space-y-4">
              <div className="text-xs opacity-60">Tag: {current.tag||"Untagged"} • Level {current.level}</div>
              <div className="rounded-xl border p-6 bg-neutral-50 min-h-[160px] flex items-center justify-center text-center text-lg">
                {showBack ? current.back : current.front}
              </div>
              <div className="flex items-center gap-2">
                {!showBack ? (
                  <button className="px-4 py-2 rounded-xl border bg-white" onClick={()=>setShowBack(true)}>Show answer (Space)</button>
                ) : (
                  <div className="flex gap-2">
                    <button className="px-4 py-2 rounded-xl border bg-white" onClick={()=>rate("again")}>Again (1)</button>
                    <button className="px-4 py-2 rounded-xl border bg-white" onClick={()=>rate("good")}>Good (2)</button>
                  </div>
                )}
                 <button className="ml-auto px-3 py-2 text-s<button className="ml-auto px-3 py-2 text-sm opacity-70 hover:opacity-100" onClick={() => setShowBack((b: boolean) => !b)}>Flip</button>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-2xl border bg-white p-4 space-y-3">
          <h2 className="font-semibold">Add Card</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            <textarea className="border rounded-xl p-2 sm:col-span-1" placeholder="Front" value={front} onChange={e=>setFront(e.target.value)} />
            <textarea className="border rounded-xl p-2 sm:col-span-1" placeholder="Back" value={back} onChange={e=>setBack(e.target.value)} />
            <input className="border rounded-xl p-2" placeholder="Tag (e.g., Logic, RC, Flaws)" value={tag} onChange={e=>setTag(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded-xl border bg-white" onClick={()=>{ if(front && back){ addCard(front, back, tag||undefined); setFront(""); setBack(""); setTag(""); } }}>Add</button>
            <button className="px-4 py-2 rounded-xl border bg-white" onClick={()=>setDeck(buildSampleDeck())}>Load Sample Deck</button>
          </div>
        </section>

        <section className="rounded-2xl border bg-white p-4">
          <h2 className="font-semibold mb-2">All Cards</h2>
          
          <div className="grid gap-2">
            {deck.map(c => (
              <div key={c.id} className="p-3 rounded-xl border flex items-start gap-3">
                <div className="text-xs opacity-60 w-28">{c.tag||"Untagged"} • L{c.level}</div>
                <div className="flex-1">
                  <div className="font-medium">{c.front}</div>
                  <div className="opacity-70 text-sm">{c.back}</div>
                </div>
                <button className="px-3 py-2 rounded-xl border bg-white" onClick={()=>removeCard(c.id)}>Delete</button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function Stat({label, value}:{label:string; value:number|string}){
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm opacity-70">{label}</div>
    </div>
  );
}
