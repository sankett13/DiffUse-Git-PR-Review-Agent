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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      // By reading directly from the store state on the client,
      // we avoid React's SSR default snapshot causing an accidental redirect
      const trueAuthState = useAuthStore.getState().isAuthenticated;
      if (!trueAuthState) {
        router.push("/login");
      }
    }
  }, [mounted, isAuthenticated, router]);

  // Prevent hydration styling mismatch and Next.js router cache breaking 
  // by returning a loader instead of `null`.
  if (!mounted || !useAuthStore.getState().isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-white text-black">
        <div className="w-8 h-8 border-[3px] border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden text-black font-sans selection:bg-black selection:text-white">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="p-8 h-full max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
