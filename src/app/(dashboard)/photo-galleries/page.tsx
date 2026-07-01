"use client";

import { useEffect, useState } from "react";
import { galleriesApi, categoriesApi } from "@/lib/api";
import { Plus, Trash2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

export default function PhotoGalleriesPage() {
  const [galleries, setGalleries] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", slug: "", description: "", thumbnailUrl: "", categoryId: "", status: "draft", images: [] as any[] });

  useEffect(() => {
    galleriesApi.list({ limit: 50 }).then((r) => setGalleries(r.data));
    categoriesApi.list().then((r) => setCategories(r.data));
  }, []);

  const addImage = () => {
    setForm({ ...form, images: [...form.images, { url: "", caption: "", sortOrder: form.images.length }] });
  };

  const updateImage = (i: number, field: string, value: string) => {
    const updated = [...form.images];
    updated[i] = { ...updated[i], [field]: value };
    setForm({ ...form, images: updated });
  };

  const removeImage = (i: number) => setForm({ ...form, images: form.images.filter((_, idx) => idx !== i) });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.slug) { toast.error("Title and slug required"); return; }
    try {
      await galleriesApi.create({ ...form, categoryId: form.categoryId ? parseInt(form.categoryId) : null });
      toast.success("Gallery created");
      setShowForm(false);
      setForm({ title: "", slug: "", description: "", thumbnailUrl: "", categoryId: "", status: "draft", images: [] });
      galleriesApi.list({ limit: 50 }).then((r) => setGalleries(r.data));
    } catch { toast.error("Failed"); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Photo Galleries ({galleries.length})</h1>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus size={16} /> New Gallery
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border p-6 mb-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="px-3 py-2 border rounded-lg" />
            <input placeholder="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required className="px-3 py-2 border rounded-lg" />
            <input placeholder="Thumbnail URL" value={form.thumbnailUrl} onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })} className="px-3 py-2 border rounded-lg" />
            <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="px-3 py-2 border rounded-lg">
              <option value="">Select category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2 border rounded-lg" />

          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-sm">Images ({form.images.length})</h4>
              <button type="button" onClick={addImage} className="text-sm text-blue-600 hover:underline">+ Add Image</button>
            </div>
            {form.images.map((img, i) => (
              <div key={i} className="flex gap-2 mb-2 items-center">
                <span className="text-xs text-gray-400 w-6">{i + 1}</span>
                <input placeholder="Image URL" value={img.url} onChange={(e) => updateImage(i, "url", e.target.value)} className="flex-1 px-2 py-1.5 border rounded text-sm" />
                <input placeholder="Caption" value={img.caption} onChange={(e) => updateImage(i, "caption", e.target.value)} className="flex-1 px-2 py-1.5 border rounded text-sm" />
                <button type="button" onClick={() => removeImage(i)} className="text-red-400 p-1"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg">Create</button>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="px-3 py-2 border rounded-lg">
              <option value="draft">Draft</option><option value="published">Published</option>
            </select>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {galleries.map((g) => (
          <div key={g.id} className="bg-white rounded-xl border overflow-hidden">
            <div className="aspect-video bg-gray-100 relative">
              {g.thumbnailUrl ? <img src={g.thumbnailUrl} alt={g.title} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full"><ImageIcon size={32} className="text-gray-300" /></div>}
              <span className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded font-medium ${g.status === "published" ? "bg-green-500 text-white" : "bg-gray-200"}`}>{g.status}</span>
            </div>
            <div className="p-3">
              <h3 className="font-medium truncate">{g.title}</h3>
              <p className="text-xs text-gray-400 mt-1">{g.categoryName || "No category"} · {g.viewsCount || 0} views</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
