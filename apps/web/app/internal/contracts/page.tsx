"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ContractsRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/internal/agreements");
  }, [router]);

  return (
    <div className="flex items-center justify-center p-12 text-[#64748B] text-sm">
      Redirecting to Service Agreements...
    </div>
  );
}
