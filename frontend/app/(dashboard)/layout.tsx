"use client";

import useAuthStore from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  useEffect(() => {
    // Optionally keep the condition just to handle client-side token expiration navigation
    const trueAuthState = useAuthStore.getState().isAuthenticated;
    if (!trueAuthState) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  return (
    <div className="flex h-screen bg-white overflow-hidden text-black font-sans selection:bg-black selection:text-white">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="p-8 h-full max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
