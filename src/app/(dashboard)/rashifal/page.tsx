"use client";

import { useState } from "react";
import { rashifalApi } from "@/lib/api";
import { toast } from "sonner";
import { Save } from "lucide-react";

const RASHI_LIST = [
  { slug: "mesh", name: "Mesh", hindi: "मेष", symbol: "♈" },
  { slug: "vrishabh", name: "Vrishabh", hindi: "वृषभ", symbol: "♉" },
  { slug: "mithun", name: "Mithun", hindi: "मिथुन", symbol: "♊" },
  { slug: "kark", name: "Kark", hindi: "कर्क", symbol: "♋" },
  { slug: "singh", name: "Singh", hindi: "सिंह", symbol: "♌" },
  { slug: "kanya", name: "Kanya", hindi: "कन्या", symbol: "♍" },
  { slug: "tula", name: "Tula", hindi: "तुला", symbol: "♎" },
  { slug: "vrishchik", name: "Vrishchik", hindi: "वृश्चिक", symbol: "♏" },
  { slug: "dhanu", name: "Dhanu", hindi: "धनु", symbol: "♐" },
  { slug: "makar", name: "Makar", hindi: "मकर", symbol: "♑" },
  { slug: "kumbh", name: "Kumbh", hindi: "कुंभ", symbol: "♒" },
  { slug: "meen", name: "Meen", hindi: "मीन", symbol: "♓" },
];

interface RashifalForm {
  content: string;
  contentHindi: string;
  luckyNumber: string;
  luckyColor: string;
  score: number;
  loveScore: number;
  careerScore: number;
  healthScore: number;
}

const defaultForm: RashifalForm = { content: "", contentHindi: "", luckyNumber: "", luckyColor: "", score: 7, loveScore: 7, careerScore: 7, healthScore: 7 };

export default function RashifalPage() {
  const [selectedRashi, setSelectedRashi] = useState<string | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [period, setPeriod] = useState("daily");
  const [form, setForm] = useState<RashifalForm>(defaultForm);
  const [saving, setSaving] = useState(false);

  const loadRashifal = async (rashi: string) => {
    setSelectedRashi(rashi);
    try {
      const res = await rashifalApi.get(rashi);
      if (res.data) {
        setForm({
          content: res.data.content || "",
          contentHindi: res.data.contentHindi || "",
          luckyNumber: res.data.luckyNumber || "",
          luckyColor: res.data.luckyColor || "",
          score: res.data.score || 7,
          loveScore: res.data.loveScore || 7,
          careerScore: res.data.careerScore || 7,
          healthScore: res.data.healthScore || 7,
        });
      } else {
        setForm(defaultForm);
      }
    } catch { setForm(defaultForm); }
  };

  const handleSave = async () => {
    if (!selectedRashi) return;
    setSaving(true);
    try {
      await rashifalApi.save({ rashi: selectedRashi, date, period, ...form });
      toast.success(`Saved rashifal for ${selectedRashi}`);
    } catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Rashifal Manager</h1>
        <div className="flex gap-2">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="px-3 py-2 border rounded-lg text-sm" />
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            <option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
        {RASHI_LIST.map((r) => (
          <button key={r.slug} onClick={() => loadRashifal(r.slug)}
            className={`p-3 rounded-xl border text-center transition ${selectedRashi === r.slug ? "bg-blue-600 text-white border-blue-600" : "bg-white hover:border-blue-300"}`}>
            <span className="text-2xl block">{r.symbol}</span>
            <span className="text-xs font-medium">{r.hindi}</span>
          </button>
        ))}
      </div>

      {selectedRashi && (
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">{RASHI_LIST.find((r) => r.slug === selectedRashi)?.symbol} {RASHI_LIST.find((r) => r.slug === selectedRashi)?.hindi} — {date}</h3>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              <Save size={16} /> {saving ? "Saving..." : "Save"}
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Prediction (English)</label>
            <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={3} className="w-full px-3 py-2 border rounded-lg" placeholder="Today's horoscope..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Prediction (Hindi)</label>
            <textarea value={form.contentHindi} onChange={(e) => setForm({ ...form, contentHindi: e.target.value })} rows={3} className="w-full px-3 py-2 border rounded-lg" placeholder="आज का राशिफल..." />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div><label className="block text-xs font-medium text-gray-500 mb-1">Lucky Number</label>
              <input value={form.luckyNumber} onChange={(e) => setForm({ ...form, luckyNumber: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1">Lucky Color</label>
              <input value={form.luckyColor} onChange={(e) => setForm({ ...form, luckyColor: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[{ key: "score", label: "Overall" }, { key: "loveScore", label: "Love" }, { key: "careerScore", label: "Career" }, { key: "healthScore", label: "Health" }].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-500 mb-1">{label}: {(form as any)[key]}/10</label>
                <input type="range" min={1} max={10} value={(form as any)[key]} onChange={(e) => setForm({ ...form, [key]: parseInt(e.target.value) })} className="w-full" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
