"use client";
import { useEffect, useState } from "react";
import { Play, Pause, RotateCcw, Download, Bot, Send } from "lucide-react";
import clsx from "clsx";
import Link from "next/link";

function pad(n:number){return String(n).padStart(2,"0");}
function fmtClock(s:number){s=Math.max(0,Math.floor(s));const m=Math.floor(s/60);const r=s%60;return `${pad(m)}:${pad(r)}`}

export default function Page(){
  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">LSAT Coach</h1>
          <nav className="flex items-center gap-4 text-sm">
            <Link className="hover:underline" href="/">Dashboard</Link>
            <Link className="hover:underline" href="/flashcards">Flashcards</Link>
            <span className="opacity-70">Goal: 170 • Test: February</span>
          </nav>
        </header>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2"><Coach /></div>
          <div className="lg:col-span-1"><MentorChat /></div>
        </div>
        <footer className="text-xs opacity-60">Local-only practice content. Use your own PrepTests for official drills. Respect LSAC copyrights.</footer>
      </div>
    </main>
  );
}

// ------------------------ Coach (MVP) ------------------------
function useLocal<T>(key:string, initial:T):[T,(v:any)=>void]{
  const [val,setVal]=useState<T>(()=>{try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):initial;}catch{return initial;}});
  useEffect(()=>{localStorage.setItem(key,JSON.stringify(val));},[key,val]);
  return [val,setVal];
}

function Coach(){
  const [logs,setLogs]=useLocal<any[]>("ls.logs",[]);
  const [queue,setQueue]=useState<any[]>([]);
  const [rc,setRC]=useState<any|null>(null);
  const [idx,setIdx]=useState(0);
  const [answer,setAnswer]=useState<string|null>(null);
  const [conf,setConf]=useState(3);
  const [secs,setSecs]=useState(0);
  const [target,setTarget]=useState(16*60);
  const [running,setRunning]=useState(false);

  useEffect(()=>{ if(!running) return; const t=setInterval(()=>setSecs(s=>s+1),1000); return ()=>clearInterval(t); },[running]);

  const start=()=>{ setRunning(true); };
  const pause=()=>setRunning(false);
  const reset=()=>{ setRunning(false); setSecs(0); };

  const runLR=()=>{ const n=8; setQueue(Array.from({length:n},()=>genLR())); setRC(null); setIdx(0); setTarget(n*120); setSecs(0); };
  const runRC=()=>{ setRC(genRC()); setQueue([]); setTarget(14*60); setSecs(0); };

  const submit=(choiceId:string)=>{
    setAnswer(choiceId);
    if(rc||!queue[idx]) return;
    const q=queue[idx];
    const correct=q.choices.find((c:any)=>c.correct)?.id;
    const row={date:new Date().toISOString(),section:"LR",topic:q.type,subtype:q.gap,difficulty:3,time_sec:secs,result:choiceId===correct?"C":"W",confidence:conf,guess:false,note:"MVP"};
    setLogs([row,...logs]);
  };
  const next=()=>{ setAnswer(null); setConf(3); if(idx<queue.length-1) setIdx(idx+1); else alert("Drill complete — check your log."); };

  const exportCSV=()=>{
    const header=["date","section","topic","subtype","difficulty","time_sec","result","confidence","guess","note"].join(",");
    const body=logs.map(r=>[r.date,r.section,esc(r.topic),esc(r.subtype),r.difficulty,r.time_sec,r.result,r.confidence,r.guess,esc(r.note||"")].join(",")).join("\n");
    const csv=`${header}\n${body}`; const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=`lsat_log_${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url);
  };
  const esc=(s:any)=> '"'+String(s).replaceAll('"','""')+'"';

  const cur = rc? rc : queue[idx];

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border p-4 bg-white">
        <div className="flex items-center gap-2">
          <button className="btn" onClick={runLR}>LR Strengthen (8Q)</button>
          <button className="btn" onClick={runRC}>RC Single (14m)</button>
          <div className="ml-auto font-mono">Time left: {fmtClock(target - secs)}</div>
        </div>
        <div className="flex gap-2 pt-2">
          <button className="btn" onClick={start}><Play className="w-4 h-4 mr-1"/>Start</button>
          <button className="btn" onClick={pause}><Pause className="w-4 h-4 mr-1"/>Pause</button>
          <button className="btn" onClick={reset}><RotateCcw className="w-4 h-4 mr-1"/>Reset</button>
          <button className="btn" onClick={exportCSV}><Download className="w-4 h-4 mr-1"/>Export</button>
        </div>
      </div>

      {/* Drill */}
      <div className="rounded-2xl border p-4 bg-white">
        {!rc && queue.length===0 && <p className="text-sm opacity-60">Start a drill to begin.</p>}

        {!rc && queue.length>0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm opacity-70">
              <div>Q {idx+1} / {queue.length} • {cur.type}</div>
              <div className="font-mono">{fmtClock(target - secs)}</div>
            </div>
            <p><span className="font-semibold">Stimulus:</span> {cur.stimulus}</p>
            <div className="grid gap-2">
              {cur.choices.map((c:any)=>(
                <label key={c.id} className={clsx("flex items-start gap-2 p-3 rounded-xl border cursor-pointer", answer===c.id?"bg-neutral-100 border-neutral-400":"hover:bg-neutral-50") }>
                  <input type="radio" name="lr" className="mt-1" checked={answer===c.id} onChange={()=>submit(c.id)} />
                  <div><span className="font-semibold mr-1">({c.id})</span>{c.text}</div>
                </label>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">Confidence:</span>
              {[1,2,3,4,5].map(n=> (
                <button key={n} className={clsx("px-2 py-1 rounded border text-sm", conf===n?"bg-neutral-900 text-white":"bg-white") } onClick={()=>setConf(n)}>{n}</button>
              ))}
              <button className="btn ml-auto" onClick={next}>Next</button>
            </div>
          </div>
        )}

        {rc && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm opacity-70">
              <div>RC • {rc.title}</div>
              <div className="font-mono">{fmtClock(target - secs)}</div>
            </div>
            <article className="p-4 rounded-xl border">
              <h3 className="font-semibold mb-2">{rc.title}</h3>
              <p>{rc.text}</p>
            </article>
            {rc.questions.map((q:any,i:number)=> (
              <div key={q.id} className="p-3 rounded-xl border">
                <div className="font-medium mb-1">Q{i+1}. {q.stem}</div>
                <div className="grid gap-2">
                  {q.choices.map((ch:any)=> (
                    <label key={ch.id} className="flex items-start gap-2 p-2 rounded-lg border cursor-pointer hover:bg-neutral-50">
                      <input type="radio" name={`rc-${q.id}`} className="mt-1" onChange={()=>{ /* could log here similarly */ }} />
                      <div><span className="font-semibold mr-1">({ch.id})</span>{ch.text}</div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <div className="flex justify-end"><button className="btn" onClick={()=>{ setRC(null); alert("RC set complete — great work."); }}>Finish RC</button></div>
          </div>
        )}
      </div>

      {/* Log Table (compact) */}
      <div className="rounded-2xl border p-4 bg-white">
        <div className="flex items-center justify-between">
          <div className="text-sm opacity-70">{logs.length} log items</div>
          <button className="btn" onClick={()=>setLogs([])}>Reset Log</button>
        </div>
        <div className="overflow-auto mt-2">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-100"><tr>{"date,section,topic,subtype,diff,time(s),result,conf".split(",").map(h=>(<th key={h} className="text-left p-2 font-medium">{h}</th>))}</tr></thead>
            <tbody>
              {logs.map((r,i)=>(
                <tr key={i} className={i%2?"bg-neutral-50":"bg-white"}>
                  <td className="p-2 whitespace-nowrap">{new Date(r.date).toLocaleString()}</td>
                  <td className="p-2">{r.section}</td>
                  <td className="p-2">{r.topic}</td>
                  <td className="p-2">{r.subtype}</td>
                  <td className="p-2">{r.difficulty}</td>
                  <td className="p-2">{r.time_sec}</td>
                  <td className="p-2">{r.result}</td>
                  <td className="p-2">{r.confidence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// Simple original LR items
function genLR(){
  const bank=[
    {type:"Strengthen",stimulus:"Survey shows cyclists have better cardiovascular health; author concludes cycling causes better health.",gap:"correlation→causation",
      choices:[{id:"A",text:"Many cyclists also run.",flaw:"scope"},{id:"B",text:"Cyclists tend to avoid smoking while other variables remain constant; their health advantage persists.",correct:true},{id:"C",text:"Some dislike cycling.",flaw:"irrelevant"},{id:"D",text:"The survey was done in summer.",flaw:"minor"},{id:"E",text:"Cardio health is complex.",flaw:"vague"}]},
    {type:"Weaken",stimulus:"Teams using a brainstorming app produced more ideas; thus, the app increases creativity.",gap:"no controls",
      choices:[{id:"A",text:"Some users muted notifications.",flaw:"irrelevant"},{id:"B",text:"Teams allowed to adopt the app were the ones with professional facilitators already.",correct:true},{id:"C",text:"The app has dark mode.",flaw:"irrelevant"},{id:"D",text:"The app is subscription-based.",flaw:"irrelevant"},{id:"E",text:"The company will publish a whitepaper.",flaw:"irrelevant"}]},
  ];
  const t=bank[Math.floor(Math.random()*bank.length)];
  const qid=`${Date.now()}-${Math.random().toString(36).slice(0,4)}`;
  return { id: qid, ...t, difficulty:3, choices: shuffle([...t.choices]) };
}
function shuffle(a:any[]){return a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);}

// Simple original RC set
function genRC(){
  const p={ id:`${Date.now()}-RC`, title:"The Puzzle of Urban Night Buses",
    text:"Cities debate late-night bus routes. Proponents say they expand access for service workers; skeptics argue low ridership wastes funds. Evidence suggests routes succeed when schedules are predictable and security presence is visible; ad-hoc routes confuse riders and shrink demand.",
    questions:[
      {id:"Q1",stem:"Author's primary purpose?",choices:[{id:"A",text:"Argue that night buses are always efficient"},{id:"B",text:"Explain when night buses work best",correct:true},{id:"C",text:"Refute skeptics entirely"},{id:"D",text:"Present a budget for buses"}]},
      {id:"Q2",stem:"Which detail best supports the author's claim?",choices:[{id:"A",text:"Some riders use taxis."},{id:"B",text:"Predictable schedules improve route success",correct:true},{id:"C",text:"Security is expensive."},{id:"D",text:"Buses are large vehicles."}]}
    ]};
  return p;
}

// ------------------------ Mentor Chat (LLM) ------------------------
function MentorChat(){
  const [input,setInput]=useState("");
  const [items,setItems]=useState<{role:"user"|"assistant";text:string}[]>([
    {role:"assistant",text:"I’m your LSAT mentor. Ask about strategy, review a miss, or click ‘Load Feb-170 Plan’ to preload your study roadmap."}
  ]);
  const [loading,setLoading]=useState(false);

  const send=async()=>{
    if(!input.trim()) return;
    const text=input; setInput(""); setItems(prev=>[...prev,{role:"user",text}]); setLoading(true);
    try{
      // Optional web search: prefix with [search]: your query
      let ctx="";
      const m=text.match(/^\[search\]:(.*)$/i);
      if(m){
        const q=m[1].trim();
        const res=await fetch("/api/search",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({query:q,max_results:5})});
        const data=await res.json();
        if(data?.ok){
          const results = (data.data?.results||data.data||[]);
          const cites = results.map((r:any,i:number)=>`[${i+1}] ${r.title} – ${r.url} :: ${(r.content||r.snippet||"").slice(0,180)}`).join("\n");
          ctx = `\n\nWeb results:\n${cites}`;
          setItems(prev=>[...prev,{role:"assistant",text:`Searched: ${q}. I’ll cite from the results in my reasoning.`}]);
        }
      }

      const resp = await fetch("/api/mentor",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({prompt:text+ctx,meta:{goal:170,test:"February"}})});

      if(!resp.body){
        const data = await resp.json();
        setItems(prev=>[...prev,{role:"assistant",text:data.text || "(no response)"}]);
      } else {
        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        const push = (chunk:string)=> setItems(prev=>{
          const last = prev[prev.length-1];
          if(last?.role === "assistant"){
            const copy = prev.slice(0,-1);
            return [...copy,{role:"assistant",text:last.text + chunk}];
          }
          return [...prev,{role:"assistant",text:chunk}];
        });
        while(true){
          const {done, value} = await reader.read();
          if(done) break;
          const str = decoder.decode(value);
          for(const line of str.split(/\n/)){
            const m = line.match(/^data:\s*(.*)$/);
            if(m){
              const payload = m[1];
              if(payload === "[DONE]") continue;
              try{
                const j = JSON.parse(payload);
                const t = j?.output_text || j?.delta || "";
                if(t) push(t);
              }catch{}
            }
          }
        }
      }
    }catch(e:any){ setItems(prev=>[...prev,{role:"assistant",text:"Error: "+(e?.message||"unknown") }]); }
    setLoading(false);
  };

  const PRESET = `Week 1 (Fundamentals)\n- 3 LR mixed drills (8–12Q)\n- 2 RC passages (14m each)\n- Build error log; memorize flaw list.\n\nWeek 2 (Targeted)\n- Pick 2 weak LR subtypes + 1 RC family\n- 3×10Q LR + 2 RC passages\n- 1 mixed section; strict review.\n\nWeek 3 (Pacing)\n- 2 timed sections (LR+RC)\n- Retime ladder runs.\n\nWeek 4 (Polish)\n- 3 timed sections\n- 2 blind reviews\n- Simulate test start times.`;

  return (
    <section className="rounded-2xl border p-4 bg-white flex flex-col h-full">
      <div className="flex items-center gap-2 mb-2"><Bot className="w-4 h-4"/><span className="font-semibold">Mentor</span></div>
      <div className="flex gap-2 mb-2">
        <button className="btn" onClick={()=> setItems(prev=>[...prev,{role:"assistant",text:PRESET}])}>Load Feb-170 Plan</button>
        <button className="btn" onClick={()=> setInput("[search]: LSAT timing strategy for LR vs RC")}>Demo Web Search</button>
      </div>
      <div className="flex-1 overflow-auto space-y-3">
        {items.map((m,i)=> (
          <div key={i} className={clsx("rounded-xl p-3", m.role==="assistant"?"bg-neutral-50":"bg-blue-50")}>{m.text}</div>
        ))}
        {loading && <div className="text-sm opacity-60">Streaming…</div>}
      </div>
      <div className="mt-3 flex gap-2">
        <input className="flex-1 border rounded-xl px-3 py-2" placeholder="Ask about LR flaws, RC mapping, pacing… (prefix with [search]: to pull web snippets)" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter') send();}} />
        <button className="btn" onClick={send}><Send className="w-4 h-4"/></button>
      </div>
    </section>
  );
}

// ------------------------ Minimal styles ------------------------
// (utility class 'btn')
declare global { namespace JSX { interface IntrinsicElements { [elemName: string]: any } } }
const btnStyle = `px-3 py-2 rounded-xl border shadow-sm bg-white hover:bg-neutral-50 active:translate-y-px text-sm font-medium`;
const styleEl = document.createElement('style'); styleEl.innerHTML = `.btn{${btnStyle}}`; document.head.appendChild(styleEl);
