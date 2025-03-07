"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Users,
  Search,
  Send,
  Dumbbell,
  Trophy,
  Lock,
  MoreVertical,
  ChevronLeft,
  ImagePlus,
  Loader2,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { supabase } from "@/utils/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  media_url?: string;
  workout_id?: string;
  achievement_id?: string;
  read_at?: string;
}

interface ChatUser {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  is_online: boolean;
  last_seen: string | null;
  is_profile_private: boolean;
  unread_count: number;
  last_message?: {
    content: string;
    created_at: string;
  };
}

interface CurrentUser {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  is_online: boolean;
  last_seen: string | null;
  is_profile_private: boolean;
}

const DEFAULT_AVATAR = "/images/profile/Minimalist_3D_Avatar.jpg";

const MessagesPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams?.get("userId");
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followStatus, setFollowStatus] = useState<{
    status: "pending" | "accepted" | "rejected";
    id: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [showBlockDialog, setShowBlockDialog] = useState(false);

  useEffect(() => {
    if (!router || !searchParams) return;

    const init = async () => {
      try {
        setLoading(true);

        // First fetch current user and ensure it's set
        const userData = await fetchCurrentUser();
        if (!userData?.id) {
          throw new Error("Failed to load user data");
        }

        // Set current user state
        setCurrentUser(userData);

        // Wait a bit to ensure state is updated
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Set up real-time subscription for messages
        const messagesSubscription = supabase
          .channel("messages")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "messages",
            },
            async (payload) => {
              console.log("Message event received:", payload);
              const messageData = payload.new as Message;
              const isRelevantMessage =
                messageData.sender_id === userData.id ||
                messageData.recipient_id === userData.id;

              if (!isRelevantMessage) return;

              // If we're in a chat with this user, update the messages
              if (
                selectedUser &&
                ((messageData.sender_id === selectedUser.id &&
                  messageData.recipient_id === userData.id) ||
                  (messageData.sender_id === userData.id &&
                    messageData.recipient_id === selectedUser.id))
              ) {
                if (payload.eventType === "INSERT") {
                  setMessages((prev) => [...prev, messageData]);
                  scrollToBottom();

                  // Mark message as read if we're the recipient and chat is open
                  if (messageData.recipient_id === userData.id) {
                    const now = new Date().toISOString();
                    await supabase
                      .from("messages")
                      .update({
                        is_read: true,
                        read_at: now,
                      })
                      .eq("id", messageData.id);
                  }
                } else if (payload.eventType === "UPDATE") {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === messageData.id ? messageData : msg
                    )
                  );
                }
              }

              // Update chat users list for any message changes
              const otherUserId =
                messageData.sender_id === userData.id
                  ? messageData.recipient_id
                  : messageData.sender_id;

              // Fetch the other user's profile
              const { data: otherUserProfile } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", otherUserId)
                .single();

              if (otherUserProfile) {
                setChatUsers((prev) => {
                  const existingUserIndex = prev.findIndex(
                    (u) => u.id === otherUserId
                  );

                  const updatedUser: ChatUser = {
                    id: otherUserProfile.id,
                    full_name: otherUserProfile.full_name,
                    username: otherUserProfile.username,
                    avatar_url: otherUserProfile.avatar_url || DEFAULT_AVATAR,
                    is_online: otherUserProfile.is_online || false,
                    last_seen: otherUserProfile.last_seen,
                    is_profile_private:
                      otherUserProfile.is_profile_private || false,
                    unread_count:
                      messageData.recipient_id === userData.id &&
                      !messageData.is_read
                        ? (prev[existingUserIndex]?.unread_count || 0) + 1
                        : prev[existingUserIndex]?.unread_count || 0,
                    last_message: {
                      content: messageData.content,
                      created_at: messageData.created_at,
                    },
                  };

                  if (existingUserIndex !== -1) {
                    const newUsers = [...prev];
                    newUsers[existingUserIndex] = updatedUser;
                    return newUsers.sort((a, b) => {
                      return (
                        new Date(b.last_message?.created_at || 0).getTime() -
                        new Date(a.last_message?.created_at || 0).getTime()
                      );
                    });
                  } else {
                    return [updatedUser, ...prev].sort((a, b) => {
                      return (
                        new Date(b.last_message?.created_at || 0).getTime() -
                        new Date(a.last_message?.created_at || 0).getTime()
                      );
                    });
                  }
                });
              }
            }
          )
          .subscribe();

        // Always fetch chat users first
        await fetchChatUsers();

        // Then initialize specific chat if userId is provided
        if (userId) {
          await initializeChat(userId);
        }

        setLoading(false);

        return () => {
          supabase.removeChannel(messagesSubscription);
        };
      } catch (error) {
        console.error("Initialization error:", error);
        toast.error("Failed to initialize chat");
        setLoading(false);
      }
    };

    init();
  }, [router, searchParams]);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages();
      checkFollowStatus();
    }
  }, [selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchCurrentUser = async (): Promise<CurrentUser> => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("Auth error:", userError);
        throw userError;
      }

      if (!user) {
        console.error("No authenticated user found");
        throw new Error("No authenticated user found");
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Profile error:", profileError);
        throw profileError;
      }

      if (!profileData) {
        console.error("No profile found for user");
        throw new Error("No profile found");
      }

      const currentUser: CurrentUser = {
        id: profileData.id,
        full_name: profileData.full_name,
        username: profileData.username,
        avatar_url: profileData.avatar_url,
        is_online: profileData.is_online || false,
        last_seen: profileData.last_seen,
        is_profile_private: profileData.is_profile_private || false,
      };

      setCurrentUser(currentUser);
      return currentUser;
    } catch (error) {
      console.error("Error fetching current user:", error);
      toast.error("Failed to load user data");
      throw error;
    }
  };

  const fetchChatUsers = async () => {
    try {
      let userId;

      // If no current user, try to fetch it
      if (!currentUser?.id) {
        const userData = await fetchCurrentUser();
        if (!userData?.id) {
          console.error("No current user found");
          return;
        }
        userId = userData.id;
      } else {
        userId = currentUser.id;
      }

      // First get all messages
      const { data: messages, error: messagesError } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .order("created_at", { ascending: false });

      if (messagesError) {
        console.error("Error fetching messages:", messagesError);
        throw messagesError;
      }

      if (!messages || messages.length === 0) {
        console.log("No messages found");
        setChatUsers([]);
        return;
      }

      // Get unique user IDs from messages
      const userIds = new Set<string>();
      messages.forEach((message) => {
        if (message.sender_id !== userId) userIds.add(message.sender_id);
        if (message.recipient_id !== userId) userIds.add(message.recipient_id);
      });

      // Fetch user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("id", Array.from(userIds));

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        throw profilesError;
      }

      // Create a map of user profiles
      const profileMap = new Map(
        profiles?.map((profile) => [profile.id, profile])
      );

      // Create a map to store unique users and their latest messages
      const usersMap = new Map<string, ChatUser>();

      messages.forEach((message) => {
        // Determine if current user is sender or recipient
        const isSender = message.sender_id === userId;
        const otherUserId = isSender ? message.recipient_id : message.sender_id;
        const otherUser = profileMap.get(otherUserId);

        if (!otherUser || otherUser.id === userId) return;

        const existingUser = usersMap.get(otherUser.id);
        if (!existingUser) {
          // Create new chat user entry
          usersMap.set(otherUser.id, {
            id: otherUser.id,
            full_name: otherUser.full_name,
            username: otherUser.username,
            avatar_url: otherUser.avatar_url || DEFAULT_AVATAR,
            is_online: otherUser.is_online || false,
            last_seen: otherUser.last_seen,
            is_profile_private: otherUser.is_profile_private || false,
            unread_count: !isSender && !message.is_read ? 1 : 0,
            last_message: {
              content: message.content,
              created_at: message.created_at,
            },
          });
        } else if (
          !existingUser.last_message ||
          new Date(message.created_at) >
            new Date(existingUser.last_message.created_at)
        ) {
          // Update existing user's last message if this one is newer
          existingUser.last_message = {
            content: message.content,
            created_at: message.created_at,
          };
          // Update unread count for messages received by current user
          if (!isSender && !message.is_read) {
            existingUser.unread_count = (existingUser.unread_count || 0) + 1;
          }
        }
      });

      const sortedUsers = Array.from(usersMap.values()).sort((a, b) => {
        return (
          new Date(b.last_message?.created_at || 0).getTime() -
          new Date(a.last_message?.created_at || 0).getTime()
        );
      });

      setChatUsers(sortedUsers);
    } catch (error) {
      console.error("Error in fetchChatUsers:", error);
      toast.error("Failed to load chat users");
    }
  };

  const fetchMessages = async () => {
    if (!selectedUser || !currentUser?.id) return;

    try {
      // Fetch messages
      const { data: messages, error: messagesError } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${currentUser.id},recipient_id.eq.${selectedUser.id}),` +
            `and(sender_id.eq.${selectedUser.id},recipient_id.eq.${currentUser.id})`
        )
        .order("created_at", { ascending: true });

      if (messagesError) {
        console.error("Error fetching messages:", messagesError);
        throw messagesError;
      }

      setMessages(messages || []);

      // Mark messages as read
      if (messages?.length > 0) {
        const unreadMessages = messages.filter(
          (msg) => msg.recipient_id === currentUser.id && !msg.is_read
        );

        if (unreadMessages.length > 0) {
          const now = new Date().toISOString();
          const { error: updateError } = await supabase
            .from("messages")
            .update({
              is_read: true,
              read_at: now,
            })
            .eq("recipient_id", currentUser.id)
            .eq("sender_id", selectedUser.id)
            .eq("is_read", false);

          if (updateError) {
            console.error("Error marking messages as read:", updateError);
          }

          // Update local messages state with read status
          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.recipient_id === currentUser.id && !msg.is_read
                ? { ...msg, is_read: true, read_at: now }
                : msg
            )
          );

          // Refresh chat users to update unread counts
          await fetchChatUsers();
        }
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load messages");
    }
  };

  const checkFollowStatus = async () => {
    if (!selectedUser) return;

    try {
      const { data: followData, error: followError } = await supabase
        .from("follows")
        .select("id, status")
        .eq("follower_id", currentUser?.id)
        .eq("following_id", selectedUser.id)
        .single();

      if (followError && followError.code !== "PGRST116") {
        console.error("Error checking follow status:", followError);
      } else if (followData) {
        setFollowStatus({
          status: followData.status,
          id: followData.id,
        });
        setIsFollowing(followData.status === "accepted");
      } else {
        setFollowStatus(null);
        setIsFollowing(false);
      }
    } catch (error) {
      console.error("Error checking follow status:", error);
    }
  };

  const handleFollow = async () => {
    if (!selectedUser || !currentUser) return;

    try {
      if (followStatus?.status === "pending") {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("id", followStatus.id);

        if (error) throw error;
        setIsFollowing(false);
        setFollowStatus(null);
        toast.success("Follow request cancelled");
        return;
      }

      if (isFollowing) {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUser.id)
          .eq("following_id", selectedUser.id);

        if (error) throw error;
        setIsFollowing(false);
        setFollowStatus(null);
        toast.success("Unfollowed successfully");
      } else {
        const status = selectedUser.is_profile_private ? "pending" : "accepted";
        const { data, error } = await supabase
          .from("follows")
          .insert({
            follower_id: currentUser.id,
            following_id: selectedUser.id,
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
    } catch (error) {
      console.error("Error updating follow status:", error);
      toast.error("Failed to update follow status");
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || !currentUser) return;

    try {
      const messageData = {
        sender_id: currentUser.id,
        recipient_id: selectedUser.id,
        content: newMessage.trim(),
        created_at: new Date().toISOString(),
        is_read: false,
      };

      const { data: newMessageData, error } = await supabase
        .from("messages")
        .insert(messageData)
        .select()
        .single();

      if (error) throw error;

      // Update messages immediately
      setMessages((prev) => [...prev, newMessageData]);
      setNewMessage("");
      scrollToBottom();

      // Update chat users list
      await fetchChatUsers();
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  // Add online status update interval
  useEffect(() => {
    if (!currentUser?.id) return;

    // Update online status every minute
    const updateOnlineStatus = async () => {
      try {
        await supabase
          .from("profiles")
          .update({
            is_online: true,
            last_seen: new Date().toISOString(),
          })
          .eq("id", currentUser.id);
      } catch (error) {
        console.error("Error updating online status:", error);
      }
    };

    const interval = setInterval(updateOnlineStatus, 60000);

    // Set up beforeunload handler
    const handleBeforeUnload = () => {
      if (currentUser?.id) {
        // Sync call to ensure it runs before page unload
        navigator.sendBeacon(
          "/api/offline",
          JSON.stringify({ userId: currentUser.id })
        );
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (currentUser?.id) {
        supabase
          .from("profiles")
          .update({
            is_online: false,
            last_seen: new Date().toISOString(),
          })
          .eq("id", currentUser.id);
      }
    };
  }, [currentUser?.id]);

  // Add real-time subscription for online status
  useEffect(() => {
    if (!currentUser?.id) return;

    const statusChannel = supabase
      .channel("online-status")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${currentUser.id}`,
        },
        (payload) => {
          const updatedProfile = payload.new as CurrentUser;
          setCurrentUser((current) => ({
            ...current!,
            is_online: updatedProfile.is_online,
            last_seen: updatedProfile.last_seen,
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(statusChannel);
    };
  }, [currentUser?.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getFilteredUsers = () => {
    return chatUsers.filter((user) => {
      const searchTerm = searchQuery.toLowerCase();
      const matchesSearch =
        user.full_name?.toLowerCase().includes(searchTerm) ||
        user.username?.toLowerCase().includes(searchTerm);

      switch (activeTab) {
        case "unread":
          return matchesSearch && user.unread_count > 0;
        case "online":
          return matchesSearch && user.is_online;
        default:
          return matchesSearch;
      }
    });
  };

  const canSendMessage = () => {
    if (!selectedUser?.is_profile_private) return true;
    return isFollowing && followStatus?.status === "accepted";
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (
        !e.target.files ||
        !e.target.files[0] ||
        !selectedUser ||
        !currentUser
      )
        return;

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

      // Create filename with timestamp
      const fileExt = file.type.split("/")[1];
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `message_media/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("messages")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("messages").getPublicUrl(filePath);

      // Send message with media
      const { error: messageError } = await supabase.from("messages").insert({
        sender_id: currentUser.id,
        recipient_id: selectedUser.id,
        content: "Sent an image",
        media_url: publicUrl,
        created_at: new Date().toISOString(),
        is_read: false,
      });

      if (messageError) throw messageError;

      // Clear input
      e.target.value = "";
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to send image");
    }
  };

  const initializeChat = async (targetUserId: string) => {
    try {
      // Ensure we have current user
      let profile = currentUser;
      if (!profile?.id) {
        profile = await fetchCurrentUser();
        if (!profile?.id) {
          throw new Error("Current user not found");
        }
      }

      // Get target user profile
      const { data: targetProfile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", targetUserId)
        .single();

      if (profileError) {
        console.error("Profile error:", profileError);
        throw new Error("Failed to fetch target user profile");
      }
      if (!targetProfile) {
        throw new Error("Target user profile not found");
      }

      // Set the selected user
      setSelectedUser({
        id: targetProfile.id,
        full_name: targetProfile.full_name || targetProfile.username || "User",
        username: targetProfile.username,
        avatar_url: targetProfile.avatar_url || DEFAULT_AVATAR,
        is_online: targetProfile.is_online || false,
        last_seen: targetProfile.last_seen,
        is_profile_private: targetProfile.is_profile_private || false,
        unread_count: 0,
      });

      // Fetch messages between current user and target user
      const { data: messages, error: messagesError } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${profile.id},recipient_id.eq.${targetUserId}),` +
            `and(sender_id.eq.${targetUserId},recipient_id.eq.${profile.id})`
        )
        .order("created_at", { ascending: true });

      if (messagesError) {
        console.error("Messages error:", messagesError);
        throw new Error("Failed to fetch messages");
      }

      // Filter messages to ensure they belong to the current conversation
      const filteredMessages =
        messages?.filter(
          (msg) =>
            (msg.sender_id === profile.id &&
              msg.recipient_id === targetUserId) ||
            (msg.sender_id === targetUserId && msg.recipient_id === profile.id)
        ) || [];

      setMessages(filteredMessages);

      // Mark messages as read
      if (filteredMessages.length > 0) {
        const { error: updateError } = await supabase
          .from("messages")
          .update({ is_read: true })
          .eq("recipient_id", profile.id)
          .eq("sender_id", targetUserId)
          .eq("is_read", false);

        if (updateError) {
          console.error("Error marking messages as read:", updateError);
        }
      }

      // Update chat users list to reflect read status
      await fetchChatUsers();
    } catch (error) {
      console.error("Error initializing chat:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to initialize chat"
      );
    }
  };

  // Add new functions for profile and block actions
  const handleViewProfile = () => {
    if (!selectedUser) return;
    router.push(`/social/profile/${selectedUser.id}`);
  };

  const handleBlockUser = async () => {
    if (!selectedUser || !currentUser) return;

    try {
      // First, check if already blocked
      const { data: existingBlock } = await supabase
        .from("blocked_users")
        .select("*")
        .eq("blocker_id", currentUser.id)
        .eq("blocked_id", selectedUser.id)
        .single();

      if (existingBlock) {
        toast.error("User is already blocked");
        return;
      }

      // Insert new block record
      const { error: blockError } = await supabase
        .from("blocked_users")
        .insert({
          blocker_id: currentUser.id,
          blocked_id: selectedUser.id,
          created_at: new Date().toISOString(),
        });

      if (blockError) throw blockError;

      // Delete any existing messages between the users
      const { error: deleteError } = await supabase
        .from("messages")
        .delete()
        .or(
          `and(sender_id.eq.${currentUser.id},recipient_id.eq.${selectedUser.id}),` +
            `and(sender_id.eq.${selectedUser.id},recipient_id.eq.${currentUser.id})`
        );

      if (deleteError) throw deleteError;

      // Delete any existing follows
      const { error: followError } = await supabase
        .from("follows")
        .delete()
        .or(
          `and(follower_id.eq.${currentUser.id},following_id.eq.${selectedUser.id}),` +
            `and(follower_id.eq.${selectedUser.id},following_id.eq.${currentUser.id})`
        );

      if (followError) throw followError;

      toast.success("User blocked successfully");
      setSelectedUser(null);
      await fetchChatUsers(); // Refresh the chat list
    } catch (error) {
      console.error("Error blocking user:", error);
      toast.error("Failed to block user");
    }
    setShowBlockDialog(false);
  };

  return (
    <>
      <div className="h-[95vh] max-h-[95vh] flex overflow-hidden">
        {/* Sidebar - Fixed width */}
        <div className="w-[320px] flex-shrink-0 hidden sm:block">
          <div
            className={cn(
              "fixed top-0 h-[95vh] w-[320px] bg-background/50 backdrop-blur-sm flex flex-col z-20",
              "transition-transform duration-300 sm:translate-x-0",
              selectedUser && "-translate-x-full sm:translate-x-0"
            )}
          >
            {/* Search Bar */}
            <div className="p-3 flex-shrink-0">
              <div className="relative flex items-center">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-muted-foreground/60" />
                </div>
                <Input
                  type="text"
                  placeholder="Search training partners..."
                  className="w-full pl-10 py-5 bg-accent/50 border-0
                           focus-visible:ring-1 focus-visible:ring-primary
                           placeholder:text-muted-foreground/60 rounded-2xl"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Tabs
                defaultValue="all"
                className="mt-3"
                onValueChange={setActiveTab}
              >
                <TabsList className="w-full h-10 p-1 bg-accent/50 rounded-xl grid grid-cols-3 gap-1">
                  <TabsTrigger
                    value="all"
                    className="rounded-lg data-[state=active]:bg-background"
                  >
                    All
                  </TabsTrigger>
                  <TabsTrigger
                    value="unread"
                    className="rounded-lg data-[state=active]:bg-background"
                  >
                    Unread
                  </TabsTrigger>
                  <TabsTrigger
                    value="online"
                    className="rounded-lg data-[state=active]:bg-background"
                  >
                    Online
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Chat Users List */}
            <div className="flex-1 overflow-y-auto px-2">
              <div className="space-y-1 py-2">
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : getFilteredUsers().length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-center">
                    <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                      <Dumbbell className="h-8 w-8 text-primary" />
                    </div>
                    <p className="font-semibold text-foreground">
                      No Training Partners
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Start connecting with others!
                    </p>
                  </div>
                ) : (
                  getFilteredUsers().map((user) => (
                    <button
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      className={cn(
                        "w-full flex items-center gap-4 p-4 rounded-2xl",
                        "transition-all duration-200",
                        selectedUser?.id === user.id
                          ? "bg-accent"
                          : "hover:bg-accent/50",
                        user.unread_count > 0 && "bg-primary/5"
                      )}
                    >
                      <div className="relative">
                        <Avatar
                          className={cn(
                            "h-14 w-14 rounded-2xl border-2",
                            "ring-offset-2 ring-offset-background",
                            user.is_online
                              ? "border-primary ring-2 ring-primary/20"
                              : "border-border",
                            selectedUser?.id === user.id && "border-primary"
                          )}
                        >
                          <AvatarImage
                            src={user.avatar_url || ""}
                            className="rounded-2xl object-cover"
                          />
                          <AvatarFallback className="rounded-2xl bg-primary/10 text-primary font-semibold">
                            {user.username?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {user.is_online && (
                          <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-lg bg-primary border-2 border-background" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center justify-between">
                          <p
                            className={cn(
                              "font-semibold truncate",
                              user.unread_count > 0
                                ? "text-primary"
                                : "text-foreground"
                            )}
                          >
                            {user.full_name || user.username}
                          </p>
                          {user.last_message && (
                            <span className="text-xs text-muted-foreground/60">
                              {formatDistanceToNow(
                                new Date(user.last_message.created_at),
                                { addSuffix: true }
                              )}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <p
                            className={cn(
                              "text-sm truncate",
                              user.unread_count > 0
                                ? "text-foreground font-medium"
                                : "text-muted-foreground/80"
                            )}
                          >
                            {user.last_message?.content || "No messages yet"}
                          </p>
                          {user.unread_count > 0 && (
                            <span className="flex-shrink-0 h-5 min-w-5 px-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center">
                              {user.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Chat Area - Takes remaining space */}
        <div
          className={cn(
            "flex-1 flex flex-col bg-background min-w-0 h-[95vh] max-h-[95vh]",
            "transition-all duration-300",
            !selectedUser && "hidden sm:flex"
          )}
        >
          {selectedUser ? (
            <>
              {/* Chat Header - Fixed */}
              <div className="h-[56px] flex-shrink-0 px-4 py-2 flex items-center justify-between bg-background/50 backdrop-blur-sm border-b">
                <div className="flex items-center gap-4">
                  <button
                    className="sm:hidden -ml-2 p-2 hover:bg-accent rounded-xl transition-colors"
                    onClick={() => setSelectedUser(null)}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <Avatar className="h-12 w-12 rounded-2xl border-2 border-border">
                    <AvatarImage
                      src={selectedUser.avatar_url || ""}
                      className="rounded-2xl object-cover"
                    />
                    <AvatarFallback className="rounded-2xl bg-primary/10 text-primary">
                      {selectedUser.username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-foreground">
                      {selectedUser.full_name || selectedUser.username}
                    </p>
                    <p className="text-sm text-muted-foreground/60">
                      {selectedUser.is_online
                        ? "Active Now"
                        : selectedUser.last_seen
                        ? `Last active ${formatDistanceToNow(
                            new Date(selectedUser.last_seen),
                            { addSuffix: true }
                          )}`
                        : "Offline"}
                    </p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-xl hover:bg-accent"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={handleViewProfile}>
                      View Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setShowBlockDialog(true)}
                      className="text-destructive focus:text-destructive"
                    >
                      Block User
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Messages Area - Scrollable */}
              <div className="flex-1 overflow-y-auto min-h-0">
                <div className="py-3 px-4 space-y-3">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[calc(95vh-180px)]">
                      <div className="h-24 w-24 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                        {selectedUser.is_profile_private &&
                        !canSendMessage() ? (
                          <Lock className="h-12 w-12 text-primary" />
                        ) : (
                          <Dumbbell className="h-12 w-12 text-primary" />
                        )}
                      </div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">
                        {selectedUser.is_profile_private && !canSendMessage()
                          ? "Private Training Profile"
                          : "Start Your Training Chat"}
                      </h3>
                      <p className="text-muted-foreground/80 text-center max-w-sm">
                        {selectedUser.is_profile_private && !canSendMessage()
                          ? "Connect with this user to start training together"
                          : "Share workouts, achievements, and motivate each other"}
                      </p>
                      {selectedUser.is_profile_private && !canSendMessage() && (
                        <Button
                          onClick={handleFollow}
                          className="mt-6 h-12 px-6 rounded-xl bg-primary hover:bg-primary/90"
                        >
                          <Users className="h-5 w-5 mr-2" />
                          {followStatus?.status === "pending"
                            ? "Request Sent"
                            : "Connect"}
                        </Button>
                      )}
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex items-end gap-3",
                          message.sender_id === currentUser?.id
                            ? "justify-end"
                            : "justify-start"
                        )}
                      >
                        {message.sender_id !== currentUser?.id && (
                          <Avatar className="h-8 w-8 rounded-xl">
                            <AvatarImage
                              src={selectedUser.avatar_url || ""}
                              className="rounded-xl object-cover"
                            />
                            <AvatarFallback className="rounded-xl bg-primary/10 text-primary">
                              {selectedUser.username?.[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className="flex flex-col gap-1.5 max-w-[75%]">
                          <div
                            className={cn(
                              "px-4 py-3 text-sm",
                              message.sender_id === currentUser?.id
                                ? "bg-primary text-primary-foreground rounded-2xl rounded-br-sm ml-auto"
                                : "bg-accent/50 text-foreground rounded-2xl rounded-bl-sm mr-auto"
                            )}
                          >
                            {message.media_url && (
                              <img
                                src={message.media_url}
                                alt="Shared media"
                                className="rounded-lg mb-2 max-w-full"
                              />
                            )}
                            {message.workout_id && (
                              <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                                <Dumbbell className="h-4 w-4" />
                                <span>Shared Workout Plan</span>
                              </div>
                            )}
                            {message.achievement_id && (
                              <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                                <Trophy className="h-4 w-4" />
                                <span>New Achievement</span>
                              </div>
                            )}
                            <p>{message.content}</p>
                          </div>
                          <span
                            className={cn(
                              "flex items-center gap-1.5 text-xs",
                              message.sender_id === currentUser?.id
                                ? "justify-end"
                                : "justify-start",
                              "text-muted-foreground/60"
                            )}
                          >
                            {format(new Date(message.created_at), "p")}
                            {message.sender_id === currentUser?.id && (
                              <>
                                <span>•</span>
                                <span>
                                  {message.is_read
                                    ? `Seen ${
                                        message.read_at
                                          ? format(
                                              new Date(message.read_at),
                                              "p"
                                            )
                                          : ""
                                      }`
                                    : "Sent"}
                                </span>
                              </>
                            )}
                          </span>
                        </div>
                        {message.sender_id === currentUser?.id && (
                          <Avatar className="h-8 w-8 rounded-xl">
                            <AvatarImage
                              src={currentUser.avatar_url || ""}
                              className="rounded-xl object-cover"
                            />
                            <AvatarFallback className="rounded-xl bg-primary/10 text-primary">
                              {currentUser.username?.[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Message Input - Fixed */}
              <div className="h-[70px] flex-shrink-0 p-3 bg-background/50 backdrop-blur-sm border-t">
                <form
                  onSubmit={handleSendMessage}
                  className="flex items-center gap-2"
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-12 w-12 rounded-xl hover:bg-accent/50"
                    onClick={() =>
                      document.getElementById("file-input")?.click()
                    }
                  >
                    <ImagePlus className="h-5 w-5 text-muted-foreground/60" />
                  </Button>
                  <input
                    id="file-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Send a message..."
                    className="flex-1 h-12 px-4 bg-accent/50 border-0
                             focus-visible:ring-1 focus-visible:ring-primary
                             placeholder:text-muted-foreground/60 rounded-xl"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="h-12 w-12 rounded-xl bg-primary hover:bg-primary/90"
                    disabled={!canSendMessage()}
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="hidden sm:flex flex-1 flex-col items-center justify-center text-center p-4">
              <div className="h-24 w-24 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Dumbbell className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Training Chat
              </h3>
              <p className="text-muted-foreground/80 max-w-sm">
                Connect with your training partners and share your fitness
                journey
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Block User Confirmation Dialog */}
      <AlertDialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to block{" "}
              {selectedUser?.full_name || selectedUser?.username}? This will:
            </AlertDialogDescription>
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-muted-foreground">
              <li>Remove all messages between you</li>
              <li>Remove any following relationships</li>
              <li>Prevent them from messaging you</li>
              <li>Hide your posts from them</li>
            </ul>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBlockUser}
              className="bg-destructive hover:bg-destructive/90"
            >
              Block User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MessagesPage;
