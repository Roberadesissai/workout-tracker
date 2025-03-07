import { useState } from "react";
import { Plus, Trash2, UtensilsCrossed } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface FoodLogEntry {
  id: string;
  food_id: string;
  meal_type: string;
  servings: number;
  notes: string;
  food: {
    name: string;
    serving_size: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
}

export default function FoodLogger() {
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [foodLogs, setFoodLogs] = useState<FoodLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [newEntry, setNewEntry] = useState({
    food_id: "",
    meal_type: "",
    servings: 1,
    notes: "",
  });

  const mealTypes = [
    { value: "breakfast", label: "Breakfast" },
    { value: "lunch", label: "Lunch" },
    { value: "dinner", label: "Dinner" },
    { value: "snack", label: "Snack" },
  ];

  const fetchFoodLogs = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("nutrition_logs")
        .select(
          `
          id,
          food_id,
          meal_type,
          servings,
          notes,
          food:food_id (
            name,
            serving_size,
            calories,
            protein,
            carbs,
            fats
          )
        `
        )
        .eq("user_id", user.id)
        .eq("date", selectedDate)
        .order("meal_type", { ascending: true });

      if (error) throw error;
      setFoodLogs(data || []);
    } catch (error) {
      console.error("Error fetching food logs:", error);
      toast.error("Failed to load food logs");
    } finally {
      setLoading(false);
    }
  };

  const addFoodLog = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please sign in to log food");
        return;
      }

      const { error } = await supabase.from("nutrition_logs").insert({
        user_id: user.id,
        date: selectedDate,
        ...newEntry,
      });

      if (error) throw error;

      toast.success("Food logged successfully");
      setNewEntry({
        food_id: "",
        meal_type: "",
        servings: 1,
        notes: "",
      });
      fetchFoodLogs();
    } catch (error) {
      console.error("Error adding food log:", error);
      toast.error("Failed to log food");
    }
  };

  const deleteFoodLog = async (id: string) => {
    try {
      const { error } = await supabase
        .from("nutrition_logs")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Food log deleted");
      fetchFoodLogs();
    } catch (error) {
      console.error("Error deleting food log:", error);
      toast.error("Failed to delete food log");
    }
  };

  const calculateTotalNutrition = () => {
    return foodLogs.reduce(
      (acc, log) => {
        const servingMultiplier = log.servings;
        return {
          calories: acc.calories + log.food.calories * servingMultiplier,
          protein: acc.protein + log.food.protein * servingMultiplier,
          carbs: acc.carbs + log.food.carbs * servingMultiplier,
          fats: acc.fats + log.food.fats * servingMultiplier,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );
  };

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl flex items-center gap-2">
            <UtensilsCrossed className="h-6 w-6 text-primary" />
            Food Logger
          </CardTitle>
          <CardDescription>
            Track your daily food intake and monitor your nutrition goals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-end gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="date" className="text-sm font-medium">
                  Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="h-10 bg-muted/50"
                />
              </div>
              <Button
                variant="outline"
                onClick={fetchFoodLogs}
                disabled={loading}
                className="h-10"
              >
                Load Logs
              </Button>
            </div>

            <div className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="meal_type" className="text-sm font-medium">
                    Meal Type
                  </Label>
                  <Select
                    value={newEntry.meal_type}
                    onValueChange={(value) =>
                      setNewEntry((prev) => ({ ...prev, meal_type: value }))
                    }
                  >
                    <SelectTrigger id="meal_type" className="h-10 bg-muted/50">
                      <SelectValue placeholder="Select meal type" />
                    </SelectTrigger>
                    <SelectContent>
                      {mealTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="servings" className="text-sm font-medium">
                    Servings
                  </Label>
                  <Input
                    id="servings"
                    type="number"
                    min="0.25"
                    step="0.25"
                    value={newEntry.servings}
                    onChange={(e) =>
                      setNewEntry((prev) => ({
                        ...prev,
                        servings: Number(e.target.value),
                      }))
                    }
                    className="h-10 bg-muted/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium">
                  Notes
                </Label>
                <Textarea
                  id="notes"
                  value={newEntry.notes}
                  onChange={(e) =>
                    setNewEntry((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Add any notes about this meal..."
                  className="min-h-[80px] bg-muted/50 resize-none"
                />
              </div>

              <Button
                onClick={addFoodLog}
                className="w-full h-11 bg-primary hover:bg-primary/90 transition-colors"
                disabled={!newEntry.meal_type || loading}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Food Log
              </Button>
            </div>

            {foodLogs.length > 0 && (
              <div className="space-y-6 mt-8">
                <h3 className="text-lg font-semibold">Today's Food Logs</h3>
                <div className="space-y-3">
                  {foodLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted/70 transition-colors group"
                    >
                      <div className="space-y-1">
                        <p className="font-medium text-base">{log.food.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="capitalize">{log.meal_type}</span>
                          <span>•</span>
                          <span>{log.servings} serving(s)</span>
                          {log.notes && (
                            <>
                              <span>•</span>
                              <span className="italic">{log.notes}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => deleteFoodLog(log.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Card className="border-none bg-muted/30">
                  <CardHeader>
                    <CardTitle className="text-lg">Daily Totals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      {Object.entries(calculateTotalNutrition()).map(
                        ([nutrient, value]) => (
                          <div key={nutrient} className="space-y-1">
                            <p className="text-sm font-medium capitalize text-muted-foreground">
                              {nutrient}
                            </p>
                            <p
                              className={cn(
                                "text-2xl font-bold",
                                nutrient === "calories"
                                  ? "text-primary"
                                  : "text-foreground"
                              )}
                            >
                              {Math.round(value)}
                              <span className="text-base ml-1">
                                {nutrient === "calories" ? "kcal" : "g"}
                              </span>
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
