import { useState } from "react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import PostActions from "./post-actions";

interface PostProps {
  post: {
    id: string;
    content: string;
    image_url?: string;
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
  };
  currentUserId: string;
  onUpdate?: () => void;
}

export default function Post({ post, currentUserId, onUpdate }: PostProps) {
  const [imageLoading, setImageLoading] = useState(true);
  const userReaction = post.reactions.find(
    (reaction) => reaction.user.profiles.full_name === currentUserId
  );

  const likedByText = () => {
    const likedBy = post.reactions.map(
      (r) => r.user.profiles.full_name.split(" ")[0]
    );
    if (likedBy.length === 0) return "";
    if (likedBy.length === 1) return `Liked by ${likedBy[0]}`;
    if (likedBy.length === 2) return `Liked by ${likedBy[0]} and ${likedBy[1]}`;
    return `Liked by ${likedBy[0]} and ${likedBy.length - 1} others`;
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4 pb-0">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={post.user.profiles.avatar_url} />
            <AvatarFallback>{post.user.profiles.full_name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">
              {post.user.profiles.full_name}
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date(post.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <p className="text-sm whitespace-pre-wrap mb-3">{post.content}</p>

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {post.image_url && (
          <div className="relative aspect-square w-full mb-3 bg-muted rounded-md overflow-hidden">
            <Image
              src={post.image_url}
              alt="Post image"
              fill
              className={cn(
                "object-cover transition-opacity duration-300",
                imageLoading ? "opacity-0" : "opacity-100"
              )}
              onLoadingComplete={() => setImageLoading(false)}
            />
            {imageLoading && (
              <Skeleton className="absolute inset-0 w-full h-full" />
            )}
          </div>
        )}

        {post.reactions.length > 0 && (
          <p className="text-sm text-muted-foreground mb-3">{likedByText()}</p>
        )}

        <PostActions
          postId={post.id}
          userId={currentUserId}
          reactions={post.reactions.length}
          comments={post.comments.length}
          userReaction={userReaction ? "like" : undefined}
          onUpdate={onUpdate}
          userName={post.user.profiles.full_name}
          userAvatar={post.user.profiles.avatar_url}
        />
      </CardContent>
    </Card>
  );
}
