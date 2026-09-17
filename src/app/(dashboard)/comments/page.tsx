"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { CheckCircle, XCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const TABS = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
] as const;

const PAGE_SIZE = 30;

export default function CommentsPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("pending");
  const [comments, setComments] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const fetch = () => {
    if (tab === "pending") {
      adminApi.pendingComments().then((r) => { setComments(r.data); setTotal(r.data.length); });
    } else {
      const params: Record<string, any> = { page, limit: PAGE_SIZE };
      if (tab !== "all") params.status = tab;
      adminApi.comments(params).then((r) => { setComments(r.data.items); setTotal(r.data.total); });
    }
  };

  useEffect(() => { fetch(); }, [tab, page]);

  const switchTab = (t: (typeof TABS)[number]["key"]) => { setTab(t); setPage(1); };

  const moderate = async (id: number, status: "approved" | "rejected") => {
    try {
      await adminApi.moderateComment(id, status);
      toast.success(status === "approved" ? "Approved" : "Rejected");
      fetch();
    } catch { toast.error("Failed to moderate comment"); }
  };

  const remove = async (id: number) => {
    if (!confirm("Permanently delete this comment?")) return;
    try {
      await adminApi.deleteComment(id);
      toast.success("Deleted");
      fetch();
    } catch { toast.error("Failed to delete comment"); }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Comments</h1>

      <div className="flex gap-1 mb-5 border-b">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => switchTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
              tab === t.key ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {comments.map((c) => (
          <div key={c.id} className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{c.userName || "Anonymous"}</p>
                  {c.status && tab !== "pending" && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      c.status === "approved" ? "bg-green-100 text-green-700" :
                      c.status === "rejected" ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-600"
                    }`}>{c.status}</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">{c.content}</p>
                <p className="text-xs text-gray-400 mt-2">
                  On: <span className="font-medium">{c.articleTitle}</span> · {format(new Date(c.createdAt), "dd MMM yyyy HH:mm")}
                </p>
              </div>
              <div className="flex gap-2 ml-4">
                {c.status !== "approved" && (
                  <button onClick={() => moderate(c.id, "approved")} className="text-green-600 p-1.5 hover:bg-green-50 rounded" title="Approve"><CheckCircle size={18} /></button>
                )}
                {c.status !== "rejected" && (
                  <button onClick={() => moderate(c.id, "rejected")} className="text-red-500 p-1.5 hover:bg-red-50 rounded" title="Reject"><XCircle size={18} /></button>
                )}
                <button onClick={() => remove(c.id)} className="text-gray-400 p-1.5 hover:bg-gray-50 hover:text-gray-600 rounded" title="Delete"><Trash2 size={16} /></button>
              </div>
            </div>
          </div>
        ))}
        {comments.length === 0 && <p className="text-gray-500 text-center py-8">No comments</p>}
      </div>

      {tab !== "pending" && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
            className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50">Prev</button>
          <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
            className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50">Next</button>
        </div>
      )}
    </div>
  );
}
