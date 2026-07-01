"use client";

import { useEffect, useState } from "react";
import { reportersApi } from "@/lib/api";
import { CheckCircle, XCircle, Ban, FileText } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function ReportersPage() {
  const [reporters, setReporters] = useState<any[]>([]);
  const [tab, setTab] = useState("all");

  const fetch = () => reportersApi.list({ status: tab === "all" ? undefined : tab }).then((r) => setReporters(r.data));
  useEffect(() => { fetch(); }, [tab]);

  const approve = async (id: number) => {
    try { await reportersApi.approve(id); toast.success("Approved"); fetch(); }
    catch { toast.error("Failed to approve"); }
  };
  const reject = async (id: number) => {
    const note = prompt("Rejection reason:");
    if (!note) return;
    try { await reportersApi.reject(id, note); toast.success("Rejected"); fetch(); }
    catch { toast.error("Failed to reject"); }
  };
  const suspend = async (id: number) => {
    const note = prompt("Suspension reason:");
    if (!note) return;
    try { await reportersApi.suspend(id, note); toast.success("Suspended"); fetch(); }
    catch { toast.error("Failed to suspend"); }
  };

  const tabs = ["all", "pending", "active", "suspended", "rejected"];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Reporters</h1>
        <Link href="/reporters/submissions" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm">
          <FileText size={16} /> Review Submissions
        </Link>
      </div>

      <div className="flex gap-2 mb-4">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-sm capitalize ${tab === t ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium">ID</th>
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">Email</th>
              <th className="text-left px-4 py-3 font-medium">Beat</th>
              <th className="text-left px-4 py-3 font-medium">City</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Articles</th>
              <th className="text-left px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reporters.map((r) => (
              <tr key={r.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 text-xs text-gray-400">{r.employeeId}</td>
                <td className="px-4 py-3 font-medium">{r.name}</td>
                <td className="px-4 py-3 text-gray-500">{r.email}</td>
                <td className="px-4 py-3 text-gray-500">{r.beat}</td>
                <td className="px-4 py-3 text-gray-500">{r.city}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    r.status === "active" ? "bg-green-100 text-green-700" :
                    r.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                    r.status === "suspended" ? "bg-red-100 text-red-700" :
                    "bg-gray-100 text-gray-700"
                  }`}>{r.status}</span>
                </td>
                <td className="px-4 py-3">{r.approvedCount}/{r.submissionsCount}</td>
                <td className="px-4 py-3 flex gap-1">
                  {r.status === "pending" && (
                    <>
                      <button onClick={() => approve(r.id)} className="text-green-600 p-1" title="Approve"><CheckCircle size={16} /></button>
                      <button onClick={() => reject(r.id)} className="text-red-500 p-1" title="Reject"><XCircle size={16} /></button>
                    </>
                  )}
                  {r.status === "active" && (
                    <button onClick={() => suspend(r.id)} className="text-orange-500 p-1" title="Suspend"><Ban size={16} /></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
