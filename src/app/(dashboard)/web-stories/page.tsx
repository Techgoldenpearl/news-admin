"use client";

import { useEffect, useState } from "react";
import { webStoriesApi } from "@/lib/api";
import { Plus, Trash2, Pencil, Eye } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function WebStoriesPage() {
  const [stories, setStories] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", slug: "", thumbnailUrl: "", categoryId: "", status: "draft", slides: [] as any[] });

  const fetchStories = () => webStoriesApi.list({ limit: 50 }).then((r) => setStories(r.data));
  useEffect(() => { fetchStories(); }, []);

  const addSlide = () => {
    setForm({ ...form, slides: [...form.slides, { imageUrl: "", text: "", linkUrl: "", sortOrder: form.slides.length }] });
  };

  const updateSlide = (index: number, field: string, value: string) => {
    const updated = [...form.slides];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, slides: updated });
  };

  const removeSlide = (index: number) => {
    setForm({ ...form, slides: form.slides.filter((_, i) => i !== index) });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.slug) { toast.error("Title and slug required"); return; }
    try {
      await webStoriesApi.create({ ...form, categoryId: form.categoryId ? parseInt(form.categoryId) : null });
      toast.success("Story created");
      setShowForm(false);
      setForm({ title: "", slug: "", thumbnailUrl: "", categoryId: "", status: "draft", slides: [] });
      fetchStories();
    } catch { toast.error("Failed"); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this story?")) return;
    await webStoriesApi.delete(id);
    toast.success("Deleted");
    fetchStories();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Web Stories ({stories.length})</h1>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus size={16} /> New Story
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border p-6 mb-6 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="px-3 py-2 border rounded-lg" />
            <input placeholder="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required className="px-3 py-2 border rounded-lg" />
            <input placeholder="Thumbnail URL" value={form.thumbnailUrl} onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })} className="px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-sm">Slides ({form.slides.length})</h4>
              <button type="button" onClick={addSlide} className="text-sm text-blue-600 hover:underline">+ Add Slide</button>
            </div>
            {form.slides.map((slide, i) => (
              <div key={i} className="flex gap-2 mb-2 items-center">
                <span className="text-xs text-gray-400 w-6">{i + 1}</span>
                <input placeholder="Image URL" value={slide.imageUrl} onChange={(e) => updateSlide(i, "imageUrl", e.target.value)} className="flex-1 px-2 py-1.5 border rounded text-sm" />
                <input placeholder="Text overlay" value={slide.text} onChange={(e) => updateSlide(i, "text", e.target.value)} className="flex-1 px-2 py-1.5 border rounded text-sm" />
                <input placeholder="Link URL" value={slide.linkUrl} onChange={(e) => updateSlide(i, "linkUrl", e.target.value)} className="w-40 px-2 py-1.5 border rounded text-sm" />
                <button type="button" onClick={() => removeSlide(i)} className="text-red-400 p-1"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg">Create</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stories.map((s) => (
          <div key={s.id} className="bg-white rounded-xl border overflow-hidden group">
            <div className="relative aspect-[9/16] bg-gray-100">
              {s.thumbnailUrl && <img src={s.thumbnailUrl} alt={s.title} className="w-full h-full object-cover" />}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                <button onClick={() => handleDelete(s.id)} className="bg-red-500 text-white p-2 rounded-lg"><Trash2 size={14} /></button>
              </div>
              <span className={`absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded font-medium ${s.status === "published" ? "bg-green-500 text-white" : "bg-gray-200 text-gray-600"}`}>{s.status}</span>
            </div>
            <div className="p-2">
              <p className="text-sm font-medium truncate">{s.title}</p>
              <p className="text-xs text-gray-400">{s.viewsCount || 0} views</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
