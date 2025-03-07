"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Pencil, Home, X, ImagePlus, Hash } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/utils/supabase/client";
import { toast } from "sonner";
import { use } from "react";

interface Post {
  id: string;
  content: string;
  media_urls: string[];
  tags: string[];
  user_id: string;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditPostPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [content, setContent] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push("/auth/login");
          return;
        }
        setCurrentUser(user.id);

        // Fetch post data
        const { data: post, error } = await supabase
          .from("posts")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        if (!post) {
          toast.error("Post not found");
          router.push("/social/community");
          return;
        }

        // Check if user owns the post
        if (post.user_id !== user.id) {
          toast.error("You can only edit your own posts");
          router.push("/social/community");
          return;
        }

        setPost(post);
        setContent(post.content);
        setMediaUrls(post.media_urls || []);
        setTags(post.tags || []);
      } catch (error) {
        console.error("Error fetching post:", error);
        toast.error("Failed to load post");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [id, router]);

  const handleAddTag = () => {
    if (!newTag.trim()) return;

    // Split input by commas and process each tag
    const newTags = newTag
      .split(",")
      .map((tag) =>
        tag
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "")
      )
      .filter((tag) => tag && !tags.includes(tag));

    if (newTags.length > 0) {
      setTags([...tags, ...newTags]);
    }
    setNewTag("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleRemoveImage = (urlToRemove: string) => {
    setMediaUrls(mediaUrls.filter((url) => url !== urlToRemove));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const newMediaUrls = [...mediaUrls];
      for (const file of files) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${currentUser}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("post-images")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("post-images").getPublicUrl(filePath);

        newMediaUrls.push(publicUrl);
      }
      setMediaUrls(newMediaUrls);
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      if (!content.trim()) {
        toast.error("Post content cannot be empty");
        return;
      }

      const { error } = await supabase
        .from("posts")
        .update({
          content: content.trim(),
          media_urls: mediaUrls,
          tags: tags,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Post updated successfully");
      router.push("/social/community");
    } catch (error) {
      console.error("Error updating post:", error);
      toast.error("Failed to update post");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 space-y-6 p-8 pt-6">
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
              <BreadcrumbLink href="/social/community">
                Community
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Edit Post</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5">
          <div className="absolute inset-0 bg-grid-white/10" />
          <div className="relative flex flex-col md:flex-row items-center gap-6 p-8">
            <div className="flex-1 min-w-[50%]">
              <div className="flex items-center gap-4 mb-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <Pencil className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight">Edit Post</h1>
              </div>
              <p className="text-muted-foreground">
                Update your post content, add images, or modify tags.
              </p>
            </div>
            <div className="relative w-full md:w-1/2 aspect-[16/9] rounded-lg overflow-hidden">
              <Image
                src="/images/hero/Community.jpg"
                alt="Edit Post"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>

        <Card className="p-8">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="animate-spin">
              <Pencil className="h-12 w-12 text-muted-foreground mb-4" />
            </div>
            <h3 className="font-medium mb-2">Loading Post...</h3>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
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
            <BreadcrumbLink href="/social/community">Community</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Edit Post</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="relative flex flex-col md:flex-row items-center gap-6 p-8">
          <div className="flex-1 min-w-[50%]">
            <div className="flex items-center gap-4 mb-4">
              <div className="rounded-full bg-primary/10 p-3">
                <Pencil className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Edit Post</h1>
            </div>
            <p className="text-muted-foreground">
              Update your post content, add images, or modify tags.
            </p>
          </div>
          <div className="relative w-full md:w-1/2 aspect-[16/9] rounded-lg overflow-hidden">
            <Image
              src="/images/hero/Community.jpg"
              alt="Edit Post"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          {/* Content Editor */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Content</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              className="min-h-[150px]"
            />
          </div>

          {/* Media Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Media</label>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => document.getElementById("image-upload")?.click()}
              >
                <ImagePlus className="h-4 w-4" />
                Add Image
              </Button>
              <input
                type="file"
                id="image-upload"
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
              />
            </div>
            {mediaUrls.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {mediaUrls.map((url, index) => (
                  <div key={index} className="relative group aspect-square">
                    <Image
                      src={url}
                      alt={`Post image ${index + 1}`}
                      fill
                      className="object-cover rounded-lg"
                      quality={100}
                      unoptimized
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveImage(url)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tags Section */}
          <div className="space-y-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Tags</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTag();
                        } else if (e.key === "," || e.key === " ") {
                          e.preventDefault();
                          const value = newTag.trim();
                          if (value && !value.endsWith(",")) {
                            setNewTag(value + ", ");
                          }
                        }
                      }}
                      placeholder="Add tags (separate with commas)"
                      className="pl-9"
                    />
                  </div>
                  <Button
                    onClick={handleAddTag}
                    variant="outline"
                    className="shrink-0"
                  >
                    Add Tags
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Separate multiple tags with commas (e.g., "fitness, workout,
                  gym")
                </p>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="flex items-center gap-1 px-3 py-1 text-sm hover:bg-destructive/10 group transition-colors"
                    >
                      <Hash className="h-3 w-3 shrink-0" />
                      <span className="truncate">{tag}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 ml-1 hover:bg-transparent shrink-0"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        <X className="h-3 w-3 group-hover:text-destructive" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-4">
            <Button
              variant="outline"
              onClick={() => router.push("/social/community")}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
