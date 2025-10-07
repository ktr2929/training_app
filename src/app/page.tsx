"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Trash2, Plus, Undo2, BarChart2, Calendar as CalendarIcon, HelpCircle } from "lucide-react";
import CalendarView from "react-calendar";
import { PressableButton as Button } from "@/components/ui/pressable-button";

/* ================= JST helpers ================= */
const TZ = "Asia/Tokyo";
// YYYY-MM-DD を JST で安定生成
const dateKeyJST = (d: Date) =>
  new Date(d.toLocaleString("en-US", { timeZone: TZ })).toISOString().slice(0, 10);
// 曜日（0=Sun..6=Sat）をJSTで
const dayJST = (d: Date) => new Date(d.toLocaleString("en-US", { timeZone: TZ })).getDay();

/* ================= types ================= */
type Part = string;
type LiftId = string;
type Lift = { id: LiftId; name: string; part: Part };
type SetEntry = { id: string; date: string; liftId: LiftId; weight: number; reps: number; sets: number; note: string };
type EventEntry = { id: string; date: string; title: string };
type PartFilter = "All" | Part;
type LiftFilter = "All" | LiftId;

/* ================= constants ================= */
const LS_PREFIX = "kintore-v3";
const LS_ENTRIES = `${LS_PREFIX}:entries`;
const LS_LIFTS   = `${LS_PREFIX}:lifts`;
const LS_PARTS   = `${LS_PREFIX}:parts`;
const LS_EVENTS  = `${LS_PREFIX}:events`;

const DEFAULT_PARTS: Part[] = ["胸", "脚", "背中", "肩", "三頭", "二頭"];
const DEFAULT_LIFTS: Lift[] = [
  { id: "Bench", name: "ベンチプレス", part: "胸" },
  { id: "Squat", name: "スクワット", part: "脚" },
  { id: "Deadlift", name: "デッドリフト", part: "背中" },
];

const todayISO = () => dateKeyJST(new Date());
const isSBD = (id: string) => ["Squat", "Bench", "Deadlift"].includes(id);

/* ================= validation ================= */
const toNumber = (v: string | number) => {
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(n) ? n : NaN;
};
// 未入力/NaN・負数はNG、0や小数はOK
const validate = (v: string | number) => {
  const n = toNumber(v);
  return { ok: Number.isFinite(n) && n >= 0, num: n };
};

/* ================= main ================= */
export default function App() {
  /* toast */
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toast = (m: string, ms = 2000) => { setToastMsg(m); setTimeout(()=>setToastMsg(null), ms); };

  /* master & data */
  const [parts, setParts] = useState<Part[]>([...DEFAULT_PARTS]);
  const [lifts, setLifts] = useState<Lift[]>([...DEFAULT_LIFTS]);
  const [entries, setEntries] = useState<SetEntry[]>([]);
  const [events, setEvents] = useState<EventEntry[]>([]);

  /* forms */
  const [form, setForm] = useState({
    date: todayISO(), part: "胸" as Part, liftId: "Bench" as LiftId,
    weight: 60, reps: 1, sets: 1, note: "",
  });
  const [lastDeleted, setLastDeleted] = useState<SetEntry[] | null>(null);

  /* filters */
  const [fDate, setFDate] = useState<string>("");
  const [fPart, setFPart] = useState<PartFilter>("All");
  const [fLift, setFLift] = useState<LiftFilter>("All");

  /* calendar */
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [eventForm, setEventForm] = useState({ date: "", title: "" });
  const [showHelp, setShowHelp] = useState(false);

  /* storage load/save */
  useEffect(() => {
    try {
      const P = localStorage.getItem(LS_PARTS);  if (P) setParts(JSON.parse(P));
      const L = localStorage.getItem(LS_LIFTS);  if (L) setLifts(JSON.parse(L));
      const E = localStorage.getItem(LS_ENTRIES);if (E) setEntries(JSON.parse(E));
      const Ev= localStorage.getItem(LS_EVENTS); if (Ev) setEvents(JSON.parse(Ev));
    } catch {}
  }, []);
  useEffect(()=> localStorage.setItem(LS_PARTS, JSON.stringify(parts)), [parts]);
  useEffect(()=> localStorage.setItem(LS_LIFTS, JSON.stringify(lifts)), [lifts]);
  useEffect(()=> localStorage.setItem(LS_ENTRIES, JSON.stringify(entries)), [entries]);
  useEffect(()=> localStorage.setItem(LS_EVENTS , JSON.stringify(events )), [events]);

  /* add entry */
  const addEntry = () => {
    const { ok: okW, num: weight } = validate(form.weight);
    const { ok: okR, num: reps }   = validate(form.reps);
    const { ok: okS, num: sets }   = validate(form.sets);
    if (!form.date || !form.liftId || !okW || !okR || !okS) {
      toast("入力値を確認してください（未入力・負の数は不可）");
      return;
    }
    const idBase = `${form.date}-${form.liftId}-${Date.now()}`;
    const newOnes: SetEntry[] = Array.from({ length: sets }).map((_, i) => ({
      id: `${idBase}-${i}`, date: form.date, liftId: form.liftId,
      weight, reps, sets: 1, note: form.note || "",
    }));
    setEntries(prev => [...newOnes, ...prev].sort((a,b)=> a.date < b.date ? 1 : -1));
    setForm(f => ({ ...f, note: "" }));
    toast("追加されました！");
  };

  /* delete + undo */
  const deleteByIds = (ids: string[]) => {
    const removed = entries.filter(e => ids.includes(e.id));
    setLastDeleted(removed);
    setEntries(entries.filter(e => !ids.includes(e.id)));
  };
  const undoDelete = () => {
    if (!lastDeleted) return;
    setEntries(prev => [...lastDeleted, ...prev].sort((a,b)=> a.date < b.date ? 1 : -1));
    setLastDeleted(null);
    toast("削除を取り消しました");
  };

  /* lift change → pick latest values of same lift */
  useEffect(() => {
    if (!form.liftId) return;
    const prev = [...entries]
      .filter(e => e.liftId === form.liftId)
      .sort((a, b) => (a.date < b.date ? 1 : -1))[0];
    if (prev) {
      setForm(f => ({ ...f, weight: prev.weight, reps: prev.reps, sets: prev.sets, note: prev.note }));
      toast("前回の記録を引き継ぎました");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.liftId]);

  /* filter application */
  const filteredEntries = useMemo(() => {
    const liftById = new Map(lifts.map(l => [l.id, l]));
    return entries.filter(e => {
      if (fDate && e.date !== fDate) return false;
      if (fLift !== "All" && e.liftId !== fLift) return false;
      if (fPart !== "All") {
        const li = liftById.get(e.liftId);
        if (!li || li.part !== fPart) return false;
      }
      return true;
    });
  }, [entries, lifts, fDate, fPart, fLift]);

  /* ===== stats: SBD line with unique dates & update-only points ===== */
  const sbdData = useMemo(() => {
    type K = "Squat" | "Bench" | "Deadlift";
    const dayMax: Record<K, Map<string, number>> = { Squat:new Map(), Bench:new Map(), Deadlift:new Map() };
    for (const e of entries) {
      if (!isSBD(e.liftId) || e.reps !== 1) continue;
      const k = e.liftId as K;
      const d = e.date;
      dayMax[k].set(d, Math.max(dayMax[k].get(d) ?? -Infinity, e.weight));
    }
    const allDates = new Set<string>([...dayMax.Squat.keys(), ...dayMax.Bench.keys(), ...dayMax.Deadlift.keys()]);
    const datesSorted = [...allDates].sort((a,b)=> a<b? -1: 1);

    const out: Array<{date: string; Squat: number|null; Bench: number|null; Deadlift: number|null}> = [];
    let best: Record<K, number> = { Squat: -Infinity, Bench: -Infinity, Deadlift: -Infinity };
    for (const d of datesSorted) {
      let changed = false;
      const row: any = { date: d, Squat: null, Bench: null, Deadlift: null };
      (["Squat","Bench","Deadlift"] as K[]).forEach(k => {
        const v = dayMax[k].get(d);
        if (v != null && v > best[k]) { best[k] = v; row[k] = v; changed = true; }
      });
      if (changed) out.push(row);
    }
    return out;
  }, [entries]);

  /* ====== day summary for selected date in filter (optional card) ====== */
  const daySummary = useMemo(() => {
    if (!fDate) return null;
    const list = entries.filter(e => e.date === fDate);
    if (!list.length) return null;
    const map = new Map<LiftId, SetEntry[]>();
    for (const e of list) { if (!map.has(e.liftId)) map.set(e.liftId, []); map.get(e.liftId)!.push(e); }
    return Array.from(map.entries()).map(([liftId, arr]) => {
      const volume = arr.reduce((s, x) => s + x.weight * x.reps * x.sets, 0);
      return { liftId, arr, volume };
    });
  }, [entries, fDate]);

  /* ===== UI ===== */
  return (
    <div className="min-h-screen w-full bg-neutral-50 text-neutral-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* header */}
        <header className="flex items-center justify-between gap-3">
          <h1 className="text-2xl md:text-3xl font-bold">きんとれログ</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={()=>setShowHelp(true)}>
              <HelpCircle className="w-4 h-4 mr-1"/>ヘルプ
            </Button>
          </div>
        </header>

        <Tabs defaultValue="log">
          <TabsList className="w-full grid grid-cols-4 md:inline-flex md:w-auto">
            <TabsTrigger value="log">記録</TabsTrigger>
            <TabsTrigger value="stats">統計</TabsTrigger>
            <TabsTrigger value="calendar">カレンダー</TabsTrigger>
            <TabsTrigger value="settings">設定</TabsTrigger>
          </TabsList>

          {/* ===== 記録 ===== */}
          <TabsContent value="log" className="space-y-4">
            {/* フィルタ */}
            <Card className="shadow-sm">
              <CardContent className="p-4 grid grid-cols-2 md:grid-cols-6 gap-3 md:items-center">
                <div>
                  <label className="text-xs text-neutral-500">日付で絞り込み</label>
                  <Input className="h-9" type="date" value={fDate} onChange={e=>setFDate(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-neutral-500">部位で絞り込み</label>
                  <Select value={fPart} onValueChange={(v)=>{ setFPart(v as PartFilter); setFLift("All"); }}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="すべて" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">すべて</SelectItem>
                      {parts.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-neutral-500">種目で絞り込み</label>
                  <Select value={fLift} onValueChange={(v)=> setFLift(v as LiftFilter)}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="すべて" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">すべて</SelectItem>
                      {(fPart==="All" ? lifts : lifts.filter(l=>l.part===fPart)).map(l =>
                        <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 col-span-2 md:col-span-3">
                  <Button className="w-full md:w-[120px]" variant="outline" onClick={()=>{ setFDate(""); setFPart("All"); setFLift("All"); }}>
                    クリア
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* その日のサマリー（任意表示） */}
            {fDate && daySummary && daySummary.length>0 && (
              <Card className="shadow-sm">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-3">{fDate} のトレーニング</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {daySummary.map(({ liftId, arr, volume }) => (
                      <div key={liftId} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">{nameOf(lifts, liftId)}</div>
                          <div className="text-sm text-neutral-500">総ボリューム {Math.round(volume)} kg</div>
                        </div>
                        <div className="text-sm space-y-1">
                          {arr.map(s => (
                            <div key={s.id} className="flex justify-between">
                              <span>{s.weight} kg × {s.reps} reps</span>
                              <span className="text-neutral-500">{s.note}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 入力フォーム */}
            <Card className="shadow-sm">
              <CardContent className="p-4 grid grid-cols-2 md:grid-cols-8 gap-3 items-center">
                <div>
                  <label className="text-xs text-neutral-500">日付</label>
                  <Input className="h-9" type="date" value={form.date} onChange={e=>setForm({...form, date:e.target.value})}/>
                </div>
                <div>
                  <label className="text-xs text-neutral-500">部位</label>
                  <Select value={form.part} onValueChange={(v)=> setForm({...form, part:v as Part})}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="選択" /></SelectTrigger>
                    <SelectContent>
                      {parts.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-neutral-500">種目</label>
                  <Select value={form.liftId} onValueChange={(v)=> setForm({...form, liftId:v as LiftId})}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="選択" /></SelectTrigger>
                    <SelectContent>
                      {lifts.filter(l=>l.part===form.part).map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-neutral-500">重量(kg)</label>
                  <Input className="h-9" type="number" inputMode="decimal" step="0.1"
                    value={form.weight}
                    onChange={e=> setForm({...form, weight: (toNumber(e.target.value) || 0) })}
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-500">回数</label>
                  <Input className="h-9" type="number" inputMode="numeric" step="1"
                    value={form.reps}
                    onChange={e=> setForm({...form, reps: (toNumber(e.target.value) || 0) })}
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-500">セット数</label>
                  <Input className="h-9" type="number" inputMode="numeric" step="1"
                    value={form.sets}
                    onChange={e=> setForm({...form, sets: (toNumber(e.target.value) || 0) })}
                  />
                </div>
                <div className="col-span-2 md:col-span-8">
                  <label className="text-xs text-neutral-500">メモ</label>
                  <Textarea className="min-h-[72px]" rows={2} value={form.note} onChange={e=>setForm({...form, note:e.target.value})}/>
                </div>
                <div className="col-span-2 md:col-span-8 flex items-center gap-2">
                  <Button className="inline-flex items-center gap-2" onClick={addEntry}><Plus className="w-4 h-4"/>追加</Button>
                  {lastDeleted && <Button className="inline-flex items-center gap-2" variant="outline" onClick={undoDelete}><Undo2 className="w-4 h-4"/>元に戻す</Button>}
                </div>
              </CardContent>
            </Card>

            {/* テーブル */}
            <LogTable entries={filteredEntries} lifts={lifts} onDelete={deleteByIds} />
          </TabsContent>

          {/* ===== 統計 ===== */}
          <TabsContent value="stats" className="space-y-4">
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart2 className="w-4 h-4" />
                  <h3 className="font-semibold">SBDマックス値推移（reps=1 実測／更新日のみ）</h3>
                </div>
                <div className="w-full h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sbdData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="Squat"    name="Squat"    stroke="#2563eb" dot />
                      <Line type="monotone" dataKey="Bench"    name="Bench"    stroke="#ef4444" dot />
                      <Line type="monotone" dataKey="Deadlift" name="Deadlift" stroke="#10b981" dot />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== カレンダー ===== */}
          <TabsContent value="calendar" className="space-y-4">
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  {/* 左：イベント追加 */}
                  <div className="xl:col-span-1 space-y-3">
                    <div>
                      <label className="text-xs text-neutral-500">日付</label>
                      <Input className="h-9" type="date" value={eventForm.date} onChange={e=>setEventForm({...eventForm, date:e.target.value})}/>
                    </div>
                    <div>
                      <label className="text-xs text-neutral-500">イベント名</label>
                      <Input className="h-9" placeholder="例: 県大会 予選" value={eventForm.title} onChange={e=>setEventForm({...eventForm, title:e.target.value})}/>
                    </div>
                    <Button className="w-full inline-flex items-center gap-2" onClick={()=>{
                      if (!eventForm.date || !eventForm.title) { toast("日付とイベント名を入力"); return; }
                      setEvents(prev=>[...prev, { id:`${eventForm.date}-${Date.now()}`, ...eventForm }].sort((a,b)=>(a.date>b.date?1:-1)));
                      setSelectedDate(new Date(eventForm.date));
                      setEventForm({ date:"", title:"" });
                      toast("イベントを追加しました");
                    }}>
                      <CalendarIcon className="w-4 h-4"/>追加
                    </Button>
                  </div>

                  {/* 中央：JST固定カレンダー */}
                  <div className="xl:col-span-1 flex justify-center">
                    <div className="rounded-xl border p-3 bg-white w-full max-w-[420px]">
                      <CalendarView
                        value={selectedDate}
                        onChange={(v) => setSelectedDate(v as Date)}
                        locale="ja-JP"
                        showNeighboringMonth={false}
                        next2Label={null}
                        prev2Label={null}
                        formatShortWeekday={(_, d) => ["日","月","火","水","木","金","土"][dayJST(d)]}
                        formatDay={(_, d) => new Date(d.toLocaleString("en-US",{timeZone:TZ})).getDate().toString()}
                        tileClassName={({ date, view }) => {
                          if (view !== "month") return "";
                          const iso = dateKeyJST(date);
                          const isToday = iso === todayISO();
                          const isEvent = events.some(e => e.date === iso);
                          const w = dayJST(date);
                          const weekend = w===0 ? "text-red-500" : w===6 ? "text-blue-600" : "";
                          const ring = isToday ? "ring-2 ring-amber-500 rounded-md" : "";
                          const bg = isEvent ? "!bg-yellow-100" : "";
                          return `${weekend} ${ring} ${bg}`;
                        }}
                      />
                    </div>
                  </div>

                  {/* 右：今後のイベント */}
                  <div className="xl:col-span-1 space-y-3">
                    <h4 className="font-semibold">今後のイベント</h4>
                    {events.length===0 && <div className="text-sm text-neutral-500">登録されたイベントはありません。</div>}
                    {events.map(e => {
                      const days = Math.ceil((new Date(e.date).getTime() - Date.now()) / (1000*3600*24));
                      return (
                        <div key={e.id} className="border rounded-lg p-2 flex items-center justify-between">
                          <div>
                            <div className="font-medium">{e.title}</div>
                            <div className="text-xs text-neutral-500">{e.date}（あと {Math.max(0, days)} 日）</div>
                          </div>
                          <Button className="inline-flex items-center gap-2" size="sm" variant="destructive"
                            onClick={()=> setEvents(events.filter(x => x.id !== e.id))}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== 設定 ===== */}
          <TabsContent value="settings" className="space-y-6">
            <PartsManager parts={parts} setParts={setParts} lifts={lifts} setLifts={setLifts} />
            <LiftsManager parts={parts} lifts={lifts} setLifts={setLifts} />
          </TabsContent>
        </Tabs>
      </div>

      {/* help modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={()=>setShowHelp(false)} />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg">使い方</h3>
              <Button variant="outline" onClick={()=>setShowHelp(false)}>閉じる</Button>
            </div>
            <div className="space-y-3 text-sm leading-7">
              <ul className="list-disc ml-5">
                <li>記録タブ：日付/部位/種目で絞り込み、当日のサマリー＋一覧、前回値自動引き継ぎ。</li>
                <li>統計タブ：SBDの1RM（reps=1実測）推移。更新日のみ折れ線表示。</li>
                <li>カレンダータブ：イベント登録とJST固定カレンダー。</li>
                <li>設定タブ：部位/種目の追加・削除・所属変更。</li>
              </ul>
              <p className="text-neutral-600">※データはローカルストレージに保存されます。</p>
            </div>
          </div>
        </div>
      )}

      {/* toast */}
      {toastMsg && (
        <div className="fixed top-4 right-4 z-[60]">
          <div className="rounded-md bg-neutral-900 text-white text-sm px-4 py-2 shadow-lg">
            {toastMsg}
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= sub components ================= */

function LogTable({ entries, lifts, onDelete }:{
  entries: SetEntry[]; lifts: Lift[]; onDelete: (ids: string[])=>void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const toggle = (id: string) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const del = () => { if (selected.size && confirm(`${selected.size}件削除しますか？`)) onDelete(Array.from(selected)); setSelected(new Set()); };
  const nameOfLocal = (id: LiftId) => lifts.find(l => l.id===id)?.name || id;

  const groups = useMemo(() => {
    const m = new Map<string, SetEntry[]>();
    for (const e of entries) { const k = `${e.date}|${e.liftId}`; if (!m.has(k)) m.set(k, []); m.get(k)!.push(e); }
    return Array.from(m.entries()).sort((a,b)=> (a[0] < b[0] ? 1 : -1));
  }, [entries]);

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-neutral-600">{entries.length} 件</div>
        <Button className="inline-flex items-center gap-2" variant="destructive" size="sm" onClick={del} disabled={!selected.size}>
          <Trash2 className="w-4 h-4 mr-1"/>選択削除 ({selected.size})
        </Button>
      </div>
      <div className="max-h-[60vh] overflow-auto rounded-lg border">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 bg-white z-10">
            <tr className="text-left text-neutral-600 border-b">
              <th className="p-2">選択</th>
              <th className="p-2">日付</th>
              <th className="p-2">種目</th>
              <th className="p-2">重量(kg)</th>
              <th className="p-2">回数</th>
              <th className="p-2">メモ</th>
            </tr>
          </thead>
          <tbody>
            {groups.map(([key, arr]) => {
              const [date, liftId] = key.split("|");
              return (
                <React.Fragment key={key}>
                  <tr className="bg-neutral-100">
                    <td colSpan={6} className="p-2 font-medium">
                      {date} / {nameOfLocal(liftId as LiftId)} <span className="text-xs text-neutral-500">({arr.length}セット)</span>
                    </td>
                  </tr>
                  {arr.map((e, i) => (
                    <motion.tr key={e.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`border-b ${i%2===0 ? "bg-white" : "bg-neutral-50"}`}>
                      <td className="p-2"><input type="checkbox" checked={selected.has(e.id)} onChange={()=>toggle(e.id)} /></td>
                      <td className="p-2 whitespace-nowrap">{e.date}</td>
                      <td className="p-2 whitespace-nowrap">{nameOfLocal(e.liftId)}</td>
                      <td className="p-2">{e.weight}</td>
                      <td className="p-2">{e.reps}</td>
                      <td className="p-2 max-w-[400px] truncate" title={e.note}>{e.note}</td>
                    </motion.tr>
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PartsManager({ parts, setParts, lifts, setLifts }:{
  parts: Part[]; setParts: (p: Part[])=>void; lifts: Lift[]; setLifts: (l: Lift[])=>void;
}) {
  const [newPart, setNewPart] = useState("");
  return (
    <Card className="shadow-sm">
      <CardContent className="p-4 space-y-4">
        <h3 className="font-semibold">部位の管理</h3>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
          <Input className="h-9" placeholder="部位を追加（例: 体幹）" value={newPart} onChange={e=>setNewPart(e.target.value)} />
          <Button className="w-full md:w-[120px]" onClick={()=>{
            const p = newPart.trim(); if (!p) return;
            if (!parts.includes(p)) setParts([...parts, p]);
            setNewPart("");
          }}>追加</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {parts.map(p => (
            <div key={p} className="px-3 py-1 rounded-full border text-sm flex items-center gap-2">
              {p}
              <Button size="icon" variant="ghost" title="削除" onClick={()=>{
                const remain = parts.filter(x=>x!==p);
                const fallback = remain[0] || "胸";
                setParts(remain.length ? remain : ["胸"]);
                setLifts(lifts.map(l => l.part===p ? { ...l, part:fallback } : l));
              }}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function LiftsManager({ parts, lifts, setLifts }:{
  parts: Part[]; lifts: Lift[]; setLifts: (l: Lift[])=>void;
}) {
  const [newLiftName, setNewLiftName] = useState("");
  const [newLiftPart, setNewLiftPart] = useState<Part>(parts[0] || "胸");
  const [editLiftId, setEditLiftId] = useState<LiftId | "">("");
  const [editLiftPart, setEditLiftPart] = useState<Part>(parts[0] || "胸");
  const isDefaultSBD = (id: string) => ["Bench","Squat","Deadlift"].includes(id);

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4 space-y-4">
        <h3 className="font-semibold">種目の管理（追加/削除/所属変更）</h3>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_160px_120px] gap-2">
          <Input className="h-9" placeholder="種目名（例: Pull-up）" value={newLiftName} onChange={e=>setNewLiftName(e.target.value)} />
          <Select value={newLiftPart} onValueChange={(v)=>setNewLiftPart(v as Part)}>
            <SelectTrigger className="h-9"><SelectValue placeholder="部位" /></SelectTrigger>
            <SelectContent>{parts.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
          </Select>
          <Button className="w-full" onClick={()=>{
            const name = newLiftName.trim(); if (!name) return;
            const id = name; // そのままIDに
            if (lifts.some(l => l.id === id)) return;
            setLifts([...lifts, { id, name, part:newLiftPart }]);
            setNewLiftName("");
          }}>追加</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_160px_120px_120px] gap-2">
          <Select value={editLiftId} onValueChange={(v)=>{
            setEditLiftId(v as LiftId);
            const t=lifts.find(l=>l.id===v);
            setEditLiftPart(t?.part || parts[0] || "胸");
          }}>
            <SelectTrigger className="h-9"><SelectValue placeholder="種目を選択" /></SelectTrigger>
            <SelectContent>{lifts.map(l => <SelectItem key={l.id} value={l.id}>{l.name}（{l.part}）</SelectItem>)}</SelectContent>
          </Select>

          <Select value={editLiftPart} onValueChange={(v)=>setEditLiftPart(v as Part)}>
            <SelectTrigger className="h-9"><SelectValue placeholder="部位" /></SelectTrigger>
            <SelectContent>{parts.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
          </Select>

          <Button className="w-full" onClick={()=>{
            if (!editLiftId) return;
            setLifts(lifts.map(l => l.id===editLiftId ? { ...l, part:editLiftPart } : l));
          }}>部位を変更</Button>

          <Button className="w-full" variant="destructive" onClick={()=>{
            if (!editLiftId) return;
            if (isDefaultSBD(editLiftId)) return;
            setLifts(lifts.filter(l => l.id!==editLiftId));
            setEditLiftId("");
          }}>種目を削除</Button>
        </div>

        <p className="text-xs text-neutral-500">※ SBD（ベンチ/スクワット/デッドリフト）は削除できません。</p>
      </CardContent>
    </Card>
  );
}

/* util */
function nameOf(lifts: Lift[], id: LiftId) {
  return lifts.find(l => l.id === id)?.name || id;
}
