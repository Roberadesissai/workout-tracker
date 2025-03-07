"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "@/utils/supabase/client";
import { toast } from "sonner";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Dumbbell,
  Utensils,
  Ruler,
  Trophy,
  Plus,
  Upload,
  Send,
  Award,
  Crown,
  Lock,
  ChevronRight,
  Star,
  Flame,
  Share2,
  MessageCircle,
  User,
  Sparkles,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  generateWorkoutTitle,
  generateWorkoutDescription,
  generateProgressDetails,
} from "@/utils/ai-client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

interface Achievement {
  id: string;
  type: "consistency" | "progress";
  level: "bronze" | "silver" | "gold";
  name: string;
  date: string;
}

interface User {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  email: string | null;
  display_option: "username" | "full_name" | "email";
  display_name: string;
  streak: number;
  achievements: Achievement[];
}

interface ProgressVisualData {
  current: number;
  target: number;
  history?: {
    date: string;
    value: number;
  }[];
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  edited?: boolean;
  user: {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    email: string | null;
    display_option: "username" | "full_name" | "email";
    display_name: string;
  };
}

interface RawProgressPost {
  id: string;
  title: string;
  content: string;
  progress_type: "workout" | "nutrition" | "measurement" | "achievement";
  media_urls: string[];
  tags: string[];
  is_premium: boolean;
  subscription_required: boolean;
  created_at: string;
  pinned: boolean;
  user_id: string;
  user: {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    email: string | null;
    display_option: "username" | "full_name" | "email";
  };
  reactions: Array<{
    id: string;
    user_id: string;
    reaction_type: keyof typeof REACTIONS;
    created_at: string;
  }>;
  comments: Array<{
    id: string;
    content: string;
    created_at: string;
    user: {
      id: string;
      full_name: string | null;
      username: string | null;
      avatar_url: string | null;
      email: string | null;
      display_option: "username" | "full_name" | "email";
    };
  }>;
}

interface ProgressPost {
  id: string;
  title: string;
  content: string;
  progress_type: "workout" | "nutrition" | "measurement" | "achievement";
  media_urls: string[];
  tags: string[];
  is_premium: boolean;
  subscription_required: boolean;
  created_at: string;
  pinned: boolean;
  expanded?: boolean;
  user: User;
  progress_details: {
    id: string;
    detail_type: string;
    value: string | number;
    unit: string;
    progress?: number;
  }[];
  reactions: {
    [K in keyof typeof REACTIONS]: number;
  };
  comments: Comment[];
  progress_visual?: {
    type: "bar" | "line" | "circle";
    data: ProgressVisualData;
  };
  user_reaction?: keyof typeof REACTIONS;
  showComments: boolean;
}

const REACTIONS = {
  like: { emoji: "/Yellow/ThumbsUp.png", label: "Like" },
  muscle: { emoji: "/Yellow/RaisedFist.png", label: "Strong" },
  goal: { emoji: "/Yellow/Victory.png", label: "Goal" },
  champion: { emoji: "/Yellow/Horns.png", label: "Champion" },
  medal: { emoji: "/Yellow/Claps.png", label: "Medal" },
} as const;

const progressTypes = [
  {
    value: "workout",
    label: "Workout",
    icon: <Dumbbell className="h-4 w-4" />,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    value: "nutrition",
    label: "Nutrition",
    icon: <Utensils className="h-4 w-4" />,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    value: "measurement",
    label: "Measurement",
    icon: <Ruler className="h-4 w-4" />,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    value: "achievement",
    label: "Achievement",
    icon: <Trophy className="h-4 w-4" />,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
  },
];

const getDisplayName = (
  user: {
    display_option: "username" | "full_name" | "email";
    username: string | null;
    full_name: string | null;
    email: string | null;
  } | null
): string => {
  if (!user) return "Anonymous User";

  if (user.display_option === "username" && user.username) {
    return user.username;
  }
  if (user.display_option === "full_name" && user.full_name) {
    return user.full_name;
  }
  return user.email || "Anonymous User";
};

export default function ShareProgressPage() {
  const [posts, setPosts] = useState<ProgressPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState<{
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    email: string | null;
    display_option: "username" | "full_name" | "email";
  } | null>(null);
  const [selectedType, setSelectedType] = useState<
    "all" | (typeof progressTypes)[number]["value"]
  >("all");
  const [newPost, setNewPost] = useState<{
    title: string;
    content: string;
    progress_type: ProgressPost["progress_type"];
    media_urls: string[];
    tags: string[];
    is_premium: boolean;
    subscription_required: boolean;
    progress_details: {
      id: string;
      detail_type: string;
      value: string | number;
      unit: string;
    }[];
  }>({
    title: "",
    content: "",
    progress_type: "workout",
    media_urls: [],
    tags: [],
    is_premium: false,
    subscription_required: false,
    progress_details: [],
  });
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    postId: string | null;
  }>({
    isOpen: false,
    postId: null,
  });
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [isGeneratingDetails, setIsGeneratingDetails] = useState(false);
  const [editingComment, setEditingComment] = useState<{
    postId: string;
    commentId: string;
    content: string;
  } | null>(null);
  const [subscribing, setSubscribing] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    [key: string]: string;
  }>({});

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
    fetchPosts();
  }, []);

  useEffect(() => {
    const fetchSubscriptionStatuses = async () => {
      if (!user) return;

      try {
        const { data: subs, error } = await supabase
          .from("progress_subscriptions")
          .select("creator_id, status")
          .eq("subscriber_id", user.id);

        if (error) throw error;

        const statusMap = subs.reduce(
          (acc, sub) => ({
            ...acc,
            [sub.creator_id]: sub.status,
          }),
          {}
        );

        setSubscriptionStatus(statusMap);
      } catch (error) {
        console.error("Error fetching subscription statuses:", error);
      }
    };

    fetchSubscriptionStatuses();
  }, [user]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data: postsData, error } = await supabase
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
            user:profiles(*)
          )
        `
        )
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      if (postsData) {
        const formattedPosts: ProgressPost[] = (
          postsData as RawProgressPost[]
        ).map((post) => {
          // Initialize reactions with all types set to 0
          const initialReactions: { [K in keyof typeof REACTIONS]: number } = {
            like: 0,
            muscle: 0,
            goal: 0,
            medal: 0,
            champion: 0,
          };

          // Count reactions by type
          const reactionCounts = (post.reactions || []).reduce(
            (acc, reaction) => ({
              ...acc,
              [reaction.reaction_type]: (acc[reaction.reaction_type] || 0) + 1,
            }),
            initialReactions
          );

          // Find user's reaction if any
          const userReaction = post.reactions?.find(
            (r: { user_id: string }) => r.user_id === user?.id
          )?.reaction_type;

          // Format comments
          const formattedComments: Comment[] = (post.comments || []).map(
            (comment) => ({
              id: comment.id,
              content: comment.content,
              created_at: comment.created_at,
              user: {
                id: comment.user.id,
                full_name: comment.user.full_name,
                username: comment.user.username,
                avatar_url: comment.user.avatar_url,
                email: comment.user.email,
                display_option: comment.user.display_option,
                display_name: getDisplayName(comment.user),
              },
            })
          );

          return {
            ...post,
            expanded: false,
            showComments: false,
            user: {
              id: post.user.id,
              full_name: post.user.full_name,
              username: post.user.username,
              avatar_url: post.user.avatar_url,
              email: post.user.email,
              display_option: post.user.display_option,
              display_name: getDisplayName(post.user),
              streak: 0,
              achievements: [],
            },
            reactions: reactionCounts,
            user_reaction: userReaction,
            comments: formattedComments,
            progress_details: [],
          };
        });
        setPosts(formattedPosts);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast.error("Failed to fetch posts");
    } finally {
      setLoading(false);
    }
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { data: post, error: postError } = await supabase
        .from("progress_posts")
        .insert([
          {
            user_id: user.id,
            title: newPost.title,
            content: newPost.content,
            progress_type: newPost.progress_type,
            media_urls: newPost.media_urls,
            tags: newPost.tags,
            is_premium: newPost.is_premium,
            subscription_required: newPost.subscription_required,
          },
        ])
        .select()
        .single();

      if (postError) throw postError;

      if (newPost.progress_details.length > 0) {
        const { error: detailsError } = await supabase
          .from("progress_details")
          .insert(
            newPost.progress_details.map((detail) => ({
              progress_post_id: post.id,
              detail_type: detail.detail_type,
              value: detail.value,
              unit: detail.unit,
            }))
          );

        if (detailsError) throw detailsError;
      }

      // Create a new post object with the current user's information
      const newProgressPost: ProgressPost = {
        ...post,
        user: {
          ...user,
          display_name: getDisplayName(user),
          streak: 0,
          achievements: [],
        },
        expanded: false,
        reactions: {
          like: 0,
          muscle: 0,
          goal: 0,
          medal: 0,
          champion: 0,
        },
        user_reaction: undefined,
        comments: [],
        progress_details: newPost.progress_details.map((detail) => ({
          ...detail,
          progress: 0,
          id: Math.random().toString(),
        })),
        showComments: false,
      };

      // Add the new post to the beginning of the posts array
      setPosts((prevPosts) => [newProgressPost, ...prevPosts]);

      // Reset the form
      setNewPost({
        title: "",
        content: "",
        progress_type: "workout",
        media_urls: [],
        tags: [],
        is_premium: false,
        subscription_required: false,
        progress_details: [],
      });

      // Show success message
      toast.success("Progress shared successfully!", {
        duration: 5000,
        icon: "🎉",
      });

      // Scroll the new post into view
      setTimeout(() => {
        document.querySelector(".space-y-6")?.children[0]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Failed to create post");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    if (!user) return;

    setUploading(true);
    try {
      const file = e.target.files[0];

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }

      // Check file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload the file directly to the existing bucket
      const { error: uploadError, data } = await supabase.storage
        .from("progress-images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error details:", {
          message: uploadError.message,
          name: uploadError.name,
        });

        if (uploadError.message.includes("permission denied")) {
          toast.error(
            "You don't have permission to upload images. Please check your authentication."
          );
        } else if (uploadError.message.includes("bucket not found")) {
          toast.error("Storage bucket not found. Please contact support.");
        } else {
          toast.error(`Failed to upload image: ${uploadError.message}`);
        }
        return;
      }

      if (!data) {
        throw new Error("No data returned from upload");
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from("progress-images")
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new Error("Failed to get public URL");
      }

      setNewPost((prev) => ({
        ...prev,
        media_urls: [...prev.media_urls, urlData.publicUrl],
      }));

      toast.success("Image uploaded successfully");
    } catch (error: unknown) {
      console.error("Error uploading image:", error);
      if (error instanceof Error) {
        toast.error(`Error uploading image: ${error.message}`);
      } else {
        toast.error("An unexpected error occurred while uploading the image");
      }
    } finally {
      setUploading(false);
    }
  };

  const handleEditPost = async (postId: string) => {
    // TODO: Implement edit functionality
    toast.success(`Editing post ${postId} - coming soon!`);
  };

  const handleDeletePost = async (postId: string) => {
    setDeleteConfirmation({ isOpen: true, postId });
  };

  const confirmDelete = async () => {
    if (!user || !deleteConfirmation.postId) return;

    try {
      const { error } = await supabase
        .from("progress_posts")
        .delete()
        .eq("id", deleteConfirmation.postId)
        .eq("user_id", user.id);

      if (error) throw error;

      setPosts((prevPosts) =>
        prevPosts.filter((post) => post.id !== deleteConfirmation.postId)
      );
      toast.success("Post deleted successfully");
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    } finally {
      setDeleteConfirmation({ isOpen: false, postId: null });
    }
  };

  const handlePinPost = async (postId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("progress_posts")
        .update({ pinned: true })
        .eq("id", postId)
        .eq("user_id", user.id);

      if (error) throw error;

      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId ? { ...post, pinned: true } : post
        )
      );
      toast.success("Post pinned successfully");
    } catch (error) {
      console.error("Error pinning post:", error);
      toast.error("Failed to pin post");
    }
  };

  const handleSharePost = async (postId: string) => {
    try {
      // Construct the URL for the specific post
      const postUrl = `${window.location.origin}/social/share-progress/post/${postId}`;

      // Try to use the Web Share API if available
      if (navigator.share) {
        await navigator.share({
          title: "Check out this fitness progress!",
          text: "Take a look at this fitness progress update!",
          url: postUrl,
        });

        toast.success("Post shared successfully!", {
          description: "The post has been shared via your device's share menu.",
        });
      } else {
        // Fallback to clipboard copy
        await navigator.clipboard.writeText(postUrl);

        toast.success("Link copied!", {
          description: "Post link has been copied to your clipboard.",
          action: {
            label: "View Post",
            onClick: () => window.open(postUrl, "_blank"),
          },
        });
      }
    } catch (error) {
      console.error("Error sharing post:", error);
      toast.error("Failed to share post", {
        description: "There was an error sharing this post. Please try again.",
      });
    }
  };

  const handleTitleGeneration = async () => {
    try {
      if (!newPost.title?.trim()) {
        toast.error("Please enter some text to generate or improve a title");
        return;
      }

      setIsGeneratingTitle(true);
      const generatedTitle = await generateWorkoutTitle(newPost.title);
      setNewPost((prev) => ({
        ...prev,
        title: generatedTitle,
      }));
      toast.success("Title generated successfully!");
    } catch (error) {
      console.error("Error generating title:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to generate title"
      );
    } finally {
      setIsGeneratingTitle(false);
    }
  };

  const handleDescriptionGeneration = async () => {
    try {
      if (!newPost.content?.trim()) {
        toast.error(
          "Please enter some text to generate or improve a description"
        );
        return;
      }

      setIsGeneratingDescription(true);
      const generatedDescription = await generateWorkoutDescription(
        newPost.content
      );
      setNewPost((prev) => ({
        ...prev,
        content: generatedDescription,
      }));
      toast.success("Description generated successfully!");
    } catch (error) {
      console.error("Error generating description:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to generate description"
      );
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const handleDetailsGeneration = async () => {
    try {
      if (!newPost.content?.trim()) {
        toast.error("Please enter a description to generate progress details");
        return;
      }

      setIsGeneratingDetails(true);
      const generatedDetails = await generateProgressDetails(newPost.content);
      setNewPost((prev) => ({
        ...prev,
        progress_details: generatedDetails.map((detail) => ({
          ...detail,
          id: Math.random().toString(),
        })),
      }));
      toast.success("Progress details generated successfully!");
    } catch (error) {
      console.error("Error generating details:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to generate details"
      );
    } finally {
      setIsGeneratingDetails(false);
    }
  };

  const handleReaction = async (
    postId: string,
    reactionType: keyof typeof REACTIONS
  ) => {
    if (!user) return;

    try {
      // Get all reactions by this user for this post
      const { data: existingReactions } = await supabase
        .from("progress_reactions")
        .select("id, reaction_type")
        .match({
          progress_post_id: postId,
          user_id: user.id,
        });

      const existingReaction = existingReactions?.[0];

      if (existingReaction) {
        if (existingReaction.reaction_type === reactionType) {
          // Remove reaction if clicking the same one
          await supabase.from("progress_reactions").delete().match({
            progress_post_id: postId,
            user_id: user.id,
          });

          // Update local state
          setPosts(
            posts.map((post) => {
              if (post.id === postId) {
                const newReactions = { ...post.reactions };
                newReactions[reactionType] = Math.max(
                  0,
                  newReactions[reactionType] - 1
                );
                return {
                  ...post,
                  reactions: newReactions,
                  user_reaction: undefined,
                };
              }
              return post;
            })
          );
        } else {
          // Change reaction type
          await supabase
            .from("progress_reactions")
            .update({ reaction_type: reactionType })
            .match({
              progress_post_id: postId,
              user_id: user.id,
            });

          // Update local state
          setPosts(
            posts.map((post) => {
              if (post.id === postId) {
                const newReactions = { ...post.reactions };
                newReactions[
                  existingReaction.reaction_type as keyof typeof REACTIONS
                ] = Math.max(
                  0,
                  newReactions[
                    existingReaction.reaction_type as keyof typeof REACTIONS
                  ] - 1
                );
                newReactions[reactionType] =
                  (newReactions[reactionType] || 0) + 1;
                return {
                  ...post,
                  reactions: newReactions,
                  user_reaction: reactionType,
                };
              }
              return post;
            })
          );
        }
      } else {
        // Add new reaction
        await supabase.from("progress_reactions").insert({
          progress_post_id: postId,
          user_id: user.id,
          reaction_type: reactionType,
        });

        // Update local state
        setPosts(
          posts.map((post) => {
            if (post.id === postId) {
              return {
                ...post,
                reactions: {
                  ...post.reactions,
                  [reactionType]: (post.reactions[reactionType] || 0) + 1,
                },
                user_reaction: reactionType,
              };
            }
            return post;
          })
        );
      }
    } catch (error) {
      console.error("Error handling reaction:", error);
      toast.error("Failed to update reaction");
    }
  };

  const handleComment = async (postId: string, content: string) => {
    if (!user || !content.trim()) return;

    try {
      const { data: commentData, error } = await supabase
        .from("progress_comments")
        .insert({
          progress_post_id: postId,
          user_id: user.id,
          content: content.trim(),
        })
        .select(
          `
          id,
          content,
          created_at,
          user:profiles(
            id,
            full_name,
            username,
            avatar_url,
            email,
            display_option
          )
        `
        )
        .single();

      if (error) throw error;

      if (!commentData || !commentData.user) {
        throw new Error("No comment data returned");
      }

      // Format the comment with proper user display name
      const formattedComment: Comment = {
        id: commentData.id,
        content: commentData.content,
        created_at: commentData.created_at,
        user: {
          id: commentData.user.id,
          full_name: commentData.user.full_name,
          username: commentData.user.username,
          avatar_url: commentData.user.avatar_url,
          email: commentData.user.email,
          display_option: commentData.user.display_option,
          display_name: getDisplayName(commentData.user),
        },
      };

      // Update local state
      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              comments: [...post.comments, formattedComment],
            };
          }
          return post;
        })
      );

      toast.success("Comment added successfully!");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    }
  };

  const handleEditComment = async (
    postId: string,
    commentId: string,
    newContent: string
  ) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("progress_comments")
        .update({
          content: newContent,
          edited: true,
        })
        .eq("id", commentId)
        .eq("user_id", user.id)
        .select();

      if (error) throw error;

      // Update local state
      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              comments: post.comments.map((comment) =>
                comment.id === commentId
                  ? { ...comment, content: newContent, edited: true }
                  : comment
              ),
            };
          }
          return post;
        })
      );

      // Clear editing state
      setEditingComment(null);
      toast.success("Comment updated successfully");
    } catch (error) {
      console.error("Error updating comment:", error);
      toast.error("Failed to update comment");
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("progress_comments")
        .delete()
        .eq("id", commentId)
        .eq("user_id", user.id);

      if (error) throw error;

      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              comments: post.comments.filter((c) => c.id !== commentId),
            };
          }
          return post;
        })
      );

      toast.success("Comment deleted");
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment");
    }
  };

  const handleSubscribe = async (creatorId: string) => {
    if (!user) return;

    try {
      setSubscribing(true);

      // Check if subscription already exists
      const { data: existingSub } = await supabase
        .from("progress_subscriptions")
        .select("*")
        .eq("subscriber_id", user.id)
        .eq("creator_id", creatorId)
        .single();

      if (existingSub) {
        // If already subscribed, delete the subscription
        const { error } = await supabase
          .from("progress_subscriptions")
          .delete()
          .eq("id", existingSub.id);

        if (error) throw error;

        setSubscriptionStatus((prev) => {
          const newStatus = { ...prev };
          delete newStatus[creatorId];
          return newStatus;
        });

        toast.success("Subscription cancelled");
      } else {
        // Create new subscription
        const { error } = await supabase.from("progress_subscriptions").insert({
          subscriber_id: user.id,
          creator_id: creatorId,
          plan_type: "premium",
          status: "active",
          started_at: new Date().toISOString(),
        });

        if (error) throw error;

        setSubscriptionStatus((prev) => ({
          ...prev,
          [creatorId]: "active",
        }));

        toast.success("Successfully subscribed!");
      }
    } catch (error) {
      console.error("Error handling subscription:", error);
      toast.error("Failed to process subscription");
    } finally {
      setSubscribing(false);
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

  return (
    <div className="flex-1 relative flex flex-col">
      {/* Breadcrumb */}
      <div className="container py-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/social">Social</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbPage>Share Progress</BreadcrumbPage>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 rounded-3xl mx-4 my-6">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="container relative py-8 md:py-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4 px-4 md:px-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
                <Star className="h-4 w-4" />
                <span className="text-sm font-medium">Track Your Journey</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                Share Your Progress
                <span className="text-primary"> with the Community</span>
              </h1>
              <p className="text-base text-muted-foreground">
                Document your fitness journey, celebrate achievements, and
                inspire others with your progress.
              </p>
              <div className="flex flex-wrap gap-3">
                {progressTypes.map((type) => (
                  <div
                    key={type.value}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl text-sm backdrop-blur-sm bg-white/10 border border-white/20",
                      type.bgColor
                    )}
                  >
                    <div className={type.color}>{type.icon}</div>
                    <span className="font-medium">{type.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
              <Image
                src="/images/hero/Track_Your_Journey.jpg"
                alt="Share Progress"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-white/20 blur-sm" />
                    <Avatar className="h-12 w-12 ring-2 ring-white/20">
                      <AvatarImage src={user?.avatar_url} />
                      <AvatarFallback>
                        {user?.full_name?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div>
                    <p className="font-medium">
                      {user?.full_name || "Your Name"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Ready to share your progress?
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Post Form */}
      <div className="container py-8">
        <Card className="mb-8">
          <CardContent className="p-6">
            <form onSubmit={handlePostSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <div className="flex gap-2">
                  <Input
                    id="title"
                    placeholder="Give your progress post a title..."
                    value={newPost.title}
                    onChange={(e) =>
                      setNewPost({ ...newPost, title: e.target.value })
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    onClick={handleTitleGeneration}
                    disabled={isGeneratingTitle}
                  >
                    {isGeneratingTitle ? (
                      <div className="animate-spin">⚪</div>
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Use quotes for a new title, e.g. &quot;leg day personal
                  record&quot;
                </p>
              </div>
              <div className="space-y-2">
                <Label>Progress Type</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {progressTypes.map((type) => (
                    <Button
                      key={type.value}
                      type="button"
                      variant={
                        newPost.progress_type === type.value
                          ? "default"
                          : "outline"
                      }
                      className="flex items-center gap-2"
                      onClick={() =>
                        setNewPost({
                          ...newPost,
                          progress_type:
                            type.value as ProgressPost["progress_type"],
                        })
                      }
                    >
                      {type.icon}
                      <span>{type.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Details</Label>
                <div className="flex gap-2">
                  <Textarea
                    id="content"
                    placeholder="Share your progress details..."
                    value={newPost.content}
                    onChange={(e) =>
                      setNewPost({ ...newPost, content: e.target.value })
                    }
                    className="min-h-[100px]"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    onClick={handleDescriptionGeneration}
                    disabled={isGeneratingDescription}
                  >
                    {isGeneratingDescription ? (
                      <div className="animate-spin">⚪</div>
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Use quotes for a new description, e.g. &quot;intense leg
                  workout with squats&quot;
                </p>
              </div>

              {/* Progress Details */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Progress Details</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleDetailsGeneration}
                      disabled={isGeneratingDetails}
                      className="flex items-center gap-2"
                    >
                      {isGeneratingDetails ? (
                        <div className="animate-spin">⚪</div>
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      Generate All Details
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setNewPost({
                          ...newPost,
                          progress_details: [
                            ...newPost.progress_details,
                            {
                              id: Math.random().toString(),
                              detail_type: "",
                              value: "",
                              unit: "",
                            },
                          ],
                        })
                      }
                    >
                      Add Detail
                    </Button>
                  </div>
                </div>
                {newPost.progress_details.map((detail, index) => (
                  <div
                    key={detail.id}
                    className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end"
                  >
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Input
                        value={detail.detail_type}
                        onChange={(e) => {
                          const newDetails = [...newPost.progress_details];
                          newDetails[index] = {
                            ...detail,
                            detail_type: e.target.value,
                          };
                          setNewPost({
                            ...newPost,
                            progress_details: newDetails,
                          });
                        }}
                        placeholder="e.g., Bench Press Weight"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Value</Label>
                      <Input
                        type="number"
                        value={detail.value}
                        onChange={(e) => {
                          const newDetails = [...newPost.progress_details];
                          newDetails[index] = {
                            ...detail,
                            value: e.target.value,
                          };
                          setNewPost({
                            ...newPost,
                            progress_details: newDetails,
                          });
                        }}
                        placeholder="Enter value"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Unit</Label>
                      <Input
                        value={detail.unit}
                        onChange={(e) => {
                          const newDetails = [...newPost.progress_details];
                          newDetails[index] = {
                            ...detail,
                            unit: e.target.value,
                          };
                          setNewPost({
                            ...newPost,
                            progress_details: newDetails,
                          });
                        }}
                        placeholder="e.g., lbs, kg, reps"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setNewPost({
                          ...newPost,
                          progress_details: newPost.progress_details.filter(
                            (d) => d.id !== detail.id
                          ),
                        });
                      }}
                      className="text-destructive"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">
                  Add your progress details or use AI to generate them based on
                  your description
                </p>
              </div>

              {/* Media Upload */}
              <div className="space-y-2">
                <Label>Media</Label>
                <div className="flex flex-col gap-4">
                  {newPost.media_urls.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {newPost.media_urls.map((url, index) => (
                        <Card key={index} className="overflow-hidden group">
                          <div className="relative aspect-square">
                            <Image
                              src={url}
                              alt={`Preview ${index + 1}`}
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                              quality={95}
                              priority={index === 0}
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setNewPost((prev) => ({
                                    ...prev,
                                    media_urls: prev.media_urls.filter(
                                      (url, idx) => idx !== index
                                    ),
                                  }));
                                }}
                                className="bg-destructive text-destructive-foreground rounded-full p-2 hover:bg-destructive/90 transition-colors"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M18 6 6 18" />
                                  <path d="m6 6 12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="media-upload"
                      disabled={uploading}
                    />
                    <label
                      htmlFor="media-upload"
                      className={cn(
                        "flex items-center justify-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-accent w-full sm:w-auto h-10",
                        uploading && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {uploading ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          <span>Upload Image</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              </div>

              {/* Premium Options */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label>Premium Options</Label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    className={cn(
                      "relative group cursor-pointer rounded-xl overflow-hidden transition-all duration-300",
                      newPost.is_premium
                        ? "bg-blue-500 hover:bg-blue-600"
                        : "bg-muted hover:bg-muted/80"
                    )}
                    onClick={() =>
                      setNewPost({
                        ...newPost,
                        is_premium: !newPost.is_premium,
                        subscription_required: false,
                      })
                    }
                  >
                    <div className="absolute inset-0 opacity-20 bg-grid-white/10" />
                    <div className="relative p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="rounded-xl bg-white/20 p-2">
                            <Crown className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h4
                              className={cn(
                                "font-medium",
                                newPost.is_premium
                                  ? "text-white"
                                  : "text-foreground"
                              )}
                            >
                              Premium Content
                            </h4>
                            <p
                              className={cn(
                                "text-sm",
                                newPost.is_premium
                                  ? "text-white/80"
                                  : "text-muted-foreground"
                              )}
                            >
                              Make this post exclusive
                            </p>
                          </div>
                        </div>
                        <span
                          className={cn(
                            "px-2 py-1 rounded-md text-sm font-semibold",
                            newPost.is_premium
                              ? "bg-blue-600 text-white"
                              : "bg-muted-foreground/20 text-muted-foreground"
                          )}
                        >
                          PRO
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <div
                          className={cn(
                            "flex items-center gap-1 text-sm rounded-full px-2.5 py-1 bg-white/20",
                            newPost.is_premium
                              ? "text-white"
                              : "text-foreground"
                          )}
                        >
                          <Star className="h-3.5 w-3.5" />
                          <span className="text-xs">Enhanced visibility</span>
                        </div>
                        <div
                          className={cn(
                            "flex items-center gap-1 text-sm rounded-full px-2.5 py-1 bg-white/20",
                            newPost.is_premium
                              ? "text-white"
                              : "text-foreground"
                          )}
                        >
                          <Award className="h-3.5 w-3.5" />
                          <span className="text-xs">Special badge</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    className={cn(
                      "relative group cursor-pointer rounded-xl overflow-hidden transition-all duration-300",
                      newPost.subscription_required
                        ? "bg-violet-500 hover:bg-violet-600"
                        : "bg-muted hover:bg-muted/80"
                    )}
                    onClick={() =>
                      setNewPost({
                        ...newPost,
                        subscription_required: !newPost.subscription_required,
                        is_premium: false,
                      })
                    }
                  >
                    <div className="absolute inset-0 opacity-20 bg-grid-white/10" />
                    <div className="relative p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="rounded-xl bg-white/20 p-2">
                            <Lock className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h4
                              className={cn(
                                "font-medium",
                                newPost.subscription_required
                                  ? "text-white"
                                  : "text-foreground"
                              )}
                            >
                              Subscribers Only
                            </h4>
                            <p
                              className={cn(
                                "text-sm",
                                newPost.subscription_required
                                  ? "text-white/80"
                                  : "text-muted-foreground"
                              )}
                            >
                              Restrict access to subscribers
                            </p>
                          </div>
                        </div>
                        <span
                          className={cn(
                            "px-2 py-1 rounded-md text-sm font-semibold",
                            newPost.subscription_required
                              ? "bg-violet-600 text-white"
                              : "bg-muted-foreground/20 text-muted-foreground"
                          )}
                        >
                          SUB
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <div
                          className={cn(
                            "flex items-center gap-1 text-sm rounded-full px-2.5 py-1 bg-white/20",
                            newPost.subscription_required
                              ? "text-white"
                              : "text-foreground"
                          )}
                        >
                          <Star className="h-3.5 w-3.5" />
                          <span className="text-xs">Exclusive access</span>
                        </div>
                        <div
                          className={cn(
                            "flex items-center gap-1 text-sm rounded-full px-2.5 py-1 bg-white/20",
                            newPost.subscription_required
                              ? "text-white"
                              : "text-foreground"
                          )}
                        >
                          <Award className="h-3.5 w-3.5" />
                          <span className="text-xs">Premium badge</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {(newPost.is_premium || newPost.subscription_required) && (
                  <div className="rounded-lg bg-muted p-4 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Lock className="h-4 w-4" />
                      <p>Premium content will only be visible to subscribers</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10"
                  disabled={uploading}
                  onClick={() => {
                    setNewPost({
                      title: "",
                      content: "",
                      progress_type: "workout",
                      media_urls: [],
                      tags: [],
                      is_premium: false,
                      subscription_required: false,
                      progress_details: [],
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="h-10" disabled={uploading}>
                  <Send className="h-4 w-4 mr-2" />
                  Share Progress
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Progress Type Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Button
            variant={selectedType === "all" ? "default" : "outline"}
            onClick={() => setSelectedType("all")}
            className="rounded-md"
          >
            All Progress
          </Button>
          {progressTypes.map((type) => (
            <Button
              key={type.value}
              type="button"
              variant={selectedType === type.value ? "default" : "outline"}
              className="flex items-center gap-2 rounded-md"
              onClick={() => setSelectedType(type.value)}
            >
              {type.icon}
              <span>{type.label}</span>
            </Button>
          ))}
        </div>

        {/* Progress Feed */}
        <div className="space-y-6">
          {posts.length === 0 ? (
            <Card className="p-6">
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  No Progress Posts Yet
                </h3>
                <p className="text-muted-foreground mb-4">
                  Be the first to share your fitness journey with the community!
                </p>
                <Button
                  onClick={() => {
                    setNewPost({
                      title: "",
                      content: "",
                      progress_type: "workout",
                      media_urls: [],
                      tags: [],
                      is_premium: false,
                      subscription_required: false,
                      progress_details: [],
                    });
                  }}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Share Your First Progress
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {posts
                .filter(
                  (post) =>
                    selectedType === "all" ||
                    post.progress_type === selectedType
                )
                .map((post) => (
                  <Card
                    key={post.id}
                    className="group flex flex-col bg-gradient-to-b from-background to-background/95 overflow-hidden border-border hover:border-border/80 transition-colors"
                  >
                    {/* Header Section - Fixed height */}
                    <div className="relative p-4 bg-gradient-to-r from-blue-500/20 via-violet-500/20 to-background border-b border-border/50">
                      <div className="flex items-center justify-between">
                        {/* Profile Section with enhanced styling */}
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/20 via-violet-500/20 to-background blur-md" />
                            <Avatar className="h-12 w-12 ring-2 ring-white/20 relative">
                              <AvatarImage
                                src={post.user.avatar_url || ""}
                                className="object-cover"
                              />
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-violet-600 text-white font-semibold">
                                {post.user.display_name
                                  .substring(0, 2)
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {post.user.streak > 0 && (
                              <div className="absolute -bottom-1 -right-1 bg-yellow-500 rounded-full p-1.5 ring-2 ring-background">
                                <Flame className="h-3 w-3 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-base">
                                {post.user.display_name}
                              </span>
                              {post.pinned && (
                                <div className="bg-blue-500/10 text-blue-500 rounded-full px-2 py-0.5 text-xs font-medium">
                                  Pinned
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {new Date(post.created_at).toLocaleDateString(
                                undefined,
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                          {post.subscription_required ? (
                            <Button
                              size="sm"
                              className={cn(
                                "bg-gradient-to-r shadow-md transition-all",
                                subscriptionStatus[post.user.id] === "active"
                                  ? "from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                                  : "from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white"
                              )}
                              onClick={() => handleSubscribe(post.user.id)}
                              disabled={subscribing}
                            >
                              {subscribing ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                              ) : subscriptionStatus[post.user.id] ===
                                "active" ? (
                                <>
                                  <User className="h-4 w-4 mr-1" />
                                  Subscribed
                                </>
                              ) : (
                                <>
                                  <Lock className="h-4 w-4 mr-1" />
                                  Subscribe
                                </>
                              )}
                            </Button>
                          ) : post.is_premium ? (
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white shadow-md"
                            >
                              <Crown className="h-4 w-4 mr-1" />
                              Premium
                            </Button>
                          ) : null}

                          {/* More Options Menu */}
                          <Select
                            onValueChange={(value) => {
                              switch (value) {
                                case "edit":
                                  handleEditPost(post.id);
                                  break;
                                case "delete":
                                  handleDeletePost(post.id);
                                  break;
                                case "pin":
                                  handlePinPost(post.id);
                                  break;
                                case "share":
                                  handleSharePost(post.id);
                                  break;
                              }
                            }}
                          >
                            <SelectTrigger className="h-8 w-8 p-0">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-4 w-4"
                              >
                                <circle cx="12" cy="12" r="1" />
                                <circle cx="12" cy="5" r="1" />
                                <circle cx="12" cy="19" r="1" />
                              </svg>
                            </SelectTrigger>
                            <SelectContent
                              className="w-fit p-3 bg-background/95 backdrop-blur-sm border-border"
                              align="start"
                            >
                              {post.user.id === user?.id && (
                                <>
                                  <SelectItem value="edit">
                                    <div className="flex items-center gap-2">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="h-4 w-4"
                                      >
                                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                        <path d="m15 5 4 4" />
                                      </svg>
                                      <span>Edit Post</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="pin">
                                    <div className="flex items-center gap-2">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="h-4 w-4"
                                      >
                                        <path d="m5 9 4-4 4 4" />
                                        <path d="M9 5v14" />
                                      </svg>
                                      <span>Pin to Top</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem
                                    value="delete"
                                    className="text-destructive"
                                  >
                                    <div className="flex items-center gap-2">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="h-4 w-4"
                                      >
                                        <path d="M3 6h18" />
                                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                      </svg>
                                      <span>Delete Post</span>
                                    </div>
                                  </SelectItem>
                                </>
                              )}
                              <SelectItem value="share">
                                <div className="flex items-center gap-2">
                                  <Share2 className="h-4 w-4" />
                                  <span>Share Post</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Content Section - Controlled height */}
                    <div className="flex-1 p-4 space-y-4 overflow-hidden">
                      <div>
                        <h3 className="text-lg font-semibold mb-2 line-clamp-1">
                          {post.title}
                        </h3>
                        <div className="relative">
                          <div
                            className={cn(
                              "text-sm text-muted-foreground",
                              post.expanded ? "line-clamp-none" : "line-clamp-2"
                            )}
                          >
                            {post.content}
                          </div>
                          {post.content.length > 100 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setPosts((prevPosts) =>
                                  prevPosts.map((p) =>
                                    p.id === post.id
                                      ? { ...p, expanded: !p.expanded }
                                      : p
                                  )
                                )
                              }
                              className="mt-1 h-6 text-xs font-medium text-primary hover:text-primary/80 hover:bg-transparent hover:underline-offset-4 hover:underline p-0"
                            >
                              {post.expanded ? "Show Less" : "Read More"}
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Media Section - Fixed aspect ratio */}
                      {post.media_urls.length > 0 && (
                        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted/50">
                          <Image
                            src={post.media_urls[0]}
                            alt={post.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            quality={95}
                            priority={true}
                          />
                          {post.media_urls.length > 1 && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="secondary"
                                size="sm"
                                className="gap-2"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="h-4 w-4"
                                >
                                  <rect
                                    width="18"
                                    height="14"
                                    x="3"
                                    y="5"
                                    rx="2"
                                  />
                                  <path d="M12 12v.01" />
                                  <path d="M16 12v.01" />
                                  <path d="M8 12v.01" />
                                </svg>
                                View All {post.media_urls.length} Images
                              </Button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Progress Details - Compact view */}
                      {post.progress_details &&
                        post.progress_details.length > 0 && (
                          <div className="max-h-[80px] overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-muted">
                            <div className="grid grid-cols-2 gap-2">
                              {post.progress_details.map((detail) => (
                                <div
                                  key={detail.id}
                                  className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                                >
                                  <span className="text-xs text-muted-foreground capitalize">
                                    {detail.detail_type.replace("_", " ")}
                                  </span>
                                  <span className="text-xs font-medium">
                                    {detail.value} {detail.unit}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>

                    {/* Action Bar - Fixed height */}
                    <div className="border-t border-border">
                      <div className="grid grid-cols-3 divide-x divide-border">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-10 rounded-none hover:bg-accent flex-1"
                            >
                              <div className="flex items-center">
                                <Award className="h-4 w-4 mr-2" />
                                React
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
                                      (sum, count) => sum + count,
                                      0
                                    )}
                                  </span>
                                </div>
                              </div>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-fit p-3 bg-background/95 backdrop-blur-sm border-border"
                            align="start"
                          >
                            <div className="flex gap-3">
                              {Object.entries(REACTIONS).map(
                                ([type, { emoji, label }]) => {
                                  const isSelected =
                                    post.user_reaction === type;
                                  return (
                                    <button
                                      key={type}
                                      onClick={() =>
                                        handleReaction(
                                          post.id,
                                          type as keyof typeof REACTIONS
                                        )
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
                            <Button
                              variant="ghost"
                              className="h-10 rounded-none hover:bg-accent"
                              data-post-id={post.id}
                            >
                              <MessageCircle className="h-4 w-4 mr-2" />
                              Comment
                              {post.comments.length > 0 && (
                                <span className="ml-1 text-xs font-medium text-primary">
                                  {post.comments.length}
                                </span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-80 p-0 bg-background/95 backdrop-blur-sm border-border"
                            align="start"
                          >
                            <div className="flex flex-col h-[400px]">
                              {/* Comments Section */}
                              <ScrollArea className="flex-1 p-4 border-b">
                                {post.comments.length > 0 ? (
                                  <div className="space-y-4">
                                    {post.comments.map((comment) => (
                                      <div
                                        key={comment.id}
                                        className="flex gap-3 group"
                                      >
                                        <Avatar className="h-8 w-8 flex-shrink-0">
                                          <AvatarImage
                                            src={comment.user.avatar_url || ""}
                                          />
                                          <AvatarFallback>
                                            {comment.user.display_name
                                              .substring(0, 2)
                                              .toUpperCase()}
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
                                          {editingComment?.commentId ===
                                          comment.id ? (
                                            <form
                                              onSubmit={(e) => {
                                                e.preventDefault();
                                                if (
                                                  editingComment.content.trim()
                                                ) {
                                                  handleEditComment(
                                                    post.id,
                                                    comment.id,
                                                    editingComment.content
                                                  );
                                                }
                                              }}
                                              className="flex items-end gap-2"
                                            >
                                              <Textarea
                                                value={editingComment.content}
                                                onChange={(e) =>
                                                  setEditingComment({
                                                    ...editingComment,
                                                    content: e.target.value,
                                                  })
                                                }
                                                className="flex-1 min-h-[60px] resize-none"
                                              />
                                              <div className="flex flex-col gap-2">
                                                <Button type="submit" size="sm">
                                                  Save
                                                </Button>
                                                <Button
                                                  type="button"
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() =>
                                                    setEditingComment(null)
                                                  }
                                                >
                                                  Cancel
                                                </Button>
                                              </div>
                                            </form>
                                          ) : (
                                            <p className="text-sm text-foreground/90">
                                              {comment.content}
                                            </p>
                                          )}
                                        </div>
                                        {comment.user.id === user?.id &&
                                          !editingComment && (
                                            <Popover>
                                              <PopoverTrigger asChild>
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                  <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    className="h-4 w-4"
                                                  >
                                                    <circle
                                                      cx="12"
                                                      cy="12"
                                                      r="1"
                                                    />
                                                    <circle
                                                      cx="12"
                                                      cy="5"
                                                      r="1"
                                                    />
                                                    <circle
                                                      cx="12"
                                                      cy="19"
                                                      r="1"
                                                    />
                                                  </svg>
                                                </Button>
                                              </PopoverTrigger>
                                              <PopoverContent
                                                className="w-fit p-2"
                                                align="end"
                                              >
                                                <div className="flex flex-col gap-1">
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="justify-start"
                                                    onClick={() => {
                                                      setEditingComment({
                                                        postId: post.id,
                                                        commentId: comment.id,
                                                        content:
                                                          comment.content,
                                                      });
                                                    }}
                                                  >
                                                    <svg
                                                      xmlns="http://www.w3.org/2000/svg"
                                                      viewBox="0 0 24 24"
                                                      fill="none"
                                                      stroke="currentColor"
                                                      strokeWidth="2"
                                                      strokeLinecap="round"
                                                      strokeLinejoin="round"
                                                      className="h-4 w-4 mr-2"
                                                    >
                                                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                                      <path d="m15 5 4 4" />
                                                    </svg>
                                                    Edit
                                                  </Button>
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="justify-start text-destructive"
                                                    onClick={() =>
                                                      handleDeleteComment(
                                                        post.id,
                                                        comment.id
                                                      )
                                                    }
                                                  >
                                                    <svg
                                                      xmlns="http://www.w3.org/2000/svg"
                                                      viewBox="0 0 24 24"
                                                      fill="none"
                                                      stroke="currentColor"
                                                      strokeWidth="2"
                                                      strokeLinecap="round"
                                                      strokeLinejoin="round"
                                                      className="h-4 w-4 mr-2"
                                                    >
                                                      <path d="M3 6h18" />
                                                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                                    </svg>
                                                    Delete
                                                  </Button>
                                                </div>
                                              </PopoverContent>
                                            </Popover>
                                          )}
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
                                  const textarea =
                                    form.querySelector("textarea");
                                  if (!textarea) return;

                                  const content = textarea.value.trim();
                                  if (!content) return;

                                  await handleComment(post.id, content);
                                  textarea.value = "";
                                }}
                                className="p-4 space-y-4 border-t bg-muted/50"
                              >
                                <div className="flex gap-2 items-start">
                                  <Avatar className="h-8 w-8 flex-shrink-0">
                                    <AvatarImage src={user?.avatar_url || ""} />
                                    <AvatarFallback>
                                      {user
                                        ? getDisplayName(user)
                                            .substring(0, 2)
                                            .toUpperCase()
                                        : "U"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <Textarea
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
                        <Button
                          variant="ghost"
                          className="h-10 rounded-none hover:bg-accent"
                          onClick={() => handleSharePost(post.id)}
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmation.isOpen}
        onOpenChange={(isOpen) =>
          setDeleteConfirmation({ isOpen, postId: null })
        }
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Post</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Are you sure you want to delete this post? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() =>
                setDeleteConfirmation({ isOpen: false, postId: null })
              }
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              className="gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
              Delete Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
