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
import {
  Trash2, Plus, Undo2, BarChart2, Calendar, HelpCircle,
} from "lucide-react";
import CalendarView from "react-calendar";
import { PressableButton as Button } from "@/components/ui/pressable-button";

// === JSTヘルパー ===
const TZ = "Asia/Tokyo";
const localDateKey = (d: Date) =>
  d.toLocaleString("sv-SE", { timeZone: TZ, hour12: false }).slice(0, 10);
const getJstDay = (d: Date) =>
  new Date(d.toLocaleString("en-US", { timeZone: TZ })).getDay();

// === 型定義 ===
type Part = string;
type LiftId = string;
type Lift = { id: LiftId; name: string; part: Part };
type SetEntry = {
  id: string;
  date: string;
  liftId: LiftId;
  weight: number;
  reps: number;
  sets: number;
  note: string;
};
type EventEntry = { id: string; date: string; title: string };
type PartFilter = "All" | Part;
type LiftFilter = "All" | LiftId;

// === 定数 ===
const LS_PREFIX = "kintore-v3";
const LS_ENTRIES = `${LS_PREFIX}:entries`;
const LS_LIFTS = `${LS_PREFIX}:lifts`;
const LS_PARTS = `${LS_PREFIX}:parts`;
const LS_EVENTS = `${LS_PREFIX}:events`;

const DEFAULT_PARTS: Part[] = ["胸", "脚", "背中", "肩", "三頭", "二頭"];
const DEFAULT_LIFTS: Lift[] = [
  { id: "Bench", name: "ベンチプレス", part: "胸" },
  { id: "Squat", name: "スクワット", part: "脚" },
  { id: "Deadlift", name: "デッドリフト", part: "背中" },
];

const todayISO = () => new Date().toISOString().slice(0, 10);
const isSBD = (id: string) => ["Squat", "Bench", "Deadlift"].includes(id);

// === バリデーション関数 ===
const toNumber = (v: string | number) => {
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(n) ? n : NaN;
};
const validateInput = (v: string | number): { ok: boolean; num: number } => {
  const n = toNumber(v);
  if (isNaN(n)) return { ok: false, num: NaN };
  if (n < 0) return { ok: false, num: NaN }; // 負の数は禁止
  return { ok: true, num: n };
};

// === メインコンポーネント ===
export default function App() {
  // トースト
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string, ms = 2000) => {
    setToastMsg(msg);
    window.setTimeout(() => setToastMsg(null), ms);
  };

  // データ状態
  const [parts, setParts] = useState<Part[]>([...DEFAULT_PARTS]);
  const [lifts, setLifts] = useState<Lift[]>([...DEFAULT_LIFTS]);
  const [entries, setEntries] = useState<SetEntry[]>([]);
  const [events, setEvents] = useState<EventEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showHelp, setShowHelp] = useState(false);
  const [lastDeleted, setLastDeleted] = useState<SetEntry[] | null>(null);

  // 入力フォーム
  const [form, setForm] = useState({
    date: todayISO(),
    part: "胸" as Part,
    liftId: "Bench" as LiftId,
    weight: 60,
    reps: 1,
    sets: 1,
    note: "",
  });

  // 絞り込みフィルタ
  const [fDate, setFDate] = useState<string>("");
  const [fPart, setFPart] = useState<PartFilter>("All");
  const [fLift, setFLift] = useState<LiftFilter>("All");

  // イベント登録フォーム
  const [eventForm, setEventForm] = useState({ date: "", title: "" });

  // === LocalStorage Load/Save ===
  useEffect(() => {
    try {
      const rawP = localStorage.getItem(LS_PARTS);
      const rawL = localStorage.getItem(LS_LIFTS);
      const rawE = localStorage.getItem(LS_ENTRIES);
      const rawEv = localStorage.getItem(LS_EVENTS);
      if (rawP) setParts(JSON.parse(rawP));
      if (rawL) setLifts(JSON.parse(rawL));
      if (rawE) setEntries(JSON.parse(rawE));
      if (rawEv) setEvents(JSON.parse(rawEv));
    } catch {}
  }, []);
  useEffect(() => { localStorage.setItem(LS_PARTS, JSON.stringify(parts)); }, [parts]);
  useEffect(() => { localStorage.setItem(LS_LIFTS, JSON.stringify(lifts)); }, [lifts]);
  useEffect(() => { localStorage.setItem(LS_ENTRIES, JSON.stringify(entries)); }, [entries]);
  useEffect(() => { localStorage.setItem(LS_EVENTS, JSON.stringify(events)); }, [events]);

  // === エントリ追加 ===
  const addEntry = () => {
    const { ok: okW, num: weight } = validateInput(form.weight);
    const { ok: okR, num: reps } = validateInput(form.reps);
    const { ok: okS, num: sets } = validateInput(form.sets);
    if (!form.date || !form.liftId || !okW || !okR || !okS) {
      showToast("入力値を確認してください（未入力・負の数は不可）");
      return;
    }

    const idBase = `${form.date}-${form.liftId}-${Date.now()}`;
    const newOnes: SetEntry[] = Array.from({ length: sets }).map((_, i) => ({
      id: `${idBase}-${i}`,
      date: form.date,
      liftId: form.liftId,
      weight,
      reps,
      sets: 1,
      note: form.note || "",
    }));

    setEntries(prev => [...newOnes, ...prev].sort((a, b) => (a.date < b.date ? 1 : -1)));
    setForm(f => ({ ...f, note: "" }));
    showToast("追加されました！");
  };

  // === 種目切り替え時に前回値を引き継ぎ ===
  useEffect(() => {
    if (!form.liftId) return;
    const prev = entries.find(e => e.liftId === form.liftId);
    if (prev) {
      setForm(f => ({
        ...f,
        weight: prev.weight,
        reps: prev.reps,
        sets: prev.sets,
        note: prev.note,
      }));
      showToast("前回の記録を引き継ぎました");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.liftId]);
  // === SBD統計：更新日のみの折れ線 ===
  const sbdSeries = useMemo(() => {
    type LiftKey = "Squat" | "Bench" | "Deadlift";
    type P = { date: string; oneRM: number };
    const dayMax: Record<LiftKey, Map<string, number>> = {
      Squat: new Map(), Bench: new Map(), Deadlift: new Map()
    };
    for (const e of entries) {
      if (!isSBD(e.liftId) || e.reps !== 1) continue;
      const k = e.liftId as LiftKey;
      const d = e.date;
      const prev = dayMax[k].get(d) ?? -Infinity;
      if (e.weight > prev) dayMax[k].set(d, e.weight);
    }
    const toSeries = (m: Map<string, number>): P[] => {
      const sorted = [...m.entries()].sort((a, b) => a[0] < b[0] ? -1 : 1);
      const out: P[] = [];
      let best = -Infinity;
      for (const [d, w] of sorted) {
        if (w > best) { best = w; out.push({ date: d, oneRM: w }); }
      }
      return out;
    };
    return {
      Squat: toSeries(dayMax.Squat),
      Bench: toSeries(dayMax.Bench),
      Deadlift: toSeries(dayMax.Deadlift),
    };
  }, [entries]);

  /** ===== UI ===== */
  return (
    <div className="min-h-screen w-full bg-neutral-50 text-neutral-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between gap-3">
          <h1 className="text-2xl md:text-3xl font-bold">きんとれログ</h1>
          <Button variant="outline" onClick={() => setShowHelp(true)}>
            <HelpCircle className="w-4 h-4 mr-2" />ヘルプ
          </Button>
        </header>

        <Tabs defaultValue="log">
          <TabsList className="w-full grid grid-cols-4 md:inline-flex md:w-auto">
            <TabsTrigger value="log">記録</TabsTrigger>
            <TabsTrigger value="stats">統計</TabsTrigger>
            <TabsTrigger value="calendar">カレンダー</TabsTrigger>
            <TabsTrigger value="settings">設定</TabsTrigger>
          </TabsList>

          {/* ==== 記録 ==== */}
          <TabsContent value="log" className="space-y-4">
            {/* 入力フォーム */}
            <Card className="shadow-sm">
              <CardContent className="p-4 grid grid-cols-2 md:grid-cols-8 gap-3 items-center">
                <div>
                  <label className="text-xs text-neutral-500">日付</label>
                  <Input className="h-9" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-neutral-500">部位</label>
                  <Select value={form.part} onValueChange={(v) => setForm({ ...form, part: v as Part })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>{parts.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-neutral-500">種目</label>
                  <Select value={form.liftId} onValueChange={(v) => setForm({ ...form, liftId: v as LiftId })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {lifts.filter(l => l.part === form.part).map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-neutral-500">重量(kg)</label>
                  <Input
                    className="h-9"
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    value={form.weight}
                    onChange={(e) => {
                      const n = toNumber(e.target.value);
                      setForm({ ...form, weight: Number.isFinite(n) ? n : 0 });
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-500">回数</label>
                  <Input
                    className="h-9"
                    type="number"
                    inputMode="numeric"
                    step="1"
                    value={form.reps}
                    onChange={(e) => {
                      const n = toNumber(e.target.value);
                      setForm({ ...form, reps: Number.isFinite(n) ? n : 0 });
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-500">セット数</label>
                  <Input
                    className="h-9"
                    type="number"
                    inputMode="numeric"
                    step="1"
                    value={form.sets}
                    onChange={(e) => {
                      const n = toNumber(e.target.value);
                      setForm({ ...form, sets: Number.isFinite(n) ? n : 0 });
                    }}
                  />
                </div>
                <div className="col-span-2 md:col-span-8">
                  <label className="text-xs text-neutral-500">メモ</label>
                  <Textarea className="min-h-[72px]" rows={2} value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
                </div>
                <div className="col-span-2 md:col-span-8 flex items-center gap-2">
                  <Button onClick={addEntry}><Plus className="w-4 h-4" />追加</Button>
                </div>
              </CardContent>
            </Card>

            {/* 記録一覧 */}
            <LogTable entries={entries} lifts={lifts} onDelete={(ids) => setEntries(entries.filter(e => !ids.includes(e.id)))} />
          </TabsContent>

          {/* ==== 統計 ==== */}
          <TabsContent value="stats" className="space-y-4">
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart2 className="w-4 h-4" />
                  <h3 className="font-semibold">SBDマックス値推移（reps=1 実測／更新日のみ）</h3>
                </div>
                <div className="w-full h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line data={sbdSeries.Squat} type="monotone" dataKey="oneRM" name="Squat" stroke="#2563eb" dot />
                      <Line data={sbdSeries.Bench} type="monotone" dataKey="oneRM" name="Bench" stroke="#ef4444" dot />
                      <Line data={sbdSeries.Deadlift} type="monotone" dataKey="oneRM" name="Deadlift" stroke="#10b981" dot />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==== カレンダー ==== */}
          <TabsContent value="calendar" className="space-y-4">
            <Card className="shadow-sm">
              <CardContent className="p-4 grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* 左：イベント追加 */}
                <div className="space-y-3">
                  <label className="text-xs text-neutral-500">日付</label>
                  <Input className="h-9" type="date" value={eventForm.date} onChange={e => setEventForm({ ...eventForm, date: e.target.value })} />
                  <label className="text-xs text-neutral-500">イベント名</label>
                  <Input className="h-9" value={eventForm.title} onChange={e => setEventForm({ ...eventForm, title: e.target.value })} placeholder="例: 大会" />
                  <Button className="w-full" onClick={() => {
                    if (!eventForm.date || !eventForm.title) return;
                    setEvents(prev => [...prev, { id: `${eventForm.date}-${Date.now()}`, ...eventForm }].sort((a, b) => a.date > b.date ? 1 : -1));
                    setEventForm({ date: "", title: "" });
                    showToast("イベントを追加しました");
                  }}>追加</Button>
                </div>

                {/* 中央：カレンダー */}
                <div className="flex justify-center">
                  <CalendarView
                    value={selectedDate}
                    onChange={(v) => setSelectedDate(v as Date)}
                    locale="ja-JP"
                    showNeighboringMonth={false}
                    next2Label={null}
                    prev2Label={null}
                    formatShortWeekday={(_, date) => ["日", "月", "火", "水", "木", "金", "土"][getJstDay(date)]}
                    tileClassName={({ date, view }) => {
                      if (view !== "month") return "";
                      const iso = localDateKey(date);
                      const isEvent = events.some(e => e.date === iso);
                      const isToday = iso === localDateKey(new Date());
                      const w = getJstDay(date);
                      const weekend = w === 0 ? "text-red-500" : w === 6 ? "text-blue-600" : "";
                      return `${weekend} ${isEvent ? "bg-yellow-100" : ""} ${isToday ? "ring-2 ring-amber-500" : ""}`;
                    }}
                  />
                </div>

                {/* 右：イベント一覧 */}
                <div className="space-y-3">
                  <h4 className="font-semibold">今後のイベント</h4>
                  {events.length === 0 && <p className="text-sm text-neutral-500">イベントは登録されていません。</p>}
                  {events.map(e => (
                    <div key={e.id} className="border rounded-md p-2 flex justify-between items-center">
                      <div>
                        <div className="font-medium">{e.title}</div>
                        <div className="text-xs text-neutral-500">{e.date}</div>
                      </div>
                      <Button size="sm" variant="destructive" onClick={() => setEvents(events.filter(x => x.id !== e.id))}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==== 設定 ==== */}
          <TabsContent value="settings" className="space-y-6">
            <PartsManager parts={parts} setParts={setParts} lifts={lifts} setLifts={setLifts} />
            <LiftsManager parts={parts} lifts={lifts} setLifts={setLifts} />
          </TabsContent>
        </Tabs>
      </div>

      {/* ヘルプ */}
      {showHelp && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowHelp(false)} />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl p-5 max-w-2xl w-[90vw] shadow-lg">
            <h3 className="font-semibold text-lg mb-2">使い方</h3>
            <ul className="list-disc ml-5 text-sm space-y-1">
              <li>記録タブ：トレーニングの入力・前回値引き継ぎ。</li>
              <li>統計タブ：SBDのマックス推移を折れ線で可視化。</li>
              <li>カレンダータブ：イベント管理と日付選択。</li>
              <li>設定タブ：部位・種目の管理。</li>
            </ul>
            <Button className="mt-4" variant="outline" onClick={() => setShowHelp(false)}>閉じる</Button>
          </div>
        </div>
      )}

      {/* トースト */}
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

/** ===== LogTable ===== */
function LogTable({ entries, lifts, onDelete }: {
  entries: SetEntry[]; lifts: Lift[]; onDelete: (ids: string[]) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const toggle = (id: string) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const del = () => { if (selected.size && confirm(`${selected.size}件削除しますか？`)) onDelete(Array.from(selected)); setSelected(new Set()); };
  const nameOf = (id: LiftId) => lifts.find(l => l.id === id)?.name || id;
  const groups = useMemo(() => {
    const m = new Map<string, SetEntry[]>();
    for (const e of entries) { const k = `${e.date}|${e.liftId}`; if (!m.has(k)) m.set(k, []); m.get(k)!.push(e); }
    return Array.from(m.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [entries]);
  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-neutral-600">{entries.length} 件</div>
        <Button variant="destructive" size="sm" onClick={del} disabled={!selected.size}>
          <Trash2 className="w-4 h-4 mr-1" />選択削除 ({selected.size})
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
                      {date} / {nameOf(liftId as LiftId)} <span className="text-xs text-neutral-500">({arr.length}セット)</span>
                    </td>
                  </tr>
                  {arr.map((e, i) => (
                    <motion.tr key={e.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`border-b ${i % 2 === 0 ? "bg-white" : "bg-neutral-50"}`}>
                      <td className="p-2"><input type="checkbox" checked={selected.has(e.id)} onChange={() => toggle(e.id)} /></td>
                      <td className="p-2">{e.date}</td>
                      <td className="p-2">{nameOf(e.liftId)}</td>
                      <td className="p-2">{e.weight}</td>
                      <td className="p-2">{e.reps}</td>
                      <td className="p-2 max-w-[400px] truncate">{e.note}</td>
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

/** ===== 部位・種目管理 ===== */
function PartsManager({ parts, setParts, lifts, setLifts }: {
  parts: Part[]; setParts: (p: Part[]) => void; lifts: Lift[]; setLifts: (l: Lift[]) => void;
}) {
  const [newPart, setNewPart] = useState("");
  return (
    <Card className="shadow-sm">
      <CardContent className="p-4 space-y-3">
        <h3 className="font-semibold">部位の管理</h3>
        <div className="flex gap-2">
          <Input className="h-9" placeholder="部位を追加（例: 体幹）" value={newPart} onChange={(e) => setNewPart(e.target.value)} />
          <Button onClick={() => {
            if (!newPart.trim()) return;
            if (parts.includes(newPart)) return alert("既に存在します");
            setParts([...parts, newPart]);
            setNewPart("");
          }}>追加</Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {parts.map(p => (
            <div key={p} className="border rounded-md px-2 py-1 flex justify-between items-center">
              <span>{p}</span>
              <Button variant="ghost" size="sm" onClick={() => {
                if (confirm(`${p} を削除しますか？`)) {
                  setParts(parts.filter(x => x !== p));
                  setLifts(lifts.filter(l => l.part !== p));
                }
              }}><Trash2 className="w-4 h-4" /></Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function LiftsManager({ parts, lifts, setLifts }: {
  parts: Part[]; lifts: Lift[]; setLifts: (l: Lift[]) => void;
}) {
  const [newLift, setNewLift] = useState({ name: "", part: parts[0] });
  return (
    <Card className="shadow-sm">
      <CardContent className="p-4 space-y-3">
        <h3 className="font-semibold">種目の管理</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Input className="h-9" placeholder="種目名" value={newLift.name} onChange={e => setNewLift({ ...newLift, name: e.target.value })} />
          <Select value={newLift.part} onValueChange={v => setNewLift({ ...newLift, part: v })}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>{parts.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
          </Select>
          <Button onClick={() => {
            if (!newLift.name.trim()) return;
            const id = newLift.name.replace(/\s+/g, "_");
            if (lifts.some(l => l.id === id)) return alert("既に存在します");
            setLifts([...lifts, { id, name: newLift.name, part: newLift.part }]);
            setNewLift({ ...newLift, name: "" });
          }}>追加</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {lifts.map(l => (
            <div key={l.id} className="border rounded-md px-2 py-1 flex justify-between items-center">
              <span>{l.name} <span className="text-xs text-neutral-500">({l.part})</span></span>
              <Button variant="ghost" size="sm" onClick={() => {
                if (confirm(`${l.name} を削除しますか？`)) {
                  setLifts(lifts.filter(x => x.id !== l.id));
                }
              }}><Trash2 className="w-4 h-4" /></Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
