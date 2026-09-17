"use client";

import { useEffect, useState } from "react";
import { categoriesApi, sitesApi, websiteCategoriesApi } from "@/lib/api";
import { Plus, Pencil, Trash2, Globe2 } from "lucide-react";
import { toast } from "sonner";

const defaultForm = { name: "", nameHindi: "", slug: "", color: "#E53E3E", sortOrder: 0, siteIds: [] as string[] };

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(defaultForm);
  const [savingForm, setSavingForm] = useState(false);
  const [sitesPanelFor, setSitesPanelFor] = useState<any>(null);

  const fetch = () => categoriesApi.list({ activeOnly: "false" }).then((r) => setCategories(r.data));
  useEffect(() => { fetch(); sitesApi.list().then((r) => setSites(r.data)).catch(() => {}); }, []);

  const siteName = (siteId: number | null) => sites.find((s) => s.id === siteId)?.name;

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();

  const handleNameChange = (name: string) => {
    setForm((prev) => ({ ...prev, name, slug: editing ? prev.slug : generateSlug(name) }));
  };

  const toggleFormSite = (siteId: string) => {
    setForm((prev) => ({
      ...prev,
      siteIds: prev.siteIds.includes(siteId) ? prev.siteIds.filter((id) => id !== siteId) : [...prev.siteIds, siteId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingForm(true);
    try {
      // First checked site becomes the category's primary/home site (categories.siteId);
      // no sites checked means Global. Every other checked site is recorded as an
      // additional assignment via website_categories, same store the Globe-icon panel uses.
      const [primarySiteId, ...extraSiteIds] = form.siteIds;
      const payload = { name: form.name, nameHindi: form.nameHindi, slug: form.slug, color: form.color, sortOrder: form.sortOrder, siteId: primarySiteId ? parseInt(primarySiteId) : null };

      let categoryId = editing?.id;
      if (editing) { await categoriesApi.update(editing.id, payload); }
      else { const res = await categoriesApi.create(payload); categoryId = res.data.id; }

      // Sync additional-site assignments: add newly checked ones, remove any that were
      // previously assigned (via the Globe panel) but got unchecked here.
      const previouslyAssigned: number[] = editing
        ? (await websiteCategoriesApi.list(editing.id)).data.map((o: any) => o.siteId)
        : [];
      const wantedExtra = extraSiteIds.map((id) => parseInt(id));
      const toAdd = wantedExtra.filter((id) => !previouslyAssigned.includes(id));
      const toRemove = previouslyAssigned.filter((id) => !wantedExtra.includes(id) && id !== payload.siteId);

      await Promise.all([
        ...toAdd.map((siteId) => websiteCategoriesApi.upsert(categoryId, siteId, { isVisible: true })),
        ...toRemove.map((siteId) => websiteCategoriesApi.remove(categoryId, siteId)),
      ]);

      toast.success(editing ? "Updated" : "Created");
      setShowForm(false); setEditing(null); setForm(defaultForm); fetch();
    } catch {
      toast.error("Failed");
    } finally {
      setSavingForm(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete?")) return;
    try { await categoriesApi.delete(id); toast.success("Deleted"); fetch(); }
    catch { toast.error("Failed to delete category"); }
  };

  const startEdit = async (c: any) => {
    setEditing(c);
    setShowForm(true);
    const primary = c.siteId ? [String(c.siteId)] : [];
    setForm({ name: c.name, nameHindi: c.nameHindi || "", slug: c.slug, color: c.color, sortOrder: c.sortOrder, siteIds: primary });
    try {
      const extra = (await websiteCategoriesApi.list(c.id)).data.map((o: any) => String(o.siteId));
      setForm((prev) => ({ ...prev, siteIds: [...primary, ...extra] }));
    } catch { /* additional-site list is optional context; primary site still loaded */ }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Categories ({categories.length})</h1>
        <button onClick={() => { setEditing(null); setForm(defaultForm); setShowForm(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"><Plus size={16} /> New</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-6 mb-6 grid grid-cols-2 gap-4">
          <input placeholder="Name" value={form.name} onChange={(e) => handleNameChange(e.target.value)} required className="px-3 py-2 border rounded-lg" />
          <input placeholder="Name Hindi" value={form.nameHindi} onChange={(e) => setForm({ ...form, nameHindi: e.target.value })} className="px-3 py-2 border rounded-lg" />
          <input placeholder="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required className="px-3 py-2 border rounded-lg" />
          <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="h-10 w-20" />
          <input type="number" placeholder="Sort Order" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) })} className="px-3 py-2 border rounded-lg" />

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Sites</label>
            <div className="flex flex-wrap gap-3 p-3 border rounded-lg">
              {sites.map((s) => (
                <label key={s.id} className="flex items-center gap-1.5 text-sm">
                  <input
                    type="checkbox"
                    checked={form.siteIds.includes(String(s.id))}
                    onChange={() => toggleFormSite(String(s.id))}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600"
                  />
                  {s.name}
                  {form.siteIds[0] === String(s.id) && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600 font-medium">Primary</span>
                  )}
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {form.siteIds.length === 0
                ? "No sites checked = Global (shows on every site)."
                : `Shows on ${form.siteIds.length} site${form.siteIds.length > 1 ? "s" : ""}. First checked site is the primary/home site.`}
            </p>
          </div>

          <div className="flex gap-2">
            <button type="submit" disabled={savingForm} className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50">
              {savingForm ? "Saving..." : editing ? "Update" : "Create"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
          </div>
        </form>
      )}

      {sitesPanelFor && (
        <SiteVisibilityPanel
          category={sitesPanelFor}
          sites={sites}
          onClose={() => setSitesPanelFor(null)}
        />
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Color</th>
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">Hindi</th>
              <th className="text-left px-4 py-3 font-medium">Slug</th>
              <th className="text-left px-4 py-3 font-medium">Site</th>
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
                <td className="px-4 py-3 text-gray-500">
                  {c.siteId
                    ? (siteName(c.siteId) || <span className="text-red-500">Unknown site #{c.siteId}</span>)
                    : <span className="text-gray-400 italic">Global</span>}
                </td>
                <td className="px-4 py-3">{c.sortOrder}</td>
                <td className="px-4 py-3">{c.isActive ? "✓" : "✗"}</td>
                <td className="px-4 py-3 flex gap-2">
                  <button onClick={() => setSitesPanelFor(c)} className="text-gray-500 hover:text-blue-600" title="Assign to additional sites"><Globe2 size={14} /></button>
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

function SiteVisibilityPanel({ category, sites, onClose }: { category: any; sites: any[]; onClose: () => void }) {
  const [assigned, setAssigned] = useState<Record<number, { checked: boolean; displayName: string }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Sites this category is NOT already assigned to via its own siteId (its
  // primary/home site is managed from the main edit form, not here).
  const additionalSites = sites.filter((s) => s.id !== category.siteId);

  useEffect(() => {
    setLoading(true);
    websiteCategoriesApi.list(category.id)
      .then((r) => {
        const existing = new Map<number, any>(r.data.map((o: any) => [o.siteId, o]));
        const initial: Record<number, { checked: boolean; displayName: string }> = {};
        for (const s of additionalSites) {
          const o = existing.get(s.id);
          initial[s.id] = { checked: !!o && o.isVisible !== false, displayName: o?.displayName || "" };
        }
        setAssigned(initial);
      })
      .catch(() => toast.error("Failed to load current site assignments"))
      .finally(() => setLoading(false));
  }, [sites, category.id, category.siteId]);

  const saveAll = async () => {
    setSaving(true);
    try {
      await Promise.all(
        additionalSites.map((s) => {
          const a = assigned[s.id];
          return a?.checked
            ? websiteCategoriesApi.upsert(category.id, s.id, { isVisible: true, displayName: a.displayName || undefined })
            : websiteCategoriesApi.remove(category.id, s.id);
        })
      );
      toast.success("Site assignments saved");
      onClose();
    } catch {
      toast.error("Failed to save some site assignments");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold">Assign to additional sites — {category.name}</h3>
        <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700">Close</button>
      </div>
      <p className="text-xs text-gray-400 mb-4">
        Select every site this category should also appear on, besides its primary site
        {category.siteId == null ? " (currently Global)" : ""}. Uncheck a site to remove it.
      </p>
      <div className="space-y-2">
        {loading && <p className="text-sm text-gray-400">Loading current site assignments...</p>}
        {!loading && additionalSites.map((s) => {
          const a = assigned[s.id] || { checked: false, displayName: "" };
          return (
            <div key={s.id} className="flex items-center gap-3 border rounded-lg px-3 py-2">
              <label className="flex items-center gap-2 w-40 shrink-0">
                <input
                  type="checkbox"
                  checked={a.checked}
                  onChange={(e) => setAssigned({ ...assigned, [s.id]: { ...a, checked: e.target.checked } })}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600"
                />
                <span className="text-sm">{s.name}</span>
              </label>
              <input
                placeholder="Display name override (optional)"
                value={a.displayName}
                disabled={!a.checked}
                onChange={(e) => setAssigned({ ...assigned, [s.id]: { ...a, displayName: e.target.value } })}
                className="flex-1 px-2 py-1 border rounded text-sm disabled:bg-gray-50 disabled:text-gray-400"
              />
            </div>
          );
        })}
        {!loading && additionalSites.length === 0 && <p className="text-sm text-gray-400">No other sites available</p>}
      </div>
      {!loading && additionalSites.length > 0 && (
        <div className="mt-4 flex justify-end">
          <button onClick={saveAll} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      )}
    </div>
  );
}
