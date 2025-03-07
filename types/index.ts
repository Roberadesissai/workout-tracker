export interface Exercise {
    name: string;
    sets?: number;
    reps?: string;
    time?: string;
    note?: string;
    type: 'primary' | 'optional' | 'cardio' | 'circuit' | 'daily';
    category?: string;
  }
  
  export interface Workout {
    name: string;
    exercises: Exercise[];
  }
  
  export interface WorkoutDay {
    [key: string]: Workout;
  }
  
  export interface ExerciseLog {
    completed: boolean;
    weights: string[];
  }
  
  export interface WorkoutLog {
    [exerciseName: string]: ExerciseLog;
  }
  
  export interface WeekDate {
    date: Date;
    dayName: string;
    isToday: boolean;
  }
  
  export interface DayStat {
    day: string;
    date: string;
    completed: number;
  }