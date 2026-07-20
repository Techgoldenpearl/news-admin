"use client";

import { useEffect, useState } from "react";
import { liveBlogsApi, articlesApi } from "@/lib/api";
import { Plus, Send, Radio, Square } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function LiveBlogsPage() {
  const [articleId, setArticleId] = useState("");
  const [blog, setBlog] = useState<any>(null);
  const [entry, setEntry] = useState({ content: "", isHighlight: false });
  const [articles, setArticles] = useState<any[]>([]);

  useEffect(() => {
    articlesApi.list({ limit: 50 }).then((r) => setArticles(r.data.items));
  }, []);

  const loadBlog = async (aid: number) => {
    try {
      const res = await liveBlogsApi.get(aid);
      setBlog(res.data);
    } catch { setBlog(null); }
  };

  const startBlog = async () => {
    if (!articleId) { toast.error("Select an article"); return; }
    try {
      const res = await liveBlogsApi.create(parseInt(articleId));
      setBlog(res.data);
      toast.success("Live blog started");
    } catch (err: any) { toast.error(err.response?.data?.error || "Failed to start"); }
  };

  const addEntry = async () => {
    if (!blog || !entry.content.trim()) return;
    try {
      await liveBlogsApi.addEntry(blog.id, entry);
      toast.success("Entry added");
      setEntry({ content: "", isHighlight: false });
      loadBlog(blog.articleId);
    } catch { toast.error("Failed"); }
  };

  const toggleLive = async () => {
    if (!blog) return;
    await liveBlogsApi.toggle(blog.id, !blog.isLive);
    toast.success(blog.isLive ? "Blog ended" : "Blog is live");
    loadBlog(blog.articleId);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Live Blogs</h1>

      <div className="bg-white rounded-xl border p-5 mb-6">
        <h3 className="font-semibold mb-3">Select Article</h3>
        <div className="flex gap-3">
          <select value={articleId} onChange={(e) => { setArticleId(e.target.value); if (e.target.value) loadBlog(parseInt(e.target.value)); }}
            className="flex-1 px-3 py-2 border rounded-lg">
            <option value="">Select article...</option>
            {articles.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
          </select>
          {!blog && <button onClick={startBlog} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"><Radio size={16} /> Start Live Blog</button>}
        </div>
      </div>

      {blog && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {blog.isLive ? (
                    <span className="flex items-center gap-1.5 text-red-600 font-medium"><span className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />LIVE</span>
                  ) : (
                    <span className="text-gray-500 font-medium">ENDED</span>
                  )}
                </div>
                <button onClick={toggleLive} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${blog.isLive ? "bg-gray-100 text-gray-700" : "bg-red-600 text-white"}`}>
                  {blog.isLive ? <><Square size={14} /> End Blog</> : <><Radio size={14} /> Go Live</>}
                </button>
              </div>

              {blog.isLive && (
                <div className="border-t pt-4">
                  <textarea value={entry.content} onChange={(e) => setEntry({ ...entry, content: e.target.value })}
                    rows={3} placeholder="Write a live update..." className="w-full px-3 py-2 border rounded-lg mb-2" />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={entry.isHighlight} onChange={(e) => setEntry({ ...entry, isHighlight: e.target.checked })} className="w-4 h-4 rounded" /> Key update</label>
                    <button onClick={addEntry} disabled={!entry.content.trim()} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"><Send size={14} /> Post Update</button>
                  </div>
                </div>
              )}
            </div>

            {/* Entries */}
            <div className="space-y-3">
              {(blog.entries || []).map((e: any) => (
                <div key={e.id} className={`bg-white rounded-xl border p-4 ${e.isHighlight ? "border-l-4 border-l-red-500" : ""}`}>
                  <p className="text-sm whitespace-pre-wrap">{e.content}</p>
                  <p className="text-xs text-gray-400 mt-2">{e.postedAt ? format(new Date(e.postedAt), "dd MMM yyyy, HH:mm:ss") : ""}</p>
                </div>
              ))}
              {(blog.entries || []).length === 0 && <p className="text-center text-gray-400 py-8">No entries yet</p>}
            </div>
          </div>

          <div className="bg-white rounded-xl border p-5 h-fit">
            <h3 className="font-semibold mb-3">Info</h3>
            <div className="text-sm space-y-2 text-gray-600">
              <p>Blog ID: {blog.id}</p>
              <p>Article ID: {blog.articleId}</p>
              <p>Status: {blog.isLive ? "Live" : "Ended"}</p>
              <p>Entries: {blog.entries?.length || 0}</p>
              {blog.startedAt && <p>Started: {format(new Date(blog.startedAt), "dd MMM yyyy HH:mm")}</p>}
              {blog.endedAt && <p>Ended: {format(new Date(blog.endedAt), "dd MMM yyyy HH:mm")}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
