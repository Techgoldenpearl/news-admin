"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FileText, FolderOpen, Image, Users, MessageSquare,
  Megaphone, Newspaper, Globe, CreditCard, Shield, Settings, LogOut,
  PenTool, BarChart3, Layout, BookOpen, Camera, Radio, Star,
  Menu, ChevronLeft, Tag, Heart,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useState } from "react";

const navSections = [
  {
    label: "Main",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/articles", label: "Articles", icon: FileText },
      { href: "/categories", label: "Categories", icon: FolderOpen },
      { href: "/media", label: "Media Library", icon: Image },
      { href: "/web-stories", label: "Web Stories", icon: BookOpen },
      { href: "/photo-galleries", label: "Photo Galleries", icon: Camera },
      { href: "/live-blogs", label: "Live Blogs", icon: Radio },
      { href: "/rashifal", label: "Rashifal", icon: Star },
    ],
  },
  {
    label: "Modules",
    items: [
      { href: "/reporters", label: "Reporters", icon: Newspaper },
      { href: "/ads", label: "Ads & Revenue", icon: Megaphone },
      { href: "/classifieds", label: "Classifieds", icon: Tag },
      { href: "/shok-sandesh", label: "Shok Sandesh", icon: Heart },
      { href: "/membership", label: "Membership", icon: CreditCard },
      { href: "/comments", label: "Comments", icon: MessageSquare },
      { href: "/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/sites", label: "Sites", icon: Globe },
      { href: "/page-builder", label: "Page Builder", icon: Layout },
      { href: "/users", label: "Users", icon: Users },
      { href: "/audit-log", label: "Audit Log", icon: Shield },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`bg-gray-900 text-white flex flex-col min-h-screen transition-all ${collapsed ? "w-16" : "w-64"}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700/50">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <PenTool size={16} />
              </div>
              <h1 className="text-lg font-bold">NewsAdmin</h1>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 hover:bg-gray-700 rounded-lg transition text-gray-400 hover:text-white">
            {collapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
        {!collapsed && (
          <>
            <p className="text-xs text-gray-500 mt-1.5 truncate">{user?.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-medium bg-blue-600/20 text-blue-400 rounded">
              {user?.role?.replace("_", " ").toUpperCase()}
            </span>
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.label} className="mb-1">
            {!collapsed && (
              <p className="px-4 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                {section.label}
              </p>
            )}
            {section.items.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 mx-2 px-3 py-2 text-sm rounded-lg transition ${
                    isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                      : "text-gray-400 hover:bg-gray-800 hover:text-white"
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon size={18} />
                  {!collapsed && item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-700/50">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition"
        >
          <LogOut size={18} />
          {!collapsed && "Logout"}
        </button>
      </div>
    </aside>
  );
}
