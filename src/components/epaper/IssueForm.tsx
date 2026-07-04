"use client";

import { useEffect, useState } from "react";
import { epaperApi, mediaApi } from "@/lib/api";
import { X } from "lucide-react";
import { toast } from "sonner";
import PdfUploadProgress from "./PdfUploadProgress";

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.readAsDataURL(file);
  });

const todayLocalDate = () => {
  const d = new Date();
  const offsetMs = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offsetMs).toISOString().slice(0, 10);
};

interface IssueFormProps {
  sites: any[];
  onCreated: () => void;
  onCancel: () => void;
}

export default function IssueForm({ sites, onCreated, onCancel }: IssueFormProps) {
  const [uploading, setUploading] = useState(false);
  const [editions, setEditions] = useState<string[]>([]);
  const [mode, setMode] = useState<"images" | "pdf">("images");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [processingIssueId, setProcessingIssueId] = useState<number | null>(null);
  const [form, setForm] = useState({
    siteId: sites[0] ? String(sites[0].id) : "",
    issueDate: todayLocalDate(),
    edition: "",
    coverImageUrl: "",
    pdfUrl: "",
    status: "draft",
    pages: [] as { pageNumber: number; imageUrl: string }[],
  });

  useEffect(() => {
    if (form.siteId) {
      epaperApi.getEditions(parseInt(form.siteId)).then((r) => setEditions(r.data)).catch(() => setEditions([]));
    }
  }, [form.siteId]);

  const handlePagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded: { pageNumber: number; imageUrl: string }[] = [];
      let nextNumber = form.pages.length + 1;
      for (const file of files) {
        const base64 = await fileToBase64(file);
        const res = await mediaApi.upload({ base64, fileName: file.name, mimeType: file.type });
        uploaded.push({ pageNumber: nextNumber++, imageUrl: res.data.url });
      }
      setForm((f) => ({ ...f, pages: [...f.pages, ...uploaded] }));
      toast.success(`${uploaded.length} page(s) uploaded`);
    } catch { toast.error("Page upload failed"); }
    finally { setUploading(false); }
  };

  const removePage = (i: number) => {
    setForm((f) => ({
      ...f,
      pages: f.pages.filter((_, idx) => idx !== i).map((p, idx) => ({ ...p, pageNumber: idx + 1 })),
    }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.siteId || !form.issueDate) { toast.error("Site and date required"); return; }
    try {
      const { data: issue } = await epaperApi.create({
        siteId: parseInt(form.siteId),
        issueDate: form.issueDate,
        edition: form.edition.trim() || undefined,
        coverImageUrl: form.coverImageUrl || undefined,
        pdfUrl: form.pdfUrl || undefined,
        status: form.status,
      });
      if (form.pages.length > 0) {
        await epaperApi.addPages(issue.id, form.pages);
      }
      toast.success("E-paper issue created");
      onCreated();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to create issue");
    }
  };

  const handlePdfSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.siteId || !form.issueDate) { toast.error("Site and date required"); return; }
    if (!pdfFile) { toast.error("Please choose a PDF file"); return; }
    setPdfUploading(true);
    try {
      const fd = new FormData();
      fd.append("siteId", form.siteId);
      fd.append("issueDate", form.issueDate);
      if (form.edition.trim()) fd.append("edition", form.edition.trim());
      fd.append("status", form.status);
      fd.append("pdf", pdfFile);

      const { data } = await epaperApi.uploadPdf(fd);
      setProcessingIssueId(data.issueId);
      toast.success("PDF uploaded — processing pages now");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to upload PDF");
    } finally {
      setPdfUploading(false);
    }
  };

  const sharedFields = (
    <div className="grid grid-cols-2 gap-3">
      <select value={form.siteId} onChange={(e) => setForm({ ...form, siteId: e.target.value })} required className="px-3 py-2 border rounded-lg">
        {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      <input type="date" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} required className="px-3 py-2 border rounded-lg" />
      <div>
        <input
          list="editions-datalist"
          placeholder="Edition (e.g. Delhi, Mumbai) — optional"
          value={form.edition}
          onChange={(e) => setForm({ ...form, edition: e.target.value })}
          className="px-3 py-2 border rounded-lg w-full"
        />
        <datalist id="editions-datalist">
          {editions.map((ed) => <option key={ed} value={ed} />)}
        </datalist>
      </div>
      <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="px-3 py-2 border rounded-lg">
        <option value="draft">Draft</option><option value="published">Published</option>
      </select>
    </div>
  );

  return (
    <div className="bg-white rounded-xl border p-6 mb-6">
      <div className="flex gap-2 mb-4 border-b">
        <button
          type="button"
          onClick={() => setMode("images")}
          className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${mode === "images" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"}`}
        >
          Upload Page Images
        </button>
        <button
          type="button"
          onClick={() => setMode("pdf")}
          className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${mode === "pdf" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"}`}
        >
          Upload PDF (auto-slice)
        </button>
      </div>

      {mode === "images" ? (
        <form onSubmit={handleCreate} className="space-y-4">
          {sharedFields}
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Cover Image URL" value={form.coverImageUrl} onChange={(e) => setForm({ ...form, coverImageUrl: e.target.value })} className="px-3 py-2 border rounded-lg" />
            <input placeholder="PDF URL (optional)" value={form.pdfUrl} onChange={(e) => setForm({ ...form, pdfUrl: e.target.value })} className="px-3 py-2 border rounded-lg" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-sm">Pages ({form.pages.length})</h4>
              <label className="text-sm text-blue-600 hover:underline cursor-pointer">
                {uploading ? "Uploading..." : "+ Upload Page Images"}
                <input type="file" accept="image/*" multiple onChange={handlePagesUpload} disabled={uploading} className="hidden" />
              </label>
            </div>
            {form.pages.length > 0 && (
              <div className="grid grid-cols-6 gap-2">
                {form.pages.map((p, i) => (
                  <div key={i} className="relative border rounded-lg overflow-hidden aspect-[3/4] bg-gray-50">
                    <img src={p.imageUrl} alt={`Page ${p.pageNumber}`} className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center py-0.5">{p.pageNumber}</span>
                    <button type="button" onClick={() => removePage(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg">Create</button>
            <button type="button" onClick={onCancel} className="px-4 py-2 border rounded-lg">Cancel</button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          {sharedFields}

          {processingIssueId ? (
            <PdfUploadProgress
              issueId={processingIssueId}
              onComplete={onCreated}
              onRetry={() => setProcessingIssueId(null)}
            />
          ) : (
            <form onSubmit={handlePdfSubmit} className="space-y-4">
              <label className="flex items-center justify-center border-2 border-dashed rounded-lg py-6 cursor-pointer hover:bg-gray-50 text-sm text-gray-500">
                {pdfFile ? pdfFile.name : "Click to choose a PDF file (max 60MB)"}
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
              <div className="flex gap-2">
                <button type="submit" disabled={pdfUploading} className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50">
                  {pdfUploading ? "Uploading…" : "Upload & Process"}
                </button>
                <button type="button" onClick={onCancel} className="px-4 py-2 border rounded-lg">Cancel</button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
