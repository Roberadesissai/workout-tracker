"use client";

import { useEffect, useState } from "react";
import { Home, Users, Check, X } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/utils/supabase/client";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";

interface FollowRequest {
  id: string;
  created_at: string;
  follower: {
    id: string;
    profiles: {
      full_name: string | null;
      username: string | null;
      avatar_url: string | null;
    };
  };
}

const DEFAULT_AVATAR = "/images/profile/Minimalist_3D_Avatar.jpg";

export default function FollowRequestsPage() {
  const [requests, setRequests] = useState<FollowRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFollowRequests();
  }, []);

  const fetchFollowRequests = async () => {
    try {
      setLoading(true);

      // Get current user with error handling
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError) {
        console.error("User fetch error:", userError);
        throw userError;
      }

      const user = userData.user;
      if (!user) {
        toast.error("Please log in to view follow requests");
        return;
      }

      console.log("Fetching follow requests for user:", user.id);

      // First get the follow requests
      const { data: followRequests, error: followError } = await supabase
        .from("follows")
        .select("*")
        .eq("following_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (followError) {
        console.error("Follow requests fetch error:", followError);
        throw followError;
      }

      console.log("Raw follow requests:", followRequests);

      if (!followRequests || followRequests.length === 0) {
        setRequests([]);
        return;
      }

      // Get all follower profiles in one query
      const followerIds = followRequests.map((request) => request.follower_id);
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .in("id", followerIds);

      if (profileError) {
        console.error("Profiles fetch error:", profileError);
        throw profileError;
      }

      console.log("Profiles data:", profiles);

      // Create a map of profiles for easy lookup
      const profileMap = new Map(
        profiles?.map((profile) => [profile.id, profile]) || []
      );

      // Transform the data to match our interface
      const transformedData: FollowRequest[] = followRequests.map((request) => {
        const profile = profileMap.get(request.follower_id);
        console.log("Processing request:", request, "with profile:", profile);
        return {
          id: request.id,
          created_at: request.created_at,
          follower: {
            id: request.follower_id,
            profiles: {
              full_name: profile?.full_name || null,
              username: profile?.username || null,
              avatar_url: profile?.avatar_url || null,
            },
          },
        };
      });

      console.log("Transformed data:", transformedData);
      setRequests(transformedData);
    } catch (error) {
      console.error("Detailed error in fetchFollowRequests:", error);
      toast.error("Failed to load follow requests. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (
    requestId: string,
    action: "accept" | "reject"
  ) => {
    try {
      // Get current user with error handling
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError) throw userError;
      if (!userData.user) {
        toast.error("Please log in to manage follow requests");
        return;
      }

      console.log("Processing request:", {
        requestId,
        action,
        userId: userData.user.id,
      });

      if (action === "accept") {
        // For accept, update the status
        const { data, error: updateError } = await supabase
          .from("follows")
          .update({ status: "accepted" })
          .eq("id", requestId)
          .select()
          .single();

        console.log("Update result:", { data, error: updateError });

        if (updateError) {
          console.error("Error accepting follow request:", updateError);
          throw updateError;
        }

        toast.success("Follow request accepted. They can now see your posts.");
      } else {
        // For reject, delete the record
        const { data, error: deleteError } = await supabase
          .from("follows")
          .delete()
          .eq("id", requestId)
          .select()
          .single();

        console.log("Delete result:", { data, error: deleteError });

        if (deleteError) {
          console.error("Error rejecting follow request:", deleteError);
          throw deleteError;
        }

        toast.success("Follow request rejected");
      }

      // Remove the request from the local state immediately
      setRequests((prevRequests) =>
        prevRequests.filter((request) => request.id !== requestId)
      );
    } catch (error) {
      console.error("Error handling follow request:", error);
      toast.error(
        action === "accept"
          ? "Failed to accept follow request. Please try again."
          : "Failed to reject follow request. Please try again."
      );
    }
  };

  return (
    <div className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/" className="flex items-center gap-1">
              <Home className="h-3 w-3" />
              Home
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/settings">Settings</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Follow Requests</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-xl border shadow-lg">
        <Image
          src="/images/hero/friend_request.jpg"
          alt="Follow Requests"
          fill
          className="object-cover opacity-15"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/50" />
        <div className="relative space-y-2 p-6 sm:p-8 md:p-12">
          <div className="inline-flex items-center rounded-lg bg-primary/10 px-3 py-1 text-sm font-medium backdrop-blur-sm">
            <Users className="mr-2 h-4 w-4" />
            Follow Requests
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
            Manage Your Follow Requests
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            When you accept a follow request, that person will be able to see
            your posts, workouts, and achievements. They'll be added to your
            followers list, but you won't automatically follow them back.
          </p>
        </div>
        <div className="absolute right-4 bottom-4 opacity-10">
          <Users className="h-24 w-24 text-primary" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="sticky top-0 z-10 backdrop-blur-sm bg-background/80 p-4 rounded-lg border shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                Pending Requests
              </h2>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 text-sm">
              <Users className="h-4 w-4 text-primary" />
              <span className="font-medium">{requests.length} pending</span>
            </div>
          </div>
        </div>

        {loading ? (
          <Card className="p-8">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="animate-spin">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
              </div>
              <h3 className="font-medium mb-2">Loading Requests...</h3>
            </div>
          </Card>
        ) : requests.length === 0 ? (
          <Card className="p-8">
            <div className="flex flex-col items-center justify-center text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No Pending Requests</h3>
              <p className="text-sm text-muted-foreground">
                You don&apos;t have any pending follow requests.
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {requests.map((request) => (
              <Card
                key={request.id}
                className="p-4 hover:shadow-md transition-all duration-300 group"
              >
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <Link
                    href={`/social/profile/${request.follower.id}`}
                    className="flex items-center gap-3 flex-1 min-w-[200px] hover:opacity-80 transition-opacity"
                  >
                    <Avatar className="h-12 w-12 border-2 border-primary/10 group-hover:border-primary/20 transition-colors">
                      <AvatarImage
                        src={
                          request.follower.profiles.avatar_url || DEFAULT_AVATAR
                        }
                        alt={request.follower.profiles.full_name || "User"}
                      />
                      <AvatarFallback className="text-lg">
                        {(
                          request.follower.profiles.full_name?.[0] ||
                          request.follower.profiles.username?.[0] ||
                          "U"
                        ).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium line-clamp-1">
                        {request.follower.profiles.full_name ||
                          request.follower.profiles.username ||
                          "User"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Requested{" "}
                        {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </Link>
                  <div className="flex items-center gap-2 ml-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRequest(request.id, "reject")}
                      className="gap-1 hover:bg-destructive/5 hover:text-destructive hover:border-destructive/50 transition-colors"
                    >
                      <X className="h-4 w-4" />
                      <span className="hidden sm:inline">Reject</span>
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleRequest(request.id, "accept")}
                      className="gap-1 hover:bg-primary/90 transition-colors"
                    >
                      <Check className="h-4 w-4" />
                      <span className="hidden sm:inline">Accept</span>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
