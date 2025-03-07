import { useState, useRef, useCallback, useEffect } from "react";
import { ImagePlus, X, Loader2, Hash } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/utils/supabase/client";
import { toast } from "sonner";

// Add inappropriate words list
// Add inappropriate words list
const INAPPROPRIATE_WORDS = [
  // Add your list of inappropriate words here
  "ass",
  "bastard",
  "bitch",
  "crap",
  "damn",
  "fuck",
  "hell",
  "piss",
  "shit",
  "slut",
  "whore",
  "dick",
  "pussy",
  "cock",
  "cunt",
  "asshole",
  "motherfucker",
  "tits",
  "penis",
  "vagina",
  "boobs",
  "nigger",
  "faggot",
  "retard",
  "wanker",
  "bollocks",
  "bugger",
  "bloody",
  "twat",
  "fag",
  "homo",
  "jerk",
  "douche",
  "jackass",
  "prick",
  "skank",
  "sex",
  "douchebag",
  "bullshit",
  "goddamn",
  "fuckwit",
  "asswipe",
  "dickhead",
  "cocksucker",
  "ballsack",
  "butthole",
  "shithead",
  "dumbass",
  "wench",
  "whore",
  "slut",
  "bitch",
  "cunt",
  "asshole",
  "motherfucker",
  "xxx",
  "porn",
  "sex",
  "nude",
  "naked",
  "sexy",
];

interface CreatePostProps {
  onPostCreated: () => void;
  userAvatar?: string;
  userName?: string;
}

export default function CreatePost({
  onPostCreated,
  userAvatar,
  userName,
}: CreatePostProps) {
  const [content, setContent] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Function to validate and clean text
  const validateAndCleanText = (text: string): string => {
    let cleanedText = text;
    INAPPROPRIATE_WORDS.forEach((word) => {
      const regex = new RegExp(word, "gi");
      cleanedText = cleanedText.replace(regex, "***");
    });
    return cleanedText;
  };

  // Function to extract hashtags from text
  const extractHashtags = (text: string): string[] => {
    const hashtagRegex = /#[\w\u0590-\u05ff]+/g;
    const matches = text.match(hashtagRegex) || [];
    return [...new Set(matches.map((tag) => tag.replace(/^#+/, "#")))];
  };

  // Handle content change with validation
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    const cleanedContent = validateAndCleanText(newContent);
    setContent(cleanedContent);
  };

  // Handle tag input change
  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setTagInput(input);

    // Auto-detect hashtags when typing
    if (input.includes(",")) {
      const newTags = input
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag) // Remove empty tags
        .map((tag) => {
          // Add hashtag if not present
          return tag.startsWith("#") ? tag : `#${tag}`;
        });

      // Add new unique tags
      setTags((prevTags) => {
        const uniqueTags = [...new Set([...prevTags, ...newTags])];
        return uniqueTags;
      });
      setTagInput("");
    }
  };

  // Remove tag
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files);
      setImages((prev) => [...prev, ...newImages]);

      // Create URLs for preview
      newImages.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImageUrls((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Remove image
  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && images.length === 0) {
      toast.error("Please add some content or images to your post");
      return;
    }

    try {
      setIsLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload images if any
      const uploadedUrls: string[] = [];
      if (images.length > 0) {
        for (const image of images) {
          const fileExt = image.name.split(".").pop();
          const fileName = `${crypto.randomUUID()}.${fileExt}`;
          const filePath = `${user.id}/${fileName}`;

          // Create the user's folder if it doesn't exist
          const { error: folderError } = await supabase.storage
            .from("post-images")
            .list(user.id);

          if (
            folderError &&
            folderError.message !== "The resource was not found"
          ) {
            console.error("Error checking folder:", folderError);
          }

          // Upload the image
          const { error: uploadError } = await supabase.storage
            .from("post-images")
            .upload(filePath, image, {
              cacheControl: "3600",
              upsert: false,
            });

          if (uploadError) {
            console.error("Error uploading image:", uploadError);
            throw uploadError;
          }

          // Get the public URL
          const {
            data: { publicUrl },
          } = supabase.storage.from("post-images").getPublicUrl(filePath);

          uploadedUrls.push(publicUrl);
        }
      }

      // Create post
      const { error: postError } = await supabase.from("posts").insert({
        user_id: user.id,
        content: content.trim(),
        media_urls: uploadedUrls,
        tags: tags.length > 0 ? tags : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (postError) {
        console.error("Error creating post:", postError);
        throw postError;
      }

      // Clear form
      setContent("");
      setImages([]);
      setImageUrls([]);
      setTags([]);
      setTagInput("");
      onPostCreated();
      toast.success("Post created successfully!");
    } catch (error: Error) {
      console.error("Error creating post:", error);
      toast.error(error.message || "Failed to create post");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-start gap-4">
        <Avatar>
          <AvatarImage src={userAvatar} />
          <AvatarFallback>{userName?.[0] || "U"}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-4">
          <Textarea
            placeholder="Share your fitness journey..."
            value={content}
            onChange={handleContentChange}
            className="min-h-[100px] resize-none"
          />

          {/* Tag Input Field */}
          <div className="space-y-2">
            <Input
              placeholder="Add tags (separate with commas)"
              value={tagInput}
              onChange={handleTagInputChange}
              className="w-full"
            />
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    <Hash className="h-3 w-3" />
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {imageUrls.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {imageUrls.map((url, index) => (
                <div key={index} className="relative aspect-video">
                  <img
                    src={url}
                    alt={`Preview ${index + 1}`}
                    className="rounded-lg object-cover w-full h-full"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 p-1 rounded-full bg-background/80 hover:bg-background"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              <ImagePlus className="h-4 w-4 mr-2" />
              Add Images
            </Button>
            <Button
              type="submit"
              disabled={isLoading || (!content.trim() && images.length === 0)}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                "Post"
              )}
            </Button>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            max={4}
          />
        </div>
      </div>
    </form>
  );
}
