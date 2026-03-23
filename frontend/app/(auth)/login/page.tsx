"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { loginSchema } from "@/validations/auth.validations";
import { type LoginUser, getApiErrorMessage } from "@/services/auth.service";
import { FaGithub } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import Link from "next/link";
import useAuthStore from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import AuthButton from "@/components/AuthButton";

export default function LoginPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginUser>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginUser) => {
    setServerError(null);
    setIsSubmitting(true);

    try {
      await login(data);
      router.push("/dashboard");
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        "Login failed. Please try again.",
      );
      setServerError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* Left marketing panel */}
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
              Welcome back
            </h1>
            <p className="text-sm text-slate-500 mb-4">
              Log in to your account to continue
            </p>

            {serverError && (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {serverError}
              </div>
            )}

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
                  or continue with
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
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
                  className={`block w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 transition ${
                    errors.email
                      ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                      : "border-slate-200 focus:border-slate-900 focus:ring-slate-900"
                  }`}
                  {...register("email")}
                />
                <p
                  className={`text-xs h-4 ${
                    errors.email ? "text-red-600" : "text-transparent"
                  }`}
                >
                  {errors.email?.message ?? "placeholder"}
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    className="text-xs font-medium text-slate-500 hover:text-slate-700"
                    onClick={() => console.log("Forgot password clicked")}
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  className={`block w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 transition ${
                    errors.password
                      ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                      : "border-slate-200 focus:border-slate-900 focus:ring-slate-900"
                  }`}
                  {...register("password")}
                />
                <p
                  className={`text-xs h-4 ${
                    errors.password ? "text-red-600" : "text-transparent"
                  }`}
                >
                  {errors.password?.message ?? "placeholder"}
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 inline-flex w-full items-center justify-center rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800 transition disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Logging in..." : "Log in"}
              </button>
            </form>

            <p className="mt-6 text-xs text-slate-500 text-center">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
