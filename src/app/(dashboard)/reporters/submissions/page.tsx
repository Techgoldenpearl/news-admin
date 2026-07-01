"use client";

import { useEffect, useState } from "react";
import { reportersApi } from "@/lib/api";
import { CheckCircle, XCircle, RotateCcw, X, Zap } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function ReporterSubmissionsPage() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [tab, setTab] = useState("pending");
  const [selected, setSelected] = useState<any>(null);

  const fetchSubmissions = () =>
    reportersApi.submissions({ status: tab === "all" ? undefined : tab }).then((r) => setSubmissions(r.data));

  useEffect(() => { fetchSubmissions(); }, [tab]);

  const approve = async (id: number) => {
    try {
      await reportersApi.approveSubmission(id);
      toast.success("स्वीकृत और प्रकाशित किया गया");
      setSelected(null);
      fetchSubmissions();
    } catch (err: any) { toast.error(err.response?.data?.error || "Failed to approve"); }
  };

  const reject = async (id: number) => {
    const note = prompt("Rejection reason:");
    if (!note) return;
    try {
      await reportersApi.rejectSubmission(id, note);
      toast.success("Rejected");
      setSelected(null);
      fetchSubmissions();
    } catch { toast.error("Failed to reject"); }
  };

  const requestRevision = async (id: number) => {
    const note = prompt("What needs revision?");
    if (!note) return;
    try {
      await reportersApi.requestRevision(id, note);
      toast.success("Revision requested");
      setSelected(null);
      fetchSubmissions();
    } catch { toast.error("Failed to request revision"); }
  };

  const tabs = ["pending", "approved", "rejected", "revision_requested", "all"];
  const tabLabels: Record<string, string> = {
    pending: "Pending", approved: "Approved", rejected: "Rejected", revision_requested: "Revision Requested", all: "All",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Reporter Submissions</h1>

      <div className="flex gap-2 mb-4">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-sm capitalize ${tab === t ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {tabLabels[t]}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Title</th>
              <th className="text-left px-4 py-3 font-medium">Reporter</th>
              <th className="text-left px-4 py-3 font-medium">Category</th>
              <th className="text-left px-4 py-3 font-medium">Submitted</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((s) => (
              <tr key={s.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">
                  <button onClick={() => setSelected(s)} className="font-medium text-blue-600 hover:underline text-left line-clamp-1 max-w-xs">
                    {s.isUrgent && <Zap size={12} className="inline text-red-500 mr-1" />}{s.title}
                  </button>
                </td>
                <td className="px-4 py-3 text-gray-500">{s.reporterName} <span className="text-xs text-gray-400">({s.reporterEmployeeId})</span></td>
                <td className="px-4 py-3 text-gray-500">{s.categoryName || "—"}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{s.submittedAt ? format(new Date(s.submittedAt), "dd MMM yyyy, h:mm a") : "—"}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    s.status === "approved" ? "bg-green-100 text-green-700" :
                    s.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                    s.status === "rejected" ? "bg-red-100 text-red-700" :
                    s.status === "revision_requested" ? "bg-purple-100 text-purple-700" :
                    "bg-gray-100 text-gray-700"
                  }`}>{s.status}</span>
                </td>
                <td className="px-4 py-3 flex gap-1">
                  {s.status === "pending" && (
                    <>
                      <button onClick={() => approve(s.id)} className="text-green-600 p-1" title="Approve & Publish"><CheckCircle size={16} /></button>
                      <button onClick={() => requestRevision(s.id)} className="text-purple-500 p-1" title="Request Revision"><RotateCcw size={16} /></button>
                      <button onClick={() => reject(s.id)} className="text-red-500 p-1" title="Reject"><XCircle size={16} /></button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {submissions.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">No submissions found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">{selected.title}</h2>
                <p className="text-sm text-gray-500 mt-1">{selected.reporterName} ({selected.reporterEmployeeId}) · {selected.categoryName}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            {selected.thumbnailUrl && <img src={selected.thumbnailUrl} alt={selected.title} className="w-full h-48 object-cover rounded-xl mb-4" />}
            {selected.summary && <p className="text-gray-700 font-medium mb-3 border-l-4 border-blue-500 pl-3">{selected.summary}</p>}
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">{selected.content}</div>

            {selected.status === "pending" && (
              <div className="flex gap-2 mt-6 pt-4 border-t">
                <button onClick={() => approve(selected.id)} className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition">
                  <CheckCircle size={14} /> Approve & Publish
                </button>
                <button onClick={() => requestRevision(selected.id)} className="flex items-center gap-1.5 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm hover:bg-purple-200 transition">
                  <RotateCcw size={14} /> Request Revision
                </button>
                <button onClick={() => reject(selected.id)} className="flex items-center gap-1.5 px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 transition">
                  <XCircle size={14} /> Reject
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
