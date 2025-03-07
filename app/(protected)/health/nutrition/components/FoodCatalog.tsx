"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface FoodItem {
  id: string;
  name: string;
  serving_size: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  category: string;
  vitamins: Record<string, number>;
  minerals: Record<string, number>;
}

const categoryColors: Record<
  string,
  { bg: string; text: string; accent: string }
> = {
  Vegetables: {
    bg: "bg-green-50",
    text: "text-green-700",
    accent: "bg-green-100",
  },
  Fruits: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    accent: "bg-orange-100",
  },
  Grains: { bg: "bg-amber-50", text: "text-amber-700", accent: "bg-amber-100" },
  Proteins: { bg: "bg-red-50", text: "text-red-700", accent: "bg-red-100" },
  Dairy: { bg: "bg-blue-50", text: "text-blue-700", accent: "bg-blue-100" },
  Legumes: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    accent: "bg-purple-100",
  },
};

export default function FoodCatalog() {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchFoods() {
      try {
        const { data, error } = await supabase
          .from("food_database")
          .select("*")
          .eq("is_verified", true);

        if (error) throw error;
        setFoods(data || []);
      } catch (error) {
        console.error("Error fetching foods:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchFoods();
  }, [supabase]);

  const categories = ["all", ...new Set(foods.map((food) => food.category))];
  const filteredFoods =
    selectedCategory === "all"
      ? foods
      : foods.filter((food) => food.category === selectedCategory);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="overflow-hidden border border-border/5">
            <CardHeader className="space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-32 w-full rounded-lg" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <ScrollArea className="w-full">
        <div className="flex flex-wrap gap-2 p-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                "px-3 py-1.5 text-sm backdrop-blur-sm border border-border/10 rounded-full transition-all",
                selectedCategory === category
                  ? "bg-white/10 shadow-sm"
                  : "bg-white/5 hover:bg-white/10"
              )}
            >
              {category === "all" ? "All Foods" : category}
            </button>
          ))}
        </div>
      </ScrollArea>

      {/* Food Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFoods.map((food) => (
          <div
            key={food.id}
            className="group relative rounded-xl backdrop-blur-sm border border-border/10 bg-white/5 overflow-hidden hover:bg-white/10 transition-all duration-300"
          >
            {/* Glassy Top Section */}
            <div className="p-4 relative">
              <div className="absolute top-0 right-0 p-3">
                <div className="text-right">
                  <span className="text-2xl font-light tracking-tight">
                    {food.calories}
                  </span>
                  <span className="text-xs ml-1 opacity-60">kcal</span>
                </div>
              </div>
              <h3 className="text-lg font-medium pr-20">{food.name}</h3>
              <p className="text-sm opacity-60 mt-1">{food.serving_size}</p>
            </div>

            {/* Macros Circle */}
            <div className="relative px-4 pb-4">
              <div className="flex justify-between items-center gap-4">
                <div className="flex-1 text-center p-2 rounded-lg bg-white/5">
                  <div className="text-lg font-light">{food.protein}</div>
                  <div className="text-xs opacity-60">Protein</div>
                </div>
                <div className="flex-1 text-center p-2 rounded-lg bg-white/5">
                  <div className="text-lg font-light">{food.carbs}</div>
                  <div className="text-xs opacity-60">Carbs</div>
                </div>
                <div className="flex-1 text-center p-2 rounded-lg bg-white/5">
                  <div className="text-lg font-light">{food.fats}</div>
                  <div className="text-xs opacity-60">Fats</div>
                </div>
              </div>
            </div>

            {/* Nutrients Section */}
            {(Object.keys(food.vitamins).length > 0 ||
              Object.keys(food.minerals).length > 0) && (
              <div className="border-t border-border/5 p-4 bg-white/[0.02]">
                <div className="space-y-3">
                  {Object.keys(food.vitamins).length > 0 && (
                    <div>
                      <span className="text-xs font-medium opacity-70">
                        Vitamins
                      </span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {Object.entries(food.vitamins).map(([key, value]) => (
                          <span
                            key={key}
                            className="px-1.5 py-0.5 text-[10px] rounded bg-white/5"
                          >
                            {key} {value}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {Object.keys(food.minerals).length > 0 && (
                    <div>
                      <span className="text-xs font-medium opacity-70">
                        Minerals
                      </span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {Object.entries(food.minerals).map(([key, value]) => (
                          <span
                            key={key}
                            className="px-1.5 py-0.5 text-[10px] rounded bg-white/5"
                          >
                            {key} {value}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
