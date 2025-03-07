"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function NutritionCalculator() {
  const [gender, setGender] = useState<"male" | "female">("male");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [activityLevel, setActivityLevel] = useState("sedentary");
  const [goal, setGoal] = useState("maintain");

  const calculateBMR = () => {
    if (!age || !weight || !height) return 0;

    // Mifflin-St Jeor Equation
    const w = parseFloat(weight) * 10; // kg to g
    const h = parseFloat(height) * 6.25; // cm
    const a = parseFloat(age) * 5;
    const s = gender === "male" ? 5 : -161;

    return w + h - a + s;
  };

  const calculateTDEE = () => {
    const bmr = calculateBMR();
    const activityMultipliers = {
      sedentary: 1.2, // Little or no exercise
      light: 1.375, // Light exercise 1-3 days/week
      moderate: 1.55, // Moderate exercise 3-5 days/week
      active: 1.725, // Heavy exercise 6-7 days/week
      veryActive: 1.9, // Very heavy exercise, physical job
    };

    return Math.round(
      bmr *
        activityMultipliers[activityLevel as keyof typeof activityMultipliers]
    );
  };

  const calculateMacros = () => {
    const tdee = calculateTDEE();
    let targetCalories = tdee;

    // Adjust calories based on goal
    switch (goal) {
      case "lose":
        targetCalories = tdee - 500; // 500 calorie deficit
        break;
      case "gain":
        targetCalories = tdee + 500; // 500 calorie surplus
        break;
    }

    // Calculate macros (40/30/30 split by default)
    const protein = Math.round((targetCalories * 0.3) / 4); // 4 calories per gram of protein
    const carbs = Math.round((targetCalories * 0.4) / 4); // 4 calories per gram of carbs
    const fats = Math.round((targetCalories * 0.3) / 9); // 9 calories per gram of fat

    return {
      calories: targetCalories,
      protein,
      carbs,
      fats,
    };
  };

  const macros = calculateMacros();

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Enter your details to calculate your nutritional needs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Gender</Label>
            <RadioGroup
              defaultValue={gender}
              onValueChange={(value) => setGender(value as "male" | "female")}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="male" id="male" />
                <Label htmlFor="male">Male</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="female" id="female" />
                <Label htmlFor="female">Female</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Years"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Weight</Label>
              <Input
                id="weight"
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="kg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Height</Label>
              <Input
                id="height"
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="cm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="activity">Activity Level</Label>
            <Select value={activityLevel} onValueChange={setActivityLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Select activity level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sedentary">
                  Sedentary (Little or no exercise)
                </SelectItem>
                <SelectItem value="light">
                  Light (Exercise 1-3 days/week)
                </SelectItem>
                <SelectItem value="moderate">
                  Moderate (Exercise 3-5 days/week)
                </SelectItem>
                <SelectItem value="active">
                  Active (Exercise 6-7 days/week)
                </SelectItem>
                <SelectItem value="veryActive">
                  Very Active (Professional athlete)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal">Goal</Label>
            <Select value={goal} onValueChange={setGoal}>
              <SelectTrigger>
                <SelectValue placeholder="Select your goal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lose">Lose Weight</SelectItem>
                <SelectItem value="maintain">Maintain Weight</SelectItem>
                <SelectItem value="gain">Gain Weight</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Daily Targets</CardTitle>
          <CardDescription>Based on your information and goals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="bg-primary/5">
              <CardHeader className="p-4">
                <CardTitle className="text-lg">Calories</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-2xl font-bold">{macros.calories}</p>
                <p className="text-sm text-muted-foreground">kcal/day</p>
              </CardContent>
            </Card>
            <Card className="bg-primary/5">
              <CardHeader className="p-4">
                <CardTitle className="text-lg">Protein</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-2xl font-bold">{macros.protein}</p>
                <p className="text-sm text-muted-foreground">grams/day</p>
              </CardContent>
            </Card>
            <Card className="bg-primary/5">
              <CardHeader className="p-4">
                <CardTitle className="text-lg">Carbs</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-2xl font-bold">{macros.carbs}</p>
                <p className="text-sm text-muted-foreground">grams/day</p>
              </CardContent>
            </Card>
            <Card className="bg-primary/5">
              <CardHeader className="p-4">
                <CardTitle className="text-lg">Fats</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-2xl font-bold">{macros.fats}</p>
                <p className="text-sm text-muted-foreground">grams/day</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
