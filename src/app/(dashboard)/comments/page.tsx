"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function CommentsPage() {
  const [comments, setComments] = useState<any[]>([]);

  const fetch = () => adminApi.pendingComments().then((r) => setComments(r.data));
  useEffect(() => { fetch(); }, []);

  const moderate = async (id: number, status: "approved" | "rejected") => {
    try {
      await adminApi.moderateComment(id, status);
      toast.success(status === "approved" ? "Approved" : "Rejected");
      fetch();
    } catch { toast.error("Failed to moderate comment"); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Pending Comments ({comments.length})</h1>
      <div className="space-y-3">
        {comments.map((c) => (
          <div key={c.id} className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="text-sm font-medium">{c.userName || "Anonymous"}</p>
                <p className="text-sm text-gray-600 mt-1">{c.content}</p>
                <p className="text-xs text-gray-400 mt-2">
                  On: <span className="font-medium">{c.articleTitle}</span> · {format(new Date(c.createdAt), "dd MMM yyyy HH:mm")}
                </p>
              </div>
              <div className="flex gap-2 ml-4">
                <button onClick={() => moderate(c.id, "approved")} className="text-green-600 p-1.5 hover:bg-green-50 rounded"><CheckCircle size={18} /></button>
                <button onClick={() => moderate(c.id, "rejected")} className="text-red-500 p-1.5 hover:bg-red-50 rounded"><XCircle size={18} /></button>
              </div>
            </div>
          </div>
        ))}
        {comments.length === 0 && <p className="text-gray-500 text-center py-8">No pending comments</p>}
      </div>
    </div>
  );
}
