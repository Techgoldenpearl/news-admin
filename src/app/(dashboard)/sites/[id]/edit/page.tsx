"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { sitesApi, mediaApi } from "@/lib/api";
import { toast } from "sonner";
import { ArrowLeft, Save, Upload, X } from "lucide-react";

export default function EditSitePage() {
  const { id } = useParams();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    name: "", slug: "", domain: "", subdomain: "", description: "",
    language: "hi", region: "", logoUrl: "", faviconUrl: "",
    isActive: true,
    theme: { primaryColor: "#E53E3E", secondaryColor: "#FF8C00", headerBg: "#1a1a2e", fontFamily: "Noto Sans Devanagari", navStyle: "mega-menu" },
    socialLinks: { facebook: "", twitter: "", instagram: "", youtube: "", whatsapp: "" },
    seoDefaults: { metaTitle: "", metaDescription: "", ogImage: "" },
  });

  useEffect(() => {
    if (id) {
      sitesApi.get(parseInt(id as string)).then((r) => {
        const s = r.data;
        setForm({
          name: s.name || "", slug: s.slug || "", domain: s.domain || "",
          subdomain: s.subdomain || "", description: s.description || "",
          language: s.language || "hi", region: s.region || "",
          logoUrl: s.logoUrl || "", faviconUrl: s.faviconUrl || "",
          isActive: s.isActive ?? true,
          theme: s.theme || form.theme,
          socialLinks: s.socialLinks || form.socialLinks,
          seoDefaults: s.seoDefaults || form.seoDefaults,
        });
      });
    }
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await sitesApi.update(parseInt(id as string), form);
      toast.success("Site updated");
    } catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  };

  const updateTheme = (key: string, value: string) => setForm({ ...form, theme: { ...form.theme, [key]: value } });
  const updateSocial = (key: string, value: string) => setForm({ ...form, socialLinks: { ...form.socialLinks, [key]: value } });
  const updateSeo = (key: string, value: string) => setForm({ ...form, seoDefaults: { ...form.seoDefaults, [key]: value } });

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("File too large (max 10MB)"); return; }
    setUploading(true);
    try {
      const base64 = await fileToBase64(file);
      const res = await mediaApi.upload({ base64, fileName: file.name, mimeType: file.type });
      setForm((prev) => ({ ...prev, logoUrl: res.data.url }));
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/sites")} className="p-2 hover:bg-gray-200 rounded-lg"><ArrowLeft size={20} /></button>
          <h1 className="text-2xl font-bold">Edit Site</h1>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
          <Save size={16} /> {saving ? "Saving..." : "Save"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl border p-5 space-y-4">
          <h3 className="font-semibold">Basic Information</h3>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium mb-1">Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">Slug</label>
              <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">Domain</label>
              <input value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} placeholder="news.example.com" className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">Subdomain</label>
              <input value={form.subdomain} onChange={(e) => setForm({ ...form, subdomain: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">Language</label>
              <select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                <option value="hi">Hindi</option><option value="en">English</option><option value="ur">Urdu</option><option value="mr">Marathi</option>
              </select></div>
            <div><label className="block text-sm font-medium mb-1">Region</label>
              <input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
          </div>
          <div><label className="block text-sm font-medium mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2 border rounded-lg" /></div>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 rounded" /><span className="text-sm">Active</span></label>
        </div>

        {/* Theme */}
        <div className="bg-white rounded-xl border p-5 space-y-4">
          <h3 className="font-semibold">Theme</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "primaryColor", label: "Primary Color" },
              { key: "secondaryColor", label: "Secondary Color" },
              { key: "headerBg", label: "Header Background" },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center gap-2">
                <input type="color" value={(form.theme as any)[key]} onChange={(e) => updateTheme(key, e.target.value)} className="w-10 h-10 rounded border cursor-pointer" />
                <div><p className="text-xs text-gray-500">{label}</p><p className="text-xs font-mono">{(form.theme as any)[key]}</p></div>
              </div>
            ))}
          </div>
          <div><label className="block text-sm font-medium mb-1">Font Family</label>
            <select value={form.theme.fontFamily} onChange={(e) => updateTheme("fontFamily", e.target.value)} className="w-full px-3 py-2 border rounded-lg">
              <option>Noto Sans Devanagari</option><option>Inter</option><option>Poppins</option><option>Mukta</option>
            </select></div>
          <div><label className="block text-sm font-medium mb-1">Nav Style</label>
            <select value={form.theme.navStyle} onChange={(e) => updateTheme("navStyle", e.target.value)} className="w-full px-3 py-2 border rounded-lg">
              <option value="mega-menu">Mega Menu</option><option value="simple">Simple</option><option value="sidebar">Sidebar</option>
            </select></div>
          {/* Preview */}
          <div className="border rounded-lg p-3 space-y-2">
            <p className="text-xs text-gray-400">Preview</p>
            <div className="rounded-lg p-3" style={{ backgroundColor: form.theme.headerBg }}>
              <span className="font-bold text-white">{form.name || "Site Name"}</span>
            </div>
            <div className="flex gap-2">
              <div className="h-8 rounded px-4 flex items-center text-white text-xs font-medium" style={{ backgroundColor: form.theme.primaryColor }}>Primary</div>
              <div className="h-8 rounded px-4 flex items-center text-white text-xs font-medium" style={{ backgroundColor: form.theme.secondaryColor }}>Secondary</div>
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="bg-white rounded-xl border p-5 space-y-4">
          <h3 className="font-semibold">Branding</h3>
          <div>
            <label className="block text-sm font-medium mb-1">Logo</label>
            {form.logoUrl ? (
              <div className="relative inline-block">
                <img src={form.logoUrl} alt="Logo" className="h-16 object-contain border rounded-lg p-2" />
                <button type="button" onClick={() => setForm({ ...form, logoUrl: "" })}
                  className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600">
                  <X size={12} />
                </button>
              </div>
            ) : uploading ? (
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-blue-300 rounded-lg p-6 bg-blue-50">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-blue-600 mb-2" />
                <span className="text-sm text-blue-600">Uploading...</span>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition">
                <Upload size={24} className="text-gray-400 mb-2" />
                <span className="text-sm text-gray-600 font-medium">Click to upload</span>
                <span className="text-xs text-gray-400 mt-1">PNG, JPG, WebP (max 10MB)</span>
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </label>
            )}
            <div className="mt-2">
              <p className="text-xs text-gray-400 mb-1">Or paste image URL:</p>
              <input value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-xs" placeholder="https://example.com/logo.png" />
            </div>
          </div>
          <div><label className="block text-sm font-medium mb-1">Favicon URL</label>
            <input value={form.faviconUrl} onChange={(e) => setForm({ ...form, faviconUrl: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
        </div>

        {/* Social Links */}
        <div className="bg-white rounded-xl border p-5 space-y-4">
          <h3 className="font-semibold">Social Links</h3>
          {["facebook", "twitter", "instagram", "youtube", "whatsapp"].map((key) => (
            <div key={key}><label className="block text-xs font-medium text-gray-500 mb-1 capitalize">{key}</label>
              <input value={(form.socialLinks as any)[key] || ""} onChange={(e) => updateSocial(key, e.target.value)} placeholder={`${key} URL`} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          ))}
        </div>

        {/* SEO Defaults */}
        <div className="bg-white rounded-xl border p-5 space-y-4 lg:col-span-2">
          <h3 className="font-semibold">SEO Defaults</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium mb-1">Default Meta Title</label>
              <input value={form.seoDefaults.metaTitle || ""} onChange={(e) => updateSeo("metaTitle", e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">Default OG Image</label>
              <input value={form.seoDefaults.ogImage || ""} onChange={(e) => updateSeo("ogImage", e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
          </div>
          <div><label className="block text-sm font-medium mb-1">Default Meta Description</label>
            <textarea value={form.seoDefaults.metaDescription || ""} onChange={(e) => updateSeo("metaDescription", e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-lg" /></div>
        </div>
      </div>
    </div>
  );
}
