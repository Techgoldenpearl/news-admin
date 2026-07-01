"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import {
  FileText, Users, Newspaper, Megaphone, MessageSquare,
  CreditCard, TrendingUp, Zap,
} from "lucide-react";

interface Stats {
  totalArticles: number;
  publishedArticles: number;
  draftArticles: number;
  breakingCount: number;
  trendingCount: number;
  totalReporters: number;
  activeReporters: number;
  pendingReporters: number;
  pendingSubmissions: number;
  activeAds: number;
  pendingAdRequests: number;
  pendingComments: number;
  activeSubscriptions: number;
  totalUsers: number;
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: any; label: string; value: number; color: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-5">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-lg ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    adminApi.stats().then((res) => setStats(res.data)).catch(() => setError(true));
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <p className="mb-2">Failed to load dashboard stats</p>
        <button onClick={() => { setError(false); adminApi.stats().then((res) => setStats(res.data)).catch(() => setError(true)); }}
          className="text-blue-600 hover:underline text-sm">Retry</button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={FileText} label="Total Articles" value={stats.totalArticles} color="bg-blue-500" />
        <StatCard icon={FileText} label="Published" value={stats.publishedArticles} color="bg-green-500" />
        <StatCard icon={Zap} label="Breaking" value={stats.breakingCount} color="bg-red-500" />
        <StatCard icon={TrendingUp} label="Trending" value={stats.trendingCount} color="bg-orange-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label="Total Users" value={stats.totalUsers} color="bg-purple-500" />
        <StatCard icon={Newspaper} label="Active Reporters" value={stats.activeReporters} color="bg-indigo-500" />
        <StatCard icon={Newspaper} label="Pending Reporters" value={stats.pendingReporters} color="bg-yellow-500" />
        <StatCard icon={Newspaper} label="Pending Submissions" value={stats.pendingSubmissions} color="bg-amber-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Megaphone} label="Active Ads" value={stats.activeAds} color="bg-teal-500" />
        <StatCard icon={Megaphone} label="Pending Ad Requests" value={stats.pendingAdRequests} color="bg-cyan-500" />
        <StatCard icon={MessageSquare} label="Pending Comments" value={stats.pendingComments} color="bg-pink-500" />
        <StatCard icon={CreditCard} label="Active Subscriptions" value={stats.activeSubscriptions} color="bg-emerald-500" />
      </div>
    </div>
  );
}
