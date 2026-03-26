"use client";
import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import useAuthStore from "@/store/useAuthStore";
import { githubService } from "@/services/github.service";

export default function SetupPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const installationId = searchParams.get("installation_id");
  console.log(installationId);
  const { accessToken } = useAuthStore();

  useEffect(() => {
    if (installationId && accessToken) {
      githubService
        .saveInstallation(installationId)
        .then(() => router.push("/dashboard"))
        .catch((error) => console.log(error));
    }
  }, [installationId, accessToken]);

  return (
    <div className="flex h-screen items-center justify-center text-lg font-medium">
      Connecting your repositories...
    </div>
  );
}
