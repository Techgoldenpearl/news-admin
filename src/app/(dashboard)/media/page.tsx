"use client";

import { useEffect, useState, useRef } from "react";
import { mediaApi } from "@/lib/api";
import { Upload, Copy } from "lucide-react";
import { toast } from "sonner";

export default function MediaPage() {
  const [media, setMedia] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { mediaApi.list().then((r) => setMedia(r.data.items || r.data)); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const base64 = await fileToBase64(file);
      const res = await mediaApi.upload({ base64, fileName: file.name, mimeType: file.type });
      setMedia((prev) => [res.data, ...prev]);
      toast.success("Uploaded");
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Media Library ({media.length})</h1>
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
              <button onClick={() => copyUrl(m.url)}
                className="absolute top-2 right-2 bg-white/80 p-1.5 rounded opacity-0 group-hover:opacity-100 transition">
                <Copy size={12} />
              </button>
            </div>
            <div className="p-2">
              <p className="text-xs text-gray-500 truncate">{m.fileName}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
