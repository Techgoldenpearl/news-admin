"use client";

import { useEffect, useState } from "react";
import { articlesApi } from "@/lib/api";
import { Plus, Pencil, Trash2, Zap, TrendingUp, Star, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import Link from "next/link";

export default function ArticlesPage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchArticles = () => {
    setLoading(true);
    articlesApi
      .list({ page, limit: 20, status: status || undefined, search: search || undefined })
      .then((res) => {
        setArticles(res.data.items);
        setTotal(res.data.total);
      })
      .catch(() => toast.error("Failed to fetch articles"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchArticles(); }, [page, status]);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this article? This cannot be undone.")) return;
    try {
      await articlesApi.delete(id);
      toast.success("Article deleted");
      fetchArticles();
    } catch { toast.error("Failed to delete"); }
  };

  const toggleBreaking = async (id: number, current: boolean) => {
    try {
      await articlesApi.toggleBreaking(id, !current);
      toast.success(!current ? "Marked as breaking" : "Removed from breaking");
      fetchArticles();
    } catch { toast.error("Failed to toggle breaking"); }
  };

  const toggleTrending = async (id: number, current: boolean) => {
    try {
      await articlesApi.toggleTrending(id, !current);
      toast.success(!current ? "Marked as trending" : "Removed from trending");
      fetchArticles();
    } catch { toast.error("Failed to toggle trending"); }
  };

  const toggleFeatured = async (id: number, current: boolean) => {
    try {
      await articlesApi.toggleFeatured(id, !current);
      toast.success(!current ? "Marked as featured" : "Removed from featured");
      fetchArticles();
    } catch { toast.error("Failed to toggle featured"); }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Articles ({total})</h1>
        <Link href="/articles/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          <Plus size={16} /> New Article
        </Link>
      </div>

      <div className="flex gap-3 mb-4">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 border rounded-lg text-sm bg-white">
          <option value="">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="archived">Archived</option>
        </select>
        <div className="flex-1 max-w-sm">
          <input placeholder="Search articles..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchArticles()}
            className="w-full px-3 py-2 border rounded-lg text-sm" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Title</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Views</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Flags</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((a) => (
              <tr key={a.id} className="border-b hover:bg-gray-50 transition">
                <td className="px-4 py-3">
                  <Link href={`/articles/${a.id}/edit`} className="font-medium text-gray-900 hover:text-blue-600 line-clamp-1 max-w-xs block">
                    {a.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-500">{a.categoryName || "—"}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    a.status === "published" ? "bg-green-100 text-green-700" :
                    a.status === "draft" ? "bg-gray-100 text-gray-600" :
                    a.status === "scheduled" ? "bg-blue-100 text-blue-700" :
                    "bg-yellow-100 text-yellow-700"
                  }`}>{a.status}</span>
                </td>
                <td className="px-4 py-3 text-gray-500 tabular-nums">{a.viewsCount?.toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                  {a.publishedAt ? format(new Date(a.publishedAt), "dd MMM yyyy") : "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => toggleBreaking(a.id, a.isBreaking)}
                      className={`p-1 rounded ${a.isBreaking ? "text-red-500 bg-red-50" : "text-gray-300 hover:text-red-400"}`} title="Breaking">
                      <Zap size={14} />
                    </button>
                    <button onClick={() => toggleTrending(a.id, a.isTrending)}
                      className={`p-1 rounded ${a.isTrending ? "text-orange-500 bg-orange-50" : "text-gray-300 hover:text-orange-400"}`} title="Trending">
                      <TrendingUp size={14} />
                    </button>
                    <button onClick={() => toggleFeatured(a.id, a.isFeatured)}
                      className={`p-1 rounded ${a.isFeatured ? "text-yellow-500 bg-yellow-50" : "text-gray-300 hover:text-yellow-400"}`} title="Featured">
                      <Star size={14} />
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <Link href={`/articles/${a.id}/edit`} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                      <Pencil size={14} />
                    </Link>
                    <button onClick={() => handleDelete(a.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && articles.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                No articles found. <Link href="/articles/new" className="text-blue-600 hover:underline">Create your first article</Link>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
            className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50">Previous</button>
          <span className="px-3 py-1.5 text-sm text-gray-500">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(page + 1)} disabled={page >= totalPages}
            className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50">Next</button>
        </div>
      )}
    </div>
  );
}
