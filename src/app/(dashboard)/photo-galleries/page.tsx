"use client";

import { useEffect, useState } from "react";
import { galleriesApi, categoriesApi, sitesApi } from "@/lib/api";
import { Plus, Trash2, Pencil, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

const emptyForm = { siteId: "", title: "", slug: "", description: "", thumbnailUrl: "", categoryId: "", status: "draft", images: [] as any[] };

export default function PhotoGalleriesPage() {
  const [galleries, setGalleries] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [sitesList, setSitesList] = useState<any[]>([]);

  const fetchGalleries = () => galleriesApi.list({ limit: 50 }).then((r) => setGalleries(r.data));

  useEffect(() => {
    fetchGalleries();
    categoriesApi.list().then((r) => setCategories(r.data));
    sitesApi.list().then((r) => setSitesList(r.data)).catch(() => {});
  }, []);

  const startEdit = async (g: any) => {
    try {
      const r = await galleriesApi.get(g.slug);
      const gallery = r.data;
      setForm({
        siteId: gallery.siteId ? String(gallery.siteId) : "",
        title: gallery.title || "", slug: gallery.slug || "", description: gallery.description || "",
        thumbnailUrl: gallery.thumbnailUrl || "", categoryId: gallery.categoryId ? String(gallery.categoryId) : "",
        status: gallery.status || "draft", images: gallery.images || [],
      });
      setEditingId(g.id);
      setShowForm(true);
    } catch { toast.error("Failed to load gallery"); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this gallery?")) return;
    try {
      await galleriesApi.delete(id);
      toast.success("Deleted");
      fetchGalleries();
    } catch { toast.error("Failed to delete"); }
  };

  const addImage = () => {
    setForm({ ...form, images: [...form.images, { imageUrl: "", caption: "", sortOrder: form.images.length }] });
  };

  const updateImage = (i: number, field: string, value: string) => {
    const updated = [...form.images];
    updated[i] = { ...updated[i], [field]: value };
    setForm({ ...form, images: updated });
  };

  const removeImage = (i: number) => setForm({ ...form, images: form.images.filter((_, idx) => idx !== i) });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.slug) { toast.error("Title and slug required"); return; }
    if (!editingId && !form.siteId) { toast.error("Site is required"); return; }
    const payload = { ...form, siteId: form.siteId ? parseInt(form.siteId) : null, categoryId: form.categoryId ? parseInt(form.categoryId) : null };
    try {
      if (editingId) {
        await galleriesApi.update(editingId, payload);
        toast.success("Gallery updated");
      } else {
        await galleriesApi.create(payload);
        toast.success("Gallery created");
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      fetchGalleries();
    } catch { toast.error("Failed"); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Photo Galleries ({galleries.length})</h1>
        <button
          onClick={() => { if (showForm) { setShowForm(false); setEditingId(null); setForm(emptyForm); } else { setShowForm(true); } }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={16} /> New Gallery
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 mb-6 space-y-4">
          {editingId && <p className="text-sm text-blue-600 font-medium">Editing gallery #{editingId}</p>}
          <div className="grid grid-cols-2 gap-3">
            <select value={form.siteId} onChange={(e) => setForm({ ...form, siteId: e.target.value })} required className="px-3 py-2 border rounded-lg">
              <option value="">Select site</option>
              {sitesList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="px-3 py-2 border rounded-lg">
              <option value="">Select category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="px-3 py-2 border rounded-lg" />
            <input placeholder="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required className="px-3 py-2 border rounded-lg" />
            <input placeholder="Thumbnail URL" value={form.thumbnailUrl} onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })} className="px-3 py-2 border rounded-lg col-span-2" />
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
                <input placeholder="Image URL" value={img.imageUrl} onChange={(e) => updateImage(i, "imageUrl", e.target.value)} className="flex-1 px-2 py-1.5 border rounded text-sm" />
                <input placeholder="Caption" value={img.caption} onChange={(e) => updateImage(i, "caption", e.target.value)} className="flex-1 px-2 py-1.5 border rounded text-sm" />
                <button type="button" onClick={() => removeImage(i)} className="text-red-400 p-1"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg">{editingId ? "Save" : "Create"}</button>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="px-3 py-2 border rounded-lg">
              <option value="draft">Draft</option><option value="published">Published</option>
            </select>
            <button type="button" onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }} className="px-4 py-2 border rounded-lg">Cancel</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {galleries.map((g) => (
          <div key={g.id} className="bg-white rounded-xl border overflow-hidden group">
            <div className="aspect-video bg-gray-100 relative">
              {g.thumbnailUrl ? <img src={g.thumbnailUrl} alt={g.title} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full"><ImageIcon size={32} className="text-gray-300" /></div>}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                <button onClick={() => startEdit(g)} className="bg-white text-gray-700 p-2 rounded-lg"><Pencil size={14} /></button>
                <button onClick={() => handleDelete(g.id)} className="bg-red-500 text-white p-2 rounded-lg"><Trash2 size={14} /></button>
              </div>
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
