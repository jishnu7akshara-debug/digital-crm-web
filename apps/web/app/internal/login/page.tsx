"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Lock, Mail, ArrowRight, ShieldAlert, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";

export default function InternalLoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("admin@digitalfootprint.in");
  const [password, setPassword] = useState("Admin@123456!");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await login(email, password, "internal");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to log in.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#F8F8FC] px-4 select-none">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-[#25124D] flex items-center justify-center font-bold text-white text-xl shadow-md mb-3 border border-[#3F2577]">
            DF
          </div>
          <h1 className="text-2xl font-bold text-[#1D1930] tracking-tight">Staff Operations Console</h1>
          <p className="text-xs text-[#77738A] mt-1 text-center">
            Authorized Digital Footprint employees and leadership only
          </p>
        </div>

        <div className="bg-white border border-[#E9E5F0] rounded-xl p-8 shadow-sm">
          {errorMsg && (
            <div className="mb-5 p-3 rounded-md bg-rose-50 border border-rose-200 flex items-start space-x-2 text-rose-700 text-xs">
              <ShieldAlert className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#1D1930] mb-1.5">Staff Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-[#77738A]" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@digitalfootprint.in"
                  className="pl-9 text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#1D1930] mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-[#77738A]" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="pl-9 text-sm"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full mt-2 font-medium bg-[#25124D] hover:bg-[#381E6E]" isLoading={isLoading}>
              Sign In to Console <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#E9E5F0] text-xs text-[#77738A] text-center">
            Are you a client?{" "}
            <Link href="/portal/login" className="text-[#6C3BDB] font-medium hover:underline">
              Switch to Client Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
