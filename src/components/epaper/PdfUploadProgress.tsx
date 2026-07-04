"use client";

import { useEffect, useState } from "react";
import { epaperApi } from "@/lib/api";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

interface PdfUploadProgressProps {
  issueId: number;
  onComplete: () => void;
  onRetry: () => void;
}

export default function PdfUploadProgress({ issueId, onComplete, onRetry }: PdfUploadProgressProps) {
  const [status, setStatus] = useState<"processing" | "completed" | "failed">("processing");
  const [error, setError] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const { data } = await epaperApi.processingStatus(issueId);
        if (cancelled) return;
        setPageCount(data.pageCount ?? 0);
        if (data.processingStatus === "completed") {
          setStatus("completed");
          onComplete();
        } else if (data.processingStatus === "failed") {
          setStatus("failed");
          setError(data.processingError || "Processing failed");
        } else {
          setTimeout(poll, 2000);
        }
      } catch {
        if (!cancelled) setTimeout(poll, 2000);
      }
    };
    poll();
    return () => { cancelled = true; };
  }, [issueId, onComplete]);

  if (status === "completed") {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
        <CheckCircle2 size={16} /> PDF processed — {pageCount} page(s) added
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-red-600 mb-2">
          <XCircle size={16} /> Processing failed{error ? `: ${error}` : ""}
        </div>
        <button onClick={onRetry} className="text-xs text-red-700 underline">Try uploading again</button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 border rounded-lg px-4 py-3">
      <Loader2 size={16} className="animate-spin" />
      Processing your PDF{pageCount > 0 ? ` — ${pageCount} page(s) so far` : "…"}
    </div>
  );
}
