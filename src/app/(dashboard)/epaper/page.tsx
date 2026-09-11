"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { epaperApi, sitesApi } from "@/lib/api";
import { Plus, Trash2, Newspaper, Search, X } from "lucide-react";
import { toast } from "sonner";
import IssueForm from "@/components/epaper/IssueForm";

const PAGE_SIZE = 24;

export default function EpaperPage() {
  const router = useRouter();
  const [issues, setIssues] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [sites, setSites] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const [filterSite, setFilterSite] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const loadIssues = () => {
    setLoading(true);
    epaperApi
      .list({
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
        ...(filterSite ? { siteId: filterSite } : {}),
        ...(filterStatus ? { status: filterStatus } : {}),
        ...(dateFrom ? { from: dateFrom } : {}),
        ...(dateTo ? { to: dateTo } : {}),
      })
      .then((r) => {
        setIssues(r.data.items || r.data);
        setTotal(r.data.total ?? (r.data.items || r.data).length);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    sitesApi.list().then((r) => setSites(r.data));
  }, []);

  useEffect(() => { loadIssues(); }, [filterSite, filterStatus, dateFrom, dateTo, page]);

  // Filters that reset the current issue set also reset pagination back to page 0.
  useEffect(() => { setPage(0); }, [filterSite, filterStatus, dateFrom, dateTo]);

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this issue and all its pages?")) return;
    try {
      await epaperApi.delete(id);
      toast.success("Issue deleted");
      loadIssues();
    } catch { toast.error("Failed to delete"); }
  };

  const siteName = (siteId: number) => sites.find((s) => s.id === siteId)?.name || `Site #${siteId}`;

  const visibleIssues = useMemo(() => {
    if (!search.trim()) return issues;
    const q = search.trim().toLowerCase();
    return issues.filter(
      (i) => (i.edition || "").toLowerCase().includes(q) || siteName(i.siteId).toLowerCase().includes(q)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issues, search, sites]);

  const groups = useMemo(() => {
    const byMonth = new Map<string, any[]>();
    for (const issue of visibleIssues) {
      const d = new Date(issue.issueDate);
      const key = d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
      if (!byMonth.has(key)) byMonth.set(key, []);
      byMonth.get(key)!.push(issue);
    }
    return Array.from(byMonth.entries());
  }, [visibleIssues]);

  const hasActiveFilters = filterSite || filterStatus || dateFrom || dateTo || search;
  const clearFilters = () => {
    setFilterSite(""); setFilterStatus(""); setDateFrom(""); setDateTo(""); setSearch("");
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">E-Paper ({total})</h1>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus size={16} /> New Issue
        </button>
      </div>

      {showForm && (
        <IssueForm
          sites={sites}
          onCreated={() => { setShowForm(false); loadIssues(); }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="bg-white border rounded-xl p-3 mb-6 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search edition or site…"
            className="pl-8 pr-3 py-2 border rounded-lg text-sm w-56"
          />
        </div>
        <select value={filterSite} onChange={(e) => setFilterSite(e.target.value)} className="px-3 py-2 border rounded-lg bg-white text-sm">
          <option value="">All sites</option>
          {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 border rounded-lg bg-white text-sm">
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <div className="flex items-center gap-1.5 text-sm">
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-2 py-2 border rounded-lg text-sm" />
          <span className="text-gray-400">to</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-2 py-2 border rounded-lg text-sm" />
        </div>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 ml-auto">
            <X size={14} /> Clear filters
          </button>
        )}
      </div>

      {loading && issues.length === 0 ? (
        <div className="text-center py-16 text-gray-400">Loading…</div>
      ) : visibleIssues.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Newspaper size={32} className="mx-auto mb-2 text-gray-300" />
          No issues found{hasActiveFilters ? " for these filters" : ""}.
        </div>
      ) : (
        <div className="bg-white border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3 font-medium w-16"></th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Edition</th>
                <th className="px-4 py-3 font-medium">Site</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Processing</th>
                <th className="px-4 py-3 font-medium text-right">Views</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {groups.map(([month, monthIssues]) => (
                <Fragment key={month}>
                  <tr className="bg-gray-50/70">
                    <td colSpan={8} className="px-4 py-2 text-xs font-semibold text-gray-500">
                      {month} <span className="font-normal text-gray-400">({monthIssues.length})</span>
                    </td>
                  </tr>
                  {monthIssues.map((issue) => (
                    <tr
                      key={issue.id}
                      onClick={() => router.push(`/epaper/${issue.id}`)}
                      className="border-b last:border-0 hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-4 py-2">
                        <div className="w-10 h-13 aspect-[3/4] bg-gray-100 rounded overflow-hidden">
                          {issue.coverImageUrl || issue.firstPageThumbnailUrl ? (
                            <img src={issue.coverImageUrl || issue.firstPageThumbnailUrl} alt={issue.issueDate} className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <div className="flex items-center justify-center h-full"><Newspaper size={16} className="text-gray-300" /></div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {new Date(issue.issueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-2">{issue.edition || "—"}</td>
                      <td className="px-4 py-2 text-gray-500">{siteName(issue.siteId)}</td>
                      <td className="px-4 py-2">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${issue.status === "published" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                          {issue.status}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        {issue.processingStatus === "failed" && (
                          <span className="text-xs px-2 py-0.5 rounded font-medium bg-red-100 text-red-700">failed</span>
                        )}
                        {issue.processingStatus === "processing" && (
                          <span className="text-xs px-2 py-0.5 rounded font-medium bg-amber-100 text-amber-700">processing…</span>
                        )}
                        {issue.processingStatus === "completed" && (
                          <span className="text-xs text-gray-400">done</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right text-gray-500">{issue.viewsCount || 0}</td>
                      <td className="px-4 py-2 text-right">
                        <button onClick={(e) => handleDelete(issue.id, e)} className="text-gray-400 hover:text-red-500">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!search && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">Page {page + 1} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
