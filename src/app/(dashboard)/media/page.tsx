"use client";

import { useEffect, useState, useRef } from "react";
import { mediaApi } from "@/lib/api";
import { Upload, Copy, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const PAGE_SIZE = 24;

export default function MediaPage() {
  const [media, setMedia] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchMedia = (p: number) => {
    mediaApi.list({ page: p, limit: PAGE_SIZE }).then((r) => {
      setMedia(r.data.items || r.data);
      setTotal(r.data.total ?? (r.data.items || r.data).length);
    });
  };

  useEffect(() => { fetchMedia(page); }, [page]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const base64 = await fileToBase64(file);
      await mediaApi.upload({ base64, fileName: file.name, mimeType: file.type });
      toast.success("Uploaded");
      setPage(1);
      fetchMedia(1);
    } catch { toast.error("Upload failed"); }
    finally { setUploading(false); }
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.readAsDataURL(file);
    });

  const copyUrl = (url: string) => { navigator.clipboard.writeText(url); toast.success("URL copied"); };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this file? This cannot be undone.")) return;
    try {
      await mediaApi.delete(id);
      toast.success("Deleted");
      fetchMedia(page);
    } catch { toast.error("Failed to delete"); }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Media Library ({total})</h1>
        <button onClick={() => fileRef.current?.click()} disabled={uploading}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
          <Upload size={16} /> {uploading ? "Uploading..." : "Upload"}
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {media.map((m) => (
          <div key={m.id} className="bg-white rounded-lg shadow-sm border overflow-hidden group">
            <div className="aspect-square bg-gray-100 relative">
              <img src={m.url} alt={m.fileName} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5">
                <button onClick={() => copyUrl(m.url)}
                  className="bg-white/90 p-1.5 rounded hover:bg-white" title="Copy URL">
                  <Copy size={13} />
                </button>
                <button onClick={() => handleDelete(m.id)}
                  className="bg-red-500 text-white p-1.5 rounded hover:bg-red-600" title="Delete">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            <div className="p-2">
              <p className="text-xs text-gray-500 truncate">{m.fileName}</p>
            </div>
          </div>
        ))}
      </div>

      {media.length === 0 && (
        <p className="text-center text-gray-400 py-16">No media uploaded yet.</p>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
            className="p-2 border rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
            className="p-2 border rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50">
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
