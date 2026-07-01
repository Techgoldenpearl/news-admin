"use client";

import { useEffect, useState } from "react";
import { membershipApi } from "@/lib/api";
import { Plus, Pencil, Star } from "lucide-react";
import { toast } from "sonner";

export default function MembershipPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [tab, setTab] = useState<"plans" | "subscriptions">("plans");

  useEffect(() => {
    membershipApi.plans().then((r) => setPlans(r.data));
    membershipApi.subscriptions().then((r) => setSubscriptions(r.data));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Membership</h1>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab("plans")} className={`px-4 py-2 rounded-lg text-sm ${tab === "plans" ? "bg-blue-600 text-white" : "bg-gray-100"}`}>Plans ({plans.length})</button>
        <button onClick={() => setTab("subscriptions")} className={`px-4 py-2 rounded-lg text-sm ${tab === "subscriptions" ? "bg-blue-600 text-white" : "bg-gray-100"}`}>Subscriptions ({subscriptions.length})</button>
      </div>

      {tab === "plans" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((p) => (
            <div key={p.id} className={`bg-white rounded-xl shadow-sm border p-5 ${p.isPopular ? "ring-2 ring-blue-500" : ""}`}>
              {p.isPopular && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded mb-2 inline-block">Popular</span>}
              <h3 className="text-lg font-bold">{p.name}</h3>
              <p className="text-sm text-gray-500">{p.nameHindi}</p>
              <p className="text-3xl font-bold mt-2">₹{p.price}<span className="text-sm text-gray-400 font-normal">/{p.interval}</span></p>
              <p className="text-sm text-gray-500 mt-2">{p.description}</p>
              <ul className="mt-3 space-y-1">
                {p.features?.map((f: string, i: number) => (
                  <li key={i} className="text-sm text-gray-600 flex items-center gap-2"><Star size={12} className="text-yellow-500" />{f}</li>
                ))}
              </ul>
              <div className="mt-3 text-xs text-gray-400">
                Duration: {p.durationDays} days · Ad-free: {p.adFree ? "Yes" : "No"}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "subscriptions" && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b"><tr>
              <th className="text-left px-4 py-3 font-medium">Plan</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Amount</th>
              <th className="text-left px-4 py-3 font-medium">Start</th>
              <th className="text-left px-4 py-3 font-medium">End</th>
            </tr></thead>
            <tbody>
              {subscriptions.map((s) => (
                <tr key={s.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{s.planName}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs ${s.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{s.status}</span></td>
                  <td className="px-4 py-3">₹{s.paymentAmount}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{new Date(s.startDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{new Date(s.endDate).toLocaleDateString()}</td>
                </tr>
              ))}
              {subscriptions.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No subscriptions yet</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
