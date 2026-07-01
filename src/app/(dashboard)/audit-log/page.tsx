"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { format } from "date-fns";

export default function AuditLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const fetch = () => adminApi.auditLogs({ page, limit: 30, search: search || undefined }).then((r) => {
    setLogs(r.data.items); setTotal(r.data.total);
  });
  useEffect(() => { fetch(); }, [page]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Audit Log ({total})</h1>

      <div className="mb-4">
        <input placeholder="Search actions, users..." value={search} onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetch()}
          className="px-3 py-2 border rounded-lg text-sm w-full max-w-sm" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b"><tr>
            <th className="text-left px-4 py-3 font-medium">Time</th>
            <th className="text-left px-4 py-3 font-medium">User</th>
            <th className="text-left px-4 py-3 font-medium">Role</th>
            <th className="text-left px-4 py-3 font-medium">Action</th>
            <th className="text-left px-4 py-3 font-medium">Entity</th>
            <th className="text-left px-4 py-3 font-medium">Details</th>
          </tr></thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{format(new Date(l.createdAt), "dd MMM HH:mm:ss")}</td>
                <td className="px-4 py-3">{l.userName || "System"}</td>
                <td className="px-4 py-3 text-xs"><span className="px-2 py-0.5 rounded bg-gray-100">{l.userRole}</span></td>
                <td className="px-4 py-3 font-mono text-xs">{l.action}</td>
                <td className="px-4 py-3 text-gray-500">{l.entityType} #{l.entityId}</td>
                <td className="px-4 py-3 text-xs text-gray-400 max-w-xs truncate">{l.details}</td>
              </tr>
            ))}
            {logs.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No audit logs</td></tr>}
          </tbody>
        </table>
      </div>

      {total > 30 && (
        <div className="flex justify-center gap-2 mt-4">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
          <span className="px-3 py-1 text-sm text-gray-500">Page {page}</span>
          <button onClick={() => setPage(page + 1)} disabled={page * 30 >= total} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
        </div>
      )}
    </div>
  );
}
