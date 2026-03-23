"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import useAuthStore from "@/store/useAuthStore";

import {
  MdOutlineDashboard,
  MdOutlineCreditCard,
  MdLogout,
} from "react-icons/md";
import { GoRepo, GoGitPullRequest } from "react-icons/go";
import { AiOutlineTool } from "react-icons/ai";
import { IoSettingsOutline } from "react-icons/io5";

export default function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const navLinks = [
    { name: "Overview", href: "/dashboard", icon: MdOutlineDashboard },
    { name: "Repositories", href: "/dashboard/repositories", icon: GoRepo },
    {
      name: "PR Reviews",
      href: "/dashboard/pr-reviews",
      icon: GoGitPullRequest,
    },
    { name: "Fix PRs", href: "/dashboard/fix-prs", icon: AiOutlineTool },
  ];

  const bottomLinks = [
    { name: "Settings", href: "/dashboard/settings", icon: IoSettingsOutline },
    {
      name: "Usage & Billings",
      href: "/dashboard/billing",
      icon: MdOutlineCreditCard,
    },
  ];

  return (
    <aside className="w-[260px] shrink-0 flex flex-col h-screen bg-white border-r border-[#eaeaea]">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-[#eaeaea]">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 bg-black text-white flex items-center justify-center font-bold text-xs">
            D
          </div>
          <span className="text-lg font-bold text-black tracking-tight">
            DiffUse
          </span>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-2">
          Menu
        </div>
        {navLinks.map((link) => {
          const isActive =
            pathname === link.href || pathname?.startsWith(`${link.href}/`);
          const isExactActive =
            link.href === "/dashboard" ? pathname === "/dashboard" : isActive;
          const Icon = link.icon;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isExactActive
                  ? "bg-black text-white"
                  : "text-gray-500 hover:bg-gray-100 hover:text-black"
              }`}
            >
              <Icon
                className={`w-[18px] h-[18px] ${isExactActive ? "text-white" : "text-gray-400 group-hover:text-black"}`}
              />
              {link.name}
            </Link>
          );
        })}

        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-8 mb-4 px-2">
          System
        </div>
        {bottomLinks.map((link) => {
          const isActive =
            pathname === link.href || pathname?.startsWith(`${link.href}/`);
          const Icon = link.icon;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? "bg-black text-white"
                  : "text-gray-500 hover:bg-gray-100 hover:text-black"
              }`}
            >
              <Icon
                className={`w-[18px] h-[18px] ${isActive ? "text-white" : "text-gray-400 group-hover:text-black"}`}
              />
              {link.name}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-4 border-t border-[#eaeaea] bg-[#fdfdfd]">
        {/* Plan & Usage Details */}
        <div className="bg-white rounded-md p-4 mb-3 border border-[#eaeaea]">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-black uppercase tracking-widest">
              Pro Plan
            </span>
            <span className="px-1.5 py-0.5 rounded-sm text-[9px] font-bold border border-black text-black">
              ACTIVE
            </span>
          </div>

          <div className="flex justify-between items-end mb-2">
            <span className="text-[11px] text-gray-500 font-medium">
              Monthly Requests
            </span>
            <span className="text-xs font-bold text-black">
              38 <span className="text-gray-400 font-medium">/ 50</span>
            </span>
          </div>

          <div className="w-full bg-[#f0f0f0] h-1 mb-3 overflow-hidden">
            <div
              className="bg-black h-1 transition-all duration-1000 ease-out"
              style={{ width: "76%" }}
            ></div>
          </div>

          <p className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold">
            Resets in <span className="text-black">12 days</span>
          </p>
        </div>

        {/* User Card / Logout */}
        <div className="flex items-center justify-between bg-white rounded-md p-2 border border-[#eaeaea]">
          <div className="flex items-center gap-3 px-1.5">
            <div className="w-7 h-7 bg-[#f5f5f5] text-black border border-[#e5e5e5] flex items-center justify-center font-bold text-[11px]">
              JD
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-black leading-tight">
                John Doe
              </span>
              <span className="text-[10px] text-gray-500 truncate w-24">
                john@example.com
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 text-gray-400 hover:text-red-800 hover:bg-red-100 rounded-md transition-colors group cursor-pointer"
            title="Logout"
          >
            <MdLogout className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
