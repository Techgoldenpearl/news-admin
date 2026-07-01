"use client";

import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { User, Lock, Shield } from "lucide-react";

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [tab, setTab] = useState<"account" | "password" | "security">("account");
  const [profileForm, setProfileForm] = useState({ name: "", phone: "", bio: "" });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) setProfileForm({ name: user.name || "", phone: "", bio: "" });
  }, [user]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/auth/profile", profileForm);
      await refreshUser();
      toast.success("Profile updated");
    } catch { toast.error("Failed to update profile"); }
    finally { setSaving(false); }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setSaving(true);
    try {
      const res = await api.put("/auth/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      if (res.status === 200) {
        toast.success("Password changed");
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to change password");
    } finally { setSaving(false); }
  };

  const tabs = [
    { key: "account" as const, label: "Account", icon: User },
    { key: "password" as const, label: "Password", icon: Lock },
    { key: "security" as const, label: "Security", icon: Shield },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="flex gap-2 mb-6">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${tab === t.key ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"}`}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {tab === "account" && (
        <div className="bg-white rounded-xl border p-6 max-w-xl space-y-5">
          <h2 className="text-lg font-semibold">Account Information</h2>
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl font-bold text-blue-600">
              {user?.name?.[0]?.toUpperCase() || "A"}
            </div>
            <div>
              <p className="font-medium text-lg">{user?.name}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded capitalize">{user?.role?.replace("_", " ")}</span>
            </div>
          </div>
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div><label className="block text-sm font-medium mb-1">Display Name</label>
              <input value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">Phone</label>
              <input value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="+91..." /></div>
            <div><label className="block text-sm font-medium mb-1">Bio</label>
              <textarea value={profileForm.bio} onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })} rows={3} className="w-full px-3 py-2 border rounded-lg" /></div>
            <button type="submit" disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      )}

      {tab === "password" && (
        <form onSubmit={handlePasswordChange} className="bg-white rounded-xl border p-6 max-w-xl space-y-4">
          <h2 className="text-lg font-semibold">Change Password</h2>
          <div><label className="block text-sm font-medium mb-1">Current Password</label>
            <input type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} required className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">New Password</label>
            <input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} required minLength={8} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">Confirm New Password</label>
            <input type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} required className="w-full px-3 py-2 border rounded-lg" /></div>
          <button type="submit" disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {saving ? "Changing..." : "Change Password"}
          </button>
        </form>
      )}

      {tab === "security" && (
        <div className="bg-white rounded-xl border p-6 max-w-xl space-y-5">
          <h2 className="text-lg font-semibold">Security</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div><p className="font-medium text-sm">Email Verified</p><p className="text-xs text-gray-500">Verify your email for account recovery</p></div>
              <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-700 font-medium">Verified</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div><p className="font-medium text-sm">Two-Factor Auth</p><p className="text-xs text-gray-500">Add extra security to your account</p></div>
              <span className="px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-500 font-medium">Coming Soon</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div><p className="font-medium text-sm">Active Sessions</p><p className="text-xs text-gray-500">Manage devices logged into your account</p></div>
              <span className="px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-700 font-medium">1 Active</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
