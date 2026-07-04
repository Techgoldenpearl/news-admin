"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { epaperApi } from "@/lib/api";
import PageReorderGrid from "@/components/epaper/PageReorderGrid";
import RegionEditor from "@/components/epaper/RegionEditor";
import { ArrowLeft } from "lucide-react";

export default function EpaperIssueDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [issue, setIssue] = useState<any>(null);
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPageId, setSelectedPageId] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    epaperApi.get(Number(id))
      .then((r) => {
        setIssue(r.data);
        setPages(r.data.pages || []);
        if (r.data.pages?.length) setSelectedPageId(r.data.pages[0].id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8 text-center text-gray-400">Loading…</div>;
  if (!issue) return <div className="p-8 text-center text-gray-400">Issue not found</div>;

  const selectedPage = pages.find((p) => p.id === selectedPageId);

  return (
    <div>
      <button onClick={() => router.push("/epaper")} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft size={16} /> Back to E-Paper
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {new Date(issue.issueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
          {issue.edition ? ` — ${issue.edition}` : ""}
        </h1>
        <p className="text-sm text-gray-400 mt-1">{issue.status} · {issue.viewsCount || 0} views</p>
      </div>

      <div className="bg-white rounded-xl border p-6 mb-6">
        <PageReorderGrid
          issueId={issue.id}
          pages={pages}
          onPagesChange={setPages}
          selectedPageId={selectedPageId}
          onSelectPage={setSelectedPageId}
        />
      </div>

      {selectedPage && (
        <div className="bg-white rounded-xl border p-6">
          <h4 className="font-medium text-sm mb-3">Article hotspots — Page {selectedPage.pageNumber}</h4>
          <RegionEditor key={selectedPage.id} pageId={selectedPage.id} imageUrl={selectedPage.imageUrl} />
        </div>
      )}
    </div>
  );
}
