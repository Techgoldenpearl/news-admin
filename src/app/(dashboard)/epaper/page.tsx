"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { epaperApi, sitesApi } from "@/lib/api";
import { Plus, Trash2, Newspaper } from "lucide-react";
import { toast } from "sonner";
import IssueForm from "@/components/epaper/IssueForm";

export default function EpaperPage() {
  const router = useRouter();
  const [issues, setIssues] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [filterSite, setFilterSite] = useState<string>("");

  const loadIssues = (siteId?: string) => {
    epaperApi.list({ limit: 50, ...(siteId ? { siteId } : {}) }).then((r) => setIssues(r.data.items || r.data));
  };

  useEffect(() => {
    loadIssues();
    sitesApi.list().then((r) => setSites(r.data));
  }, []);

  useEffect(() => { loadIssues(filterSite); }, [filterSite]);

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this issue and all its pages?")) return;
    try {
      await epaperApi.delete(id);
      toast.success("Issue deleted");
      loadIssues(filterSite);
    } catch { toast.error("Failed to delete"); }
  };

  const siteName = (siteId: number) => sites.find((s) => s.id === siteId)?.name || `Site #${siteId}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">E-Paper ({issues.length})</h1>
        <div className="flex items-center gap-3">
          <select value={filterSite} onChange={(e) => setFilterSite(e.target.value)} className="px-3 py-2 border rounded-lg bg-white text-sm">
            <option value="">All sites</option>
            {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <Plus size={16} /> New Issue
          </button>
        </div>
      </div>

      {showForm && (
        <IssueForm
          sites={sites}
          onCreated={() => { setShowForm(false); loadIssues(filterSite); }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {issues.map((issue) => (
          <div
            key={issue.id}
            onClick={() => router.push(`/epaper/${issue.id}`)}
            className="bg-white rounded-xl border overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="aspect-[3/4] bg-gray-100 relative">
              {issue.coverImageUrl ? (
                <img src={issue.coverImageUrl} alt={issue.issueDate} className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full"><Newspaper size={32} className="text-gray-300" /></div>
              )}
              <span className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded font-medium ${issue.status === "published" ? "bg-green-500 text-white" : "bg-gray-200"}`}>{issue.status}</span>
            </div>
            <div className="p-3">
              <h3 className="font-medium">
                {new Date(issue.issueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                {issue.edition ? ` — ${issue.edition}` : ""}
              </h3>
              <p className="text-xs text-gray-400 mt-1">{siteName(issue.siteId)} · {issue.viewsCount || 0} views</p>
              <button onClick={(e) => handleDelete(issue.id, e)} className="mt-2 flex items-center gap-1 text-xs text-red-500 hover:underline">
                <Trash2 size={12} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
