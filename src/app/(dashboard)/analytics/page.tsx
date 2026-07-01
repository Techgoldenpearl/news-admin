"use client";

import { useEffect, useState } from "react";
import { adminApi, analyticsApi } from "@/lib/api";
import { BarChart3, TrendingUp, Eye, Users, FileText, Megaphone } from "lucide-react";

interface Stats {
  totalArticles: number; publishedArticles: number; draftArticles: number;
  breakingCount: number; trendingCount: number; totalUsers: number;
  activeReporters: number; pendingReporters: number; pendingSubmissions: number;
  activeAds: number; pendingAdRequests: number; pendingComments: number;
  activeSubscriptions: number; totalReporters: number;
}

function MetricCard({ icon: Icon, label, value, change, color }: { icon: any; label: string; value: number | string; change?: string; color: string }) {
  return (
    <div className="bg-white rounded-xl border p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg ${color}`}><Icon size={18} className="text-white" /></div>
        {change && <span className={`text-xs font-medium ${change.startsWith("+") ? "text-green-600" : "text-red-500"}`}>{change}</span>}
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

function BarChartSimple({ data, label }: { data: { name: string; value: number }[]; label: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="bg-white rounded-xl border p-5">
      <h3 className="font-semibold mb-4">{label}</h3>
      <div className="space-y-2">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-xs text-gray-500 w-28 truncate">{d.name}</span>
            <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(d.value / max) * 100}%` }} />
            </div>
            <span className="text-xs font-medium w-12 text-right">{d.value.toLocaleString()}</span>
          </div>
        ))}
        {data.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No data</p>}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [adAnalytics, setAdAnalytics] = useState<any[]>([]);

  useEffect(() => {
    adminApi.stats().then((r) => setStats(r.data)).catch(console.error);
    analyticsApi.adAnalytics({ days: 30 }).then((r) => setAdAnalytics(r.data.zoneSummary || [])).catch(() => {});
  }, []);

  if (!stats) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600" /></div>;

  const contentData = [
    { name: "Published", value: stats.publishedArticles },
    { name: "Draft", value: stats.draftArticles },
    { name: "Breaking", value: stats.breakingCount },
    { name: "Trending", value: stats.trendingCount },
  ];

  const adData = adAnalytics.map((a: any) => ({
    name: a.zone,
    value: Number(a.impressions || 0),
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard icon={FileText} label="Total Articles" value={stats.totalArticles} color="bg-blue-500" />
        <MetricCard icon={Users} label="Total Users" value={stats.totalUsers} color="bg-purple-500" />
        <MetricCard icon={Eye} label="Active Subscriptions" value={stats.activeSubscriptions} color="bg-green-500" />
        <MetricCard icon={Megaphone} label="Active Ads" value={stats.activeAds} color="bg-orange-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard icon={FileText} label="Published" value={stats.publishedArticles} color="bg-emerald-500" />
        <MetricCard icon={TrendingUp} label="Trending" value={stats.trendingCount} color="bg-amber-500" />
        <MetricCard icon={BarChart3} label="Active Reporters" value={stats.activeReporters} color="bg-indigo-500" />
        <MetricCard icon={Users} label="Pending Comments" value={stats.pendingComments} color="bg-pink-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <BarChartSimple data={contentData} label="Content Overview" />
        <BarChartSimple data={adData} label="Ad Impressions by Zone (30 days)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold mb-4">Reporter Activity</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Total Reporters</span><span className="font-medium">{stats.totalReporters}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Active</span><span className="font-medium text-green-600">{stats.activeReporters}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Pending Approval</span><span className="font-medium text-yellow-600">{stats.pendingReporters}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Pending Submissions</span><span className="font-medium text-blue-600">{stats.pendingSubmissions}</span></div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold mb-4">Ad Revenue</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Active Ads</span><span className="font-medium">{stats.activeAds}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Pending Requests</span><span className="font-medium text-yellow-600">{stats.pendingAdRequests}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Total Impressions</span><span className="font-medium">{adData.reduce((s, d) => s + d.value, 0).toLocaleString()}</span></div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold mb-4">Membership</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Active Subscribers</span><span className="font-medium text-green-600">{stats.activeSubscriptions}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Total Users</span><span className="font-medium">{stats.totalUsers}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Conversion Rate</span>
              <span className="font-medium">{stats.totalUsers > 0 ? ((stats.activeSubscriptions / stats.totalUsers) * 100).toFixed(1) : 0}%</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
