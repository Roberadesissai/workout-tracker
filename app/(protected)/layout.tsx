"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import Sidebar from "@/components/Sidebar";
import { cn } from "@/lib/utils";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!router) return;

    const checkUser = async () => {
      try {
        setIsLoading(true);
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.push("/login");
          return;
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error checking auth status:", error);
        router.push("/login");
      }
    };

    checkUser();
  }, [router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar onCollapseChange={setIsSidebarCollapsed} />
      <main
        className={cn(
          "flex-1 transition-all duration-300",
          isSidebarCollapsed ? "lg:ml-[70px]" : "lg:ml-[280px]"
        )}
      >
        <div className="p-4">{children}</div>
      </main>
    </div>
  );
}
