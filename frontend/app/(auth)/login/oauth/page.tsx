"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useAuthStore from "@/store/useAuthStore";

function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (token) {
      // Access the store's state directly to manually set the auth payload
      useAuthStore.setState({
        accessToken: token,
        isAuthenticated: true,
        isLoading: false,
        isError: null,
      });
      // Redirect to dashboard natively to force a clean re-mount
      window.location.href = "/dashboard";
    } else {
      router.push("/login?error=OAuthFailed");
    }
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] text-black">
      <div className="flex flex-col items-center gap-6">
        <div className="w-8 h-8 border-[3px] border-black border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-bold tracking-widest uppercase text-gray-500">Authenticating</p>
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa] text-black">
        <div className="w-8 h-8 border-[3px] border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <OAuthCallbackContent />
    </Suspense>
  );
}
