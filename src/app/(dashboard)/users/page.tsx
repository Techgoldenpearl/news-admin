"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { Search, Users, Shield, Plus, Pencil, Trash2, X } from "lucide-react";

interface UserForm {
  name: string;
  email: string;
  phone: string;
  role: string;
  password: string;
}

const emptyForm: UserForm = { name: "", email: "", phone: "", role: "user", password: "" };

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadUsers = () => {
    setLoading(true);
    adminApi
      .users({ page, limit: 20, search: search || undefined, role: roleFilter || undefined })
      .then((r) => { setUsers(r.data.items); setTotal(r.data.total); })
      .catch(() => toast.error("Failed to load users"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadUsers(); }, [page, roleFilter]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (u: any) => {
    setEditingId(u.id);
    setForm({ name: u.name || "", email: u.email, phone: u.phone || "", role: u.role, password: "" });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email) { toast.error("Email is required"); return; }
    if (!editingId && !form.password) { toast.error("Password is required for new users"); return; }
    if (form.password && form.password.length < 6) { toast.error("Password must be at least 6 characters"); return; }

    setSaving(true);
    try {
      if (editingId) {
        const data: any = { name: form.name, email: form.email, phone: form.phone, role: form.role };
        if (form.password) data.password = form.password;
        await adminApi.updateUser(editingId, data);
        toast.success("User updated");
      } else {
        await adminApi.createUser(form);
        toast.success("User created");
      }
      setShowModal(false);
      loadUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to save user");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete user "${name || "this user"}"? This cannot be undone.`)) return;
    try {
      await adminApi.deleteUser(id);
      toast.success("User deleted");
      loadUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to delete user");
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users size={24} className="text-gray-400" />
          <h1 className="text-2xl font-bold">Users ({total})</h1>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          <Plus size={16} /> Add User
        </button>
      </div>

      <div className="flex gap-3 mb-4">
        <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border rounded-lg text-sm bg-white">
          <option value="">All Roles</option>
          <option value="user">User</option>
          <option value="editor">Editor</option>
          <option value="admin">Admin</option>
          <option value="super_admin">Super Admin</option>
        </select>
        <div className="flex-1 max-w-sm relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input placeholder="Search by name or email..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { setPage(1); loadUsers(); } }}
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">User</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Last Login</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Joined</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-blue-600 mx-auto" />
              </td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">No users found</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-b hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600">
                        {u.name?.[0]?.toUpperCase() || u.email?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{u.name || "—"}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      u.role === "super_admin" ? "bg-red-100 text-red-700" :
                      u.role === "admin" ? "bg-purple-100 text-purple-700" :
                      u.role === "editor" ? "bg-blue-100 text-blue-700" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      {u.role.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                      u.isVerified ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      <Shield size={10} />
                      {u.isVerified ? "Verified" : "Unverified"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {u.lastSignedIn ? format(new Date(u.lastSignedIn), "dd MMM yy, HH:mm") : "Never"}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {format(new Date(u.createdAt), "dd MMM yyyy")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(u)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(u.id, u.name)} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
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

      {/* Add/Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">{editingId ? "Edit User" : "Add New User"}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg" placeholder="Full name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg" placeholder="user@example.com" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg" placeholder="+91..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg">
                  <option value="user">User</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {editingId ? "New Password (leave blank to keep current)" : "Password *"}
                </label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg" placeholder="Min 6 characters"
                  required={!editingId} minLength={6} />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {saving ? "Saving..." : editingId ? "Update User" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
