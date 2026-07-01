"use client";

import { useEffect, useState } from "react";
import { sitesApi, adminApi } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Trash2, GripVertical, Save, ChevronUp, ChevronDown } from "lucide-react";

const SECTION_TYPES = [
  { value: "breaking_ticker", label: "Breaking News Ticker" },
  { value: "featured", label: "Featured Grid" },
  { value: "latest", label: "Latest News" },
  { value: "trending", label: "Trending" },
  { value: "category_feed", label: "Category Feed" },
  { value: "video_feed", label: "Video Feed" },
  { value: "web_stories", label: "Web Stories" },
  { value: "photo_gallery", label: "Photo Gallery" },
  { value: "rashifal", label: "Rashifal" },
  { value: "ad_banner", label: "Ad Banner" },
  { value: "custom_html", label: "Custom HTML" },
];

interface Section {
  type: string;
  label?: string;
  categorySlug?: string;
  limit?: number;
  adZone?: string;
  html?: string;
}

export default function PageBuilderPage() {
  const [sites, setSites] = useState<any[]>([]);
  const [selectedSite, setSelectedSite] = useState<number | null>(null);
  const [pageType, setPageType] = useState("home");
  const [sections, setSections] = useState<Section[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    sitesApi.list().then((r) => {
      setSites(r.data);
      if (r.data.length > 0) setSelectedSite(r.data[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedSite) return;
    adminApi.getLayout(selectedSite, pageType).then((r) => {
      setSections(r.data?.sections || []);
    }).catch(() => setSections([]));
  }, [selectedSite, pageType]);

  const addSection = (type: string) => {
    const label = SECTION_TYPES.find((s) => s.value === type)?.label || type;
    setSections([...sections, { type, label, limit: 6 }]);
  };

  const removeSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= sections.length) return;
    const updated = [...sections];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setSections(updated);
  };

  const updateSection = (index: number, field: string, value: any) => {
    const updated = [...sections];
    (updated[index] as any)[field] = value;
    setSections(updated);
  };

  const handleSave = async () => {
    if (!selectedSite) return;
    setSaving(true);
    try {
      await adminApi.updateLayout({ siteId: selectedSite, pageType, sections });
      toast.success("Layout saved");
    } catch {
      toast.error("Failed to save layout");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Page Builder</h1>
        <button onClick={handleSave} disabled={saving || !selectedSite}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
          <Save size={16} /> {saving ? "Saving..." : "Save Layout"}
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <select value={selectedSite || ""} onChange={(e) => setSelectedSite(parseInt(e.target.value))}
          className="px-3 py-2 border rounded-lg bg-white">
          {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={pageType} onChange={(e) => setPageType(e.target.value)}
          className="px-3 py-2 border rounded-lg bg-white">
          <option value="home">Homepage</option>
          <option value="category">Category Page</option>
          <option value="article">Article Page</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {sections.length === 0 && (
            <div className="bg-white rounded-xl border-2 border-dashed p-12 text-center text-gray-400">
              No sections yet. Add sections from the panel on the right.
            </div>
          )}
          {sections.map((section, i) => (
            <div key={i} className="bg-white rounded-xl border p-4 flex items-start gap-3">
              <div className="flex flex-col gap-1 pt-1">
                <button onClick={() => moveSection(i, -1)} className="p-0.5 hover:bg-gray-100 rounded" disabled={i === 0}><ChevronUp size={14} /></button>
                <GripVertical size={14} className="text-gray-300 mx-auto" />
                <button onClick={() => moveSection(i, 1)} className="p-0.5 hover:bg-gray-100 rounded" disabled={i === sections.length - 1}><ChevronDown size={14} /></button>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider">{section.type.replace(/_/g, " ")}</span>
                  <button onClick={() => removeSection(i)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={14} /></button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input placeholder="Label" value={section.label || ""} onChange={(e) => updateSection(i, "label", e.target.value)}
                    className="px-2 py-1.5 border rounded text-sm" />
                  <input type="number" placeholder="Limit" value={section.limit || ""} onChange={(e) => updateSection(i, "limit", parseInt(e.target.value) || 6)}
                    className="px-2 py-1.5 border rounded text-sm" />
                  {section.type === "category_feed" && (
                    <input placeholder="Category slug" value={section.categorySlug || ""} onChange={(e) => updateSection(i, "categorySlug", e.target.value)}
                      className="px-2 py-1.5 border rounded text-sm col-span-2" />
                  )}
                  {section.type === "ad_banner" && (
                    <input placeholder="Ad zone (e.g. header-leaderboard)" value={section.adZone || ""} onChange={(e) => updateSection(i, "adZone", e.target.value)}
                      className="px-2 py-1.5 border rounded text-sm col-span-2" />
                  )}
                  {section.type === "custom_html" && (
                    <textarea placeholder="Custom HTML..." value={section.html || ""} onChange={(e) => updateSection(i, "html", e.target.value)}
                      rows={3} className="px-2 py-1.5 border rounded text-sm col-span-2" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border p-4">
          <h3 className="font-semibold mb-3">Add Section</h3>
          <div className="space-y-1.5">
            {SECTION_TYPES.map((s) => (
              <button key={s.value} onClick={() => addSection(s.value)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left border rounded-lg hover:bg-blue-50 hover:border-blue-200 transition">
                <Plus size={14} className="text-blue-500" /> {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
