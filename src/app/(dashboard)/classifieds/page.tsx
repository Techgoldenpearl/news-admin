"use client";

import { useEffect, useState } from "react";
import { classifiedsApi } from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { Plus, Check, X, Pencil, Trash2, Search, Eye, AlertTriangle } from "lucide-react";

const CATEGORIES = [
  { value: "property", label: "Property / संपत्ति" },
  { value: "jobs", label: "Jobs / नौकरी" },
  { value: "business", label: "Business / व्यापार" },
  { value: "services", label: "Services / सेवाएं" },
  { value: "vehicles", label: "Vehicles / वाहन" },
  { value: "buy_sell", label: "Buy/Sell / खरीदें/बेचें" },
  { value: "matrimonial", label: "Matrimonial / वैवाहिक" },
  { value: "education", label: "Education / शिक्षा" },
  { value: "lost_found", label: "Lost & Found / खोया-पाया" },
  { value: "public_notice", label: "Public Notice / सार्वजनिक सूचना" },
];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  expired: "bg-gray-100 text-gray-500",
  paused: "bg-blue-100 text-blue-700",
};

export default function ClassifiedsPage() {
  const [ads, setAds] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"list" | "create">("list");
  const [form, setForm] = useState<any>({
    category: "property", title: "", titleHindi: "", description: "", descriptionHindi: "",
    price: "", contactName: "", contactPhone: "", contactWhatsapp: "", city: "", area: "", state: "",
    isFeatured: false, isUrgent: false, isHomepage: false,
  });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const loadAds = () => {
    classifiedsApi.list({ page, limit: 20, status: status || undefined, category: category || undefined, search: search || undefined })
      .then((r) => { setAds(r.data.items); setTotal(r.data.total); })
      .catch(() => toast.error("Failed to load classifieds"));
  };

  useEffect(() => { loadAds(); }, [page, status, category]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.category) { toast.error("Title and category required"); return; }
    setSaving(true);
    try {
      if (editingId) {
        await classifiedsApi.update(editingId, form);
        toast.success("Ad updated");
      } else {
        await classifiedsApi.create(form);
        toast.success("Ad created & published");
      }
      setTab("list"); setEditingId(null); loadAds();
      setForm({ category: "property", title: "", titleHindi: "", description: "", descriptionHindi: "", price: "", contactName: "", contactPhone: "", contactWhatsapp: "", city: "", area: "", state: "", isFeatured: false, isUrgent: false, isHomepage: false });
    } catch (err: any) { toast.error(err.response?.data?.error || "Failed to save"); }
    finally { setSaving(false); }
  };

  const handleApprove = async (id: number) => {
    try { await classifiedsApi.approve(id); toast.success("Approved"); loadAds(); }
    catch { toast.error("Failed"); }
  };

  const handleReject = async (id: number) => {
    const reason = prompt("Rejection reason:");
    if (!reason) return;
    try { await classifiedsApi.reject(id, reason); toast.success("Rejected"); loadAds(); }
    catch { toast.error("Failed"); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this ad?")) return;
    try { await classifiedsApi.delete(id); toast.success("Deleted"); loadAds(); }
    catch { toast.error("Failed"); }
  };

  const openEdit = (ad: any) => {
    setEditingId(ad.id);
    setForm({ ...ad });
    setTab("create");
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Classified Ads ({total})</h1>
        <button onClick={() => { setTab(tab === "list" ? "create" : "list"); setEditingId(null); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          {tab === "list" ? <><Plus size={16} /> New Ad</> : <><Eye size={16} /> View All</>}
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
              <option value="expired">Expired</option>
            </select>
            <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="px-3 py-2 border rounded-lg text-sm bg-white">
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <div className="flex-1 max-w-sm relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && loadAds()}
                placeholder="Search ads..." className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Title</th>
                  <th className="text-left px-4 py-3 font-medium">Category</th>
                  <th className="text-left px-4 py-3 font-medium">City</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Price</th>
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-left px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {ads.map((ad) => (
                  <tr key={ad.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium line-clamp-1">{ad.title}</p>
                      {ad.contactName && <p className="text-xs text-gray-400">{ad.contactName} · {ad.contactPhone}</p>}
                    </td>
                    <td className="px-4 py-3 text-xs capitalize">{ad.category?.replace("_", " ")}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{ad.city || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[ad.status] || ""}`}>{ad.status}</span>
                      {ad.isFeatured && <span className="ml-1 px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded">★</span>}
                      {ad.isUrgent && <span className="ml-1 px-1.5 py-0.5 bg-red-100 text-red-600 text-xs rounded">Urgent</span>}
                    </td>
                    <td className="px-4 py-3 text-xs">{ad.price || "—"}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{format(new Date(ad.createdAt), "dd MMM yy")}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {ad.status === "pending" && (
                          <>
                            <button onClick={() => handleApprove(ad.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Approve"><Check size={14} /></button>
                            <button onClick={() => handleReject(ad.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Reject"><X size={14} /></button>
                          </>
                        )}
                        <button onClick={() => openEdit(ad)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Edit"><Pencil size={14} /></button>
                        <button onClick={() => handleDelete(ad.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Delete"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {ads.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">No classified ads found</td></tr>}
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
            <h2 className="font-semibold text-lg">{editingId ? "Edit Ad" : "Create New Classified Ad"}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-1">Category *</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                  {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-medium mb-1">Price</label>
                <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="₹ or Negotiable" />
              </div>
            </div>
            <div><label className="block text-sm font-medium mb-1">Title (English) *</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
            </div>
            <div><label className="block text-sm font-medium mb-1">Title (Hindi)</label>
              <input value={form.titleHindi} onChange={(e) => setForm({ ...form, titleHindi: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="हिंदी शीर्षक" />
            </div>
            <div><label className="block text-sm font-medium mb-1">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div><label className="block text-sm font-medium mb-1">Description (Hindi)</label>
              <textarea value={form.descriptionHindi} onChange={(e) => setForm({ ...form, descriptionHindi: e.target.value })} rows={3} className="w-full px-3 py-2 border rounded-lg" placeholder="हिंदी विवरण" />
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6 space-y-4">
            <h3 className="font-semibold">Contact Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-1">Name</label>
                <input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div><label className="block text-sm font-medium mb-1">Phone</label>
                <input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="+91..." />
              </div>
              <div><label className="block text-sm font-medium mb-1">WhatsApp</label>
                <input value={form.contactWhatsapp} onChange={(e) => setForm({ ...form, contactWhatsapp: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6 space-y-4">
            <h3 className="font-semibold">Location</h3>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="block text-sm font-medium mb-1">City</label>
                <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div><label className="block text-sm font-medium mb-1">Area</label>
                <input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div><label className="block text-sm font-medium mb-1">State</label>
                <input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6 space-y-3">
            <h3 className="font-semibold">Options</h3>
            <div className="flex gap-6">
              {[
                { key: "isFeatured", label: "★ Featured" },
                { key: "isUrgent", label: "⚡ Urgent" },
                { key: "isHomepage", label: "🏠 Homepage" },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form[key] || false} onChange={(e) => setForm({ ...form, [key]: e.target.checked })} className="w-4 h-4 rounded" />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => { setTab("list"); setEditingId(null); }} className="px-6 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? "Saving..." : editingId ? "Update Ad" : "Create & Publish Ad"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
