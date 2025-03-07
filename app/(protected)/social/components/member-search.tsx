"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Search,
  UserPlus,
  Check,
  Plus,
  Users,
  Sparkles,
  Filter,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Member {
  id: string;
  email: string;
  user_metadata: {
    full_name: string;
    avatar_url: string;
  };
  subscription_status?: "pending" | "active" | "cancelled";
}

interface Program {
  id: string;
  title: string;
  description: string;
  price: number;
}

export default function MemberSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [programs, setPrograms] = useState<{ [key: string]: Program[] }>({});
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"search" | "create">("search");
  const [filter, setFilter] = useState<"all" | "trainers" | "athletes">("all");

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user.id);
      }
    };
    getUser();
  }, []);

  const searchMembers = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a search term");
      return;
    }

    setLoading(true);
    try {
      // Get all users with role filter
      let query = supabase
        .from("profiles")
        .select("*")
        .ilike("full_name", `%${searchQuery}%`);

      if (filter !== "all") {
        query = query.eq("role", filter);
      }

      const { data: users, error: usersError } = await query;

      if (usersError) throw usersError;

      // Get current user's subscriptions
      const { data: subscriptions } = await supabase
        .from("member_subscriptions")
        .select("*")
        .eq("subscriber_id", currentUser);

      // Transform users data and add subscription status
      const transformedMembers = users.map((user) => ({
        ...user,
        subscription_status: subscriptions?.find(
          (sub) => sub.subscribed_to_id === user.id
        )?.status,
      }));

      setMembers(transformedMembers);

      // Get programs for each member
      const programsMap: { [key: string]: Program[] } = {};
      for (const member of transformedMembers) {
        const { data: memberPrograms } = await supabase
          .from("member_programs")
          .select("*")
          .eq("member_id", member.id);

        if (memberPrograms) {
          programsMap[member.id] = memberPrograms;
        }
      }
      setPrograms(programsMap);
    } catch (error) {
      console.error("Error searching members:", error);
      toast.error("Failed to search members");
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (memberId: string) => {
    if (!currentUser) {
      toast.error("Please log in to subscribe");
      return;
    }

    try {
      const { error } = await supabase.from("member_subscriptions").insert({
        subscriber_id: currentUser,
        subscribed_to_id: memberId,
        status: "pending",
      });

      if (error) throw error;

      // Update local state
      setMembers((prevMembers) =>
        prevMembers.map((member) =>
          member.id === memberId
            ? { ...member, subscription_status: "pending" }
            : member
        )
      );

      toast.success("Subscription request sent");
    } catch (error) {
      console.error("Error subscribing to member:", error);
      toast.error("Failed to subscribe");
    }
  };

  const handleCreateMembership = async () => {
    if (!currentUser) {
      toast.error("Please log in to create a membership");
      return;
    }

    try {
      // Create a new program
      const { data: program, error: programError } = await supabase
        .from("member_programs")
        .insert({
          member_id: currentUser,
          title: "My Training Program",
          description: "Join my personalized training program!",
          price: 0,
        })
        .select()
        .single();

      if (programError) throw programError;

      toast.success("Membership created successfully!");
      setActiveTab("search");
      searchMembers(); // Refresh the search results
    } catch (error) {
      console.error("Error creating membership:", error);
      toast.error("Failed to create membership");
    }
  };

  return (
    <div className="space-y-4">
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "search" | "create")}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Find Members
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Membership
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchMembers()}
            />
            <Select
              value={filter}
              onValueChange={(value) =>
                setFilter(value as "all" | "trainers" | "athletes")
              }
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Members</SelectItem>
                <SelectItem value="trainers">Trainers</SelectItem>
                <SelectItem value="athletes">Athletes</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={searchMembers} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {members.length === 0 ? (
            <Card className="p-8">
              <div className="text-center space-y-4">
                <div className="rounded-full bg-primary/10 p-3 w-12 h-12 mx-auto flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium mb-2">No Members Found</h3>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your search or create your own membership to
                    get started.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setActiveTab("create")}
                  className="mt-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Membership
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {members.map((member) => (
                <Card key={member.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {member.user_metadata.full_name}
                    </CardTitle>
                    {member.subscription_status ? (
                      <Badge variant="secondary">
                        {member.subscription_status === "pending" ? (
                          <span className="flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Pending
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Check className="h-3 w-3" />
                            {member.subscription_status}
                          </span>
                        )}
                      </Badge>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSubscribe(member.id)}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Subscribe
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage src={member.user_metadata.avatar_url} />
                        <AvatarFallback>
                          {member.user_metadata.full_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">
                          {member.email}
                        </p>
                        {programs[member.id]?.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm font-medium">
                              Available Programs:
                            </p>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {programs[member.id].map((program) => (
                                <Badge key={program.id} variant="outline">
                                  {program.title}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card className="p-6">
            <div className="text-center space-y-4">
              <div className="rounded-full bg-primary/10 p-3 w-12 h-12 mx-auto flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-medium mb-2">Create Your Membership</h3>
                <p className="text-sm text-muted-foreground">
                  Start your fitness journey by creating a membership and
                  sharing your expertise with others.
                </p>
              </div>
              <Button onClick={handleCreateMembership} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Create Membership
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
