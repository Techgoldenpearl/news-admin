"use client";

import { useEffect, useRef, useState } from "react";
import { epaperApi, articlesApi } from "@/lib/api";
import { X, Link2 } from "lucide-react";
import { toast } from "sonner";

interface Region {
  id: number;
  pageId: number;
  articleId: number | null;
  externalUrl: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string | null;
}

interface DraftRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface RegionEditorProps {
  pageId: number;
  imageUrl: string;
}

export default function RegionEditor({ pageId, imageUrl }: RegionEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [draftRect, setDraftRect] = useState<DraftRect | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [popover, setPopover] = useState<DraftRect | null>(null);
  const [articleSearch, setArticleSearch] = useState("");
  const [articleResults, setArticleResults] = useState<any[]>([]);
  const [externalUrl, setExternalUrl] = useState("");

  useEffect(() => {
    epaperApi.listRegions(pageId).then((r) => setRegions(r.data)).catch(() => setRegions([]));
  }, [pageId]);

  useEffect(() => {
    if (!articleSearch.trim()) { setArticleResults([]); return; }
    const t = setTimeout(() => {
      articlesApi.list({ search: articleSearch, limit: 8 }).then((r) => setArticleResults(r.data.items || r.data)).catch(() => setArticleResults([]));
    }, 300);
    return () => clearTimeout(t);
  }, [articleSearch]);

  const getRelativePos = (e: React.MouseEvent) => {
    const rect = containerRef.current!.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (popover) return;
    const pos = getRelativePos(e);
    setDragStart(pos);
    setDrawing(true);
    setDraftRect({ x: pos.x, y: pos.y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!drawing || !dragStart) return;
    const pos = getRelativePos(e);
    setDraftRect({
      x: Math.min(dragStart.x, pos.x),
      y: Math.min(dragStart.y, pos.y),
      width: Math.abs(pos.x - dragStart.x),
      height: Math.abs(pos.y - dragStart.y),
    });
  };

  const handleMouseUp = () => {
    if (!drawing) return;
    setDrawing(false);
    if (draftRect && draftRect.width > 0.01 && draftRect.height > 0.01) {
      setPopover(draftRect);
    } else {
      setDraftRect(null);
    }
    setDragStart(null);
  };

  const resetDraft = () => {
    setDraftRect(null);
    setPopover(null);
    setArticleSearch("");
    setArticleResults([]);
    setExternalUrl("");
  };

  const saveRegion = async (articleId?: number, url?: string) => {
    if (!popover) return;
    try {
      const { data } = await epaperApi.addRegion(pageId, {
        articleId,
        externalUrl: url,
        x: popover.x, y: popover.y, width: popover.width, height: popover.height,
      });
      setRegions((r) => [...r, data]);
      toast.success("Region linked");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to save region");
    } finally {
      resetDraft();
    }
  };

  const deleteRegion = async (id: number) => {
    try {
      await epaperApi.deleteRegion(id);
      setRegions((r) => r.filter((reg) => reg.id !== id));
    } catch { toast.error("Failed to delete region"); }
  };

  return (
    <div>
      <p className="text-xs text-gray-500 mb-2">Click and drag on the page to draw a hotspot linking to an article or URL.</p>
      <div
        ref={containerRef}
        className="relative w-full select-none cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <img src={imageUrl} alt="Page" className="w-full h-auto pointer-events-none" draggable={false} />

        {regions.map((r) => (
          <div
            key={r.id}
            className="absolute border-2 border-blue-500/70 bg-blue-500/10 group"
            style={{ left: `${r.x * 100}%`, top: `${r.y * 100}%`, width: `${r.width * 100}%`, height: `${r.height * 100}%` }}
          >
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); deleteRegion(r.id); }}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100"
            >
              <X size={10} />
            </button>
          </div>
        ))}

        {draftRect && (
          <div
            className="absolute border-2 border-dashed border-green-500 bg-green-500/10 pointer-events-none"
            style={{ left: `${draftRect.x * 100}%`, top: `${draftRect.y * 100}%`, width: `${draftRect.width * 100}%`, height: `${draftRect.height * 100}%` }}
          />
        )}

        {popover && (
          <div
            className="absolute bg-white border rounded-lg shadow-lg p-3 z-10 w-72"
            style={{ left: `${Math.min(popover.x * 100, 60)}%`, top: `${popover.y * 100}%` }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium flex items-center gap-1"><Link2 size={12} /> Link this region</span>
              <button type="button" onClick={resetDraft}><X size={14} /></button>
            </div>
            <input
              placeholder="Search article by title…"
              value={articleSearch}
              onChange={(e) => setArticleSearch(e.target.value)}
              className="w-full px-2 py-1.5 border rounded text-sm mb-1"
            />
            {articleResults.length > 0 && (
              <div className="max-h-32 overflow-y-auto border rounded mb-2 divide-y">
                {articleResults.map((a) => (
                  <button
                    type="button"
                    key={a.id}
                    onClick={() => saveRegion(a.id, undefined)}
                    className="block w-full text-left px-2 py-1.5 text-xs hover:bg-gray-50"
                  >
                    {a.title}
                  </button>
                ))}
              </div>
            )}
            <div className="text-[10px] text-gray-400 my-1">— or —</div>
            <div className="flex gap-1">
              <input
                placeholder="External URL"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                className="flex-1 px-2 py-1.5 border rounded text-sm"
              />
              <button
                type="button"
                disabled={!externalUrl.trim()}
                onClick={() => saveRegion(undefined, externalUrl.trim())}
                className="px-2 py-1.5 bg-blue-600 text-white rounded text-xs disabled:opacity-40"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
