"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  MessageSquare,
  Users,
  TrendingUp,
  UserPlus,
  Home,
  Hash,
  Trash2,
  MoreVertical,
  Pencil,
  Link,
  Flag,
  Repeat,
  Plus,
  Bookmark,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { supabase } from "@/utils/supabase/client";
import CreatePost from "../components/create-post";
import PostActions from "../components/post-actions";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type ReactionType =
  | "like"
  | "laugh"
  | "wow"
  | "fire"
  | "dislike"
  | "muscle"
  | "workout"
  | "goal"
  | "medal"
  | "champion";

interface RepostedPost {
  post_id: string;
  user_id: string;
  user_name: string;
}

interface Post {
  id: string;
  user_id: string;
  content: string;
  media_urls: string[];
  tags: string[];
  workout_id: string | null;
  achievement_id: string | null;
  created_at: string;
  updated_at: string;
  reposted_from: RepostedPost | null;
  user: {
    id: string;
    full_name: string;
    username: string;
    avatar_url: string;
    email: string;
    display_option: "full_name" | "username" | "email";
  };
  reactions: {
    count: number;
    types: { [key: string]: number };
  };
  comments: number;
  user_reaction?: ReactionType;
}

interface PostData {
  id: string;
  user_id: string;
  content: string;
  media_urls: string[] | null;
  tags: string[] | null;
  workout_id: string | null;
  achievement_id: string | null;
  created_at: string;
  updated_at: string;
  reposted_from: RepostedPost | null;
  user: {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    email: string;
    display_option: "full_name" | "username" | "email" | null;
  } | null;
}

interface UserConnection {
  id: string;
  connected_user_id: string;
  status: string;
  connected_user: {
    email: string;
    user_metadata: {
      full_name: string;
      avatar_url: string;
    };
  };
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [connections, setConnections] = useState<UserConnection[]>([]);
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalPosts: 0,
    activeUsers: 0,
    engagement: 0,
  });
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    user_metadata: {
      full_name: string;
      avatar_url: string;
    };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [trendingTags, setTrendingTags] = useState<
    { tag: string; count: number }[]
  >([]);
  const router = useRouter();
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [activeTab, setActiveTab] = useState<"feed" | "network" | "trending">(
    "feed"
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const formatUsername = (email: string): string => {
    if (!email || email === "Unknown User") return "Unknown User";

    // Remove any numbers from the email
    const nameWithoutNumbers = email.replace(/\d+/g, "");

    // Split by @ and take the first part
    const name = nameWithoutNumbers.split("@")[0];

    // Capitalize first letter and add @ prefix
    return `@${name.charAt(0).toUpperCase()}${name.slice(1)}`;
  };

  const getDisplayName = (user: Post["user"]) => {
    if (!user) return "";

    // If user has a display preference, use it
    if (user.display_option === "full_name" && user.full_name) {
      return user.full_name;
    }
    if (user.display_option === "username" && user.username) {
      return user.username;
    }
    if (user.display_option === "email") {
      return user.email?.split("@")[0] || "";
    }

    // No preference set, default to email username
    return user.email?.split("@")[0] || "";
  };

  const fetchPosts = async () => {
    try {
      // First, get all posts with basic user info
      const { data: postsData, error: postsError } = (await supabase
        .from("posts")
        .select(
          `
          *,
          user:profiles!posts_user_id_fkey (
            id,
            full_name,
            username,
            avatar_url,
            email,
            display_option
          )
        `
        )
        .order("created_at", { ascending: false })) as {
        data: PostData[] | null;
        error: { message: string } | null;
      };

      if (postsError) {
        console.error("Error fetching posts:", postsError.message);
        throw postsError;
      }

      if (!postsData) {
        setPosts([]);
        return;
      }

      // Get reactions and comments counts for all posts
      const postIds = postsData.map((post) => post.id);

      const { data: reactionsData } = await supabase
        .from("reactions")
        .select("post_id, user_id, reaction_type")
        .in("post_id", postIds);

      const { data: commentsData } = await supabase
        .from("comments")
        .select("post_id")
        .in("post_id", postIds);

      // Transform the data
      const transformedPosts: Post[] = (postsData || []).map((post) => {
        const postReactions =
          reactionsData?.filter((r) => r.post_id === post.id) || [];
        const postComments =
          commentsData?.filter((c) => c.post_id === post.id) || [];

        // Count reactions by type
        const reactionTypes = postReactions.reduce((acc, reaction) => {
          acc[reaction.reaction_type] = (acc[reaction.reaction_type] || 0) + 1;
          return acc;
        }, {} as { [key: string]: number });

        // Ensure display_option is one of the valid values
        const displayOption: "full_name" | "username" | "email" =
          post.user?.display_option || "full_name";

        return {
          id: post.id,
          user_id: post.user_id,
          content: post.content,
          media_urls: post.media_urls || [],
          tags: post.tags || [],
          workout_id: post.workout_id,
          achievement_id: post.achievement_id,
          created_at: post.created_at,
          updated_at: post.updated_at,
          reposted_from: post.reposted_from,
          user: {
            id: post.user?.id || "",
            full_name: post.user?.full_name || "",
            username: post.user?.username || "",
            avatar_url: post.user?.avatar_url || "",
            email: post.user?.email || "",
            display_option: displayOption,
          },
          reactions: {
            count: postReactions.length,
            types: reactionTypes,
          },
          comments: postComments.length,
          user_reaction: postReactions.find(
            (r) => r.user_id === currentUser?.id
          )?.reaction_type as ReactionType | undefined,
        };
      });

      setPosts(transformedPosts);
    } catch (error) {
      console.error(
        "Error fetching posts:",
        error instanceof Error ? error.message : "Unknown error"
      );
      toast.error("Failed to load posts");
    }
  };

  const fetchCommunityData = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const userMetadata = user.user_metadata as {
        full_name?: string;
        avatar_url?: string;
      };
      setCurrentUser({
        id: user.id,
        user_metadata: {
          full_name: userMetadata.full_name || "",
          avatar_url: userMetadata.avatar_url || "",
        },
      });

      await fetchPosts();

      const { count: postsCount } = await supabase
        .from("posts")
        .select("*", { count: "exact" });

      const activeUsersCount = await getActiveUsersCount();
      const engagementRate = calculateEngagementRate(posts);

      setStats({
        totalMembers: 0,
        totalPosts: postsCount || 0,
        activeUsers: activeUsersCount,
        engagement: engagementRate,
      });
    } catch (error) {
      console.error("Error fetching community data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendingTags = async () => {
    try {
      const { data: posts, error } = await supabase
        .from("posts")
        .select("tags")
        .not("tags", "is", null);

      if (error) {
        console.error("Error fetching tags:", error);
        return;
      }

      // Count tag occurrences
      const tagCounts = new Map<string, number>();
      posts.forEach((post) => {
        if (post.tags) {
          post.tags.forEach((tag: string) => {
            tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
          });
        }
      });

      // Convert to array and sort by count
      const sortedTags = Array.from(tagCounts.entries())
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // Get top 5 tags

      setTrendingTags(sortedTags);
    } catch (error) {
      console.error("Error in fetchTrendingTags:", error);
    }
  };

  const handleFindMembers = () => {
    router.push("/social/members");
  };

  const handleFollowMember = async (memberId: string) => {
    try {
      if (!currentUser) {
        toast.error("Please log in to follow members");
        return;
      }

      const { error } = await supabase.from("follows").insert({
        follower_id: currentUser.id,
        following_id: memberId,
      });

      if (error) throw error;

      toast.success("Started following member");
      fetchCommunityData(); // Refresh the data
    } catch (error) {
      console.error("Error following member:", error);
      toast.error("Failed to follow member");
    }
  };

  useEffect(() => {
    fetchCommunityData();
    fetchTrendingTags();
  }, []);

  const getActiveUsersCount = async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
      .from("posts")
      .select("user_id")
      .gte("created_at", thirtyDaysAgo.toISOString());

    if (error) return 0;

    // Count unique user_ids
    const uniqueUsers = new Set(data?.map((post) => post.user_id));
    return uniqueUsers.size;
  };

  const calculateEngagementRate = (postsList: Post[]) => {
    if (postsList.length === 0) return 0;
    const totalInteractions = postsList.reduce(
      (acc, post) => acc + post.reactions.count,
      0
    );
    return Math.round((totalInteractions / postsList.length) * 100) / 100;
  };

  const handlePostCreated = () => {
    fetchCommunityData();
  };

  const handlePostUpdated = () => {
    if (currentUser) {
      fetchPosts();
    }
  };

  const handleDeletePost = async (postId: string, postUserId: string) => {
    try {
      if (currentUser?.id !== postUserId) {
        toast.error("You can only delete your own posts");
        return;
      }

      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", postId)
        .eq("user_id", postUserId);

      if (error) throw error;

      toast.success("Post deleted successfully");
      fetchPosts();
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    }
  };

  const handleReaction = async (postId: string, reactionType: ReactionType) => {
    try {
      if (!currentUser) {
        toast.error("Please log in to react to posts");
        return;
      }

      // Optimistically update UI
      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post.id === postId) {
            const oldReaction = post.user_reaction;
            const newReactions = { ...post.reactions };

            // Remove old reaction if it exists
            if (oldReaction) {
              newReactions.count--;
              newReactions.types[oldReaction]--;
              if (newReactions.types[oldReaction] <= 0) {
                delete newReactions.types[oldReaction];
              }
            }

            // Add new reaction if it's different from the old one
            if (oldReaction !== reactionType) {
              newReactions.count++;
              newReactions.types[reactionType] =
                (newReactions.types[reactionType] || 0) + 1;
              return {
                ...post,
                reactions: newReactions,
                user_reaction: reactionType,
              };
            } else {
              // If same reaction, remove it (toggle off)
              return {
                ...post,
                reactions: newReactions,
                user_reaction: undefined,
              };
            }
          }
          return post;
        })
      );

      const { data: existingReaction } = await supabase
        .from("reactions")
        .select("id, reaction_type")
        .eq("post_id", postId)
        .eq("user_id", currentUser.id)
        .single();

      if (existingReaction) {
        if (existingReaction.reaction_type === reactionType) {
          // Remove reaction if clicking the same type
          const { error } = await supabase
            .from("reactions")
            .delete()
            .eq("id", existingReaction.id);

          if (error) throw error;
        } else {
          // Update reaction type
          const { error } = await supabase
            .from("reactions")
            .update({ reaction_type: reactionType })
            .eq("id", existingReaction.id);

          if (error) throw error;
        }
      } else {
        // Create new reaction
        const { error } = await supabase.from("reactions").insert({
          post_id: postId,
          user_id: currentUser.id,
          reaction_type: reactionType,
        });

        if (error) throw error;
      }

      await fetchPosts(); // Refresh posts to get updated reaction counts
    } catch (error) {
      console.error("Error handling reaction:", error);
      toast.error("Failed to update reaction");
      // Revert optimistic update on error
      await fetchPosts();
    }
  };

  const handleComment = async (postId: string, content: string) => {
    try {
      if (!currentUser) {
        toast.error("Please log in to comment");
        return;
      }

      const { error } = await supabase.from("comments").insert({
        post_id: postId,
        user_id: currentUser.id,
        content: content,
      });

      if (error) throw error;

      await fetchPosts();
      toast.success("Comment added successfully");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    }
  };

  // Mobile navigation handler
  const handleTabChange = (tab: "feed" | "network" | "trending") => {
    setActiveTab(tab);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchCommunityData();
    setIsRefreshing(false);
  };

  const filteredPosts = selectedTag
    ? posts.filter((post) => post.tags?.includes(selectedTag))
    : posts;

  if (loading) {
    return (
      <div className="flex-1 space-y-6 p-8 pt-6">
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
              <BreadcrumbPage>Community</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Hero Section - Always visible */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5">
          <div className="absolute inset-0 bg-grid-white/10" />
          <div className="relative flex flex-col md:flex-row items-center gap-6 p-8">
            <div className="flex-1 min-w-[50%]">
              <div className="flex items-center gap-4 mb-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight">Community</h1>
              </div>
              <p className="text-muted-foreground">
                Connect with other athletes, share your progress, and stay
                motivated together.
              </p>
            </div>
            <div className="relative w-full md:w-1/2 aspect-[16/9] rounded-lg overflow-hidden">
              <Image
                src="/images/hero/Community.jpg"
                alt="Community"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>

        {/* Loading State for Database Content */}
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="animate-spin">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
            </div>
            <h3 className="font-medium mb-2">Loading Community Data...</h3>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 relative flex flex-col">
      {/* Main scrollable content */}
      <div
        className="flex-1 overflow-y-auto pb-24 lg:pb-8 relative z-0"
        style={{ WebkitOverflowScrolling: "touch" }}
        onScroll={(e) => {
          const target = e.currentTarget;
          if (target.scrollTop < -50 && !isRefreshing) {
            handleRefresh();
          }
        }}
      >
        <div className="p-4 sm:p-6 lg:p-8 space-y-4">
          {/* Quick Stats Row - Mobile */}
          <div className="lg:hidden grid grid-cols-2 gap-2">
            <Card className="p-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">{stats.totalMembers}</p>
                  <p className="text-xs text-muted-foreground">Members</p>
                </div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">{stats.totalPosts}</p>
                  <p className="text-xs text-muted-foreground">Posts</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:block">
            {/* Existing desktop hero and stats grid */}
            <div className="space-y-6">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink
                      href="/"
                      className="flex items-center gap-1"
                    >
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
                    <BreadcrumbPage>Community</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>

              {/* Hero Section */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5">
                <div className="absolute inset-0 bg-grid-white/10" />
                <div className="relative flex flex-col md:flex-row items-center gap-6 p-4 sm:p-8">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="rounded-full bg-primary/10 p-3">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">
                        Community
                      </h1>
                    </div>
                    <p className="text-muted-foreground text-sm sm:text-base">
                      Connect with fellow fitness enthusiasts, share your
                      journey, and inspire others.
                    </p>
                  </div>
                  <div className="relative w-full md:w-1/2 aspect-[16/9] rounded-lg overflow-hidden hidden md:block">
                    <Image
                      src="/images/hero/Community.jpg"
                      alt="Community"
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="overflow-hidden transition-all">
                  <Card className="bg-gradient-to-br from-card to-card/50 border-border/50 h-full">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Total Members
                      </CardTitle>
                      <div className="rounded-full bg-primary/10 p-2">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {stats.totalMembers}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Community size
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="overflow-hidden transition-all">
                  <Card className="bg-gradient-to-br from-card to-card/50 border-border/50 h-full">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Total Posts
                      </CardTitle>
                      <div className="rounded-full bg-primary/10 p-2">
                        <MessageSquare className="h-4 w-4 text-primary" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {stats.totalPosts}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Shared experiences
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="overflow-hidden transition-all">
                  <Card className="bg-gradient-to-br from-card to-card/50 border-border/50 h-full">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Active Users
                      </CardTitle>
                      <div className="rounded-full bg-primary/10 p-2">
                        <UserPlus className="h-4 w-4 text-primary" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {stats.activeUsers}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Last 30 days
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="overflow-hidden transition-all">
                  <Card className="bg-gradient-to-br from-card to-card/50 border-border/50 h-full">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Engagement Rate
                      </CardTitle>
                      <div className="rounded-full bg-primary/10 p-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {stats.engagement}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Avg. interactions per post
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Feed Section */}
            <div
              className={cn(
                "lg:col-span-2",
                activeTab !== "feed" && "hidden lg:block"
              )}
            >
              {selectedTag && (
                <div className="mb-6 flex items-center justify-between bg-primary/5 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Hash className="h-5 w-5 text-primary" />
                    <span className="font-medium">
                      Showing posts for #{selectedTag}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedTag(null)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Clear Filter
                  </Button>
                </div>
              )}

              {/* Create Post - Desktop Only */}
              <div className="hidden lg:block mb-6">
                <Card className="p-6">
                  <CreatePost
                    onPostCreated={handlePostCreated}
                    userAvatar={currentUser?.user_metadata?.avatar_url}
                    userName={currentUser?.user_metadata?.full_name}
                  />
                </Card>
              </div>

              {/* Posts Feed */}
              <div className="space-y-4">
                {filteredPosts.map((post) => (
                  <Card
                    key={post.id}
                    className="overflow-hidden bg-card/95 dark:bg-card/95 border-border/50 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_8px_-3px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.4)] transition-all duration-300 relative group"
                  >
                    {/* Post Header */}
                    <div className="p-4 sm:p-6 border-b bg-background/95 dark:bg-background/95">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Button
                            variant="ghost"
                            className="p-0 h-auto hover:bg-transparent group/avatar relative"
                            onClick={() =>
                              router.push(`/social/profile/${post.user_id}`)
                            }
                          >
                            <div className="relative">
                              <Avatar className="h-12 w-12 ring-[3px] ring-white/80 dark:ring-white/20">
                                <AvatarImage
                                  src={post.user.avatar_url || ""}
                                  alt={getDisplayName(post.user)}
                                />
                                <AvatarFallback>
                                  {getDisplayName(post.user).charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-background" />
                            </div>
                            <div className="absolute inset-0 bg-black/0 group-hover/avatar:bg-black/5 rounded-full transition-colors" />
                          </Button>
                          <div>
                            <Button
                              variant="ghost"
                              className="h-auto p-0 font-semibold text-base hover:bg-transparent hover:text-primary"
                              onClick={() =>
                                router.push(`/social/profile/${post.user_id}`)
                              }
                            >
                              {getDisplayName(post.user)}
                            </Button>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>
                                {new Date(post.created_at).toLocaleDateString(
                                  undefined,
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  }
                                )}
                              </span>
                              <span>•</span>
                              <span>
                                {new Date(post.created_at).toLocaleTimeString(
                                  undefined,
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </span>
                            </div>
                          </div>
                        </div>

                        {currentUser?.id === post.user_id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem
                                className="text-primary focus:text-primary"
                                onClick={() =>
                                  router.push(`/social/post/${post.id}/edit`)
                                }
                              >
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit Post
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-primary focus:text-primary"
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    `${window.location.origin}/social/post/${post.id}`
                                  );
                                  toast.success("Link copied to clipboard");
                                }}
                              >
                                <Link className="h-4 w-4 mr-2" />
                                Copy Link
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-primary focus:text-primary"
                                onClick={() => {
                                  // TODO: Implement report functionality
                                  toast.success("Post reported");
                                }}
                              >
                                <Flag className="h-4 w-4 mr-2" />
                                Report Post
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() =>
                                  handleDeletePost(post.id, post.user_id)
                                }
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Post
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>

                    {/* Post Content */}
                    <div className="p-4 sm:p-6">
                      <div className="space-y-4">
                        {/* Repost Attribution */}
                        {post.reposted_from && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Repeat className="h-4 w-4" />
                            <span>Reposted from</span>
                            <Button
                              variant="link"
                              className="h-auto p-0 text-primary"
                              onClick={() =>
                                router.push(
                                  `/social/profile/${post.reposted_from?.user_id}`
                                )
                              }
                            >
                              @{post.reposted_from.user_name}
                            </Button>
                          </div>
                        )}

                        {/* Text content */}
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {post.content}
                        </p>

                        {/* Media */}
                        {post.media_urls &&
                          Array.isArray(post.media_urls) &&
                          post.media_urls.length > 0 && (
                            <div className="relative -mx-4 sm:-mx-6">
                              <div
                                className={cn(
                                  "grid gap-1",
                                  post.media_urls.length === 1 && "grid-cols-1",
                                  post.media_urls.length === 2 && "grid-cols-2",
                                  post.media_urls.length >= 3 &&
                                    "grid-cols-2 grid-rows-2",
                                  "relative rounded-xl overflow-hidden"
                                )}
                              >
                                {post.media_urls.map((url, index) => {
                                  if (index >= 4) return null;
                                  const mediaLength =
                                    post.media_urls?.length || 0;
                                  return (
                                    <div
                                      key={index}
                                      className={cn(
                                        "relative overflow-hidden group/media",
                                        mediaLength === 1 && "aspect-[16/9]",
                                        mediaLength === 2 && "aspect-square",
                                        mediaLength >= 3 &&
                                          index === 0 &&
                                          "row-span-2 aspect-[4/5]",
                                        mediaLength >= 3 &&
                                          index !== 0 &&
                                          "aspect-square"
                                      )}
                                    >
                                      <Image
                                        src={url}
                                        alt={`Post image ${index + 1}`}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
                                        quality={100}
                                        unoptimized
                                      />
                                      <div className="absolute inset-0 bg-black/0 group-hover/media:bg-black/20 transition-colors" />
                                      {mediaLength > 4 && index === 3 && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                          <span className="text-white text-xl font-semibold">
                                            +{mediaLength - 4}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                        {/* Tags */}
                        {post.tags && post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-2">
                            {post.tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="rounded-full px-3 py-1 text-xs gap-1 bg-primary/10 hover:bg-primary/20 transition-colors cursor-pointer"
                              >
                                <Hash className="h-3 w-3" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Post Actions */}
                        <div className="pt-4 border-t">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            {/* Left side actions - Reactions, Comments, Share */}
                            <div className="flex items-center gap-4">
                              <PostActions
                                postId={post.id}
                                userId={currentUser?.id || ""}
                                onUpdate={handlePostUpdated}
                                reactions={post.reactions.count}
                                reactionTypes={post.reactions.types}
                                comments={post.comments}
                                userReaction={post.user_reaction}
                                onReaction={handleReaction}
                                onComment={handleComment}
                                authorId={post.user_id}
                                isFollowing={false}
                                onFollow={handleFollowMember}
                                postContent={post.content}
                                postMedia={post.media_urls || []}
                                author={post.user}
                              />
                            </div>
                            {/* Right side actions - Repost, Bookmark, Follow */}
                            <div className="flex items-center gap-4 bg-primary/5 dark:bg-primary/10 rounded-lg px-4 py-2 w-full sm:w-auto">
                              {/* Repost - Only show on other users' posts */}
                              {post.user_id !== currentUser?.id && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-primary hover:text-primary/80 transition-colors group"
                                  onClick={() => handleRepost(post.id)}
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 border-2 border-primary/20 shadow-sm transition-transform group-hover:scale-110">
                                      <Repeat className="h-4 w-4" />
                                    </div>
                                    <span className="hidden sm:inline text-sm text-muted-foreground">
                                      Repost
                                    </span>
                                  </div>
                                </Button>
                              )}

                              {/* Bookmark */}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-primary hover:text-primary/80 transition-colors group"
                                onClick={() => handleBookmark(post.id)}
                              >
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 border-2 border-primary/20 shadow-sm transition-transform group-hover:scale-110">
                                    <Bookmark className="h-4 w-4" />
                                  </div>
                                  <span className="hidden sm:inline text-sm text-muted-foreground">
                                    Save
                                  </span>
                                </div>
                              </Button>

                              {/* Follow */}
                              {post.user_id !== currentUser?.id && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-primary hover:text-primary/80 transition-colors group"
                                  onClick={() =>
                                    handleFollowMember(post.user_id)
                                  }
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 border-2 border-primary/20 shadow-sm transition-transform group-hover:scale-110">
                                      <UserPlus className="h-4 w-4" />
                                    </div>
                                    <span className="hidden sm:inline text-sm text-muted-foreground">
                                      Follow
                                    </span>
                                  </div>
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Sidebar - Network and Trending */}
            <div
              className={cn(
                "space-y-4",
                activeTab !== "network" &&
                  activeTab !== "trending" &&
                  "hidden lg:block"
              )}
            >
              {/* Network Section */}
              <div className={cn(activeTab !== "network" && "hidden lg:block")}>
                <Card className="p-6 bg-gradient-to-br from-card to-card/50">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="font-semibold text-lg">Your Network</h2>
                      <p className="text-sm text-muted-foreground">
                        {connections.length}{" "}
                        {connections.length === 1 ? "member" : "members"}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-background/50 hover:bg-background/80 gap-2"
                      onClick={handleFindMembers}
                    >
                      <UserPlus className="h-4 w-4" />
                      Find Members
                    </Button>
                  </div>
                  {connections.length === 0 ? (
                    <div className="text-center py-12 px-4">
                      <div className="rounded-full bg-gradient-to-br from-primary/20 to-primary/10 p-4 w-16 h-16 mx-auto mb-6 flex items-center justify-center ring-4 ring-background">
                        <Users className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">
                        No Connections Yet
                      </h3>
                      <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                        Start building your fitness network by connecting with
                        other members
                      </p>
                      <Button
                        variant="default"
                        size="lg"
                        className="bg-primary/90 hover:bg-primary gap-2"
                        onClick={handleFindMembers}
                      >
                        <UserPlus className="h-5 w-5" />
                        Discover Members
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {connections.map((connection) => (
                        <div
                          key={connection.id}
                          className="flex items-center gap-4 p-3 rounded-xl bg-background/50 hover:bg-background/80 transition-all group"
                        >
                          <div className="relative">
                            <Avatar className="h-12 w-12 ring-[3px] ring-white/80 dark:ring-white/20">
                              <AvatarImage
                                src={
                                  connection.connected_user.user_metadata
                                    .avatar_url
                                }
                              />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {
                                  connection.connected_user.user_metadata
                                    .full_name[0]
                                }
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-background" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-base truncate">
                              {
                                connection.connected_user.user_metadata
                                  .full_name
                              }
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {formatUsername(connection.connected_user.email)}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Message
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>

              {/* Trending Section */}
              <div
                className={cn(activeTab !== "trending" && "hidden lg:block")}
              >
                <Card className="p-6 bg-gradient-to-br from-card to-card/50">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="font-semibold text-lg">Trending Topics</h2>
                      <p className="text-sm text-muted-foreground">
                        {selectedTag
                          ? "Showing posts for #" + selectedTag
                          : "Popular hashtags"}
                      </p>
                    </div>
                    {selectedTag && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedTag(null)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        Clear Filter
                      </Button>
                    )}
                  </div>
                  <div className="space-y-4">
                    {trendingTags.length === 0 ? (
                      <div className="text-center py-12 px-4">
                        <div className="rounded-full bg-gradient-to-br from-primary/20 to-primary/10 p-4 w-16 h-16 mx-auto mb-6 flex items-center justify-center ring-4 ring-background">
                          <Hash className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">
                          No Trending Topics
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Topics will appear here as members add hashtags to
                          their posts
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {trendingTags.map(({ tag, count }) => (
                          <button
                            key={tag}
                            onClick={() => setSelectedTag(tag)}
                            className={cn(
                              "w-full flex items-center justify-between p-4 rounded-xl transition-all",
                              selectedTag === tag
                                ? "bg-primary/10 hover:bg-primary/15"
                                : "bg-muted/50 hover:bg-muted/80"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  "rounded-full p-2",
                                  selectedTag === tag
                                    ? "bg-primary/20"
                                    : "bg-background/50"
                                )}
                              >
                                <Hash
                                  className={cn(
                                    "h-4 w-4",
                                    selectedTag === tag
                                      ? "text-primary"
                                      : "text-muted-foreground"
                                  )}
                                />
                              </div>
                              <span
                                className={cn(
                                  "font-medium",
                                  selectedTag === tag && "text-primary"
                                )}
                              >
                                {tag}
                              </span>
                            </div>
                            <Badge
                              variant={
                                selectedTag === tag ? "default" : "secondary"
                              }
                              className={cn(
                                "ml-auto",
                                selectedTag === tag
                                  ? "bg-primary/20 hover:bg-primary/30 text-primary"
                                  : "bg-background/50 hover:bg-background/80"
                              )}
                            >
                              {count} posts
                            </Badge>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Bar - Moved outside the scroll container */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t z-[9999] shadow-lg">
        <div className="flex items-center justify-around p-2">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "flex-1 flex flex-col items-center gap-1 h-auto py-2",
              activeTab === "feed" && "text-primary"
            )}
            onClick={() => handleTabChange("feed")}
          >
            <Home className="h-5 w-5" />
            <span className="text-xs">Feed</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "flex-1 flex flex-col items-center gap-1 h-auto py-2",
              activeTab === "network" && "text-primary"
            )}
            onClick={() => handleTabChange("network")}
          >
            <Users className="h-5 w-5" />
            <span className="text-xs">Network</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "flex-1 flex flex-col items-center gap-1 h-auto py-2",
              activeTab === "trending" && "text-primary"
            )}
            onClick={() => handleTabChange("trending")}
          >
            <TrendingUp className="h-5 w-5" />
            <span className="text-xs">Trending</span>
          </Button>
        </div>
      </div>

      {/* Floating Action Button for Create Post */}
      <Button
        className="lg:hidden fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg z-[9999]"
        onClick={() => setShowCreatePost(true)}
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Create Post Dialog - Mobile */}
      <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Post</DialogTitle>
            <DialogDescription>
              Share your fitness journey with the community
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <CreatePost
              onPostCreated={() => {
                handlePostCreated();
                setShowCreatePost(false);
              }}
              userAvatar={currentUser?.user_metadata?.avatar_url}
              userName={currentUser?.user_metadata?.full_name}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
