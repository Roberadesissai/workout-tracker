"use client";

import { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Share2,
  X,
  Repeat,
  Bookmark,
  UserPlus,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/utils/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  user: {
    id: string;
    full_name: string;
    avatar_url: string;
    email: string;
    username: string;
    display_option: "email" | "username" | "full_name";
  };
  reactions?: {
    type: string;
    count: number;
    userReaction?: string;
  }[];
}

const REACTION_TYPES = [
  { type: "like", icon: "👍", label: "Like", color: "text-blue-500" },
  { type: "laugh", icon: "😄", label: "Laugh", color: "text-yellow-500" },
  { type: "wow", icon: "😮", label: "Wow", color: "text-purple-500" },
  { type: "fire", icon: "🔥", label: "Fire", color: "text-orange-500" },
  { type: "dislike", icon: "👎", label: "Dislike", color: "text-red-500" },
  // Additional gym-related reactions (these will be added to database)
  { type: "muscle", icon: "💪", label: "Strong", color: "text-indigo-500" },
  { type: "workout", icon: "🏋️‍♂️", label: "Workout", color: "text-green-500" },
  { type: "goal", icon: "🎯", label: "Goal", color: "text-pink-500" },
  { type: "medal", icon: "🏅", label: "Medal", color: "text-amber-500" },
  { type: "champion", icon: "🏆", label: "Champion", color: "text-violet-500" },
] as const;

type ReactionType = (typeof REACTION_TYPES)[number]["type"];

interface PostActionsProps {
  postId: string;
  userId: string;
  reactions: number;
  reactionTypes?: { [key: string]: number };
  comments: number;
  userReaction?: ReactionType;
  onUpdate: () => void;
  onReaction?: (postId: string, reactionType: ReactionType) => Promise<void>;
  onComment?: (postId: string, content: string) => Promise<void>;
  authorId: string;
  isFollowing?: boolean;
  onFollow?: (userId: string) => Promise<void>;
  postContent?: string;
  postMedia?: string[];
  author?: {
    id: string;
    full_name: string;
    username: string;
    avatar_url: string;
    email: string;
    display_option: "email" | "username" | "full_name";
  };
}

export default function PostActions({
  postId,
  userId,
  reactions,
  reactionTypes = {},
  comments,
  userReaction,
  onUpdate,
  onReaction,
  onComment,
  authorId,
  isFollowing,
  onFollow,
  postContent,
  postMedia,
  author,
}: PostActionsProps) {
  const [isReacting, setIsReacting] = useState(false);
  const [postComments, setPostComments] = useState<Comment[]>([]);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [showReactions, setShowReactions] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isFollowingAuthor, setIsFollowingAuthor] = useState(isFollowing);
  const [currentReaction, setCurrentReaction] = useState<
    ReactionType | undefined
  >(userReaction);
  const commentsRef = useRef<HTMLDivElement>(null);
  const commentSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isCommentsOpen) {
      fetchComments();
    }
  }, [isCommentsOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is outside both the comment button and comment section
      const isOutsideCommentButton =
        commentsRef.current &&
        !commentsRef.current.contains(event.target as Node);
      const isOutsideCommentSection =
        commentSectionRef.current &&
        !commentSectionRef.current.contains(event.target as Node);

      if (isOutsideCommentButton && isOutsideCommentSection) {
        setIsCommentsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setCurrentReaction(userReaction);
  }, [userReaction]);

  const fetchComments = async () => {
    try {
      // First fetch comments
      const { data: commentsData, error: commentsError } = await supabase
        .from("comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: false });

      if (commentsError) {
        console.error("Error fetching comments:", commentsError.message);
        throw commentsError;
      }

      if (!commentsData || commentsData.length === 0) {
        setPostComments([]);
        return;
      }

      // Then fetch user profiles for these comments
      const userIds = [
        ...new Set(commentsData.map((comment) => comment.user_id)),
      ];
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("id", userIds);

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError.message);
        throw profilesError;
      }

      // Map profiles to comments
      const transformedComments: Comment[] = commentsData.map((comment) => {
        const userProfile = profilesData?.find(
          (profile) => profile.id === comment.user_id
        );
        return {
          id: comment.id,
          content: comment.content,
          created_at: comment.created_at,
          user_id: comment.user_id,
          user: {
            id: userProfile?.id || comment.user_id,
            full_name: userProfile?.full_name || "Unknown User",
            avatar_url: userProfile?.avatar_url || "",
            email: userProfile?.email || "",
            username: userProfile?.username || "",
            display_option: userProfile?.display_option || "full_name",
          },
          reactions: [],
        };
      });

      setPostComments(transformedComments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast.error("Failed to load comments");
    }
  };

  const handleReaction = async (reactionType: ReactionType) => {
    try {
      if (!onReaction) return;
      setIsReacting(true);

      // If clicking the same reaction, we'll remove it
      if (currentReaction === reactionType) {
        setCurrentReaction(undefined);
      } else {
        setCurrentReaction(reactionType);
      }

      setShowReactions(false);
      await onReaction(postId, reactionType);
      onUpdate();
    } catch (error) {
      // Revert on error
      setCurrentReaction(userReaction);
      console.error("Error handling reaction:", error);
      toast.error("Failed to update reaction");
    } finally {
      setIsReacting(false);
    }
  };

  const handleShare = async () => {
    try {
      const postUrl = `${window.location.origin}/social/post/${postId}`;
      await navigator.clipboard.writeText(postUrl);
      toast.success("Post link copied to clipboard!");
    } catch (error) {
      console.error("Error sharing post:", error);
      toast.error("Failed to share post");
    }
  };

  const handleRepost = async () => {
    try {
      if (!postContent || !author) {
        toast.error("Cannot repost: missing content or author information");
        return;
      }

      // Create the repost with attribution
      const repostContent = `Reposted from @${getDisplayName(
        author
      )}:\n\n${postContent}`;

      const { error: repostError } = await supabase
        .from("posts")
        .insert({
          user_id: userId,
          content: repostContent,
          media_urls: postMedia,
          reposted_from: {
            post_id: postId,
            user_id: authorId,
            user_name: getDisplayName(author),
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (repostError) throw repostError;

      toast.success("Post reposted successfully!");
      onUpdate();
    } catch (error) {
      console.error("Error reposting:", error);
      toast.error("Failed to repost");
    }
  };

  const handleBookmark = async () => {
    try {
      setIsBookmarked(!isBookmarked);
      // TODO: Implement bookmark functionality
      toast.success(
        isBookmarked ? "Post removed from bookmarks" : "Post bookmarked!"
      );
    } catch (error) {
      console.error("Error bookmarking:", error);
      toast.error("Failed to update bookmark");
    }
  };

  const handleFollow = async () => {
    try {
      if (!onFollow) return;
      await onFollow(authorId);
      setIsFollowingAuthor(!isFollowingAuthor);
      toast.success(
        isFollowingAuthor ? "Unfollowed author" : "Following author"
      );
    } catch (error) {
      console.error("Error following:", error);
      toast.error("Failed to update follow status");
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !onComment) return;

    try {
      await onComment(postId, newComment.trim());
      setNewComment("");
      await fetchComments();
      onUpdate();
      toast.success("Comment added successfully!");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    }
  };

  // Get sorted reaction types by count
  const getSortedReactionCounts = () => {
    if (!reactionTypes || Object.keys(reactionTypes).length === 0) {
      return [];
    }
    return Object.entries(reactionTypes)
      .map(([type, count]) => ({
        type,
        count,
        icon: REACTION_TYPES.find((r) => r.type === type)?.icon || "👋",
      }))
      .sort((a, b) => b.count - a.count);
  };

  // Add getDisplayName helper function
  const getDisplayName = (
    user: Comment["user"] | PostActionsProps["author"]
  ) => {
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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Reactions */}
        <div className="relative">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative text-primary hover:text-primary/80 transition-colors group"
                  onClick={() => setShowReactions(!showReactions)}
                  disabled={isReacting}
                >
                  <div className="flex items-center gap-2">
                    {/* Stacked Reaction Icons */}
                    <div className="flex items-center">
                      {currentReaction ? (
                        // Show user's selected reaction
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 border-2 border-primary/20 shadow-sm transition-transform hover:scale-110">
                          <span className="text-xl">
                            {REACTION_TYPES.find(
                              (r) => r.type === currentReaction
                            )?.icon || "👋"}
                          </span>
                        </div>
                      ) : getSortedReactionCounts().length > 0 ? (
                        // Show all reactions with counts
                        <div className="flex -space-x-1">
                          {getSortedReactionCounts()
                            .slice(0, 3)
                            .map((reaction, index) => (
                              <div
                                key={reaction.type}
                                className={cn(
                                  "flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 border-2 border-primary/20 shadow-sm",
                                  "hover:scale-110 transition-transform",
                                  index === 0 && "z-30",
                                  index === 1 && "z-20",
                                  index === 2 && "z-10"
                                )}
                              >
                                <span className="text-base">
                                  {reaction.icon}
                                </span>
                              </div>
                            ))}
                        </div>
                      ) : (
                        // Placeholder when no reactions
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 border-2 border-primary/20 transition-transform hover:scale-110">
                          <span className="text-xl text-primary">👋</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{reactions}</span>
                      <span className="hidden sm:inline text-sm text-muted-foreground">
                        Reactions
                      </span>
                    </div>
                  </div>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="flex flex-col gap-1">
                  {getSortedReactionCounts().length > 0 ? (
                    getSortedReactionCounts().map((reaction) => (
                      <div
                        key={reaction.type}
                        className="flex items-center gap-2"
                      >
                        <span className="text-base">{reaction.icon}</span>
                        <span className="text-sm">{reaction.type}</span>
                        <span className="text-xs text-muted-foreground">
                          ({reaction.count})
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-base">👋</span>
                      <span className="text-sm">Be the first to react!</span>
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {showReactions && (
            <div className="absolute bottom-full left-0 mb-2 bg-background border rounded-lg shadow-lg p-2 flex gap-1 z-50">
              {REACTION_TYPES.map((reaction) => (
                <TooltipProvider key={reaction.type}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-8 w-8 p-0 hover:bg-primary/10 group transition-all duration-200",
                          currentReaction === reaction.type &&
                            "bg-primary/20 scale-110",
                          "hover:scale-125"
                        )}
                        onClick={() => handleReaction(reaction.type)}
                      >
                        <span className="text-xl">{reaction.icon}</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{reaction.label}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          )}
        </div>

        {/* Comments */}
        <div className="relative" ref={commentsRef}>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary hover:text-primary/80 transition-colors group"
            onClick={() => setIsCommentsOpen(!isCommentsOpen)}
          >
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 border-2 border-primary/20 shadow-sm transition-transform group-hover:scale-110">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-1">
                <span className="font-medium">{comments}</span>
                <span className="hidden sm:inline text-sm text-muted-foreground">
                  Comments
                </span>
              </div>
            </div>
          </Button>
        </div>

        {/* Share */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:text-primary/80 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 border-2 border-primary/20 shadow-sm transition-transform group-hover:scale-110">
                  <Share2 className="h-4 w-4" />
                </div>
                <span className="hidden sm:inline text-sm text-muted-foreground">
                  Share
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Copy Link
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Send className="h-4 w-4 mr-2" />
              Send to Friends
            </DropdownMenuItem>
            <DropdownMenuItem>
              <MessageSquare className="h-4 w-4 mr-2" />
              Share to Story
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {/* Comments Section */}
      {isCommentsOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 lg:relative lg:inset-auto lg:bg-transparent lg:backdrop-blur-none">
          <div
            ref={commentSectionRef}
            className="fixed bottom-0 left-0 right-0 bg-background border-t rounded-t-xl lg:relative lg:bottom-auto lg:rounded-xl lg:border lg:shadow-xl lg:mt-4 transition-transform duration-200 ease-in-out transform translate-y-0 lg:absolute lg:top-full lg:left-0 lg:right-auto lg:w-[400px]"
          >
            <div className="flex flex-col h-[80vh] lg:h-[500px]">
              {/* Comment Header */}
              <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-background z-10">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">Comments</h3>
                  <span className="text-muted-foreground">({comments})</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setIsCommentsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Comments List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {postComments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No comments yet</p>
                    <p className="text-sm">Be the first to comment</p>
                  </div>
                ) : (
                  postComments.map((comment) => (
                    <div
                      key={comment.id}
                      className="flex gap-4 group animate-in fade-in slide-in-from-bottom-2 duration-200"
                    >
                      <Avatar className="h-8 w-8 flex-shrink-0 ring-2 ring-border dark:ring-white/20 ring-offset-2 ring-offset-background">
                        {comment.user.avatar_url ? (
                          <AvatarImage
                            src={comment.user.avatar_url}
                            alt={getDisplayName(comment.user)}
                          />
                        ) : (
                          <AvatarFallback>
                            {getDisplayName(comment.user)[0].toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="bg-muted rounded-lg p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium">
                              {getDisplayName(comment.user)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(comment.created_at).toLocaleDateString(
                                undefined,
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                }
                              )}
                            </p>
                          </div>
                          <p className="text-sm mt-1 whitespace-pre-wrap break-words">
                            {comment.content}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                          >
                            Reply
                          </Button>
                          {comment.user_id === userId && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs text-destructive"
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Comment Input */}
              <div className="p-4 border-t sticky bottom-0 bg-background">
                <form onSubmit={handleCommentSubmit} className="flex gap-2">
                  <Input
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1"
                    autoComplete="off"
                  />
                  <Button type="submit" size="sm" disabled={!newComment.trim()}>
                    Post
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
