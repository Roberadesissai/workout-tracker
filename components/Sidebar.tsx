"use client";

import type React from "react";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { supabase } from "@/utils/supabase/client";
import {
  Activity,
  BarChart2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  FileText,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Target,
  Timer,
  Trophy,
  User,
  Search,
  Plus,
  Moon,
  Sun,
  UserCircle,
  Mail,
  Shield,
  HelpCircle,
  Palette,
  Calculator,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: number | string | React.ReactNode;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navigationGroups: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { title: "Analytics", href: "/analytics", icon: BarChart2, badge: "New" },
      { title: "Progress", href: "/progress", icon: Target },
    ],
  },
  {
    title: "Training",
    items: [
      {
        title: "Workouts",
        href: "/training/workouts",
        icon: Dumbbell,
        badge: 3,
      },
      { title: "Programs", href: "/training/programs", icon: FileText },
      { title: "Calendar", href: "/training/calendar", icon: Calendar },
      { title: "History", href: "/training/history", icon: History },
    ],
  },
  {
    title: "Health",
    items: [
      { title: "Activity", href: "/health/activity", icon: Activity },
      {
        title: "Nutrition Cal..",
        href: "/health/nutrition",
        icon: Calculator,
      },
      { title: "Timer", href: "/health/timer", icon: Timer },
    ],
  },
  {
    title: "Social",
    items: [
      {
        title: "Achievements",
        href: "/social/achievements",
        icon: Trophy,
        badge: 2,
      },
      { title: "Community", href: "/social/community", icon: MessageSquare },
    ],
  },
];

interface User {
  id: string;
  email?: string | undefined;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
  username: string | null;
}

interface Counts {
  workouts: number;
  achievements: number;
  notifications: number;
  followers: number;
  following: number;
}

interface SidebarProps {
  onCollapseChange: (collapsed: boolean) => void;
}

export default function ModernSidebar({ onCollapseChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [counts, setCounts] = useState<Counts>({
    workouts: 0,
    achievements: 0,
    notifications: 0,
    followers: 0,
    following: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [filteredNavigation, setFilteredNavigation] =
    useState(navigationGroups);
  const [darkMode, setDarkMode] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const sidebarRef = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Fetch profile data
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(profileData);

        // Fetch counts
        const [
          workoutsCount,
          achievementsCount,
          notificationsCount,
          followersCount,
          followingCount,
        ] = await Promise.all([
          supabase
            .from("workout_programs")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id),
          supabase
            .from("achievements")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id),
          supabase
            .from("notifications")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("read", false),
          supabase
            .from("follows")
            .select("*", { count: "exact", head: true })
            .eq("following_id", user.id),
          supabase
            .from("follows")
            .select("*", { count: "exact", head: true })
            .eq("follower_id", user.id),
        ]);

        setCounts({
          workouts: workoutsCount.count || 0,
          achievements: achievementsCount.count || 0,
          notifications: notificationsCount.count || 0,
          followers: followersCount.count || 0,
          following: followingCount.count || 0,
        });
      }
    };
    getUser();

    // Check system preference for dark mode
    if (typeof window !== "undefined") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setDarkMode(isDark);
      if (isDark) {
        document.documentElement.classList.add("dark");
      }
    }
  }, []);

  // Update navigation groups with dynamic counts
  const dynamicNavigationGroups = useMemo(() => {
    return navigationGroups.map((group) => ({
      ...group,
      items: group.items.map((item) => {
        if (item.title === "Workouts") {
          return {
            ...item,
            badge: counts.workouts > 0 ? counts.workouts : undefined,
          };
        }
        if (item.title === "Achievements") {
          return {
            ...item,
            badge: counts.achievements > 0 ? counts.achievements : undefined,
          };
        }
        return item;
      }),
    }));
  }, [counts]);

  useEffect(() => {
    // Filter navigation items based on search query
    if (searchQuery.trim() === "") {
      setFilteredNavigation(dynamicNavigationGroups);
    } else {
      const filtered = dynamicNavigationGroups
        .map((group) => ({
          ...group,
          items: group.items.filter((item) =>
            item.title.toLowerCase().includes(searchQuery.toLowerCase())
          ),
        }))
        .filter((group) => group.items.length > 0);
      setFilteredNavigation(filtered);
    }
  }, [searchQuery, dynamicNavigationGroups]);

  // Update the search handler to include email search
  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (query.trim().length > 0) {
      try {
        const { data: profiles, error } = await supabase
          .from("profiles")
          .select("*")
          .or(
            `email.ilike.%${query}%,username.ilike.%${query}%,full_name.ilike.%${query}%`
          )
          .limit(5);

        if (error) throw error;
        setSearchResults(profiles || []);
        setShowSearchResults(true);
      } catch (error) {
        console.error("Error searching profiles:", error);
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  // Handle click outside search results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Signed out successfully");
      router.push("/login");
    } catch (error) {
      if (error instanceof Error) {
        toast.error("Error signing out", {
          description: error.message,
        });
      }
    }
  };

  const handleProfileClick = () => {
    router.push(`/settings/profile`);
  };

  const handleEmailSettingsClick = () => {
    router.push(`/settings/email`);
  };

  const handlePrivacySecurityClick = () => {
    router.push(`/settings/privacy`);
  };

  const handleAppearanceClick = () => {
    router.push(`/settings/appearance`);
  };

  const handleHelpSupportClick = () => {
    router.push(`/settings/help`);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  // Handle click outside to close mobile sidebar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mobileOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        setMobileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [mobileOpen]);

  // Update the collapse handler to notify parent
  const handleCollapse = (newCollapsed: boolean) => {
    setCollapsed(newCollapsed);
    onCollapseChange(newCollapsed);
  };

  return (
    <TooltipProvider delayDuration={300}>
      <>
        <Button
          variant="outline"
          size="icon"
          className="fixed top-4 left-4 z-[200] lg:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <Menu className="h-4 w-4" />
        </Button>
        <aside
          ref={sidebarRef}
          className={cn(
            "fixed left-0 top-0 h-screen flex-shrink-0 transition-all duration-300 ease-in-out z-[200]",
            "bg-background border-r border-border",
            collapsed ? "w-[70px]" : "w-[280px]",
            !mobileOpen && "hidden lg:block"
          )}
        >
          <div className="flex h-full flex-col">
            {/* Header with Search and Theme Toggle */}
            <div className="flex flex-col gap-2 p-3 border-b border-border/30">
              <div className="flex items-center justify-between">
                {!collapsed && (
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-primary/60">
                      CELSTHLETE
                    </span>
                    <Badge
                      variant="outline"
                      className="bg-primary/10 text-primary text-[10px] h-5 px-1.5"
                    >
                      PRO
                    </Badge>
                  </div>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-xl bg-muted/50 hover:bg-muted"
                    onClick={toggleDarkMode}
                  >
                    {darkMode ? (
                      <Sun className="h-4 w-4" />
                    ) : (
                      <Moon className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-xl hover:bg-primary/10 hover:text-primary"
                    onClick={() => handleCollapse(!collapsed)}
                  >
                    {collapsed ? (
                      <ChevronRight className="h-4 w-4" />
                    ) : (
                      <ChevronLeft className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {!collapsed && (
                <div className="relative" ref={searchRef}>
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search friends..."
                    className="pl-9 h-9 bg-muted/80 border-none focus-visible:ring-1 focus-visible:ring-primary/30"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                  {showSearchResults && searchResults.length > 0 && (
                    <div className="absolute w-full mt-1 py-2 bg-background rounded-lg border border-border shadow-lg z-50">
                      {searchResults.map((profile) => (
                        <Link
                          key={profile.id}
                          href={`/social/profile/${profile.id}`}
                          className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 transition-colors"
                          onClick={() => setShowSearchResults(false)}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={profile.avatar_url || undefined}
                            />
                            <AvatarFallback>
                              {(
                                profile.full_name?.[0] ||
                                profile.username?.[0] ||
                                profile.email?.[0] ||
                                "U"
                              ).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {profile.full_name ||
                                profile.username ||
                                profile.email?.split("@")[0]}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {profile.username
                                ? `@${profile.username}`
                                : profile.email}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1 custom-scrollbar">
              {filteredNavigation.map((group, i) => (
                <div key={i} className="space-y-0.5">
                  <div className="relative px-2 mb-1">
                    {!collapsed ? (
                      <div className="flex items-center justify-between">
                        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {group.title}
                        </h4>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 rounded-full"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="h-px w-8 bg-gradient-to-r from-transparent via-border to-transparent mx-auto" />
                    )}
                  </div>
                  <div className="space-y-0.5">
                    {group.items.map((item, j) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;
                      return (
                        <Tooltip key={j}>
                          <TooltipTrigger asChild>
                            <Link
                              href={item.href}
                              className={cn(
                                "group flex items-center gap-2 rounded-lg px-2 py-1 text-muted-foreground transition-all",
                                "hover:bg-muted/40",
                                isActive && "bg-muted/60",
                                collapsed && "justify-center px-0"
                              )}
                            >
                              <div
                                className={cn(
                                  "flex items-center justify-center rounded-md w-8 h-8 transition-all bg-muted/60 relative",
                                  "group-hover:bg-muted/80",
                                  isActive && "ring-1 ring-border"
                                )}
                              >
                                <Icon
                                  className={cn(
                                    "h-4 w-4",
                                    isActive && "text-primary"
                                  )}
                                />
                                {collapsed && item.badge && (
                                  <Badge
                                    className={cn(
                                      "absolute -right-1 -top-1 h-4 min-w-4 text-[10px] font-medium",
                                      typeof item.badge === "string"
                                        ? "bg-primary/10 text-primary"
                                        : "bg-primary text-primary-foreground"
                                    )}
                                  >
                                    {item.badge}
                                  </Badge>
                                )}
                              </div>
                              {!collapsed && (
                                <div className="flex flex-1 items-center justify-between">
                                  <span
                                    className={cn(
                                      "text-[13px]",
                                      isActive && "font-medium text-primary"
                                    )}
                                  >
                                    {item.title}
                                  </span>
                                  {item.badge && (
                                    <Badge
                                      className={cn(
                                        "h-5 text-[11px] font-medium",
                                        typeof item.badge === "string"
                                          ? "bg-primary/10 text-primary hover:bg-primary/20"
                                          : "bg-primary text-primary-foreground"
                                      )}
                                    >
                                      {item.badge}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </Link>
                          </TooltipTrigger>
                          {collapsed && (
                            <TooltipContent
                              side="right"
                              className="flex items-center gap-2"
                            >
                              {item.title}
                              {item.badge && (
                                <Badge
                                  className={cn(
                                    "h-5 text-[11px] font-medium",
                                    typeof item.badge === "string"
                                      ? "bg-primary/10 text-primary"
                                      : "bg-primary text-primary-foreground"
                                  )}
                                >
                                  {item.badge}
                                </Badge>
                              )}
                            </TooltipContent>
                          )}
                        </Tooltip>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            {/* Footer with Quick Actions and Profile */}
            <div className="mt-auto space-y-2 p-2 border-t border-border/30">
              {/* Quick Actions Section */}
              {!collapsed ? (
                <>
                  <div className="px-2">
                    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Quick Actions
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href={`/social/profile/${user?.id}`}
                        className="relative group overflow-hidden rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300"
                      >
                        <div className="absolute inset-0 opacity-20 bg-grid-white/10" />
                        <div className="relative p-4">
                          <div className="flex items-center justify-between">
                            <div className="rounded-xl bg-white/20 p-2">
                              <User className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-xl font-bold text-white tracking-tight">
                              {counts.followers}
                            </span>
                          </div>
                          <p className="mt-2 text-sm font-medium text-white">
                            Followers
                          </p>
                          <p className="text-xs text-white/80">
                            People following you
                          </p>
                          <div className="absolute bottom-1.5 right-1.5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">
                            <User className="h-12 w-12 text-white/20" />
                          </div>
                        </div>
                      </Link>
                      <Link
                        href={`/social/profile/${user?.id}`}
                        className="relative group overflow-hidden rounded-xl bg-gradient-to-br from-violet-400 to-violet-600 hover:shadow-lg hover:shadow-violet-500/20 transition-all duration-300"
                      >
                        <div className="absolute inset-0 opacity-20 bg-grid-white/10" />
                        <div className="relative p-4">
                          <div className="flex items-center justify-between">
                            <div className="rounded-xl bg-white/20 p-2">
                              <User className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-xl font-bold text-white tracking-tight">
                              {counts.following}
                            </span>
                          </div>
                          <p className="mt-2 text-sm font-medium text-white">
                            Following
                          </p>
                          <p className="text-xs text-white/80">
                            People you follow
                          </p>
                          <div className="absolute bottom-1.5 right-1.5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">
                            <User className="h-12 w-12 text-white/20" />
                          </div>
                        </div>
                      </Link>
                    </div>
                  </div>

                  {/* Profile Section */}
                  <div className="border-t border-border/20 pt-2 mt-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-primary/10 to-transparent p-2.5 cursor-pointer hover:from-primary/15 relative z-50">
                          <div className="relative">
                            <Avatar className="h-9 w-9 border-2 border-primary/20">
                              <AvatarImage
                                src={profile?.avatar_url || undefined}
                                alt={
                                  profile?.full_name ||
                                  user?.email?.split("@")[0] ||
                                  "User"
                                }
                              />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {(
                                  profile?.full_name?.[0] ||
                                  user?.email?.[0] ||
                                  "U"
                                ).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background"></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="truncate text-[13px] font-medium">
                              {profile?.full_name || user?.email?.split("@")[0]}
                            </div>
                            <div className="truncate text-[11px] text-muted-foreground">
                              {user?.email}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSignOut();
                            }}
                          >
                            <LogOut className="h-4 w-4" />
                          </Button>
                        </div>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        className="w-56 p-2"
                        align="end"
                        side="right"
                        sideOffset={0}
                        alignOffset={0}
                        forceMount
                        style={{
                          zIndex: 201,
                          position: "relative",
                        }}
                      >
                        <DropdownMenuLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-1">
                          My Account
                        </DropdownMenuLabel>
                        <DropdownMenuGroup className="space-y-0.5">
                          <DropdownMenuItem
                            className="rounded-lg flex items-center gap-2 py-1.5 px-2 text-muted-foreground hover:bg-muted/40 cursor-pointer"
                            onClick={handleProfileClick}
                          >
                            <div className="flex items-center justify-center rounded-md w-8 h-8 bg-muted/60 group-hover:bg-muted/80">
                              <UserCircle className="h-4 w-4" />
                            </div>
                            <span className="text-[13px]">Profile</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="rounded-lg flex items-center gap-2 py-1.5 px-2 text-muted-foreground hover:bg-muted/40 cursor-pointer"
                            onClick={handleEmailSettingsClick}
                          >
                            <div className="flex items-center justify-center rounded-md w-8 h-8 bg-muted/60 group-hover:bg-muted/80">
                              <Mail className="h-4 w-4" />
                            </div>
                            <span className="text-[13px]">Email Settings</span>
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator className="my-2 bg-border/30" />
                        <DropdownMenuLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-1">
                          Preferences
                        </DropdownMenuLabel>
                        <DropdownMenuGroup className="space-y-0.5">
                          <DropdownMenuItem
                            className="rounded-lg flex items-center gap-2 py-1.5 px-2 text-muted-foreground hover:bg-muted/40 cursor-pointer"
                            onClick={handlePrivacySecurityClick}
                          >
                            <div className="flex items-center justify-center rounded-md w-8 h-8 bg-muted/60 group-hover:bg-muted/80">
                              <Shield className="h-4 w-4" />
                            </div>
                            <span className="text-[13px]">
                              Privacy & Security
                            </span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="rounded-lg flex items-center gap-2 py-1.5 px-2 text-muted-foreground hover:bg-muted/40 cursor-pointer"
                            onClick={handleAppearanceClick}
                          >
                            <div className="flex items-center justify-center rounded-md w-8 h-8 bg-muted/60 group-hover:bg-muted/80">
                              <Palette className="h-4 w-4" />
                            </div>
                            <span className="text-[13px]">Appearance</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="rounded-lg flex items-center gap-2 py-1.5 px-2 text-muted-foreground hover:bg-muted/40 cursor-pointer"
                            onClick={handleHelpSupportClick}
                          >
                            <div className="flex items-center justify-center rounded-md w-8 h-8 bg-muted/60 group-hover:bg-muted/80">
                              <HelpCircle className="h-4 w-4" />
                            </div>
                            <span className="text-[13px]">Help & Support</span>
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator className="my-2 bg-border/30" />
                        <DropdownMenuItem
                          className="rounded-lg flex items-center gap-2 py-1.5 px-2 text-destructive hover:bg-destructive/10 cursor-pointer"
                          onClick={handleSignOut}
                        >
                          <div className="flex items-center justify-center rounded-md w-8 h-8 bg-destructive/10">
                            <LogOut className="h-4 w-4" />
                          </div>
                          <span className="text-[13px]">Sign Out</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 border-t border-border/20 pt-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={`/social/profile/${user?.id}`}
                        className="relative group overflow-hidden h-8 w-8 lg:h-9 lg:w-9 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 flex items-center justify-center"
                      >
                        <div className="absolute inset-0 opacity-20 bg-grid-white/10" />
                        <User className="h-4 w-4 text-white relative z-10" />
                        <Badge className="absolute -right-1 -top-1 h-3 min-w-3 lg:h-4 lg:w-4 text-[9px] lg:text-[10px] flex items-center justify-center rounded-full p-0 bg-white/20 text-white border border-white/20">
                          {counts.followers}
                        </Badge>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">Followers</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={`/social/profile/${user?.id}`}
                        className="relative group overflow-hidden h-8 w-8 lg:h-9 lg:w-9 rounded-xl bg-gradient-to-br from-violet-400 to-violet-600 hover:shadow-lg hover:shadow-violet-500/20 transition-all duration-300 flex items-center justify-center"
                      >
                        <div className="absolute inset-0 opacity-20 bg-grid-white/10" />
                        <User className="h-4 w-4 text-white relative z-10" />
                        <Badge className="absolute -right-1 -top-1 h-3 min-w-3 lg:h-4 lg:w-4 text-[9px] lg:text-[10px] flex items-center justify-center rounded-full p-0 bg-white/20 text-white border border-white/20">
                          {counts.following}
                        </Badge>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">Following</TooltipContent>
                  </Tooltip>
                </div>
              )}
            </div>
          </div>
        </aside>
        {mobileOpen && (
          <div
            className="fixed inset-0 z-[190] bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </>
    </TooltipProvider>
  );
}
