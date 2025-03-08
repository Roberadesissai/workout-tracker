"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, Home, RotateCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex-1 p-6 flex items-center justify-center">
      <Card className="max-w-md w-full p-6 space-y-6 bg-gradient-to-br from-destructive/5 via-destructive/10 to-destructive/5">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="rounded-full bg-destructive/10 p-3">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Something went wrong!
            </h1>
            <p className="text-sm text-muted-foreground">
              {error.message ||
                "An unexpected error occurred. Please try again."}
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button variant="outline" onClick={() => reset()} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Try again
          </Button>
          <Button
            variant="default"
            onClick={() => (window.location.href = "/")}
            className="gap-2"
          >
            <Home className="h-4 w-4" />
            Return Home
          </Button>
        </div>
      </Card>
    </div>
  );
}

