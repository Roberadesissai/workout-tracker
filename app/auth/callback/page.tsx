"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";

const DEFAULT_AVATAR = "/images/profile/Minimalist_3D_Avatar.jpg";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Error:", error.message);
        router.push("/login?error=auth");
        return;
      }

      if (!session) {
        router.push("/login");
        return;
      }

      // Check if profile exists, if not create one
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select()
        .eq("id", session.user.id)
        .single();

      if (!existingProfile) {
        const { error: profileError } = await supabase.from("profiles").insert({
          id: session.user.id,
          avatar_url: DEFAULT_AVATAR,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (profileError) {
          console.error("Error creating profile:", profileError);
        }
      }

      router.push("/");
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Completing sign in...</h2>
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  );
}
