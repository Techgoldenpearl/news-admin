"use client";

import { useEffect, useState } from "react";
import { membershipApi } from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { Plus, Pencil, Trash2, Star, X, EyeOff } from "lucide-react";

interface PlanForm {
  name: string;
  nameHindi: string;
  slug: string;
  description: string;
  price: string;
  currency: string;
  interval: string;
  durationDays: string;
  features: string;
  maxArticlesPerDay: string;
  adFree: boolean;
  downloadEnabled: boolean;
  prioritySupport: boolean;
  sortOrder: string;
  isPopular: boolean;
}

const emptyForm: PlanForm = {
  name: "",
  nameHindi: "",
  slug: "",
  description: "",
  price: "",
  currency: "INR",
  interval: "monthly",
  durationDays: "30",
  features: "",
  maxArticlesPerDay: "",
  adFree: false,
  downloadEnabled: false,
  prioritySupport: false,
  sortOrder: "0",
  isPopular: false,
};

export default function MembershipPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [uniqueSubscribers, setUniqueSubscribers] = useState(0);
  const [tab, setTab] = useState<"plans" | "subscriptions">("plans");
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<PlanForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadPlans = () => {
    setLoadingPlans(true);
    membershipApi
      .adminPlans()
      .then((r) => setPlans(r.data))
      .catch(() => toast.error("Failed to load plans"))
      .finally(() => setLoadingPlans(false));
  };

  const loadSubscriptions = () => {
    setLoadingSubs(true);
    membershipApi
      .subscriptions()
      .then((r) => {
        setSubscriptions(r.data.items);
        setUniqueSubscribers(r.data.uniqueSubscribers);
      })
      .catch(() => toast.error("Failed to load subscriptions"))
      .finally(() => setLoadingSubs(false));
  };

  useEffect(() => {
    loadPlans();
    loadSubscriptions();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (p: any) => {
    setEditingId(p.id);
    setForm({
      name: p.name || "",
      nameHindi: p.nameHindi || "",
      slug: p.slug || "",
      description: p.description || "",
      price: p.price?.toString() || "",
      currency: p.currency || "INR",
      interval: p.interval || "monthly",
      durationDays: p.durationDays?.toString() || "30",
      features: (p.features || []).join(", "),
      maxArticlesPerDay: p.maxArticlesPerDay?.toString() || "",
      adFree: !!p.adFree,
      downloadEnabled: !!p.downloadEnabled,
      prioritySupport: !!p.prioritySupport,
      sortOrder: p.sortOrder?.toString() || "0",
      isPopular: !!p.isPopular,
    });
    setShowModal(true);
  };

  const buildPayload = () => ({
    name: form.name,
    nameHindi: form.nameHindi || undefined,
    slug: form.slug,
    description: form.description || undefined,
    price: form.price,
    currency: form.currency || undefined,
    interval: form.interval,
    durationDays: Number(form.durationDays),
    features: form.features
      ? form.features.split(",").map((f) => f.trim()).filter(Boolean)
      : undefined,
    maxArticlesPerDay: form.maxArticlesPerDay ? Number(form.maxArticlesPerDay) : undefined,
    adFree: form.adFree,
    downloadEnabled: form.downloadEnabled,
    prioritySupport: form.prioritySupport,
    sortOrder: Number(form.sortOrder),
    isPopular: form.isPopular,
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.slug || !form.price || !form.durationDays) {
      toast.error("Name, slug, price and duration are required");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await membershipApi.updatePlan(editingId, buildPayload());
        toast.success("Plan updated");
      } else {
        await membershipApi.createPlan(buildPayload());
        toast.success("Plan created");
      }
      setShowModal(false);
      loadPlans();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to save plan");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete plan "${name}"? This deactivates it — existing subscribers keep access until expiry.`)) return;
    try {
      await membershipApi.deletePlan(id);
      toast.success("Plan deactivated");
      loadPlans();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to delete plan");
    }
  };

  const toggleActive = async (p: any) => {
    try {
      await membershipApi.updatePlan(p.id, { isActive: !p.isActive });
      toast.success(p.isActive ? "Plan deactivated" : "Plan activated");
      loadPlans();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update plan");
    }
  };

  const togglePopular = async (p: any) => {
    try {
      await membershipApi.updatePlan(p.id, { isPopular: !p.isPopular });
      loadPlans();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update plan");
    }
  };

  const toggleSubscriptionActive = async (s: any) => {
    const nextActive = s.status !== "active";
    try {
      await membershipApi.setSubscriptionActive(s.id, nextActive);
      toast.success(nextActive ? "Subscription activated" : "Subscription deactivated");
      loadSubscriptions();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update subscription");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Membership</h1>
        {tab === "plans" && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={16} /> Add Plan
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => setTab("plans")} className={`px-4 py-2 rounded-lg text-sm ${tab === "plans" ? "bg-blue-600 text-white" : "bg-gray-100"}`}>Plans ({plans.length})</button>
        <button onClick={() => setTab("subscriptions")} className={`px-4 py-2 rounded-lg text-sm ${tab === "subscriptions" ? "bg-blue-600 text-white" : "bg-gray-100"}`}>Subscriptions ({subscriptions.length})</button>
        {tab === "subscriptions" && !loadingSubs && (
          <span className="text-sm text-gray-500 ml-2">{uniqueSubscribers} unique subscriber{uniqueSubscribers === 1 ? "" : "s"}</span>
        )}
      </div>

      {tab === "plans" && (
        loadingPlans ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-blue-600" />
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No plans yet — click &quot;Add Plan&quot; to create one.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((p) => (
              <div key={p.id} className={`bg-white rounded-xl shadow-sm border p-5 relative ${p.isPopular ? "ring-2 ring-blue-500" : ""} ${!p.isActive ? "opacity-60" : ""}`}>
                <div className="flex items-center gap-2 mb-1">
                  {p.isPopular && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded inline-block">Popular</span>}
                  {!p.isActive && (
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded inline-flex items-center gap-1">
                      <EyeOff size={10} /> Inactive
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold">{p.name}</h3>
                <p className="text-sm text-gray-500">{p.nameHindi}</p>
                <p className="text-xs text-gray-400 mt-0.5">/{p.slug}</p>
                <p className="text-3xl font-bold mt-2">₹{p.price}<span className="text-sm text-gray-400 font-normal">/{p.interval}</span></p>
                <p className="text-sm text-gray-500 mt-2">{p.description}</p>
                <ul className="mt-3 space-y-1">
                  {p.features?.map((f: string, i: number) => (
                    <li key={i} className="text-sm text-gray-600 flex items-center gap-2"><Star size={12} className="text-yellow-500" />{f}</li>
                  ))}
                </ul>
                <div className="mt-3 text-xs text-gray-400 space-y-0.5">
                  <div>Duration: {p.durationDays} days · Ad-free: {p.adFree ? "Yes" : "No"}</div>
                  <div>Download: {p.downloadEnabled ? "Yes" : "No"} · Priority support: {p.prioritySupport ? "Yes" : "No"}</div>
                  {p.maxArticlesPerDay ? <div>Max articles/day: {p.maxArticlesPerDay}</div> : null}
                </div>
                <div className="flex items-center gap-1 mt-4 pt-3 border-t">
                  <button onClick={() => openEdit(p)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => toggleActive(p)} className="px-2 py-1 text-xs border rounded hover:bg-gray-50">
                    {p.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button onClick={() => togglePopular(p)} className="px-2 py-1 text-xs border rounded hover:bg-gray-50">
                    {p.isPopular ? "Unmark popular" : "Mark popular"}
                  </button>
                  <button onClick={() => handleDelete(p.id, p.name)} className="p-1.5 text-red-500 hover:bg-red-50 rounded ml-auto" title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {tab === "subscriptions" && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b"><tr>
              <th className="text-left px-4 py-3 font-medium">User</th>
              <th className="text-left px-4 py-3 font-medium">Plan</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Amount</th>
              <th className="text-left px-4 py-3 font-medium">Start</th>
              <th className="text-left px-4 py-3 font-medium">End</th>
              <th className="text-left px-4 py-3 font-medium">Actions</th>
            </tr></thead>
            <tbody>
              {loadingSubs ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-blue-600 mx-auto" />
                </td></tr>
              ) : subscriptions.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No subscriptions yet</td></tr>
              ) : (
                subscriptions.map((s) => (
                  <tr key={s.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{s.userName || "—"}</p>
                      <p className="text-xs text-gray-400">{s.userEmail || "Unknown user"}</p>
                    </td>
                    <td className="px-4 py-3 font-medium">{s.planName}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs ${s.status === "active" ? "bg-green-100 text-green-700" : s.status === "cancelled" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>{s.status}</span></td>
                    <td className="px-4 py-3">₹{s.paymentAmount}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{format(new Date(s.startDate), "dd MMM yyyy")}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{format(new Date(s.endDate), "dd MMM yyyy")}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleSubscriptionActive(s)}
                        className="px-2 py-1 text-xs border rounded hover:bg-gray-50">
                        {s.status === "active" ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {subscriptions.length >= 50 && (
            <div className="px-4 py-2 text-xs text-gray-400 border-t">Showing latest 50 subscriptions</div>
          )}
        </div>
      )}

      {/* Add/Edit Plan Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">{editingId ? "Edit Plan" : "Add New Plan"}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg" placeholder="Premium" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name (Hindi)</label>
                  <input value={form.nameHindi} onChange={(e) => setForm({ ...form, nameHindi: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg" placeholder="प्रीमियम" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg" placeholder="premium" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg" rows={2} placeholder="Full access with premium features" />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                  <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg" placeholder="249.00" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg" placeholder="INR" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (days) *</label>
                  <input type="number" value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg" required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Interval *</label>
                <select value={form.interval} onChange={(e) => setForm({ ...form, interval: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg">
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="half_yearly">Half-yearly</option>
                  <option value="yearly">Yearly</option>
                  <option value="lifetime">Lifetime</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Features (comma-separated)</label>
                <input value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg" placeholder="Ad-free experience, Download articles" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max articles/day</label>
                  <input type="number" value={form.maxArticlesPerDay} onChange={(e) => setForm({ ...form, maxArticlesPerDay: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg" placeholder="Unlimited" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort order</label>
                  <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={form.adFree} onChange={(e) => setForm({ ...form, adFree: e.target.checked })} />
                  Ad-free
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={form.downloadEnabled} onChange={(e) => setForm({ ...form, downloadEnabled: e.target.checked })} />
                  Download enabled
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={form.prioritySupport} onChange={(e) => setForm({ ...form, prioritySupport: e.target.checked })} />
                  Priority support
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={form.isPopular} onChange={(e) => setForm({ ...form, isPopular: e.target.checked })} />
                  Mark as popular
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {saving ? "Saving..." : editingId ? "Update Plan" : "Create Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
