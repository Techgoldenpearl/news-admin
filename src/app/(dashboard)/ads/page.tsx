"use client";

import { useEffect, useState } from "react";
import { adsApi } from "@/lib/api";
import { Trash2, Pencil, Pause, Play } from "lucide-react";
import { toast } from "sonner";

const AD_ZONES = ["header-leaderboard", "breaking-below", "sidebar-top", "sidebar-middle", "in-article-1", "in-article-2", "footer-banner", "category-top", "video-preroll", "popup"];

const EMPTY_FORM = {
  name: "", zone: "header-leaderboard", type: "image", imageUrl: "", linkUrl: "", htmlContent: "",
  altText: "", width: 728, height: 90, deviceTarget: "all", priority: 5, status: "active", startDate: "", endDate: "",
  impressionCap: "", clickCap: "",
};

function toDateInput(v: any): string {
  if (!v) return "";
  const d = new Date(v);
  return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

export default function AdsPage() {
  const [ads, setAds] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [advertisers, setAdvertisers] = useState<any[]>([]);
  const [adRequests, setAdRequests] = useState<any[]>([]);
  const [revenueRates, setRevenueRates] = useState<any[]>([]);
  const [tab, setTab] = useState<"ads" | "create" | "advertisers" | "requests" | "revenue">("ads");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const fetchAll = () => {
    adsApi.list().then((r) => { setAds(r.data.items); setTotal(r.data.total); });
    adsApi.advertisers().then((r) => setAdvertisers(r.data));
    adsApi.adRequests().then((r) => setAdRequests(r.data));
    adsApi.revenueConfig().then((r) => setRevenueRates(r.data)).catch(() => {});
  };
  useEffect(fetchAll, []);

  const resetForm = () => { setEditingId(null); setForm(EMPTY_FORM); };

  const startEdit = (a: any) => {
    setEditingId(a.id);
    setForm({
      name: a.name ?? "", zone: a.zone ?? "header-leaderboard", type: a.type ?? "image",
      imageUrl: a.imageUrl ?? "", linkUrl: a.linkUrl ?? "", htmlContent: a.htmlContent ?? "",
      altText: a.altText ?? "", width: a.width ?? 728, height: a.height ?? 90,
      deviceTarget: a.deviceTarget ?? "all", priority: a.priority ?? 5, status: a.status ?? "active",
      startDate: toDateInput(a.startDate), endDate: toDateInput(a.endDate),
      impressionCap: a.impressionCap ?? "", clickCap: a.clickCap ?? "",
    });
    setTab("create");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      startDate: form.startDate ? new Date(form.startDate) : null,
      endDate: form.endDate ? new Date(form.endDate) : null,
      impressionCap: form.impressionCap ? parseInt(form.impressionCap as any) : null,
      clickCap: form.clickCap ? parseInt(form.clickCap as any) : null,
    };
    try {
      if (editingId) {
        await adsApi.update(editingId, payload);
        toast.success("Ad updated");
      } else {
        await adsApi.create(payload);
        toast.success("Ad created");
      }
      setTab("ads");
      resetForm();
      fetchAll();
    } catch { toast.error("Failed"); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete?")) return;
    try { await adsApi.delete(id); toast.success("Deleted"); fetchAll(); }
    catch { toast.error("Failed to delete"); }
  };

  const toggleStatus = async (a: any) => {
    const next = a.status === "active" ? "paused" : "active";
    try { await adsApi.update(a.id, { status: next }); toast.success(next === "active" ? "Resumed" : "Paused"); fetchAll(); }
    catch { toast.error("Failed to update status"); }
  };

  const updateRate = async (zone: string, field: "cpmRate" | "cpcRate", value: string, current: any) => {
    const rate = current ?? { cpmRate: "0.5", cpcRate: "2.0" };
    const cpmRate = field === "cpmRate" ? value : rate.cpmRate;
    const cpcRate = field === "cpcRate" ? value : rate.cpcRate;
    try {
      await adsApi.updateRevenueConfig(zone, parseFloat(cpmRate), parseFloat(cpcRate));
      fetchAll();
    } catch { toast.error("Failed to update rate"); }
  };

  const approveAdvertiser = async (id: number) => {
    try { await adsApi.approveAdvertiser(id); toast.success("Approved"); fetchAll(); }
    catch { toast.error("Failed to approve"); }
  };
  const suspendAdvertiser = async (id: number) => {
    try { await adsApi.suspendAdvertiser(id); toast.success("Suspended"); fetchAll(); }
    catch { toast.error("Failed to suspend"); }
  };
  const approveRequest = async (id: number) => {
    try { await adsApi.approveRequest(id); toast.success("Approved"); fetchAll(); }
    catch { toast.error("Failed to approve"); }
  };
  const rejectRequest = async (id: number) => {
    const note = prompt("Reason:"); if (!note) return;
    try { await adsApi.rejectRequest(id, note); toast.success("Rejected"); fetchAll(); }
    catch { toast.error("Failed to reject"); }
  };

  const tabs = [
    { key: "ads", label: `Ads (${total})` },
    { key: "create", label: editingId ? "Edit Ad" : "Create Ad" },
    { key: "advertisers", label: `Advertisers (${advertisers.length})` },
    { key: "requests", label: `Requests (${adRequests.length})` },
    { key: "revenue", label: "Revenue Config" },
  ] as const;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Ads & Revenue</h1>

      <div className="flex gap-2 mb-6">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => { if (t.key !== "create") resetForm(); setTab(t.key); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === t.key ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "create" && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 space-y-4">
          <h3 className="font-semibold">{editingId ? "Edit Ad" : "Create New Ad"}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Ad Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full px-3 py-2 border rounded-lg" placeholder="Homepage Banner" /></div>
            <div><label className="block text-sm font-medium mb-1">Zone *</label>
              <select value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                {AD_ZONES.map((z) => <option key={z} value={z}>{z}</option>)}
              </select></div>
            <div><label className="block text-sm font-medium mb-1">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                <option value="image">Image</option><option value="html">HTML</option><option value="script">Script</option><option value="text">Text</option>
              </select></div>
            <div><label className="block text-sm font-medium mb-1">Device</label>
              <select value={form.deviceTarget} onChange={(e) => setForm({ ...form, deviceTarget: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                <option value="all">All</option><option value="desktop">Desktop</option><option value="mobile">Mobile</option>
              </select></div>
            {form.type === "image" && (
              <>
                <div><label className="block text-sm font-medium mb-1">Image URL</label>
                  <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1">Link URL</label>
                  <input value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1">Width</label>
                  <input type="number" value={form.width} onChange={(e) => setForm({ ...form, width: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1">Height</label>
                  <input type="number" value={form.height} onChange={(e) => setForm({ ...form, height: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" /></div>
              </>
            )}
            {form.type === "html" && (
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">HTML Content</label>
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-2">
                  Warning: this HTML renders directly on the site with full access to cookies and page data. Only paste content from advertisers you trust — never untrusted or third-party-submitted markup.
                </p>
                <textarea value={form.htmlContent} onChange={(e) => setForm({ ...form, htmlContent: e.target.value })} rows={4} className="w-full px-3 py-2 border rounded-lg font-mono text-sm" /></div>
            )}
            <div><label className="block text-sm font-medium mb-1">Priority (0-100)</label>
              <input type="number" min={0} max={100} value={form.priority} onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                <option value="active">Active</option><option value="paused">Paused</option>
              </select></div>
            <div><label className="block text-sm font-medium mb-1">Start Date</label>
              <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">End Date</label>
              <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">Impression Cap</label>
              <input type="number" min={0} value={form.impressionCap} onChange={(e) => setForm({ ...form, impressionCap: e.target.value })} placeholder="Unlimited" className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">Click Cap</label>
              <input type="number" min={0} value={form.clickCap} onChange={(e) => setForm({ ...form, clickCap: e.target.value })} placeholder="Unlimited" className="w-full px-3 py-2 border rounded-lg" /></div>
          </div>
          {form.imageUrl && <div className="border rounded-lg p-2"><p className="text-xs text-gray-400 mb-1">Preview</p><img src={form.imageUrl} alt="Preview" className="max-h-32 object-contain" /></div>}
          <div className="flex gap-3">
            <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">{editingId ? "Save Changes" : "Create Ad"}</button>
            {editingId && <button type="button" onClick={() => { resetForm(); setTab("ads"); }} className="px-6 py-2 rounded-lg border hover:bg-gray-50">Cancel</button>}
          </div>
        </form>
      )}

      {tab === "ads" && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b"><tr>
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">Zone</th>
              <th className="text-left px-4 py-3 font-medium">Type</th>
              <th className="text-left px-4 py-3 font-medium">Device</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Priority</th>
              <th className="text-left px-4 py-3 font-medium">Served</th>
              <th className="text-left px-4 py-3 font-medium">Actions</th>
            </tr></thead>
            <tbody>
              {ads.map((a) => (
                <tr key={a.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{a.name}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs font-mono">{a.zone}</td>
                  <td className="px-4 py-3 text-gray-500">{a.type}</td>
                  <td className="px-4 py-3 text-gray-500">{a.deviceTarget}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${a.status === "active" ? "bg-green-100 text-green-700" : a.status === "paused" ? "bg-gray-100 text-gray-600" : "bg-red-100 text-red-600"}`}>{a.status}</span></td>
                  <td className="px-4 py-3">{a.priority}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {a.impressionCount ?? 0}{a.impressionCap ? ` / ${a.impressionCap}` : ""} impr
                    {(a.clickCount || a.clickCap) ? <><br />{a.clickCount ?? 0}{a.clickCap ? ` / ${a.clickCap}` : ""} clicks</> : null}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button onClick={() => startEdit(a)} title="Edit" className="text-blue-600 hover:text-blue-800"><Pencil size={14} /></button>
                      {a.status !== "expired" && (
                        <button onClick={() => toggleStatus(a)} title={a.status === "active" ? "Pause" : "Resume"} className="text-amber-600 hover:text-amber-800">
                          {a.status === "active" ? <Pause size={14} /> : <Play size={14} />}
                        </button>
                      )}
                      <button onClick={() => handleDelete(a.id)} title="Delete" className="text-red-500 hover:text-red-700"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {ads.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No ads. Click "Create Ad" to add one.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === "advertisers" && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b"><tr>
              <th className="text-left px-4 py-3 font-medium">Company</th><th className="text-left px-4 py-3 font-medium">Contact</th>
              <th className="text-left px-4 py-3 font-medium">Email</th><th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Actions</th>
            </tr></thead>
            <tbody>
              {advertisers.map((a) => (
                <tr key={a.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{a.companyName}</td><td className="px-4 py-3">{a.contactName}</td>
                  <td className="px-4 py-3 text-gray-500">{a.email}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs ${a.status === "active" ? "bg-green-100 text-green-700" : a.status === "suspended" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>{a.status}</span></td>
                  <td className="px-4 py-3">
                    {a.status === "active" ? (
                      <button onClick={() => suspendAdvertiser(a.id)} className="text-red-500 text-sm hover:underline">De-active</button>
                    ) : (
                      <button onClick={() => approveAdvertiser(a.id)} className="text-green-600 text-sm hover:underline">
                        {a.status === "suspended" ? "Activate" : "Approve"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "requests" && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b"><tr>
              <th className="text-left px-4 py-3 font-medium">Ad Name</th><th className="text-left px-4 py-3 font-medium">Zone</th>
              <th className="text-left px-4 py-3 font-medium">Company</th><th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Actions</th>
            </tr></thead>
            <tbody>
              {adRequests.map((r: any) => (
                <tr key={r.request.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{r.request.name}</td><td className="px-4 py-3 text-gray-500">{r.request.zone}</td>
                  <td className="px-4 py-3">{r.advertiser?.companyName}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs ${r.request.status === "approved" ? "bg-green-100 text-green-700" : r.request.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>{r.request.status}</span></td>
                  <td className="px-4 py-3 flex gap-2">
                    {r.request.status === "pending" && (<>
                      <button onClick={() => approveRequest(r.request.id)} className="text-green-600 text-sm">Approve</button>
                      <button onClick={() => rejectRequest(r.request.id)} className="text-red-500 text-sm">Reject</button>
                    </>)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "revenue" && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <p className="text-sm text-gray-500 p-4 pb-0">Set CPM (per 1,000 impressions) and CPC (per click) rates used to estimate revenue on the Analytics page. Changes save on blur.</p>
          <table className="w-full text-sm mt-4">
            <thead className="bg-gray-50 border-b"><tr>
              <th className="text-left px-4 py-3 font-medium">Zone</th>
              <th className="text-left px-4 py-3 font-medium">CPM Rate (₹)</th>
              <th className="text-left px-4 py-3 font-medium">CPC Rate (₹)</th>
            </tr></thead>
            <tbody>
              {AD_ZONES.map((zone) => {
                const current = revenueRates.find((r) => r.zone === zone);
                return (
                  <tr key={zone} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{zone}</td>
                    <td className="px-4 py-3">
                      <input type="number" step="0.01" min={0} defaultValue={current ? current.cpmRate : "0.5000"}
                        onBlur={(e) => updateRate(zone, "cpmRate", e.target.value, current)}
                        className="w-28 px-2 py-1 border rounded" />
                    </td>
                    <td className="px-4 py-3">
                      <input type="number" step="0.01" min={0} defaultValue={current ? current.cpcRate : "2.0000"}
                        onBlur={(e) => updateRate(zone, "cpcRate", e.target.value, current)}
                        className="w-28 px-2 py-1 border rounded" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
