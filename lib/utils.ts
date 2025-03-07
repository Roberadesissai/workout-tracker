import { format } from "date-fns";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface WeekDate {
  date: Date;
  dayName: string;
  isToday: boolean;
}

export function formatDate(date: Date): string {
  return format(date, "EEEE, MMMM d, yyyy");
}

export function getCurrentDay(): string {
  return format(new Date(), "EEEE");
}

export function getWeekDates(): WeekDate[] {
  const today = new Date();
  const day = today.getDay(); // 0 is Sunday, 1 is Monday, etc.

  // Adjust to get Monday as the first day (0)
  const daysFromMonday = day === 0 ? 6 : day - 1;

  // Get Monday's date
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysFromMonday);

  // Generate all weekdays including weekend
  const weekDates: WeekDate[] = [];
  for (let i = 0; i < 7; i++) {
    // Changed from 5 to 7 to include weekend
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    weekDates.push({
      date,
      dayName: format(date, "EEEE"),
      isToday: format(date, "yyyy-MM-dd") === format(today, "yyyy-MM-dd"),
    });
  }

  return weekDates;
}

// Generate a unique ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// Create a local storage helper
export function getLocalStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;

  const stored = localStorage.getItem(key);
  if (!stored) return defaultValue;

  try {
    return JSON.parse(stored) as T;
  } catch (error) {
    console.error("Error parsing stored data:", error);
    return defaultValue;
  }
}

export function setLocalStorage<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}
