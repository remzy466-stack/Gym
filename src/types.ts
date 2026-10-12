export interface ExerciseSet {
  id: string;
  reps: number;
  weightKg: number;
  rpe: number;
  completed: boolean;
}

export interface ExerciseItem {
  id: string;
  name: string;
  muscleGroup: string;
  restSeconds: number;
  formCue: string;
  sets: ExerciseSet[];
}

export interface WorkoutRoutine {
  id: string;
  title: string;
  focus: string;
  durationMinutes: number;
  coachNote: string;
  exercises: ExerciseItem[];
}

export interface MealLogItem {
  id: string;
  mealName: string;
  mealType: 'Breakfast' | 'Lunch' | 'Pre-Workout' | 'Post-Workout' | 'Dinner' | 'Snack';
  timestamp: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  detectedItems: string[];
  nutritionistTip?: string;
}

export interface MacroTargets {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  waterMl: number;
}

export interface ReadinessState {
  sleepHours: number;
  soreness: number; // 1-10
  energy: number; // 1-10
  goal: 'Hypertrophy & Lean Mass' | 'Maximal Strength' | 'Metabolic Conditioning' | 'Mobility & Active Recovery';
}

export interface DailyAdviceBrief {
  headline: string;
  workoutAdjustment: string;
  nutritionFocus: string;
  recoveryProtocol: string;
  spokenSummary: string;
  audioBase64?: string | null;
}

export interface JointCheckpoint {
  joint: string;
  status: string;
  observation: string;
}

export interface FormAnalysisResult {
  score: number;
  riskLevel: 'Nominal' | 'Caution' | 'High Risk' | string;
  primaryCorrection: string;
  bracingCue: string;
  spokenCue: string;
  jointCheckpoints: JointCheckpoint[];
  audioBase64?: string | null;
  timestamp: string;
  exerciseName: string;
}

export interface LeaderboardEntry {
  rank: number;
  athleteName: string;
  progress: number;
  streakDays: number;
  isCurrentUser?: boolean;
}

export interface SocialChallenge {
  id: string;
  title: string;
  category: 'Strength' | 'Nutrition' | 'Consistency';
  targetMetric: number;
  unit: string;
  userProgress: number;
  participantsCount: number;
  daysRemaining: number;
  joined: boolean;
  rewardLabel: string;
  leaderboard: LeaderboardEntry[];
}

export interface PushNotificationAlert {
  id: string;
  title: string;
  body: string;
  category: 'Workout' | 'Nutrition' | 'Challenge' | 'Coach Call';
  timeLabel: string;
  read: boolean;
}

export interface CallTurn {
  id: string;
  sender: 'coach' | 'athlete';
  text: string;
  timestamp: string;
  actionSteps?: string[];
  escalateToHotline?: boolean;
  triageClassification?: string;
}
