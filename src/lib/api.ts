import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const api = axios.create({
  baseURL: `${API_BASE}/api`,
  withCredentials: true,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),
  me: () => api.get("/auth/me"),
  logout: () => api.post("/auth/logout"),
};

// Articles
export const articlesApi = {
  list: (params?: Record<string, any>) =>
    api.get("/articles/admin/list", { params }),
  get: (slug: string) => api.get(`/articles/${slug}`),
  create: (data: any) => api.post("/articles", data),
  update: (id: number, data: any) => api.put(`/articles/${id}`, data),
  delete: (id: number) => api.delete(`/articles/${id}`),
  toggleBreaking: (id: number, isBreaking: boolean) =>
    api.patch(`/articles/${id}/toggle-breaking`, { isBreaking }),
  toggleTrending: (id: number, isTrending: boolean) =>
    api.patch(`/articles/${id}/toggle-trending`, { isTrending }),
  toggleFeatured: (id: number, isFeatured: boolean) =>
    api.patch(`/articles/${id}/toggle-featured`, { isFeatured }),
};

// Categories
export const categoriesApi = {
  list: (params?: Record<string, any>) =>
    api.get("/categories", { params }),
  create: (data: any) => api.post("/categories", data),
  update: (id: number, data: any) => api.put(`/categories/${id}`, data),
  delete: (id: number) => api.delete(`/categories/${id}`),
};

// Media
export const mediaApi = {
  list: (params?: Record<string, any>) =>
    api.get("/media", { params }),
  upload: (data: { base64: string; fileName: string; mimeType: string }) =>
    api.post("/media/upload", data),
};

// Admin
export const adminApi = {
  stats: () => api.get("/admin/stats"),
  users: (params?: Record<string, any>) =>
    api.get("/admin/users", { params }),
  createUser: (data: any) => api.post("/admin/users", data),
  updateUser: (id: number, data: any) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id: number) => api.delete(`/admin/users/${id}`),
  updateRole: (userId: number, role: string) =>
    api.patch(`/admin/users/${userId}/role`, { role }),
  pendingComments: () => api.get("/admin/comments/pending"),
  moderateComment: (id: number, status: string) =>
    api.patch(`/admin/comments/${id}/moderate`, { status }),
  auditLogs: (params?: Record<string, any>) =>
    api.get("/admin/audit-logs", { params }),
  getLayout: (siteId: number, pageType: string) =>
    api.get("/admin/layouts", { params: { siteId, pageType } }),
  updateLayout: (data: any) => api.put("/admin/layouts", data),
};

// Sites
export const sitesApi = {
  list: () => api.get("/sites"),
  get: (id: number) => api.get(`/sites/${id}`),
  create: (data: any) => api.post("/sites", data),
  update: (id: number, data: any) => api.put(`/sites/${id}`, data),
  delete: (id: number) => api.delete(`/sites/${id}`),
};

// Reporters
export const reportersApi = {
  list: (params?: Record<string, any>) =>
    api.get("/reporters/admin/list", { params }),
  approve: (id: number) => api.patch(`/reporters/admin/${id}/approve`),
  reject: (id: number, note: string) =>
    api.patch(`/reporters/admin/${id}/reject`, { note }),
  suspend: (id: number, note: string) =>
    api.patch(`/reporters/admin/${id}/suspend`, { note }),
  submissions: (params?: Record<string, any>) =>
    api.get("/reporters/admin/submissions", { params }),
  approveSubmission: (id: number, note?: string) =>
    api.patch(`/reporters/admin/submissions/${id}/approve`, { note }),
  rejectSubmission: (id: number, note: string) =>
    api.patch(`/reporters/admin/submissions/${id}/reject`, { note }),
  requestRevision: (id: number, note: string) =>
    api.patch(`/reporters/admin/submissions/${id}/revision`, { note }),
};

// Ads
export const adsApi = {
  list: (params?: Record<string, any>) =>
    api.get("/ads/admin/list", { params }),
  create: (data: any) => api.post("/ads/admin", data),
  update: (id: number, data: any) => api.put(`/ads/admin/${id}`, data),
  delete: (id: number) => api.delete(`/ads/admin/${id}`),
  analytics: (params?: Record<string, any>) =>
    api.get("/ads/analytics", { params }),
  advertisers: (params?: Record<string, any>) =>
    api.get("/ads/admin/advertisers", { params }),
  approveAdvertiser: (id: number) =>
    api.patch(`/ads/admin/advertisers/${id}/approve`),
  adRequests: (params?: Record<string, any>) =>
    api.get("/ads/admin/requests", { params }),
  approveRequest: (id: number) =>
    api.patch(`/ads/admin/requests/${id}/approve`),
  rejectRequest: (id: number, adminNote: string) =>
    api.patch(`/ads/admin/requests/${id}/reject`, { adminNote }),
};

// Membership
export const membershipApi = {
  plans: () => api.get("/membership/plans"),
  createPlan: (data: any) => api.post("/membership/admin/plans", data),
  updatePlan: (id: number, data: any) =>
    api.put(`/membership/admin/plans/${id}`, data),
  deletePlan: (id: number) => api.delete(`/membership/admin/plans/${id}`),
  subscriptions: () => api.get("/membership/admin/subscriptions"),
};

// Tags
export const tagsApi = {
  list: () => api.get("/features/tags"),
  create: (data: any) => api.post("/features/tags", data),
};

// Web Stories
export const webStoriesApi = {
  list: (params?: Record<string, any>) => api.get("/features/web-stories", { params }),
  get: (slug: string) => api.get(`/features/web-stories/${slug}`),
  create: (data: any) => api.post("/features/web-stories", data),
  update: (id: number, data: any) => api.put(`/features/web-stories/${id}`, data),
  delete: (id: number) => api.delete(`/features/web-stories/${id}`),
};

// Photo Galleries
export const galleriesApi = {
  list: (params?: Record<string, any>) => api.get("/features/photo-galleries", { params }),
  get: (slug: string) => api.get(`/features/photo-galleries/${slug}`),
  create: (data: any) => api.post("/features/photo-galleries", data),
};

// Live Blogs
export const liveBlogsApi = {
  get: (articleId: number) => api.get(`/features/live-blogs/${articleId}`),
  create: (articleId: number) => api.post("/features/live-blogs", { articleId }),
  addEntry: (id: number, data: any) => api.post(`/features/live-blogs/${id}/entries`, data),
  toggle: (id: number, isLive: boolean) => api.patch(`/features/live-blogs/${id}/toggle`, { isLive }),
};

// Rashifal
export const rashifalApi = {
  list: (params?: Record<string, any>) => api.get("/features/rashifal", { params }),
  get: (rashi: string) => api.get(`/features/rashifal/${rashi}`),
  save: (data: any) => api.post("/features/rashifal", data),
};

// Analytics
export const analyticsApi = {
  adAnalytics: (params?: Record<string, any>) => api.get("/ads/analytics", { params }),
};

// Classified Ads
export const classifiedsApi = {
  list: (params?: Record<string, any>) => api.get("/classifieds/admin/list", { params }),
  create: (data: any) => api.post("/classifieds/admin/create", data),
  update: (id: number, data: any) => api.put(`/classifieds/admin/${id}`, data),
  delete: (id: number) => api.delete(`/classifieds/admin/${id}`),
  approve: (id: number) => api.patch(`/classifieds/admin/${id}/approve`),
  reject: (id: number, reason: string) => api.patch(`/classifieds/admin/${id}/reject`, { reason }),
  reports: () => api.get("/classifieds/admin/reports"),
  packages: () => api.get("/classifieds/packages"),
  createPackage: (data: any) => api.post("/classifieds/admin/packages", data),
  updatePackage: (id: number, data: any) => api.put(`/classifieds/admin/packages/${id}`, data),
  deletePackage: (id: number) => api.delete(`/classifieds/admin/packages/${id}`),
};

// Shok Sandesh
export const shokSandeshApi = {
  list: (params?: Record<string, any>) => api.get("/shok-sandesh/admin/list", { params }),
  create: (data: any) => api.post("/shok-sandesh/admin/create", data),
  update: (id: number, data: any) => api.put(`/shok-sandesh/admin/${id}`, data),
  delete: (id: number) => api.delete(`/shok-sandesh/admin/${id}`),
  approve: (id: number) => api.patch(`/shok-sandesh/admin/${id}/approve`),
  reject: (id: number, reason: string) => api.patch(`/shok-sandesh/admin/${id}/reject`, { reason }),
  packages: () => api.get("/shok-sandesh/packages"),
  createPackage: (data: any) => api.post("/shok-sandesh/admin/packages", data),
};
