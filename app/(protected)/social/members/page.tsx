"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Home,
  Users,
  Search,
  Plus,
  TrendingUp,
  DollarSign,
  Calendar,
  AlertCircle,
  Dumbbell,
  Clock,
  Star,
  CheckCircle2,
  Zap,
  Target,
  Award,
  Pencil,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/utils/supabase/client";
import { toast } from "react-hot-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Program {
  id: string;
  member_id: string;
  title: string;
  description: string;
  price: number;
  created_at: string;
  features: string[];
  requirements: string[];
  cover_image_url: string | null;
  member: {
    id: string;
    email: string;
    avatar_url: string | null;
  };
  subscription_status?: "pending" | "active" | "cancelled";
}

const formatEmailDisplay = (email: string): string => {
  if (!email || email === "Unknown User") return "Unknown User";

  // Remove any numbers from the entire email (not just the start)
  const nameWithoutNumbers = email.replace(/\d+/g, "");

  // Split by @ and take the first part
  const name = nameWithoutNumbers.split("@")[0];

  // Capitalize first letter and return with @ prefix
  return `@${name.charAt(0).toUpperCase()}${name.slice(1)}`;
};

const handleCopyEmail = (email: string) => {
  const formattedEmail = formatEmailDisplay(email);
  navigator.clipboard.writeText(formattedEmail);
  toast.success("Username copied to clipboard");
};

export default function MembersPage() {
  const router = useRouter();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"popular" | "newest" | "price">(
    "newest"
  );
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (user) {
          setCurrentUser({ id: user.id });
        }
      } catch (error) {
        console.error("Error fetching current user:", error);
        setError("Failed to load user data");
        setShowErrorDialog(true);
      }
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    fetchPrograms();
  }, [sortBy]);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      setError(null);

      // First, get all programs with member info
      const { data: programs, error: programsError } = await supabase.from(
        "member_programs"
      ).select(`
          *,
          member:profiles!member_programs_member_id_fkey (
            id,
            email,
            avatar_url
          )
        `);

      if (programsError) {
        console.error("Programs error:", programsError);
        throw new Error(programsError.message);
      }

      if (!programs) {
        setPrograms([]);
        return;
      }

      // Transform the data
      let transformedPrograms = programs.map((program: any) => ({
        ...program,
        member: program.member || {
          email: "Unknown User",
          avatar_url: null,
        },
      }));

      // Apply sorting
      switch (sortBy) {
        case "newest":
          transformedPrograms.sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          );
          break;
        case "price":
          transformedPrograms.sort((a, b) => b.price - a.price);
          break;
        default: // popular
          transformedPrograms.sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          );
      }

      setPrograms(transformedPrograms);
    } catch (error) {
      console.error("Error fetching programs:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load programs"
      );
      setShowErrorDialog(true);
      toast.error("Failed to load programs");
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (programId: string) => {
    try {
      if (!currentUser) {
        toast.error("Please log in to subscribe");
        return;
      }

      const { error: subscribeError } = await supabase
        .from("program_subscriptions")
        .insert({
          subscriber_id: currentUser.id,
          program_id: programId,
          status: "pending",
        });

      if (subscribeError) throw subscribeError;

      toast.success("Subscription request sent");
      fetchPrograms();
    } catch (error) {
      console.error("Error subscribing:", error);
      setError(error instanceof Error ? error.message : "Failed to subscribe");
      setShowErrorDialog(true);
      toast.error("Failed to subscribe");
    }
  };

  const handleCoverImageUpload = async (programId: string, file: File) => {
    try {
      setUploading(true);

      // First verify ownership
      const { data: program, error: programError } = await supabase
        .from("member_programs")
        .select("member_id")
        .eq("id", programId)
        .single();

      if (programError) throw programError;

      if (program.member_id !== currentUser?.id) {
        toast.error("You can only edit your own programs");
        return;
      }

      // Upload image to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${programId}-${Math.random()}.${fileExt}`;
      const filePath = `${currentUser.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("program-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get the public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("program-images").getPublicUrl(filePath);

      // Update the program with the new cover image URL
      const { error: updateError } = await supabase
        .from("member_programs")
        .update({ cover_image_url: publicUrl })
        .eq("id", programId)
        .eq("member_id", currentUser.id);

      if (updateError) throw updateError;

      toast.success("Cover image updated successfully");
      setShowUploadDialog(false);
      fetchPrograms(); // Refresh the programs list
    } catch (error) {
      console.error("Error uploading cover image:", error);
      toast.error("Failed to update cover image");
    } finally {
      setUploading(false);
    }
  };

  const filteredPrograms = programs.filter(
    (program) =>
      program.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      formatEmailDisplay(program.member?.email || "Unknown User")
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 space-y-4 sm:space-y-6 p-3 sm:p-6 lg:p-8 pt-4 sm:pt-6">
      {/* Breadcrumb */}
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
            <BreadcrumbPage>Programs</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="relative flex flex-col lg:flex-row items-center gap-4 sm:gap-6 p-4 sm:p-6 lg:p-8">
          <div className="flex-1 min-w-0 w-full lg:max-w-[60%]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="rounded-full bg-primary/10 p-2 sm:p-3">
                  <Dumbbell className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight truncate">
                  Training Programs
                </h1>
              </div>
              <Button
                onClick={() => router.push("/social/programs/create")}
                className="w-full sm:w-auto"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Program
              </Button>
            </div>
            <p className="text-muted-foreground text-sm sm:text-base max-w-2xl">
              Discover and join training programs from experienced trainers.
            </p>
          </div>
          <div className="relative w-full lg:w-[40%] aspect-[16/9] rounded-lg overflow-hidden mt-4 sm:mt-0">
            <Image
              src="/images/hero/Find_Members.jpg"
              alt="Training Programs"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <Card className="p-3 sm:p-6">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <Input
                placeholder="Search programs or trainers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 sm:h-10"
              />
            </div>
            <Select
              value={sortBy}
              onValueChange={(value: any) => setSortBy(value)}
            >
              <SelectTrigger className="w-full sm:w-[180px] h-9 sm:h-10">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Sort by" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price">Price: High to Low</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mx-3 sm:mx-0">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Programs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 px-3 sm:px-0">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-3 sm:p-6 animate-pulse">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-muted rounded" />
                  <div className="h-3 w-1/2 bg-muted rounded" />
                </div>
              </div>
            </Card>
          ))
        ) : filteredPrograms.length === 0 ? (
          <div className="col-span-full text-center py-6 sm:py-8 lg:py-12">
            <div className="rounded-full bg-primary/10 p-2 sm:p-3 w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
              <Dumbbell className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <h3 className="font-medium mb-2 text-sm sm:text-base">
              No programs found
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
              Try adjusting your search or create a new program
            </p>
            <Button
              onClick={() => router.push("/social/programs/create")}
              className="w-full sm:w-auto"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Program
            </Button>
          </div>
        ) : (
          filteredPrograms.map((program) => (
            <Card
              key={program.id}
              className="group overflow-hidden hover:shadow-xl transition-all duration-300 relative bg-card border border-border flex flex-col max-w-[500px] mx-auto w-full"
            >
              {/* Program Header */}
              <div className="relative h-36 sm:h-40 bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5">
                {program.cover_image_url && (
                  <Image
                    src={program.cover_image_url}
                    alt={program.title}
                    fill
                    className="object-cover"
                  />
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="rounded-full bg-background p-3 shadow-lg ring-2 ring-primary/10 dark:ring-primary/20">
                    <Dumbbell className="h-6 w-6 text-primary" />
                  </div>
                </div>
                {program.price > 0 && (
                  <div className="absolute top-3 right-3">
                    <Badge
                      variant="secondary"
                      className="bg-background text-primary border-primary/20 dark:bg-background/80"
                    >
                      Premium
                    </Badge>
                  </div>
                )}
                {/* Edit Cover Image Button - Only show for program owner */}
                {currentUser?.id === program.member_id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute bottom-2 left-2 h-8 w-8 rounded-full bg-background/80 hover:bg-background shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      setSelectedProgram(program);
                      setShowUploadDialog(true);
                    }}
                  >
                    <Pencil className="h-4 w-4 text-primary" />
                  </Button>
                )}
              </div>

              {/* Program Content */}
              <div className="flex-1 flex flex-col p-4 sm:p-5">
                {/* Trainer Info */}
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10 sm:h-12 sm:w-12 ring-2 ring-background">
                      <AvatarImage src={program.member?.avatar_url || ""} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {(program.member?.email || "Unknown User")[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 bg-green-500 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border-2 border-background" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-base sm:text-lg text-foreground truncate group-hover:text-primary transition-colors">
                      {program.title}
                    </h3>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleCopyEmail(
                          program.member?.email || "Unknown User"
                        );
                      }}
                      className="text-sm sm:text-base text-primary hover:text-primary/80 truncate transition-colors"
                    >
                      {formatEmailDisplay(
                        program.member?.email || "Unknown User"
                      )}
                    </button>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-2 sm:mb-3">
                  {program.description.length > 67
                    ? `${program.description.slice(0, 67)}...`
                    : program.description}
                </p>

                {/* Features and Requirements */}
                <div className="space-y-2 sm:space-y-3 mb-2 sm:mb-3">
                  {/* Features */}
                  <div className="space-y-1.5 sm:space-y-2">
                    <h4 className="text-xs sm:text-sm font-medium text-foreground flex items-center gap-1.5 sm:gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                      Features
                    </h4>
                    <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                      {program.features && program.features.length > 0 ? (
                        program.features.map((feature, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground"
                          >
                            <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary" />
                            <span className="truncate">
                              {feature.length > 20
                                ? `${feature.slice(0, 20)}...`
                                : feature}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-2 text-xs sm:text-sm text-muted-foreground italic">
                          No features specified
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Requirements */}
                  <div className="space-y-1.5 sm:space-y-2">
                    <h4 className="text-xs sm:text-sm font-medium text-foreground flex items-center gap-1.5 sm:gap-2">
                      <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                      Requirements
                    </h4>
                    <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                      {program.requirements &&
                      program.requirements.length > 0 ? (
                        program.requirements.map((requirement, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground"
                          >
                            <Award className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary" />
                            <span className="truncate">
                              {requirement.length > 20
                                ? `${requirement.slice(0, 20)}...`
                                : requirement}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-2 text-xs sm:text-sm text-muted-foreground italic">
                          No requirements specified
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Push the divider and button section to the bottom */}
                <div className="mt-auto">
                  {/* Fixed Position Divider */}
                  <div className="h-px bg-border mb-2 sm:mb-3" />

                  {/* Price, Date, and Subscribe Button */}
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        {program.price > 0 ? (
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                            <span className="font-semibold text-foreground">
                              {program.price}
                            </span>
                          </div>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-primary/10 text-primary text-xs sm:text-sm"
                          >
                            Free
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
                        <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        <span>
                          {new Date(program.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="default"
                      onClick={() => handleSubscribe(program.id)}
                      className="w-full text-xs sm:text-sm"
                      size="sm"
                    >
                      {program.price > 0 ? "Subscribe Now" : "Join Program"}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Cover Image Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Cover Image</DialogTitle>
            <DialogDescription>
              Choose a new cover image for your program
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && selectedProgram) {
                  handleCoverImageUpload(selectedProgram.id, file);
                }
              }}
              disabled={uploading}
            />
            {uploading && (
              <p className="text-sm text-muted-foreground mt-2">
                Uploading image...
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
            <DialogDescription>
              {error || "An unexpected error occurred"}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
