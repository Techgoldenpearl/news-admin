"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { articlesApi, categoriesApi, tagsApi, mediaApi, sitesApi } from "@/lib/api";
import { RichTextEditor } from "./RichTextEditor";
import { toast } from "sonner";
import { ArrowLeft, Save, Eye, Upload, X } from "lucide-react";

interface ArticleFormProps {
  articleId?: number;
}

interface FormData {
  title: string;
  titleHindi: string;
  slug: string;
  summary: string;
  content: string;
  categoryId: string;
  siteId: string;
  contentType: string;
  videoUrl: string;
  videoType: string;
  thumbnailUrl: string;
  status: string;
  isBreaking: boolean;
  isTrending: boolean;
  isFeatured: boolean;
  isPremium: boolean;
  isGlobal: boolean;
  state: string;
  city: string;
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
  readTimeMinutes: string;
  scheduledAt: string;
  tagIds: number[];
}

const defaultForm: FormData = {
  title: "", titleHindi: "", slug: "", summary: "", content: "",
  categoryId: "", siteId: "", contentType: "article",
  videoUrl: "", videoType: "none", thumbnailUrl: "",
  status: "draft", isBreaking: false, isTrending: false,
  isFeatured: false, isPremium: false, isGlobal: false,
  state: "", city: "", metaTitle: "", metaDescription: "",
  ogImage: "", readTimeMinutes: "", scheduledAt: "", tagIds: [],
};

export function ArticleForm({ articleId }: ArticleFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(defaultForm);
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [sitesList, setSitesList] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<"content" | "seo" | "settings">("content");

  useEffect(() => {
    categoriesApi.list({ activeOnly: "false" }).then((r) => setCategories(r.data));
    tagsApi.list().then((r) => setTags(r.data));
    sitesApi.list().then((r) => setSitesList(r.data)).catch(() => {});

    if (articleId) {
      articlesApi.list({ limit: 100 }).then((r) => {
        const article = r.data.items.find((a: any) => a.id === articleId);
        if (!article) return;
        articlesApi.get(article.slug).then((res) => {
          const a = res.data;
          setForm({
            title: a.title || "", titleHindi: a.titleHindi || "",
            slug: a.slug || "", summary: a.summary || "",
            content: a.content || "", categoryId: String(a.categoryId || ""),
            siteId: String(a.siteId || ""), contentType: a.contentType || "article",
            videoUrl: a.videoUrl || "", videoType: a.videoType || "none",
            thumbnailUrl: a.thumbnailUrl || "", status: a.status || "draft",
            isBreaking: a.isBreaking || false, isTrending: a.isTrending || false,
            isFeatured: a.isFeatured || false, isPremium: a.isPremium || false,
            isGlobal: a.isGlobal || false, state: a.state || "",
            city: a.city || "", metaTitle: a.metaTitle || "",
            metaDescription: a.metaDescription || "", ogImage: a.ogImage || "",
            readTimeMinutes: String(a.readTimeMinutes || ""),
            scheduledAt: a.scheduledAt ? new Date(a.scheduledAt).toISOString().slice(0, 16) : "",
            tagIds: a.tags?.map((t: any) => t.id) || [],
          });
        });
      });
    }
  }, [articleId]);

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
  };

  const handleTitleChange = (title: string) => {
    setForm((prev) => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title),
    }));
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const base64 = await fileToBase64(file);
      const res = await mediaApi.upload({ base64, fileName: file.name, mimeType: file.type });
      return res.data.url;
    } catch {
      return null;
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("File too large (max 10MB)"); return; }
    setUploading(true);
    try {
      const url = await uploadFile(file);
      if (url) {
        setForm((prev) => ({ ...prev, thumbnailUrl: url }));
        toast.success("Thumbnail uploaded");
      } else {
        toast.error("Upload failed — you can paste an image URL instead");
      }
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (submitStatus?: string) => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    const isPublishing = (submitStatus || form.status) === "published";
    if (isPublishing && !form.content.trim()) { toast.error("Content is required to publish"); return; }
    if (isPublishing && !form.categoryId) { toast.error("Category is required to publish"); return; }

    setSaving(true);
    try {
      const payload: any = {
        ...form,
        categoryId: parseInt(form.categoryId),
        siteId: form.siteId ? parseInt(form.siteId) : null,
        readTimeMinutes: form.readTimeMinutes ? parseInt(form.readTimeMinutes) : null,
        scheduledAt: form.scheduledAt ? new Date(form.scheduledAt) : null,
        status: submitStatus || form.status,
      };

      delete payload.tagIds;

      if (articleId) {
        await articlesApi.update(articleId, { ...payload, tagIds: form.tagIds });
        toast.success("Article updated");
      } else {
        await articlesApi.create({ ...payload, tagIds: form.tagIds });
        toast.success("Article created");
      }
      router.push("/articles");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to save article");
    } finally {
      setSaving(false);
    }
  };

  const toggleTag = (tagId: number) => {
    setForm((prev) => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter((id) => id !== tagId)
        : [...prev.tagIds, tagId],
    }));
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/articles")} className="p-2 hover:bg-gray-200 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold">{articleId ? "Edit Article" : "New Article"}</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleSubmit("draft")} disabled={saving}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50">
            <Save size={16} /> Save Draft
          </button>
          <button onClick={() => handleSubmit("published")} disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            <Eye size={16} /> Publish
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b">
        {(["content", "seo", "settings"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition capitalize ${
              activeTab === tab ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}>
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content area */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === "content" && (
            <>
              {/* Title */}
              <div className="bg-white rounded-xl border p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input value={form.title} onChange={(e) => handleTitleChange(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-lg font-medium focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter article title..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title (Hindi)</label>
                  <input value={form.titleHindi} onChange={(e) => setForm({ ...form, titleHindi: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg" placeholder="हिंदी शीर्षक..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                  <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm font-mono text-gray-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Summary</label>
                  <textarea value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })}
                    rows={3} className="w-full px-3 py-2 border rounded-lg" placeholder="Brief summary..." />
                </div>
              </div>

              {/* Rich Text Editor */}
              <div className="bg-white rounded-xl border p-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">Content *</label>
                <RichTextEditor content={form.content} onChange={(html) => setForm({ ...form, content: html })} />
              </div>
            </>
          )}

          {activeTab === "seo" && (
            <div className="bg-white rounded-xl border p-5 space-y-4">
              <h3 className="font-semibold">SEO Settings</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
                <input value={form.metaTitle} onChange={(e) => setForm({ ...form, metaTitle: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg" placeholder="Custom meta title (defaults to article title)" />
                <p className="text-xs text-gray-400 mt-1">{form.metaTitle.length || form.title.length}/60 characters</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                <textarea value={form.metaDescription} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
                  rows={3} className="w-full px-3 py-2 border rounded-lg" placeholder="Custom meta description (defaults to summary)" />
                <p className="text-xs text-gray-400 mt-1">{form.metaDescription.length || form.summary.length}/160 characters</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">OG Image URL</label>
                <input value={form.ogImage} onChange={(e) => setForm({ ...form, ogImage: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg" placeholder="Open Graph image URL" />
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="bg-white rounded-xl border p-5 space-y-4">
              <h3 className="font-semibold">Article Settings</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content Type</label>
                  <select value={form.contentType} onChange={(e) => setForm({ ...form, contentType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg">
                    <option value="article">Article</option>
                    <option value="video">Video</option>
                    <option value="explainer">Explainer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Read Time (min)</label>
                  <input type="number" value={form.readTimeMinutes} onChange={(e) => setForm({ ...form, readTimeMinutes: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg" placeholder="Auto-calculated" />
                </div>
              </div>
              {form.contentType === "video" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Video URL</label>
                    <input value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg" placeholder="YouTube or direct URL" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Video Type</label>
                    <select value={form.videoType} onChange={(e) => setForm({ ...form, videoType: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg">
                      <option value="youtube">YouTube</option>
                      <option value="direct">Direct</option>
                    </select>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg" placeholder="e.g. Uttar Pradesh" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg" placeholder="e.g. Lucknow" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Publish</label>
                <input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "isBreaking", label: "Breaking News" },
                  { key: "isTrending", label: "Trending" },
                  { key: "isFeatured", label: "Featured" },
                  { key: "isPremium", label: "Premium (Members Only)" },
                  { key: "isGlobal", label: "Show on All Sites" },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={(form as any)[key]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Status */}
          <div className="bg-white rounded-xl border p-5">
            <h3 className="font-semibold mb-3">Status</h3>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="scheduled">Scheduled</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Site */}
          <div className="bg-white rounded-xl border p-5">
            <h3 className="font-semibold mb-3">Publish to Site *</h3>
            <select value={form.siteId} onChange={(e) => setForm({ ...form, siteId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg">
              <option value="">Select site</option>
              {sitesList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.language === "hi" ? "Hindi" : "English"})
                </option>
              ))}
            </select>
            {form.siteId && (
              <p className="text-xs text-gray-400 mt-2">
                {sitesList.find((s) => String(s.id) === form.siteId)?.region || ""}
              </p>
            )}
          </div>

          {/* Category */}
          <div className="bg-white rounded-xl border p-5">
            <h3 className="font-semibold mb-3">Category *</h3>
            <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg">
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name} {c.nameHindi ? `(${c.nameHindi})` : ""}</option>
              ))}
            </select>
          </div>

          {/* Thumbnail (Optional) */}
          <div className="bg-white rounded-xl border p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Thumbnail</h3>
              <span className="text-xs text-gray-400">Optional</span>
            </div>
            {form.thumbnailUrl ? (
              <div className="relative">
                <img src={form.thumbnailUrl} alt="Thumbnail" className="w-full rounded-lg aspect-video object-cover" />
                <button type="button" onClick={() => setForm({ ...form, thumbnailUrl: "" })}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600">
                  <X size={14} />
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
                <input type="file" accept="image/*" onChange={handleThumbnailUpload} className="hidden" />
              </label>
            )}
            <div className="mt-2">
              <p className="text-xs text-gray-400 mb-1">Or paste image URL:</p>
              <input value={form.thumbnailUrl} onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-xs" placeholder="https://example.com/image.jpg" />
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white rounded-xl border p-5">
            <h3 className="font-semibold mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <button key={t.id} type="button" onClick={() => toggleTag(t.id)}
                  className={`px-3 py-1 text-xs rounded-full border transition ${
                    form.tagIds.includes(t.id) ? "bg-blue-600 text-white border-blue-600" : "bg-gray-50 text-gray-600 hover:border-blue-300"
                  }`}>
                  {t.name}
                </button>
              ))}
              {tags.length === 0 && <p className="text-xs text-gray-400">No tags available</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
