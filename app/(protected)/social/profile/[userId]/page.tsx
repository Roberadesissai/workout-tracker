"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  Home,
  Users,
  UserPlus,
  UserMinus,
  MessageSquare,
  Dumbbell,
  Trophy,
  Target,
  Settings,
  Camera,
  Grid,
  LayoutList,
  Activity,
  Timer,
  Pencil,
  Lock,
  Clock,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/utils/supabase/client";
import { toast } from "sonner";
import Post from "../../components/post";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import Link from "next/link";
import { generateOrImproveBio } from "@/utils/ai-client";

interface UserProfile {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  bio: string | null;
  workout_count: number;
  following_count: number;
  followers_count: number;
  achievements_count: number;
  personal_records: number;
  location?: string;
  fitness_level?: string;
  preferred_workout?: string;
  joined_date?: string;
  email: string | null;
  is_profile_private: boolean;
}

interface FollowUser {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_profile_private: boolean;
  status: "pending" | "accepted" | "rejected";
}

interface FollowerResponse {
  follower: {
    id: string;
    profiles: {
      full_name: string | null;
      username: string | null;
      avatar_url: string | null;
      bio: string | null;
      is_profile_private: boolean;
    }[];
  };
}

interface FollowingResponse {
  following: {
    id: string;
    profiles: {
      full_name: string | null;
      username: string | null;
      avatar_url: string | null;
      bio: string | null;
      is_profile_private: boolean;
    }[];
  };
  status: "pending" | "accepted" | "rejected";
}

interface Post {
  id: string;
  content: string;
  media_urls?: string[];
  created_at: string;
  user: {
    id: string;
    profiles: {
      full_name: string;
      avatar_url: string;
    };
  };
  reactions: {
    user: {
      profiles: {
        full_name: string;
      };
    };
  }[];
  comments: {
    id: string;
  }[];
  tags?: string[];
  image_url: string;
}

interface PostData {
  id: string;
  user_id: string;
  content: string;
  media_urls?: string[];
  tags?: string[];
  workout_id?: string;
  achievement_id?: string;
  created_at: string;
  updated_at: string;
  reposted_from?: {
    post_id: string;
    user_id: string;
    user_name: string;
  };
  user?: {
    id: string;
    email: string;
    avatar_url: string;
  };
  reactions?: {
    user_id: string;
    reaction_type: string;
  }[];
  comments?: {
    id: string;
  }[];
}

interface Workout {
  id: string;
  program_id: string;
  program_name: string;
  completed_at: string;
  duration: number;
  exercises_completed: number;
  total_exercises: number;
  notes: string | null;
}

interface FollowStatus {
  status: "pending" | "accepted" | "rejected";
  id: string;
}

const DEFAULT_AVATAR = "/images/profile/Minimalist_3D_Avatar.jpg";

export default function ProfilePage() {
  const { userId } = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedTab, setSelectedTab] = useState("posts");
  const [imageLoading, setImageLoading] = useState(true);
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
  const [followStatus, setFollowStatus] = useState<FollowStatus | null>(null);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [followersLoading, setFollowersLoading] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);

  const updateAllProfilesWithDefaultAvatar = async () => {
    try {
      // First, get all profiles without avatars
      const { data: profiles, error: fetchError } = await supabase
        .from("profiles")
        .select("id")
        .or("avatar_url.is.null,avatar_url.eq.");

      if (fetchError) throw fetchError;

      if (profiles && profiles.length > 0) {
        // Update all profiles without avatars
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            avatar_url: DEFAULT_AVATAR,
            updated_at: new Date().toISOString(),
          })
          .or("avatar_url.is.null,avatar_url.eq.");

        if (updateError) throw updateError;
        console.log(`Updated ${profiles.length} profiles with default avatar`);
      }
    } catch (error) {
      console.error("Error updating profiles with default avatar:", error);
    }
  };

  useEffect(() => {
    updateAllProfilesWithDefaultAvatar();
    fetchProfileData();
  }, [userId]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);

      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;

      // Transform User to UserProfile type
      if (user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        setCurrentUser(
          profileData || {
            id: user.id,
            full_name: null,
            username: null,
            avatar_url: null,
            cover_url: null,
            bio: null,
            email: user.email,
            is_profile_private: false,
            workout_count: 0,
            following_count: 0,
            followers_count: 0,
            achievements_count: 0,
            personal_records: 0,
          }
        );

        // Check follow status with proper error handling
        const { data: followData, error: followError } = await supabase
          .from("follows")
          .select("id, status")
          .eq("follower_id", user.id)
          .eq("following_id", userId)
          .single();

        if (followError && followError.code !== "PGRST116") {
          console.error("Error checking follow status:", followError);
        } else if (followData) {
          setFollowStatus({
            status: followData.status,
            id: followData.id,
          });
          setIsFollowing(followData.status === "accepted");
        }
      }

      if (!userId) {
        toast.error("Invalid profile URL");
        return;
      }

      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        console.error("Error fetching profile:", profileError);
        toast.error("Failed to load profile");
        return;
      }

      let finalProfileData = profileData;

      if (!profileData) {
        // If no profile exists, create one with default avatar
        const { data: newProfile, error: createError } = await supabase
          .from("profiles")
          .insert({
            id: userId,
            avatar_url: DEFAULT_AVATAR,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (createError) throw createError;
        finalProfileData = newProfile;
      } else if (
        !profileData.avatar_url ||
        profileData.avatar_url.trim() === ""
      ) {
        // If profile exists but no avatar, set default
        const { data: updatedProfile, error: updateError } = await supabase
          .from("profiles")
          .update({
            avatar_url: DEFAULT_AVATAR,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId)
          .select()
          .single();

        if (updateError) throw updateError;
        finalProfileData = updatedProfile;
      }

      // Ensure avatar_url is never null/undefined in the profile data
      if (
        finalProfileData &&
        (!finalProfileData.avatar_url ||
          finalProfileData.avatar_url.trim() === "")
      ) {
        finalProfileData.avatar_url = DEFAULT_AVATAR;
      }

      // Get counts with error handling
      const [
        workoutResult,
        followingResult,
        followersResult,
        achievementsResult,
        personalRecordsResult,
      ] = await Promise.all([
        supabase
          .from("workout_logs")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId),
        supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("follower_id", userId),
        supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("following_id", userId),
        supabase
          .from("achievements")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId),
        supabase
          .from("personal_records")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId),
      ]);

      // Update the profile state with the data
      if (finalProfileData) {
        setProfile({
          ...finalProfileData,
          avatar_url: finalProfileData.avatar_url || DEFAULT_AVATAR, // Ensure default avatar is used
          workout_count: workoutResult.count || 0,
          following_count: followingResult.count || 0,
          followers_count: followersResult.count || 0,
          achievements_count: achievementsResult.count || 0,
          personal_records: personalRecordsResult.count || 0,
        });
      }

      // Fetch user's posts with proper error handling
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select(
          `
          *,
          user:profiles!posts_user_id_fkey (
            id,
            full_name,
            avatar_url,
            email
          ),
          reactions (
            id,
            user_id,
            reaction_type
          ),
          comments (
            id
          )
        `
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (postsError) {
        throw postsError;
      }

      if (postsData) {
        const transformedPosts: Post[] = postsData.map((post: PostData) => ({
          id: post.id,
          content: post.content,
          media_urls: post.media_urls || [],
          created_at: post.created_at,
          image_url: post.media_urls?.[0] || "",
          user: {
            id: post.user?.id || "",
            profiles: {
              full_name: post.user?.email?.split("@")[0] || "User",
              avatar_url: post.user?.avatar_url || DEFAULT_AVATAR,
            },
          },
          reactions: (post.reactions || []).map((reaction) => ({
            user: {
              profiles: {
                full_name: reaction.user_id || "",
              },
            },
          })),
          comments: post.comments || [],
          tags: post.tags || [],
        }));

        setPosts(transformedPosts);
      } else {
        setPosts([]);
      }

      // Fetch user's workout history
      const { data: workoutsData, error: workoutsError } = await supabase
        .from("workout_history")
        .select(
          `
          *,
          program:workout_programs(
            name
          )
        `
        )
        .eq("user_id", userId)
        .order("completed_at", { ascending: false });

      if (workoutsError) {
        console.error("Error fetching workouts:", workoutsError);
        toast.error("Failed to load workout history");
        return;
      }

      if (workoutsData) {
        const transformedWorkouts = workoutsData.map((workout) => ({
          id: workout.id,
          program_id: workout.program_id,
          program_name: workout.program?.name || "Unknown Program",
          completed_at: workout.completed_at,
          duration: workout.duration,
          exercises_completed: workout.exercises_completed,
          total_exercises: workout.total_exercises,
          notes: workout.notes,
        }));

        setWorkouts(transformedWorkouts);
      } else {
        setWorkouts([]);
      }

      // Fetch pending requests count
      const { count: pendingCount, error: pendingRequestsError } =
        await supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("following_id", userId)
          .eq("status", "pending");

      if (pendingRequestsError && pendingRequestsError.code !== "PGRST116") {
        console.error("Error fetching pending requests:", pendingRequestsError);
      } else {
        setPendingRequestsCount(pendingCount || 0);
      }

      // Fetch unread messages count
      const { count: unreadCount, error: unreadMessagesError } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("recipient_id", userId)
        .eq("is_read", false);

      if (unreadMessagesError && unreadMessagesError.code !== "PGRST116") {
        console.error("Error fetching unread messages:", unreadMessagesError);
      } else {
        setUnreadMessagesCount(unreadCount || 0);
      }
    } catch (error) {
      console.error("Error in fetchProfileData:", error);
      toast.error("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      if (!currentUser) {
        toast.error("Please log in to follow users");
        return;
      }

      // If there's a pending request and user clicks again, cancel it
      if (followStatus?.status === "pending") {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("id", followStatus.id);

        if (error) throw error;
        setIsFollowing(false);
        setFollowStatus(null);
        toast.success("Follow request cancelled");
        fetchProfileData();
        return;
      }

      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUser.id)
          .eq("following_id", userId);

        if (error) throw error;
        setIsFollowing(false);
        setFollowStatus(null);
        toast.success("Unfollowed successfully");
      } else {
        // Follow or send follow request
        const status = profile?.is_profile_private ? "pending" : "accepted";
        const { data, error } = await supabase
          .from("follows")
          .insert({
            follower_id: currentUser.id,
            following_id: userId,
            status,
          })
          .select()
          .single();

        if (error) throw error;

        if (status === "pending") {
          setFollowStatus({ status: "pending", id: data.id });
          toast.success("Follow request sent");
        } else {
          setIsFollowing(true);
          setFollowStatus({ status: "accepted", id: data.id });
          toast.success("Following successfully");
        }
      }

      // Refresh profile data to update counts
      fetchProfileData();
    } catch (error) {
      console.error("Error updating follow status:", error);
      toast.error("Failed to update follow status");
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || !e.target.files[0]) return;
      const file = e.target.files[0];

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }

      // Check file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }

      // First, try to remove any existing avatar file
      try {
        const { data: existingFiles } = await supabase.storage
          .from("profile_pictures")
          .list(`avatars`);

        const existingAvatar = existingFiles?.find((f) =>
          f.name.startsWith(`${userId}`)
        );
        if (existingAvatar) {
          await supabase.storage
            .from("profile_pictures")
            .remove([`avatars/${existingAvatar.name}`]);
        }
      } catch (removeError) {
        console.log("Error removing existing avatar:", removeError);
      }

      // Create new filename with timestamp to avoid cache issues
      const fileExt = file.type.split("/")[1];
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage with public access
      const { error: uploadError, data } = await supabase.storage
        .from("profile_pictures")
        .upload(filePath, file, {
          cacheControl: "0",
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
      }

      if (!data) {
        throw new Error("Upload failed - no data returned");
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("profile_pictures").getPublicUrl(filePath);

      if (!publicUrl) {
        throw new Error("Failed to get public URL");
      }

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (updateError) {
        console.error("Profile update error:", updateError);
        throw updateError;
      }

      // Refresh profile data
      await fetchProfileData();
      toast.success("Profile picture updated successfully");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update profile picture"
      );
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || !e.target.files[0]) return;
      const file = e.target.files[0];

      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }

      // Check file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }

      // First, try to remove any existing cover file
      try {
        const { data: existingFiles } = await supabase.storage
          .from("profile_pictures")
          .list(`covers`);

        const existingCover = existingFiles?.find((f) =>
          f.name.startsWith(`cover-${userId}`)
        );
        if (existingCover) {
          await supabase.storage
            .from("profile_pictures")
            .remove([`covers/${existingCover.name}`]);
        }
      } catch {
        console.log("No existing cover to remove");
      }

      // Create new filename with timestamp
      const fileExt = file.type.split("/")[1];
      const fileName = `cover-${userId}-${Date.now()}.${fileExt}`;
      const filePath = `covers/${fileName}`;

      // Upload to Supabase Storage with public access
      const { error: uploadError, data } = await supabase.storage
        .from("profile_pictures")
        .upload(filePath, file, {
          cacheControl: "0",
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
      }

      if (!data) {
        throw new Error("Upload failed - no data returned");
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("profile_pictures").getPublicUrl(filePath);

      if (!publicUrl) {
        throw new Error("Failed to get public URL");
      }

      // Update profile with new cover URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          cover_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (updateError) {
        console.error("Profile update error:", updateError);
        throw updateError;
      }

      // Refresh profile data
      await fetchProfileData();
      toast.success("Cover photo updated successfully");
    } catch (error) {
      console.error("Error uploading cover photo:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update cover photo"
      );
    }
  };

  const handleBioGeneration = async () => {
    try {
      setIsGeneratingBio(true);
      const currentBio = profile?.bio || "";
      const generatedBio = await generateOrImproveBio(currentBio);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          bio: generatedBio,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (updateError) throw updateError;

      await fetchProfileData();
      toast.success("Bio updated successfully");
    } catch (error) {
      console.error("Error updating bio:", error);
      toast.error("Failed to update bio");
    } finally {
      setIsGeneratingBio(false);
    }
  };

  const canViewPrivateContent = () => {
    if (!profile?.is_profile_private) return true;
    if (currentUser?.id === userId) return true;
    return isFollowing && followStatus?.status === "accepted";
  };

  const handleMessageClick = () => {
    router.push(`/messages?userId=${userId}`);
  };

  const fetchFollowers = async () => {
    try {
      setFollowersLoading(true);
      const { data, error } = await supabase
        .from("follows")
        .select(
          `
          follower:follower_id(
            id,
            profiles!inner(
              full_name,
              username,
              avatar_url,
              bio,
              is_profile_private
            )
          )
        `
        )
        .eq("following_id", userId)
        .eq("status", "accepted");

      if (error) throw error;

      if (data) {
        const transformedFollowers: FollowUser[] = data.map((item) => ({
          id: (item.follower as any).id,
          full_name: (item.follower as any).profiles[0].full_name,
          username: (item.follower as any).profiles[0].username,
          avatar_url:
            (item.follower as any).profiles[0].avatar_url || DEFAULT_AVATAR,
          bio: (item.follower as any).profiles[0].bio,
          is_profile_private: (item.follower as any).profiles[0]
            .is_profile_private,
          status: "accepted",
        }));
        setFollowers(transformedFollowers);
      }
    } catch (error) {
      console.error("Error fetching followers:", error);
      toast.error("Failed to load followers");
    } finally {
      setFollowersLoading(false);
    }
  };

  const fetchFollowing = async () => {
    try {
      setFollowingLoading(true);
      const { data, error } = await supabase
        .from("follows")
        .select(
          `
          following:following_id(
            id,
            profiles!inner(
              full_name,
              username,
              avatar_url,
              bio,
              is_profile_private
            )
          ),
          status
        `
        )
        .eq("follower_id", userId);

      if (error) throw error;

      if (data) {
        const transformedFollowing: FollowUser[] = data.map((item) => ({
          id: (item.following as any).id,
          full_name: (item.following as any).profiles[0].full_name,
          username: (item.following as any).profiles[0].username,
          avatar_url:
            (item.following as any).profiles[0].avatar_url || DEFAULT_AVATAR,
          bio: (item.following as any).profiles[0].bio,
          is_profile_private: (item.following as any).profiles[0]
            .is_profile_private,
          status: item.status,
        }));
        setFollowing(transformedFollowing);
      }
    } catch (error) {
      console.error("Error fetching following:", error);
      toast.error("Failed to load following");
    } finally {
      setFollowingLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTab === "followers") {
      fetchFollowers();
    } else if (selectedTab === "following") {
      fetchFollowing();
    }
  }, [selectedTab, userId]);

  if (!profile) {
    return (
      <div className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Breadcrumb - Always visible */}
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
              <BreadcrumbLink href="/social">Social</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Loading Profile...</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Hero Section - Always visible with loading state */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5"
        >
          <div className="absolute inset-0 bg-grid-white/10" />
          {/* Cover Image */}
          <div className="relative h-32 sm:h-48 lg:h-64 w-full overflow-hidden">
            <Image
              src="/images/hero/Profile_thumbnail1.jpg"
              alt="Default Cover"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/50 to-transparent" />
          </div>

          {/* Profile Content */}
          <div className="relative px-4 sm:px-6 lg:px-8 pb-4 -mt-16 sm:-mt-20 lg:-mt-24">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6">
              {/* Avatar */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative"
              >
                <div className="rounded-full p-1 bg-background shadow-2xl">
                  <Avatar className="h-28 w-28 sm:h-32 sm:w-32 lg:h-40 lg:w-40 ring-4 ring-background">
                    <AvatarImage
                      src={DEFAULT_AVATAR}
                      alt="Profile"
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-primary/5 text-2xl">
                      U
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-green-500 ring-4 ring-background" />
              </motion.div>

              <div className="flex-1 text-center sm:text-left space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
                      Loading Profile...
                    </h1>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Loading State for Database Content */}
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="animate-spin">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
            </div>
            <h3 className="font-medium mb-2">Loading Profile Data...</h3>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Breadcrumb */}
      <Breadcrumb className="hidden sm:block">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/" className="flex items-center gap-1">
              <Home className="h-3 w-3" />
              Home
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/social">Social</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              {profile?.full_name || "User Profile"}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Enhanced Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5"
      >
        <div className="absolute inset-0 bg-grid-white/10" />
        {/* Cover Image with blur overlay for private accounts */}
        <div className="relative h-24 sm:h-32 md:h-48 lg:h-64 w-full overflow-hidden">
          {profile?.cover_url ? (
            <div
              className={cn(
                "relative w-full h-full",
                !canViewPrivateContent() && "blur-xl"
              )}
            >
              <Image
                src={profile.cover_url}
                alt="Cover"
                fill
                className="object-cover"
                priority
              />
            </div>
          ) : (
            <div
              className={cn(
                "relative w-full h-full",
                !canViewPrivateContent() && "blur-xl"
              )}
            >
              <Image
                src="/images/hero/Profile_thumbnail1.jpg"
                alt="Default Cover"
                fill
                className="object-cover"
                priority
              />
            </div>
          )}
          {currentUser?.id === userId && (
            <label className="absolute top-2 right-2 sm:top-4 sm:right-4">
              <Button
                variant="outline"
                size="sm"
                className="bg-background/80 backdrop-blur-sm cursor-pointer"
                asChild
              >
                <div>
                  <Camera className="h-4 w-4 mr-2" />
                  Change Cover
                  <input
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/png"
                    onChange={handleCoverUpload}
                  />
                </div>
              </Button>
            </label>
          )}
        </div>

        {/* Profile Content */}
        <div className="relative px-3 sm:px-6 lg:px-8 pb-4 -mt-12 sm:-mt-16 md:-mt-20 lg:-mt-24">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-3 sm:gap-6">
            {/* Avatar with blur for private accounts */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative"
            >
              <div className="rounded-full p-0.5 sm:p-1 bg-background shadow-2xl">
                <div
                  className={cn(
                    "relative group rounded-full overflow-hidden",
                    !canViewPrivateContent() && "blur-lg"
                  )}
                >
                  <Avatar className="h-20 w-20 sm:h-28 sm:w-28 md:h-32 md:w-32 lg:h-40 lg:w-40 ring-2 sm:ring-4 ring-background">
                    <AvatarImage
                      src={profile?.avatar_url || DEFAULT_AVATAR}
                      alt={profile?.full_name || "Profile"}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-primary/5 text-2xl">
                      {profile?.full_name?.[0] || profile?.username?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  {currentUser?.id === userId && (
                    <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 cursor-pointer transition-all">
                      <Camera className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                      />
                    </label>
                  )}
                </div>
              </div>
            </motion.div>

            <div className="flex-1 text-center sm:text-left space-y-1 sm:space-y-2">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4"
              >
                <div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">
                    {profile?.full_name || profile?.username || "User"}
                  </h1>
                  {profile?.username && profile?.full_name && (
                    <p className="text-muted-foreground">@{profile.username}</p>
                  )}
                  {profile?.location && (
                    <p className="text-muted-foreground flex items-center justify-center sm:justify-start gap-1 mt-1 text-sm sm:text-base">
                      <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                      {profile.location}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-center sm:justify-end gap-2">
                  {currentUser?.id === userId ? (
                    <Link
                      href="/settings/profile"
                      className="inline-flex items-center justify-center gap-2 h-8 sm:h-10 px-4 rounded-md bg-background text-foreground border border-input hover:bg-accent hover:text-accent-foreground"
                    >
                      <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                      Edit Profile
                    </Link>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button
                        className="gap-2 h-8 sm:h-10 min-w-[100px] sm:min-w-[120px]"
                        variant={isFollowing ? "outline" : "default"}
                        onClick={handleFollow}
                      >
                        {isFollowing ? (
                          <>
                            <UserMinus className="h-3 w-3 sm:h-4 sm:w-4" />
                            Unfollow
                          </>
                        ) : followStatus?.status === "pending" ? (
                          <>
                            <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                            Requested
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-3 w-3 sm:h-4 sm:w-4" />
                            {profile?.is_profile_private ? "Request" : "Follow"}
                          </>
                        )}
                      </Button>
                      {isFollowing && (
                        <Button
                          onClick={handleMessageClick}
                          variant="outline"
                          className="gap-2 h-8 sm:h-10"
                        >
                          <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
                          Message
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Bio section */}
              {(profile?.bio || canViewPrivateContent()) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-2 sm:mt-4 text-sm sm:text-base text-muted-foreground max-w-2xl relative group"
                >
                  <p>{profile?.bio || "No bio added yet"}</p>
                  {currentUser?.id === userId && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute -right-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={handleBioGeneration}
                      disabled={isGeneratingBio}
                    >
                      {isGeneratingBio ? (
                        <div className="animate-spin">⚪</div>
                      ) : (
                        <Pencil className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Private Account Message */}
      {profile?.is_profile_private && !canViewPrivateContent() && (
        <Card className="p-8 bg-background/95 backdrop-blur border-2 border-primary/10">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="h-10 w-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Private Account</h2>
              <p className="text-muted-foreground max-w-md">
                This account is private. Follow this user to see their photos,
                videos, workouts, and other content.
              </p>
            </div>
            <Button onClick={handleFollow} size="lg" className="gap-2">
              <UserPlus className="h-5 w-5" />
              Follow to See Content
            </Button>
          </div>
        </Card>
      )}

      {/* Only show content if user can view private content */}
      {canViewPrivateContent() && (
        <>
          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 sm:gap-4"
          >
            {/* Workouts Card */}
            <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                      Workouts
                    </p>
                    <div className="rounded-full bg-emerald-500/10 p-1.5 sm:p-2">
                      <Dumbbell className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-500" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <p className="text-xl sm:text-2xl font-bold">
                      {profile?.workout_count || 0}
                    </p>
                    <span className="text-[10px] sm:text-xs text-muted-foreground">
                      completed
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Following Card */}
            <Link
              href={`/social/profile/${userId}?tab=following`}
              className="block"
            >
              <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-cyan-500/5 via-cyan-500/10 to-cyan-500/5 hover:border-cyan-500/50">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                        Following
                      </p>
                      <div className="rounded-full bg-cyan-500/10 p-1.5 sm:p-2">
                        <Users className="h-3 w-3 sm:h-4 sm:w-4 text-cyan-500" />
                      </div>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <p className="text-xl sm:text-2xl font-bold text-cyan-500">
                        {profile?.following_count || 0}
                      </p>
                      <span className="text-[10px] sm:text-xs text-muted-foreground">
                        athletes
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Followers Card */}
            <Link
              href={`/social/profile/${userId}?tab=followers`}
              className="block"
            >
              <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-indigo-500/5 via-indigo-500/10 to-indigo-500/5 hover:border-indigo-500/50">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                        Followers
                      </p>
                      <div className="rounded-full bg-indigo-500/10 p-1.5 sm:p-2">
                        <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 text-indigo-500" />
                      </div>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <p className="text-xl sm:text-2xl font-bold text-indigo-500">
                        {profile?.followers_count || 0}
                      </p>
                      <span className="text-[10px] sm:text-xs text-muted-foreground">
                        fans
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Achievements Card */}
            <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-amber-500/5 via-amber-500/10 to-amber-500/5 hover:border-amber-500/50">
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                      Achievements
                    </p>
                    <div className="rounded-full bg-amber-500/10 p-1.5 sm:p-2">
                      <Trophy className="h-3 w-3 sm:h-4 sm:w-4 text-amber-500" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <p className="text-xl sm:text-2xl font-bold text-amber-500">
                      {profile?.achievements_count || 0}
                    </p>
                    <span className="text-[10px] sm:text-xs text-muted-foreground">
                      earned
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {currentUser?.id === userId && (
              <>
                {/* Follow Requests Card */}
                <Link href="/settings/follow-requests" className="block">
                  <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-blue-500/5 via-blue-500/10 to-blue-500/5 hover:border-blue-500/50">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                            Requests
                          </p>
                          <div className="rounded-full bg-blue-500/10 p-1.5 sm:p-2">
                            <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                          </div>
                          {pendingRequestsCount > 0 && (
                            <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] font-medium text-white">
                              {pendingRequestsCount}
                            </span>
                          )}
                        </div>
                        <div className="flex items-baseline gap-1">
                          <p className="text-xl sm:text-2xl font-bold text-blue-500">
                            {pendingRequestsCount || 0}
                          </p>
                          <span className="text-[10px] sm:text-xs text-muted-foreground">
                            pending
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                {/* Messages Card */}
                <Link href="/messages" className="block">
                  <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-violet-500/5 via-violet-500/10 to-violet-500/5 hover:border-violet-500/50">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                            Messages
                          </p>
                          <div className="rounded-full bg-violet-500/10 p-1.5 sm:p-2">
                            <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 text-violet-500" />
                          </div>
                          {unreadMessagesCount > 0 && (
                            <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-violet-500 text-[10px] font-medium text-white">
                              {unreadMessagesCount}
                            </span>
                          )}
                        </div>
                        <div className="flex items-baseline gap-1">
                          <p className="text-xl sm:text-2xl font-bold text-violet-500">
                            {unreadMessagesCount || 0}
                          </p>
                          <span className="text-[10px] sm:text-xs text-muted-foreground">
                            unread
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </>
            )}
          </motion.div>

          {/* Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap gap-1 sm:gap-2 mt-2 sm:mt-6"
          >
            {profile?.fitness_level && (
              <Badge
                variant="secondary"
                className="gap-1 px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm"
              >
                <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
                {profile.fitness_level}
              </Badge>
            )}
            {profile?.preferred_workout && (
              <Badge
                variant="secondary"
                className="gap-1 px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm"
              >
                <Dumbbell className="h-3 w-3 sm:h-4 sm:w-4" />
                {profile.preferred_workout}
              </Badge>
            )}
            {profile?.joined_date && (
              <Badge
                variant="secondary"
                className="gap-1 px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm"
              >
                <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                Joined {new Date(profile.joined_date).toLocaleDateString()}
              </Badge>
            )}
          </motion.div>

          {/* Content Tabs */}
          <Tabs
            value={selectedTab}
            onValueChange={setSelectedTab}
            className="space-y-4"
          >
            <div className="flex flex-col gap-4">
              {/* View Mode Toggle - Always at top */}
              {selectedTab === "posts" && (
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className={cn(
                      "h-8 w-8 p-0",
                      viewMode === "grid" && "bg-primary/10 text-primary"
                    )}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className={cn(
                      "h-8 w-8 p-0",
                      viewMode === "list" && "bg-primary/10 text-primary"
                    )}
                  >
                    <LayoutList className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Single Row Tabs Navigation */}
              <TabsList className="h-10 p-1 flex w-full bg-muted">
                <TabsTrigger
                  value="posts"
                  className="flex-1 flex items-center justify-center gap-2 px-2 sm:px-4 min-w-[70px] data-[state=active]:bg-primary/10"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span className="hidden sm:inline">Posts</span>
                </TabsTrigger>
                <TabsTrigger
                  value="workouts"
                  className="flex-1 flex items-center justify-center gap-2 px-2 sm:px-4 min-w-[70px] data-[state=active]:bg-primary/10"
                >
                  <Dumbbell className="h-4 w-4" />
                  <span className="hidden sm:inline">Workouts</span>
                </TabsTrigger>
                <TabsTrigger
                  value="followers"
                  className="flex-1 flex items-center justify-center gap-2 px-2 sm:px-4 min-w-[70px] data-[state=active]:bg-primary/10"
                >
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Followers</span>
                </TabsTrigger>
                <TabsTrigger
                  value="following"
                  className="flex-1 flex items-center justify-center gap-2 px-2 sm:px-4 min-w-[70px] data-[state=active]:bg-primary/10"
                >
                  <UserPlus className="h-4 w-4" />
                  <span className="hidden sm:inline">Following</span>
                </TabsTrigger>
                <TabsTrigger
                  value="achievements"
                  className="flex-1 flex items-center justify-center gap-2 px-2 sm:px-4 min-w-[70px] data-[state=active]:bg-primary/10"
                >
                  <Trophy className="h-4 w-4" />
                  <span className="hidden sm:inline">Achievements</span>
                </TabsTrigger>
                <TabsTrigger
                  value="goals"
                  className="flex-1 flex items-center justify-center gap-2 px-2 sm:px-4 min-w-[70px] data-[state=active]:bg-primary/10"
                >
                  <Target className="h-4 w-4" />
                  <span className="hidden sm:inline">Goals</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="followers">
              {loading || followersLoading ? (
                <Card className="p-8">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="animate-spin">
                      <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    </div>
                    <h3 className="font-medium mb-2">Loading Followers...</h3>
                  </div>
                </Card>
              ) : !canViewPrivateContent() ? (
                <Card className="p-8">
                  <div className="flex flex-col items-center justify-center text-center">
                    <Lock className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-medium mb-2">Private Account</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Follow this account to see their followers
                    </p>
                    <Button onClick={handleFollow} className="gap-2">
                      <UserPlus className="h-4 w-4" />
                      Follow to See Followers
                    </Button>
                  </div>
                </Card>
              ) : followers.length === 0 ? (
                <Card className="p-8">
                  <div className="flex flex-col items-center justify-center text-center">
                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-medium mb-2">No Followers Yet</h3>
                    <p className="text-sm text-muted-foreground">
                      This user doesn&apos;t have any followers yet.
                    </p>
                  </div>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {followers.map((follower) => (
                    <Card
                      key={follower.id}
                      className="overflow-hidden hover:shadow-lg transition-all duration-300"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <Link href={`/social/profile/${follower.id}`}>
                            <Avatar className="h-12 w-12 ring-2 ring-background">
                              <AvatarImage
                                src={follower.avatar_url || DEFAULT_AVATAR}
                                alt={follower.full_name || "User"}
                              />
                              <AvatarFallback>
                                {(follower.full_name?.[0] || "U").toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </Link>
                          <div className="flex-1 space-y-1">
                            <Link
                              href={`/social/profile/${follower.id}`}
                              className="hover:underline"
                            >
                              <h4 className="font-medium">
                                {follower.full_name || "User"}
                              </h4>
                            </Link>
                            {follower.username && (
                              <p className="text-sm text-muted-foreground">
                                @{follower.username}
                              </p>
                            )}
                            {follower.bio && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {follower.bio}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="following">
              {loading || followingLoading ? (
                <Card className="p-8">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="animate-spin">
                      <UserPlus className="h-12 w-12 text-muted-foreground mb-4" />
                    </div>
                    <h3 className="font-medium mb-2">Loading Following...</h3>
                  </div>
                </Card>
              ) : !canViewPrivateContent() ? (
                <Card className="p-8">
                  <div className="flex flex-col items-center justify-center text-center">
                    <Lock className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-medium mb-2">Private Account</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Follow this account to see who they follow
                    </p>
                    <Button onClick={handleFollow} className="gap-2">
                      <UserPlus className="h-4 w-4" />
                      Follow to See Following
                    </Button>
                  </div>
                </Card>
              ) : following.length === 0 ? (
                <Card className="p-8">
                  <div className="flex flex-col items-center justify-center text-center">
                    <UserPlus className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-medium mb-2">Not Following Anyone</h3>
                    <p className="text-sm text-muted-foreground">
                      This user isn&apos;t following anyone yet.
                    </p>
                  </div>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {following.map((follow) => (
                    <Card
                      key={follow.id}
                      className="overflow-hidden hover:shadow-lg transition-all duration-300"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <Link href={`/social/profile/${follow.id}`}>
                            <Avatar className="h-12 w-12 ring-2 ring-background">
                              <AvatarImage
                                src={follow.avatar_url || DEFAULT_AVATAR}
                                alt={follow.full_name || "User"}
                              />
                              <AvatarFallback>
                                {(follow.full_name?.[0] || "U").toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </Link>
                          <div className="flex-1 space-y-1">
                            <Link
                              href={`/social/profile/${follow.id}`}
                              className="hover:underline"
                            >
                              <h4 className="font-medium">
                                {follow.full_name || "User"}
                              </h4>
                            </Link>
                            {follow.username && (
                              <p className="text-sm text-muted-foreground">
                                @{follow.username}
                              </p>
                            )}
                            {follow.bio && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {follow.bio}
                              </p>
                            )}
                            {follow.status === "pending" && (
                              <Badge variant="secondary" className="mt-2">
                                Request Pending
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="posts">
              {loading ? (
                <Card className="p-8">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="animate-spin">
                      <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                    </div>
                    <h3 className="font-medium mb-2">Loading Posts...</h3>
                  </div>
                </Card>
              ) : !canViewPrivateContent() ? (
                <Card className="p-8">
                  <div className="flex flex-col items-center justify-center text-center">
                    <Lock className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-medium mb-2">Private Account</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Follow this account to see their posts and activities
                    </p>
                    <Button onClick={handleFollow} className="gap-2">
                      <UserPlus className="h-4 w-4" />
                      Follow to See Content
                    </Button>
                  </div>
                </Card>
              ) : posts.length === 0 ? (
                <Card className="p-8">
                  <div className="flex flex-col items-center justify-center text-center">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-medium mb-2">No Posts Yet</h3>
                    <p className="text-sm text-muted-foreground">
                      This user hasn&apos;t shared any posts yet.
                    </p>
                  </div>
                </Card>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
                  {posts.map((post) => (
                    <Card
                      key={post.id}
                      className="overflow-hidden group cursor-pointer hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-card to-card/50 border-border/50"
                    >
                      {post.image_url ? (
                        <div className="relative aspect-square">
                          <Image
                            src={post.image_url}
                            alt=""
                            fill
                            className={cn(
                              "object-cover transition-opacity duration-300",
                              imageLoading ? "opacity-0" : "opacity-100"
                            )}
                            onLoadingComplete={() => setImageLoading(false)}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                            <div className="flex items-center gap-4 text-white">
                              <div className="flex items-center gap-1">
                                <MessageSquare className="h-5 w-5" />
                                <span className="text-sm font-medium">
                                  {post.comments.length}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Activity className="h-5 w-5" />
                                <span className="text-sm font-medium">
                                  {post.reactions.length}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={
                                  post.user.profiles.avatar_url ||
                                  DEFAULT_AVATAR
                                }
                                alt={post.user.profiles.full_name}
                                className="object-cover"
                              />
                              <AvatarFallback>
                                {(
                                  post.user.profiles.full_name[0] || "U"
                                ).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">
                                {post.user.profiles.full_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(post.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <p className="line-clamp-4 text-sm leading-relaxed">
                            {post.content}
                          </p>
                          {post.tags && post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-3">
                              {post.tags.slice(0, 3).map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="secondary"
                                  className="text-xs bg-primary/10 hover:bg-primary/20"
                                >
                                  #{tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <Post
                      key={post.id}
                      post={post}
                      currentUserId={currentUser?.id || ""}
                      onUpdate={fetchProfileData}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="workouts">
              {loading ? (
                <Card className="p-8">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="animate-spin">
                      <Dumbbell className="h-12 w-12 text-muted-foreground mb-4" />
                    </div>
                    <h3 className="font-medium mb-2">Loading Workouts...</h3>
                  </div>
                </Card>
              ) : !canViewPrivateContent() ? (
                <Card className="p-8">
                  <div className="flex flex-col items-center justify-center text-center">
                    <Lock className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-medium mb-2">Private Account</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Follow this account to see their workout history
                    </p>
                    <Button onClick={handleFollow} className="gap-2">
                      <UserPlus className="h-4 w-4" />
                      Follow to See Workouts
                    </Button>
                  </div>
                </Card>
              ) : workouts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
                  {workouts.map((workout) => (
                    <Card
                      key={workout.id}
                      className="group hover:shadow-lg transition-all duration-300"
                    >
                      <CardContent className="p-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">
                              {workout.program_name}
                            </h3>
                            <span className="text-xs text-muted-foreground">
                              {new Date(
                                workout.completed_at
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-1">
                              <Timer className="h-4 w-4 text-primary" />
                              <span>
                                {Math.floor(workout.duration / 60)}m{" "}
                                {workout.duration % 60}s
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Dumbbell className="h-4 w-4 text-primary" />
                              <span>
                                {workout.exercises_completed}/
                                {workout.total_exercises}
                              </span>
                            </div>
                          </div>
                          {workout.notes && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {workout.notes}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-8">
                  <div className="flex flex-col items-center justify-center text-center">
                    <Dumbbell className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-medium mb-2">No Workouts Yet</h3>
                    <p className="text-sm text-muted-foreground">
                      This user hasn&apos;t completed any workouts yet.
                    </p>
                  </div>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="achievements">
              {!canViewPrivateContent() ? (
                <Card className="p-8">
                  <div className="flex flex-col items-center justify-center text-center">
                    <Lock className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-medium mb-2">Private Account</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Follow this account to see their achievements
                    </p>
                    <Button onClick={handleFollow} className="gap-2">
                      <UserPlus className="h-4 w-4" />
                      Follow to See Achievements
                    </Button>
                  </div>
                </Card>
              ) : (
                <Card className="p-8">
                  <div className="flex flex-col items-center justify-center text-center">
                    <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-medium mb-2">Achievements</h3>
                    <p className="text-sm text-muted-foreground">
                      Coming soon: Track fitness milestones and achievements.
                    </p>
                  </div>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="goals">
              {!canViewPrivateContent() ? (
                <Card className="p-8">
                  <div className="flex flex-col items-center justify-center text-center">
                    <Lock className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-medium mb-2">Private Account</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Follow this account to see their fitness goals
                    </p>
                    <Button onClick={handleFollow} className="gap-2">
                      <UserPlus className="h-4 w-4" />
                      Follow to See Goals
                    </Button>
                  </div>
                </Card>
              ) : (
                <Card className="p-8">
                  <div className="flex flex-col items-center justify-center text-center">
                    <Target className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-medium mb-2">Fitness Goals</h3>
                    <p className="text-sm text-muted-foreground">
                      Coming soon: Set and track your fitness goals.
                    </p>
                  </div>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
