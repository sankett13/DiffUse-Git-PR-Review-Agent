"use client";
import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import useAuthStore from "@/store/useAuthStore";

export default function SetupPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const installationId = searchParams.get("installation_id");
  const { accessToken } = useAuthStore();

  useEffect(() => {
    if (installationId && accessToken) {
      fetch("http://localhost:4000/api/github/save-installation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ installationId }),
      }).then(() => router.push("/dashboard"));
    }
  }, [installationId, accessToken]);

  return (
    <div className="flex h-screen items-center justify-center text-lg font-medium">
      Connecting your repositories...
    </div>
  );
}
