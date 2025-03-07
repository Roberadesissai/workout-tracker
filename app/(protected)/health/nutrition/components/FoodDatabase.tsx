import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface FoodItem {
  id: string;
  name: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  vitamins: {
    [key: string]: number;
  };
  minerals: {
    [key: string]: number;
  };
}

const commonFoods: FoodItem[] = [
  {
    id: "1",
    name: "Chicken Breast",
    servingSize: "100g",
    calories: 165,
    protein: 31,
    carbs: 0,
    fats: 3.6,
    fiber: 0,
    vitamins: {
      B6: 0.6,
      B12: 0.3,
    },
    minerals: {
      iron: 1,
      zinc: 1,
    },
  },
  {
    id: "2",
    name: "Brown Rice",
    servingSize: "100g cooked",
    calories: 112,
    protein: 2.6,
    carbs: 23,
    fats: 0.9,
    fiber: 1.8,
    vitamins: {
      B1: 0.1,
      B6: 0.1,
    },
    minerals: {
      magnesium: 44,
      iron: 0.5,
    },
  },
  // Add more common foods...
];

export default function FoodDatabase() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);

  const filteredFoods = commonFoods.filter((food) =>
    food.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Food Database</CardTitle>
          <CardDescription>
            Search for foods to view their nutritional information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Search foods..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline" size="icon">
              <Search className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Food</TableHead>
                  <TableHead>Serving</TableHead>
                  <TableHead>Calories</TableHead>
                  <TableHead>Protein</TableHead>
                  <TableHead>Carbs</TableHead>
                  <TableHead>Fats</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFoods.map((food) => (
                  <TableRow
                    key={food.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedFood(food)}
                  >
                    <TableCell className="font-medium">{food.name}</TableCell>
                    <TableCell>{food.servingSize}</TableCell>
                    <TableCell>{food.calories}</TableCell>
                    <TableCell>{food.protein}g</TableCell>
                    <TableCell>{food.carbs}g</TableCell>
                    <TableCell>{food.fats}g</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {selectedFood && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>{selectedFood.name}</CardTitle>
                <CardDescription>
                  Nutritional information per {selectedFood.servingSize}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Macronutrients</h4>
                    <ul className="space-y-1 text-sm">
                      <li>Calories: {selectedFood.calories} kcal</li>
                      <li>Protein: {selectedFood.protein}g</li>
                      <li>Carbohydrates: {selectedFood.carbs}g</li>
                      <li>Fats: {selectedFood.fats}g</li>
                      <li>Fiber: {selectedFood.fiber}g</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Micronutrients</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <h5 className="font-medium">Vitamins</h5>
                        <ul className="space-y-1">
                          {Object.entries(selectedFood.vitamins).map(
                            ([vitamin, amount]) => (
                              <li key={vitamin}>
                                Vitamin {vitamin}: {amount}mg
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-medium">Minerals</h5>
                        <ul className="space-y-1">
                          {Object.entries(selectedFood.minerals).map(
                            ([mineral, amount]) => (
                              <li key={mineral}>
                                {mineral.charAt(0).toUpperCase() +
                                  mineral.slice(1)}
                                : {amount}mg
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
