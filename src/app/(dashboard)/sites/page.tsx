"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { sitesApi } from "@/lib/api";
import { Plus, Pencil, Globe } from "lucide-react";
import { toast } from "sonner";

export default function SitesPage() {
  const [sites, setSites] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", domain: "", language: "hi", region: "", description: "" });

  const fetch = () => sitesApi.list().then((r) => setSites(r.data));
  useEffect(() => { fetch(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await sitesApi.create(form);
      toast.success("Site created");
      setShowForm(false);
      setForm({ name: "", slug: "", domain: "", language: "hi", region: "", description: "" });
      fetch();
    } catch { toast.error("Failed to create site"); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Sites ({sites.length})</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus size={16} /> New Site
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-6 mb-6 grid grid-cols-2 gap-4">
          <input placeholder="Site Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="px-3 py-2 border rounded-lg" />
          <input placeholder="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required className="px-3 py-2 border rounded-lg" />
          <input placeholder="Domain (e.g. news.example.com)" value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} className="px-3 py-2 border rounded-lg" />
          <input placeholder="Region" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} className="px-3 py-2 border rounded-lg" />
          <input placeholder="Language (hi, en)" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} className="px-3 py-2 border rounded-lg" />
          <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="px-3 py-2 border rounded-lg" />
          <div className="col-span-2 flex gap-2">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg">Create Site</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sites.map((s) => (
          <div key={s.id} className="bg-white rounded-xl shadow-sm border p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg"><Globe size={20} className="text-blue-600" /></div>
              <div>
                <h3 className="font-semibold">{s.name}</h3>
                <p className="text-xs text-gray-400">{s.domain || s.slug}</p>
              </div>
            </div>
            <div className="text-sm text-gray-500 space-y-1">
              <p>Language: {s.language} · Region: {s.region || "—"}</p>
              <p>Status: {s.isActive ? <span className="text-green-600">Active</span> : <span className="text-red-500">Inactive</span>}</p>
            </div>
            <Link href={`/sites/${s.id}/edit`} className="mt-3 inline-block text-sm text-blue-600 hover:underline">Edit Site & Theme →</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
