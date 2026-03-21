"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, GraduationCap, BookOpen } from "lucide-react";
import { signUp } from "@/lib/auth-client";
import { signUpSchema, type SignUpInput } from "@/lib/validations";
import { cn } from "@/lib/utils";

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { role: "STUDENT" },
  });

  const selectedRole = watch("role");

  async function onSubmit(data: SignUpInput) {
    setLoading(true);
    try {
      const result = await signUp.email({
        email: data.email,
        password: data.password,
        name: data.name,
   // @ts-expect-error — role is a custom field defined in auth config
role: data.role,
      });

      if (result.error) {
        toast.error(result.error.message ?? "Signup failed");
        return;
      }

      toast.success("Account created! Redirecting…");
      if (data.role === "TEACHER") {
        router.push("/teacher");
      } else {
        router.push("/student");
      }
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white border border-gray-200 rounded-2xl p-10 shadow-sm">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl text-[#1a1a2e] mb-1">Create account</h1>
          <p className="text-sm text-gray-500">Join Indus to manage your assignments</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Role selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              I am a…
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(["STUDENT", "TEACHER"] as const).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setValue("role", role)}
                  className={cn(
                    "flex items-center gap-2.5 p-3.5 rounded-xl border text-sm font-medium transition-all",
                    selectedRole === role
                      ? "bg-[#1a1a2e] text-white border-[#1a1a2e]"
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300"
                  )}
                >
                  {role === "STUDENT" ? (
                    <GraduationCap className="w-4 h-4" />
                  ) : (
                    <BookOpen className="w-4 h-4" />
                  )}
                  {role === "STUDENT" ? "Student" : "Teacher"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Full name
            </label>
            <input
              {...register("name")}
              type="text"
              placeholder="Your full name"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 transition-colors bg-gray-50 focus:bg-white"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email
            </label>
            <input
              {...register("email")}
              type="email"
              placeholder="you@email.com"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 transition-colors bg-gray-50 focus:bg-white"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                {...register("password")}
                type={showPassword ? "text" : "password"}
                placeholder="Min. 8 characters"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 transition-colors bg-gray-50 focus:bg-white pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1a1a2e] text-white py-3 rounded-lg text-sm font-medium hover:bg-[#16213e] transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Create account
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-[#1a1a2e] font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
