"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { registerSchema } from "@/validations/auth.validations";
import {
  authService,
  RegisterUser,
  getApiErrorMessage,
} from "@/services/auth.service";
import { FaGithub } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/useAuthStore";
import AuthButton from "@/components/AuthButton";

export default function Register() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterUser>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterUser) => {
    setServerError(null);
    setIsSubmitting(true);

    try {
      const response = await authService.register(data);
      console.log("Registered:", response);
      // redirect or show success here
    } catch (error) {
      const message = getApiErrorMessage(error);

      // Field-level error: attaches directly under the email input
      if (message === "Email already in use") {
        setError("email", {
          type: "server",
          message, // shows under the email field
        });
      } else {
        // Generic fallback shown as a banner above the form
        setServerError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* Left panel — unchanged */}
        <div className="hidden md:flex flex-col bg-slate-900 text-slate-50 p-10">
          <p className="text-sm font-medium tracking-wide text-white mb-6">
            ReviewBot
          </p>
          <div className="mt-auto space-y-4 max-w-md">
            <h2 className="text-3xl font-semibold leading-tight">
              Ship code faster with AI-powered reviews.
            </h2>
            <p className="text-sm text-slate-300">
              Automate your PR workflow, catch bugs before they merge, and
              maintain high code quality effortlessly.
            </p>
          </div>
          <p className="mt-10 text-xs text-slate-500">
            © {new Date().getFullYear()} ReviewBot. All rights reserved.
          </p>
        </div>

        {/* Right form panel */}
        <div className="p-8 sm:p-10 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto">
            <h1 className="text-2xl font-semibold text-slate-900 mb-2">
              Create an account
            </h1>

            {/* ✅ Generic server error banner */}
            {serverError && (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {serverError}
              </div>
            )}

            {/* OAuth buttons — unchanged */}
            <div className="relative mb-3 mt-3">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-slate-400">
                  Get Started with a single click
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-3 mb-5 mt-2">
              <AuthButton
                icon={<FaGithub className="h-[18px] w-[18px]" />}
                text="Continue with GitHub"
                onClick={() =>
                  (window.location.href =
                    "http://localhost:4000/api/auth/github")
                }
              />
              <AuthButton
                icon={<FcGoogle className="h-[18px] w-[18px]" />}
                text="Continue with Google"
                onClick={() =>
                  (window.location.href =
                    "http://localhost:4000/api/auth/google")
                }
              />
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-slate-400">
                  or Enter your details to create an account
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div className="space-y-1.5">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-slate-700"
                >
                  Full name
                </label>
                <input
                  id="name"
                  type="text"
                  className="block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  {...register("name")}
                />
                <p
                  className={`text-xs h-4 ${errors.name ? "text-red-600" : "text-transparent"}`}
                >
                  {errors.name?.message ?? "placeholder"}
                </p>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-700"
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  // ✅ Red border when there's a server-side email error
                  className={`block w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 transition ${
                    errors.email
                      ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                      : "border-slate-200 focus:border-slate-900 focus:ring-slate-900"
                  }`}
                  {...register("email")}
                />
                {/* ✅ Shows "Email already in use" right under the field */}
                <p
                  className={`text-xs h-4 ${errors.email ? "text-red-600" : "text-transparent"}`}
                >
                  {errors.email?.message ?? "placeholder"}
                </p>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  className="block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  {...register("password")}
                />
                <p
                  className={`text-xs h-4 ${errors.password ? "text-red-600" : "text-transparent"}`}
                >
                  {errors.password?.message ?? "placeholder"}
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 inline-flex w-full items-center justify-center rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800 transition disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Creating account..." : "Create account"}
              </button>
            </form>

            <p className="mt-4 text-xs text-slate-500 text-center">
              Already have an account?{" "}
              <Link href="/login">
                <span className="underline cursor-pointer">Log in</span>
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
