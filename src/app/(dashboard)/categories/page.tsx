"use client";

import { useEffect, useState } from "react";
import { categoriesApi } from "@/lib/api";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", nameHindi: "", slug: "", color: "#E53E3E", sortOrder: 0 });

  const fetch = () => categoriesApi.list({ activeOnly: "false" }).then((r) => setCategories(r.data));
  useEffect(() => { fetch(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) { await categoriesApi.update(editing.id, form); toast.success("Updated"); }
      else { await categoriesApi.create(form); toast.success("Created"); }
      setShowForm(false); setEditing(null); setForm({ name: "", nameHindi: "", slug: "", color: "#E53E3E", sortOrder: 0 }); fetch();
    } catch { toast.error("Failed"); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete?")) return;
    try { await categoriesApi.delete(id); toast.success("Deleted"); fetch(); }
    catch { toast.error("Failed to delete category"); }
  };

  const startEdit = (c: any) => {
    setEditing(c); setForm({ name: c.name, nameHindi: c.nameHindi || "", slug: c.slug, color: c.color, sortOrder: c.sortOrder }); setShowForm(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Categories ({categories.length})</h1>
        <button onClick={() => { setEditing(null); setForm({ name: "", nameHindi: "", slug: "", color: "#E53E3E", sortOrder: 0 }); setShowForm(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"><Plus size={16} /> New</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-6 mb-6 grid grid-cols-2 gap-4">
          <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="px-3 py-2 border rounded-lg" />
          <input placeholder="Name Hindi" value={form.nameHindi} onChange={(e) => setForm({ ...form, nameHindi: e.target.value })} className="px-3 py-2 border rounded-lg" />
          <input placeholder="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required className="px-3 py-2 border rounded-lg" />
          <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="h-10 w-20" />
          <input type="number" placeholder="Sort Order" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) })} className="px-3 py-2 border rounded-lg" />
          <div className="flex gap-2">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg">{editing ? "Update" : "Create"}</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Color</th>
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">Hindi</th>
              <th className="text-left px-4 py-3 font-medium">Slug</th>
              <th className="text-left px-4 py-3 font-medium">Order</th>
              <th className="text-left px-4 py-3 font-medium">Active</th>
              <th className="text-left px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3"><div className="w-6 h-6 rounded-full" style={{ backgroundColor: c.color }} /></td>
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 text-gray-500">{c.nameHindi}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{c.slug}</td>
                <td className="px-4 py-3">{c.sortOrder}</td>
                <td className="px-4 py-3">{c.isActive ? "✓" : "✗"}</td>
                <td className="px-4 py-3 flex gap-2">
                  <button onClick={() => startEdit(c)} className="text-blue-600"><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(c.id)} className="text-red-500"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
