"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/utils/supabase/client";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Home,
  ChevronRight,
  MessageCircle,
  Share2,
  Award,
  Send,
  UserPlus,
  UserMinus,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const REACTIONS = {
  like: { emoji: "/Yellow/ThumbsUp.png", label: "Like" },
  muscle: { emoji: "/Yellow/RaisedFist.png", label: "Strong" },
  goal: { emoji: "/Yellow/Victory.png", label: "Goal" },
  champion: { emoji: "/Yellow/Horns.png", label: "Champion" },
  medal: { emoji: "/Yellow/Claps.png", label: "Medal" },
} as const;

const getDisplayName = (user: {
  display_option: "username" | "full_name" | "email";
  username: string | null;
  full_name: string | null;
  email: string | null;
}): string => {
  if (user.display_option === "username" && user.username) {
    return user.username;
  }
  if (user.display_option === "full_name" && user.full_name) {
    return user.full_name;
  }
  return user.email || "Anonymous User";
};

interface Comment {
  id: string;
  content: string;
  created_at: string;
  edited: boolean;
  user: {
    id: string;
    avatar_url: string | null;
    display_name: string;
  };
}

interface DatabaseUser {
  id: string;
  username: string | null;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  display_option: "username" | "full_name" | "email";
}

interface ReactionType {
  user_id: string;
  reaction_type: keyof typeof REACTIONS;
  progress_post_id: string;
}

interface PostData {
  id: string;
  title: string;
  content: string;
  created_at: string;
  media_urls: string[];
  user: DatabaseUser;
  comments: Array<{
    id: string;
    content: string;
    created_at: string;
    edited: boolean;
    user: DatabaseUser;
  }>;
  reactions: ReactionType[];
}

interface Post {
  id: string;
  title: string;
  content: string;
  created_at: string;
  media_urls: string[];
  user: {
    id: string;
    avatar_url: string | null;
    display_name: string;
  };
  comments: Comment[];
  reactions: Record<keyof typeof REACTIONS, number>;
  user_reaction: keyof typeof REACTIONS | null;
}

interface Profile {
  id: string;
  avatar_url: string | null;
  username: string | null;
  full_name: string | null;
  email: string | null;
  display_option: "username" | "full_name" | "email";
}

export default function SinglePostPage() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<Profile | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [editingComment, setEditingComment] = useState<{
    commentId: string;
    content: string;
  } | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setUser(profile);
      }
    };

    fetchUser();
    fetchPost();
  }, [params.id]);

  const fetchPost = async () => {
    if (!params.id) return;

    try {
      const { data: postData, error } = await supabase
        .from("progress_posts")
        .select(
          `
          *,
          user:profiles(*),
          reactions:progress_reactions(*),
          comments:progress_comments(
            id,
            content,
            created_at,
            edited,
            user:profiles(*)
          )
        `
        )
        .eq("id", params.id)
        .single();

      if (error) throw error;

      if (postData) {
        const typedPostData = postData as unknown as PostData;
        // Format the post data
        const formattedPost: Post = {
          ...typedPostData,
          user: {
            id: typedPostData.user.id,
            avatar_url: typedPostData.user.avatar_url,
            display_name: getDisplayName(typedPostData.user),
          },
          comments: typedPostData.comments.map((comment) => ({
            ...comment,
            user: {
              id: comment.user.id,
              avatar_url: comment.user.avatar_url,
              display_name: getDisplayName(comment.user),
            },
          })),
          reactions: Object.keys(REACTIONS).reduce(
            (acc, type) => ({
              ...acc,
              [type]: typedPostData.reactions.filter(
                (r) => r.reaction_type === type
              ).length,
            }),
            {} as Record<keyof typeof REACTIONS, number>
          ),
          user_reaction:
            typedPostData.reactions.find((r) => r.user_id === user?.id)
              ?.reaction_type || null,
        };

        setPost(formattedPost);

        // Check if current user is following the post author
        if (user) {
          const { data: followData } = await supabase
            .from("follows")
            .select("*")
            .eq("follower_id", user.id)
            .eq("following_id", typedPostData.user.id)
            .single();

          setIsFollowing(!!followData);
        }
      }
    } catch (error) {
      console.error("Error fetching post:", error);
      toast.error("Failed to load post");
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!user || !post) return;

    try {
      if (isFollowing) {
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", post.user.id);

        setIsFollowing(false);
        toast.success("Unfollowed successfully");
      } else {
        await supabase.from("follows").insert({
          follower_id: user.id,
          following_id: post.user.id,
          status: "accepted",
        });

        setIsFollowing(true);
        toast.success("Following successfully");
      }
    } catch (error) {
      console.error("Error updating follow status:", error);
      toast.error("Failed to update follow status");
    }
  };

  const handleReaction = async (reactionType: keyof typeof REACTIONS) => {
    if (!user || !post) return;

    try {
      const { data: existingReactions } = await supabase
        .from("progress_reactions")
        .select("*")
        .eq("progress_post_id", post.id)
        .eq("user_id", user.id);

      const existingReaction = existingReactions?.[0];

      if (existingReaction) {
        if (existingReaction.reaction_type === reactionType) {
          await supabase
            .from("progress_reactions")
            .delete()
            .eq("progress_post_id", post.id)
            .eq("user_id", user.id);
        } else {
          await supabase
            .from("progress_reactions")
            .update({ reaction_type: reactionType })
            .eq("progress_post_id", post.id)
            .eq("user_id", user.id);
        }
      } else {
        await supabase.from("progress_reactions").insert({
          progress_post_id: post.id,
          user_id: user.id,
          reaction_type: reactionType,
        });
      }

      await fetchPost();
    } catch (error) {
      console.error("Error handling reaction:", error);
      toast.error("Failed to update reaction");
    }
  };

  const handleComment = async (content: string) => {
    if (!user || !post || !content.trim()) return;

    try {
      await supabase.from("progress_comments").insert({
        progress_post_id: post.id,
        user_id: user.id,
        content: content.trim(),
      });

      await fetchPost();
      toast.success("Comment added successfully");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    }
  };

  const handleShare = async () => {
    if (!post) return;

    try {
      const postUrl = `${window.location.origin}/social/share-progress/post/${post.id}`;

      if (navigator.share) {
        await navigator.share({
          title: "Check out this fitness progress!",
          text: post.content,
          url: postUrl,
        });

        toast.success("Post shared successfully!");
      } else {
        await navigator.clipboard.writeText(postUrl);
        toast.success("Link copied to clipboard!");
      }
    } catch (error) {
      console.error("Error sharing post:", error);
      toast.error("Failed to share post");
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="animate-pulse space-y-4">
          <div className="h-12 w-48 bg-muted rounded"></div>
          <div className="h-32 w-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Post Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The post you&apos;re looking for doesn&apos;t exist or has been
            removed.
          </p>
          <Button onClick={() => router.push("/social/share-progress")}>
            Back to Feed
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative flex flex-col">
      {/* Breadcrumb */}
      <div className="container py-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Home
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink href="/social/share-progress">
                Share Progress
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage>Post</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="container py-8 max-w-3xl mx-auto">
        <Card className="overflow-hidden bg-gradient-to-b from-background to-background/95 border-border hover:border-border/80 transition-colors">
          {/* Hero Section */}
          <div className="relative w-full h-[400px] bg-muted">
            {post.media_urls && post.media_urls.length > 0 && (
              <Image
                src={post.media_urls[0]}
                alt={post.title}
                fill
                className="object-contain"
                priority
              />
            )}
          </div>

          <CardContent className="p-6">
            {/* Post Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/20 via-violet-500/20 to-background blur-md" />
                  <Avatar className="h-12 w-12 ring-2 ring-white/20 relative">
                    <AvatarImage src={post.user.avatar_url || undefined} />
                    <AvatarFallback>
                      {post.user.display_name[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div>
                  <h2 className="font-semibold">{post.user.display_name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(post.created_at), "PPP")}
                  </p>
                </div>
              </div>
              {user && user.id !== post.user.id && (
                <Button
                  variant={isFollowing ? "outline" : "default"}
                  onClick={handleFollow}
                  className="gap-2"
                >
                  {isFollowing ? (
                    <>
                      <UserMinus className="h-4 w-4" />
                      Unfollow
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Follow
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Post Content */}
            <div className="space-y-4">
              <h1 className="text-2xl font-bold">{post.title}</h1>
              <p className="text-muted-foreground">{post.content}</p>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <div className="flex items-center gap-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" className="gap-2">
                      <Award className="h-4 w-4" />
                      React
                      {Object.values(post.reactions).reduce(
                        (a, b) => a + b,
                        0
                      ) > 0 && (
                        <div className="ml-2 flex items-center">
                          <div className="flex -space-x-3">
                            {Object.entries(post.reactions)
                              .filter(([, count]) => count > 0)
                              .sort(([, a], [, b]) => b - a)
                              .slice(0, 3)
                              .map(([type], index, array) => (
                                <div
                                  key={type}
                                  className="relative"
                                  style={{
                                    zIndex: array.length - index,
                                  }}
                                >
                                  <div className="absolute inset-0 rounded-full bg-background/80 dark:bg-background/60 backdrop-blur-sm" />
                                  <div className="relative rounded-full border border-white/20 dark:border-white/10 bg-white/10 dark:bg-white/5 p-0.5 backdrop-blur-[2px]">
                                    <div className="w-7 h-7 rounded-full overflow-hidden bg-muted/50">
                                      <Image
                                        src={
                                          REACTIONS[
                                            type as keyof typeof REACTIONS
                                          ].emoji
                                        }
                                        alt={
                                          REACTIONS[
                                            type as keyof typeof REACTIONS
                                          ].label
                                        }
                                        width={28}
                                        height={28}
                                        className="w-7 h-7"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                          <span className="ml-2 text-sm font-medium text-primary translate-y-0.5">
                            {Object.values(post.reactions).reduce(
                              (a, b) => a + b,
                              0
                            )}
                          </span>
                        </div>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-fit p-3" align="start">
                    <div className="flex gap-3">
                      {Object.entries(REACTIONS).map(
                        ([type, { emoji, label }]) => {
                          const isSelected = post.user_reaction === type;
                          return (
                            <button
                              key={type}
                              onClick={() =>
                                handleReaction(type as keyof typeof REACTIONS)
                              }
                              className={cn(
                                "group relative p-0.5 rounded-full transition-all transform hover:scale-110",
                                "bg-white/10 dark:bg-white/5 backdrop-blur-[2px]",
                                "hover:bg-white/20 dark:hover:bg-white/10",
                                isSelected &&
                                  "ring-2 ring-primary/50 ring-offset-2 ring-offset-background"
                              )}
                              title={label}
                            >
                              <div className="relative w-10 h-10 rounded-full overflow-hidden bg-muted/50">
                                <Image
                                  src={emoji}
                                  alt={label}
                                  width={40}
                                  height={40}
                                  className="w-10 h-10"
                                />
                              </div>
                              <div
                                className={cn(
                                  "absolute -bottom-1 left-1/2 transform -translate-x-1/2 px-2 py-0.5 text-xs font-medium",
                                  "rounded-full bg-background/80 text-primary opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                                )}
                              >
                                {label}
                              </div>
                            </button>
                          );
                        }
                      )}
                    </div>
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" className="gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Comments
                      {post.comments.length > 0 && (
                        <span className="text-sm font-medium">
                          {post.comments.length}
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="start">
                    <div className="flex flex-col h-[400px]">
                      <ScrollArea className="flex-1 p-4">
                        {post.comments.length > 0 ? (
                          <div className="space-y-4">
                            {post.comments.map((comment) => (
                              <div
                                key={comment.id}
                                className="flex gap-3 group"
                              >
                                <Avatar className="h-8 w-8 flex-shrink-0">
                                  <AvatarImage
                                    src={comment.user.avatar_url || undefined}
                                  />
                                  <AvatarFallback>
                                    {comment.user.display_name[0].toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">
                                      {comment.user.display_name}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {format(
                                        new Date(comment.created_at),
                                        "MMM d, yyyy"
                                      )}
                                      {comment.edited && " (edited)"}
                                    </span>
                                  </div>
                                  {editingComment?.commentId === comment.id ? (
                                    <div className="mt-1 space-y-2">
                                      <Textarea
                                        value={editingComment.content}
                                        onChange={(e) =>
                                          setEditingComment((prev) =>
                                            prev
                                              ? {
                                                  ...prev,
                                                  content: e.target.value,
                                                }
                                              : null
                                          )
                                        }
                                        className="min-h-[60px]"
                                      />
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          onClick={async () => {
                                            if (!editingComment) return;
                                            try {
                                              const { error } = await supabase
                                                .from("progress_comments")
                                                .update({
                                                  content:
                                                    editingComment.content,
                                                  edited: true,
                                                })
                                                .eq("id", comment.id)
                                                .select();

                                              if (error) throw error;
                                              setEditingComment(null);
                                              await fetchPost();
                                              toast.success("Comment updated");
                                            } catch (error) {
                                              console.error(
                                                "Error updating comment:",
                                                error
                                              );
                                              toast.error(
                                                "Failed to update comment"
                                              );
                                            }
                                          }}
                                        >
                                          Save
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() =>
                                            setEditingComment(null)
                                          }
                                        >
                                          Cancel
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-sm mt-1">
                                      {comment.content}
                                    </p>
                                  )}
                                  {user?.id === comment.user.id &&
                                    !editingComment && (
                                      <div className="flex gap-2 mt-1">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-auto p-0 text-xs"
                                          onClick={() =>
                                            setEditingComment({
                                              commentId: comment.id,
                                              content: comment.content,
                                            })
                                          }
                                        >
                                          Edit
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-auto p-0 text-xs text-destructive"
                                          onClick={async () => {
                                            try {
                                              const { error } = await supabase
                                                .from("progress_comments")
                                                .delete()
                                                .eq("id", comment.id);

                                              if (error) throw error;
                                              await fetchPost();
                                              toast.success("Comment deleted");
                                            } catch (error) {
                                              console.error(
                                                "Error deleting comment:",
                                                error
                                              );
                                              toast.error(
                                                "Failed to delete comment"
                                              );
                                            }
                                          }}
                                        >
                                          Delete
                                        </Button>
                                      </div>
                                    )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                            <MessageCircle className="h-12 w-12 mb-4" />
                            <p className="text-sm">No comments yet</p>
                            <p className="text-xs">
                              Be the first to comment on this post
                            </p>
                          </div>
                        )}
                      </ScrollArea>

                      {/* Comment Input */}
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const form = e.target as HTMLFormElement;
                          const textarea = form.comment as HTMLTextAreaElement;
                          const content = textarea.value.trim();

                          if (!content) return;

                          await handleComment(content);
                          form.reset();
                        }}
                        className="p-4 space-y-4 border-t"
                      >
                        <div className="flex gap-2 items-start">
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage src={user?.avatar_url || undefined} />
                            <AvatarFallback>
                              {user?.full_name?.[0]?.toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <Textarea
                            name="comment"
                            placeholder="Write a comment..."
                            className="flex-1 min-h-[60px] resize-none"
                          />
                        </div>
                        <div className="flex justify-end">
                          <Button type="submit" size="sm">
                            <Send className="h-4 w-4 mr-2" />
                            Post
                          </Button>
                        </div>
                      </form>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <Button variant="ghost" className="gap-2" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
