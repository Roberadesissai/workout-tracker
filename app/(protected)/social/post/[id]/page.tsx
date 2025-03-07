import { Metadata } from "next";
import { supabase } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import { MessageSquare, Home } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import PostActions from "../../components/post-actions";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { cn } from "@/lib/utils";
import Link from "next/link";

// Generate metadata for the post
export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const supabase = createServerComponentClient({ cookies });

  try {
    const { data: post } = await supabase
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
      .eq("id", params.id)
      .single();

    if (!post) {
      return {
        title: "Post Not Found",
        description: "The requested post could not be found.",
      };
    }

    const userName =
      post.user.display_option === "full_name"
        ? post.user.full_name
        : post.user.display_option === "username"
        ? post.user.username
        : post.user.email?.split("@")[0];

    // Get the first image if any
    const firstImage =
      post.media_urls && post.media_urls.length > 0
        ? post.media_urls[0]
        : post.user.avatar_url;

    return {
      title: `${userName}'s Post`,
      description: post.content?.slice(0, 200) || "View this post",
      openGraph: {
        title: `${userName}'s Post`,
        description: post.content?.slice(0, 200) || "View this post",
        images: firstImage ? [{ url: firstImage }] : [],
      },
      twitter: {
        card: "summary_large_image",
        title: `${userName}'s Post`,
        description: post.content?.slice(0, 200) || "View this post",
        images: firstImage ? [firstImage] : [],
      },
    };
  } catch (error) {
    console.error("Error fetching post metadata:", error);
    return {
      title: "Post",
      description: "View this post",
    };
  }
}

export default async function PostPage({ params }: { params: { id: string } }) {
  const supabase = createServerComponentClient({ cookies });

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  // Fetch post data
  const { data: post } = await supabase
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
    .eq("id", params.id)
    .single();

  if (!post) {
    notFound();
  }

  // Fetch reactions and comments count
  const { data: reactions } = await supabase
    .from("reactions")
    .select("*")
    .eq("post_id", params.id);

  const { data: comments } = await supabase
    .from("comments")
    .select("*")
    .eq("post_id", params.id);

  // Get user's reaction if any
  const userReaction = reactions?.find(
    (r) => r.user_id === user.id
  )?.reaction_type;

  // Count reactions by type
  const reactionTypes =
    reactions?.reduce((acc, reaction) => {
      acc[reaction.reaction_type] = (acc[reaction.reaction_type] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number }) || {};

  const getDisplayName = (user: any) => {
    if (!user) return "";
    if (user.display_option === "full_name" && user.full_name)
      return user.full_name;
    if (user.display_option === "username" && user.username)
      return user.username;
    return user.email?.split("@")[0] || "";
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/" className="flex items-center gap-1">
                <Home className="h-3 w-3" />
                Home
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/social">Social</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Post</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card className="overflow-hidden">
        <div className="p-6 space-y-6">
          {/* Post Header */}
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12 ring-2 ring-border dark:ring-white/20">
              <AvatarImage
                src={post.user.avatar_url}
                alt={getDisplayName(post.user)}
              />
              <AvatarFallback>{getDisplayName(post.user)[0]}</AvatarFallback>
            </Avatar>
            <div>
              <Link
                href={`/social/profile/${post.user.id}`}
                className="font-semibold text-lg hover:text-primary transition-colors"
              >
                {getDisplayName(post.user)}
              </Link>
              <p className="text-sm text-muted-foreground">
                {new Date(post.created_at).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Post Content */}
          <div className="space-y-4">
            <p className="text-base whitespace-pre-wrap">{post.content}</p>

            {/* Media Grid */}
            {post.media_urls && post.media_urls.length > 0 && (
              <div className="relative -mx-6">
                <div
                  className={cn(
                    "grid gap-1",
                    post.media_urls.length === 1 && "grid-cols-1",
                    post.media_urls.length === 2 && "grid-cols-2",
                    post.media_urls.length >= 3 && "grid-cols-2 grid-rows-2",
                    "relative rounded-xl overflow-hidden"
                  )}
                >
                  {post.media_urls.map((url: string, index: number) => {
                    if (index >= 4) return null;
                    const mediaLength = post.media_urls?.length || 0;
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
                          mediaLength >= 3 && index !== 0 && "aspect-square"
                        )}
                      >
                        <Image
                          src={url}
                          alt={`Post image ${index + 1}`}
                          fill
                          className="object-cover"
                          quality={100}
                          unoptimized
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
                        />
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
          </div>

          {/* Post Actions */}
          <div className="relative" id="post-actions">
            <PostActions
              postId={post.id}
              userId={user.id}
              reactions={reactions?.length || 0}
              reactionTypes={reactionTypes}
              comments={comments?.length || 0}
              userReaction={userReaction}
              onUpdate={() => {}}
              authorId={post.user.id}
              postContent={post.content}
              postMedia={post.media_urls}
              author={post.user}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
