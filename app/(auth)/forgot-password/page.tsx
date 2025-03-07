"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/utils/supabase/client";
import Image from "next/image";
import { Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Reset link sent!", {
        description: "Check your email for the password reset link",
      });
      router.push("/login");
    } catch (error: any) {
      toast.error("Error resetting password", {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center py-10 px-4 bg-gradient-to-b from-background to-muted/20">
      <div className={cn("w-full max-w-[1000px]")}>
        <Card className="overflow-hidden rounded-xl shadow-2xl border-muted/20">
          <CardContent className="grid p-0 md:grid-cols-[45%_55%] rounded-xl">
            <form onSubmit={handleResetPassword} className="p-8 md:p-12">
              <div className="flex flex-col gap-8">
                <div className="flex flex-col items-center text-center space-y-2.5">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight">
                    Reset Your Password
                  </h1>
                  <p className="text-balance text-muted-foreground text-lg max-w-[90%]">
                    Don't worry! It happens. Please enter the email address
                    associated with your account.
                  </p>
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="email" className="text-base">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 px-4 text-base"
                  />
                </div>
                <div className="space-y-6">
                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-medium"
                    disabled={isLoading}
                  >
                    {isLoading ? "Sending Reset Link..." : "Send Reset Link"}
                  </Button>
                  <div className="text-center text-base">
                    Remember your password?{" "}
                    <Link
                      href="/login"
                      className="font-medium text-primary hover:text-primary/80 underline-offset-4 transition-colors"
                    >
                      Back to Sign in
                    </Link>
                  </div>
                </div>
              </div>
            </form>
            <div className="relative hidden md:block p-6 rounded-r-xl bg-muted/5">
              <div className="relative h-full w-full overflow-hidden rounded-xl shadow-[inset_0_0_50px_rgba(0,0,0,0.1)]">
                <Image
                  src="/images/forgot-password.jpg"
                  alt="Celesthlete Password Reset"
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-700"
                  priority={true}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="mt-8 text-balance text-center text-sm text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
          By clicking continue, you agree to our{" "}
          <Link href="/terms">Terms of Service</Link> and{" "}
          <Link href="/privacy">Privacy Policy</Link>.
        </div>
      </div>
    </div>
  );
}
