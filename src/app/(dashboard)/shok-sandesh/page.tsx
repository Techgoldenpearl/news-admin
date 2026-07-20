"use client";

import { useEffect, useState } from "react";
import { shokSandeshApi, statesApi, citiesApi } from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { Plus, Check, X, Pencil, Trash2, Search, Eye, Heart } from "lucide-react";

const TYPES = [
  { value: "shok_sandesh", label: "शोक संदेश" },
  { value: "shradhanjali", label: "श्रद्धांजलि" },
  { value: "punyatithi", label: "पुण्यतिथि" },
  { value: "uthavna", label: "उठावना" },
  { value: "terahvi", label: "तेरहवीं" },
  { value: "smriti_sandesh", label: "स्मृति संदेश" },
];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  expired: "bg-gray-100 text-gray-500",
};

export default function ShokSandeshPage() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"list" | "create">("list");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({
    type: "shok_sandesh", deceasedName: "", deceasedNameHindi: "", deceasedAge: "",
    dateOfDeath: "", place: "", city: "", state: "", familyName: "", familyNameHindi: "",
    message: "", messageHindi: "", eventDetails: "", eventDetailsHindi: "",
    eventDate: "", eventPlace: "", deceasedPhoto: "", isHomepage: false,
  });
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);

  useEffect(() => { statesApi.list().then((r) => setStates(r.data)).catch(() => {}); }, []);

  useEffect(() => {
    const matchedState = states.find((s) => s.name === form.state);
    if (matchedState) {
      citiesApi.list({ stateId: matchedState.id }).then((r) => setCities(r.data)).catch(() => {});
    } else {
      setCities([]);
    }
  }, [form.state, states]);

  const loadItems = () => {
    shokSandeshApi.list({ page, limit: 20, status: status || undefined, type: typeFilter || undefined, search: search || undefined })
      .then((r) => { setItems(r.data.items); setTotal(r.data.total); })
      .catch(() => toast.error("Failed to load"));
  };

  useEffect(() => { loadItems(); }, [page, status, typeFilter]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.deceasedName || !form.type) { toast.error("Name and type required"); return; }
    setSaving(true);
    try {
      const data = { ...form, deceasedAge: form.deceasedAge ? parseInt(form.deceasedAge) : null };
      if (editingId) {
        await shokSandeshApi.update(editingId, data);
        toast.success("Updated");
      } else {
        await shokSandeshApi.create(data);
        toast.success("Created & published");
      }
      setTab("list"); setEditingId(null); loadItems();
    } catch (err: any) { toast.error(err.response?.data?.error || "Failed"); }
    finally { setSaving(false); }
  };

  const handleApprove = async (id: number) => {
    try { await shokSandeshApi.approve(id); toast.success("Approved"); loadItems(); }
    catch { toast.error("Failed"); }
  };

  const handleReject = async (id: number) => {
    const reason = prompt("Rejection reason:");
    if (!reason) return;
    try { await shokSandeshApi.reject(id, reason); toast.success("Rejected"); loadItems(); }
    catch { toast.error("Failed"); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete?")) return;
    try { await shokSandeshApi.delete(id); toast.success("Deleted"); loadItems(); }
    catch { toast.error("Failed"); }
  };

  const openEdit = (item: any) => {
    setEditingId(item.id);
    setForm({
      ...item,
      deceasedAge: item.deceasedAge ? String(item.deceasedAge) : "",
      dateOfDeath: item.dateOfDeath ? item.dateOfDeath.slice(0, 10) : "",
      eventDate: item.eventDate ? item.eventDate.slice(0, 10) : "",
    });
    setTab("create");
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Heart size={24} className="text-gray-400" />
          <h1 className="text-2xl font-bold">शोक संदेश / श्रद्धांजलि ({total})</h1>
        </div>
        <button onClick={() => { setTab(tab === "list" ? "create" : "list"); setEditingId(null); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          {tab === "list" ? <><Plus size={16} /> New Entry</> : <><Eye size={16} /> View All</>}
        </button>
      </div>

      {tab === "list" ? (
        <>
          <div className="flex gap-3 mb-4 flex-wrap">
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="px-3 py-2 border rounded-lg text-sm bg-white">
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} className="px-3 py-2 border rounded-lg text-sm bg-white">
              <option value="">All Types</option>
              {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <div className="flex-1 max-w-sm relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && loadItems()}
                placeholder="Search by name..." className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Deceased</th>
                  <th className="text-left px-4 py-3 font-medium">Type</th>
                  <th className="text-left px-4 py-3 font-medium">Family</th>
                  <th className="text-left px-4 py-3 font-medium">City</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-left px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {item.deceasedPhoto && <img src={item.deceasedPhoto} alt="" className="w-8 h-8 rounded-full object-cover" />}
                        <div>
                          <p className="font-medium">{item.deceasedNameHindi || item.deceasedName}</p>
                          {item.deceasedAge && <p className="text-xs text-gray-400">Age: {item.deceasedAge}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">{TYPES.find((t) => t.value === item.type)?.label || item.type}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{item.familyNameHindi || item.familyName || "—"}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{item.city || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[item.status] || ""}`}>{item.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{format(new Date(item.createdAt), "dd MMM yy")}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {item.status === "pending" && (
                          <>
                            <button onClick={() => handleApprove(item.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded"><Check size={14} /></button>
                            <button onClick={() => handleReject(item.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><X size={14} /></button>
                          </>
                        )}
                        <button onClick={() => openEdit(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Pencil size={14} /></button>
                        <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">No entries found</td></tr>}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40">Previous</button>
              <span className="px-3 py-1.5 text-sm text-gray-500">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(page + 1)} disabled={page >= totalPages} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40">Next</button>
            </div>
          )}
        </>
      ) : (
        <form onSubmit={handleSave} className="max-w-3xl space-y-6">
          <div className="bg-white rounded-xl border p-6 space-y-4">
            <h2 className="font-semibold text-lg">{editingId ? "Edit Entry" : "New शोक संदेश / श्रद्धांजलि"}</h2>
            <div><label className="block text-sm font-medium mb-1">Type *</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6 space-y-4">
            <h3 className="font-semibold">Deceased Details / स्वर्गीय का विवरण</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-1">Name (English) *</label>
                <input value={form.deceasedName} onChange={(e) => setForm({ ...form, deceasedName: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
              </div>
              <div><label className="block text-sm font-medium mb-1">Name (Hindi)</label>
                <input value={form.deceasedNameHindi} onChange={(e) => setForm({ ...form, deceasedNameHindi: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="हिंदी नाम" />
              </div>
              <div><label className="block text-sm font-medium mb-1">Age</label>
                <input type="number" value={form.deceasedAge} onChange={(e) => setForm({ ...form, deceasedAge: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div><label className="block text-sm font-medium mb-1">Date of Death</label>
                <input type="date" value={form.dateOfDeath} onChange={(e) => setForm({ ...form, dateOfDeath: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
            </div>
            <div><label className="block text-sm font-medium mb-1">Photo URL</label>
              <input value={form.deceasedPhoto} onChange={(e) => setForm({ ...form, deceasedPhoto: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="https://..." />
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6 space-y-4">
            <h3 className="font-semibold">Family & Location / परिवार और स्थान</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-1">Family Name</label>
                <input value={form.familyName} onChange={(e) => setForm({ ...form, familyName: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div><label className="block text-sm font-medium mb-1">Family Name (Hindi)</label>
                <input value={form.familyNameHindi} onChange={(e) => setForm({ ...form, familyNameHindi: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="परिवार का नाम" />
              </div>
              <div><label className="block text-sm font-medium mb-1">Place</label>
                <input value={form.place} onChange={(e) => setForm({ ...form, place: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div><label className="block text-sm font-medium mb-1">State</label>
                <select value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value, city: "" })} className="w-full px-3 py-2 border rounded-lg">
                  <option value="">Select state</option>
                  {states.map((s) => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div><label className="block text-sm font-medium mb-1">City</label>
                <select value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full px-3 py-2 border rounded-lg" disabled={!form.state}>
                  <option value="">Select city</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6 space-y-4">
            <h3 className="font-semibold">Message / संदेश</h3>
            <div><label className="block text-sm font-medium mb-1">Message (English)</label>
              <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={3} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div><label className="block text-sm font-medium mb-1">Message (Hindi)</label>
              <textarea value={form.messageHindi} onChange={(e) => setForm({ ...form, messageHindi: e.target.value })} rows={3} className="w-full px-3 py-2 border rounded-lg" placeholder="हिंदी संदेश..." />
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6 space-y-4">
            <h3 className="font-semibold">Event Details / कार्यक्रम विवरण</h3>
            <div><label className="block text-sm font-medium mb-1">Event Details</label>
              <textarea value={form.eventDetails} onChange={(e) => setForm({ ...form, eventDetails: e.target.value })} rows={2} className="w-full px-3 py-2 border rounded-lg" placeholder="उठावना / तेरहवीं / श्रद्धांजलि सभा details" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-1">Event Date</label>
                <input type="date" value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div><label className="block text-sm font-medium mb-1">Event Place</label>
                <input value={form.eventPlace} onChange={(e) => setForm({ ...form, eventPlace: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isHomepage || false} onChange={(e) => setForm({ ...form, isHomepage: e.target.checked })} className="w-4 h-4 rounded" />
              <span className="text-sm">Show on Homepage</span>
            </label>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => { setTab("list"); setEditingId(null); }} className="px-6 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? "Saving..." : editingId ? "Update" : "Create & Publish"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
