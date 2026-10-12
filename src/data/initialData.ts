import {
  WorkoutRoutine,
  MealLogItem,
  MacroTargets,
  ReadinessState,
  DailyAdviceBrief,
  FormAnalysisResult,
  SocialChallenge,
  PushNotificationAlert,
} from './types';

import heroGymImg from '../assets/images/hero_gym_biomechanics_1791797749922.jpg';
import squatRefImg from '../assets/images/form_squat_reference_1791797764118.jpg';
import mealBowlImg from '../assets/images/meal_macro_bowl_1791797778436.jpg';
import coachAvatarImg from '../assets/images/coach_avatar_profile_1791797789828.jpg';

export const ASSETS = {
  heroGymImg,
  squatRefImg,
  mealBowlImg,
  coachAvatarImg,
};

export const EMERGENCY_HOTLINE = '07057124133';

export const INITIAL_READINESS: ReadinessState = {
  sleepHours: 7.5,
  soreness: 3,
  energy: 8,
  goal: 'Hypertrophy & Lean Mass',
};

export const INITIAL_DAILY_ADVICE: DailyAdviceBrief = {
  headline: 'Prime CNS Readiness: Push Top-Set Squat Velocity Today',
  workoutAdjustment:
    'With 7.5h sleep and low soreness (3/10), maintain 85% 1RM working loads on compound lifts and keep rest intervals strictly at 120s.',
  nutritionFocus:
    'Ingest 45g fast-digesting carbohydrates and 35g whey or lean protein within 45 minutes post-session to replenish glycogen.',
  recoveryProtocol:
    'Perform 6 minutes of 90/90 hip internal rotation and thoracic spine extension before loading the barbell.',
  spokenSummary:
    'Your central nervous system readiness is locked in at 84 percent today. Hit your top barbell squat sets with crisp bar speed, and prioritize your post-workout protein target.',
};

export const INITIAL_MACRO_TARGETS: MacroTargets = {
  calories: 2750,
  protein: 205,
  carbs: 290,
  fats: 82,
  waterMl: 3500,
};

export const INITIAL_MEALS: MealLogItem[] = [
  {
    id: 'meal-1',
    mealName: 'Wild Salmon, Quinoa & Avocado Recovery Bowl',
    mealType: 'Lunch',
    timestamp: '12:45 PM',
    calories: 685,
    protein: 52,
    carbs: 64,
    fats: 24,
    fiber: 11,
    detectedItems: [
      '200g Seared Wild Atlantic Salmon',
      '150g Cooked Tri-Color Quinoa',
      '80g Sliced Hass Avocado & Edamame',
      '100g Roasted Sweet Potato Cubes',
    ],
    nutritionistTip:
      'High omega-3 fatty acids paired with slow-release complex carbs sustain afternoon training output.',
  },
  {
    id: 'meal-2',
    mealName: 'Egg White Omelet, Sourdough & Mixed Berries',
    mealType: 'Breakfast',
    timestamp: '08:15 AM',
    calories: 540,
    protein: 46,
    carbs: 58,
    fats: 14,
    fiber: 7,
    detectedItems: [
      '2 Whole Pasture Eggs + 150ml Egg Whites',
      '2 Slices Toasted Artisan Sourdough',
      '100g Fresh Blueberries & Spinach',
    ],
    nutritionistTip:
      'High leucine breakfast kickstarts muscle protein synthesis after overnight fasting.',
  },
  {
    id: 'meal-3',
    mealName: 'Pre-Session Whey Isolate & Banana Espresso',
    mealType: 'Pre-Workout',
    timestamp: '04:00 PM',
    calories: 295,
    protein: 32,
    carbs: 36,
    fats: 2,
    fiber: 3,
    detectedItems: [
      '1.5 Scoops Hydrolyzed Whey Isolate',
      '1 Large Ripe Banana',
      'Double Shot Espresso',
    ],
    nutritionistTip:
      'Rapidly absorbed glucose and amino acids minimize muscle breakdown during heavy compound sets.',
  },
];

export const INITIAL_ROUTINES: WorkoutRoutine[] = [
  {
    id: 'routine-1',
    title: 'Lower Body Force & Posterior Chain Hypertrophy',
    focus: 'Quads · Glutes · Hamstrings · Core Bracing',
    durationMinutes: 65,
    coachNote:
      'Drive knees outward over mid-foot during the eccentric phase. Use AI Form Studio on your top squat set.',
    exercises: [
      {
        id: 'ex-1',
        name: 'High-Bar Back Squat',
        muscleGroup: 'Quadriceps & Glutes',
        restSeconds: 120,
        formCue: '360-degree abdominal brace; keep chest proud and elbows tucked under the bar.',
        sets: [
          { id: 's-1', reps: 8, weightKg: 100, rpe: 7.5, completed: true },
          { id: 's-2', reps: 6, weightKg: 115, rpe: 8.5, completed: true },
          { id: 's-3', reps: 6, weightKg: 120, rpe: 9.0, completed: false },
          { id: 's-4', reps: 8, weightKg: 110, rpe: 8.0, completed: false },
        ],
      },
      {
        id: 'ex-2',
        name: 'Romanian Deadlift (Barbell)',
        muscleGroup: 'Hamstrings & Erectors',
        restSeconds: 90,
        formCue: 'Push hips straight back as if closing a car door; shave the bar down your shins.',
        sets: [
          { id: 's-5', reps: 10, weightKg: 95, rpe: 8.0, completed: true },
          { id: 's-6', reps: 10, weightKg: 100, rpe: 8.5, completed: false },
          { id: 's-7', reps: 10, weightKg: 100, rpe: 9.0, completed: false },
        ],
      },
      {
        id: 'ex-3',
        name: 'Bulgarian Split Squat (Dumbbells)',
        muscleGroup: 'Unilateral Quads & Glute Medius',
        restSeconds: 75,
        formCue: 'Slight 15-degree forward torso lean; prevent front knee valgus collapse.',
        sets: [
          { id: 's-8', reps: 10, weightKg: 28, rpe: 8.5, completed: false },
          { id: 's-9', reps: 10, weightKg: 28, rpe: 9.0, completed: false },
          { id: 's-10', reps: 10, weightKg: 28, rpe: 9.0, completed: false },
        ],
      },
      {
        id: 'ex-4',
        name: 'Hanging Straight-Leg Raise',
        muscleGroup: 'Anterior Core & Hip Flexors',
        restSeconds: 60,
        formCue: 'Posteriorly tilt the pelvis at the top; control the 3-second lowering phase.',
        sets: [
          { id: 's-11', reps: 12, weightKg: 0, rpe: 8.0, completed: false },
          { id: 's-12', reps: 12, weightKg: 0, rpe: 8.5, completed: false },
          { id: 's-13', reps: 12, weightKg: 0, rpe: 9.0, completed: false },
        ],
      },
    ],
  },
  {
    id: 'routine-2',
    title: 'Upper Body Push/Pull Mechanical Tension',
    focus: 'Pectorals · Lats · Deltoids · Triceps',
    durationMinutes: 55,
    coachNote: 'Focus on scapular retraction on rows and controlled 2-second pause on incline press.',
    exercises: [
      {
        id: 'ex-201',
        name: 'Incline Dumbbell Bench Press',
        muscleGroup: 'Upper Pectorals & Anterior Delts',
        restSeconds: 90,
        formCue: '45-degree elbow tuck; full stretch at bottom without shoulder rolling forward.',
        sets: [
          { id: 's-201', reps: 8, weightKg: 36, rpe: 8.0, completed: false },
          { id: 's-202', reps: 8, weightKg: 38, rpe: 8.5, completed: false },
          { id: 's-203', reps: 8, weightKg: 38, rpe: 9.0, completed: false },
        ],
      },
      {
        id: 'ex-202',
        name: 'Weighted Pull-Ups',
        muscleGroup: 'Latissimus Dorsi & Biceps',
        restSeconds: 120,
        formCue: 'Initiate pull by depressing shoulder blades; drive elbows down toward hips.',
        sets: [
          { id: 's-204', reps: 6, weightKg: 15, rpe: 8.5, completed: false },
          { id: 's-205', reps: 6, weightKg: 15, rpe: 9.0, completed: false },
          { id: 's-206', reps: 6, weightKg: 15, rpe: 9.0, completed: false },
        ],
      },
    ],
  },
];

export const INITIAL_FORM_ANALYSIS: FormAnalysisResult = {
  score: 91,
  riskLevel: 'Nominal',
  primaryCorrection:
    'Maintain mid-foot pressure coming out of the hole; avoid slight hips-rising-faster-than-chest shift at sticking point.',
  bracingCue:
    'Take a deep 360-degree diaphragmatic breath into your obliques and lock your lats down before initiating hip flexion.',
  spokenCue:
    'Strong depth and neutral lumbar spine at parallel. Drive your upper back into the bar out of the bottom to keep your torso angle locked.',
  jointCheckpoints: [
    {
      joint: 'Lumbar & Thoracic Spine',
      status: 'Nominal Alignment',
      observation: 'Neutral spine maintained through 105-degree hip flexion with zero lumbar rounding.',
    },
    {
      joint: 'Knee Tracking & Valgus Control',
      status: 'Nominal Alignment',
      observation: 'Patella tracks cleanly over second and third toe with stable ankle dorsiflexion.',
    },
    {
      joint: 'Bar Path Verticality',
      status: 'Minor Forward Drift',
      observation: '1.8cm forward drift during concentric transition; cue chest up out of the hole.',
    },
  ],
  timestamp: 'Today · 04:20 PM',
  exerciseName: 'High-Bar Back Squat',
};

export const INITIAL_CHALLENGES: SocialChallenge[] = [
  {
    id: 'chal-1',
    title: 'October 50,000 kg Compound Volume Club',
    category: 'Strength',
    targetMetric: 50000,
    unit: 'kg lifted',
    userProgress: 38450,
    participantsCount: 1420,
    daysRemaining: 9,
    joined: true,
    rewardLabel: 'Apex Heavy Hitter Recognition',
    leaderboard: [
      { rank: 1, athleteName: 'Elena Rostova', progress: 47900, streakDays: 21 },
      { rank: 2, athleteName: 'Devon Vance', progress: 44120, streakDays: 19 },
      { rank: 3, athleteName: 'You (Athlete)', progress: 38450, streakDays: 14, isCurrentUser: true },
      { rank: 4, athleteName: 'Kofi Mensah', progress: 36800, streakDays: 12 },
      { rank: 5, athleteName: 'Sora Takahashi', progress: 34200, streakDays: 11 },
    ],
  },
  {
    id: 'chal-2',
    title: '30-Day 180g+ Daily Protein Streak',
    category: 'Nutrition',
    targetMetric: 30,
    unit: 'days hit',
    userProgress: 18,
    participantsCount: 2890,
    daysRemaining: 12,
    joined: true,
    rewardLabel: 'Metabolic Precision Recognition',
    leaderboard: [
      { rank: 1, athleteName: 'Marcus Sterling', progress: 22, streakDays: 22 },
      { rank: 2, athleteName: 'You (Athlete)', progress: 18, streakDays: 18, isCurrentUser: true },
      { rank: 3, athleteName: 'Aria Chen', progress: 17, streakDays: 17 },
      { rank: 4, athleteName: 'Liam O’Connor', progress: 15, streakDays: 15 },
    ],
  },
  {
    id: 'chal-3',
    title: 'Zero Missed Mobility & Form Check Week',
    category: 'Consistency',
    targetMetric: 7,
    unit: 'sessions',
    userProgress: 5,
    participantsCount: 940,
    daysRemaining: 3,
    joined: true,
    rewardLabel: 'Biomechanics Mastery Recognition',
    leaderboard: [
      { rank: 1, athleteName: 'You (Athlete)', progress: 5, streakDays: 5, isCurrentUser: true },
      { rank: 2, athleteName: 'Nadia Al-Mansoor', progress: 5, streakDays: 5 },
      { rank: 3, athleteName: 'lucas_lifts', progress: 4, streakDays: 4 },
    ],
  },
];

export const INITIAL_NOTIFICATIONS: PushNotificationAlert[] = [
  {
    id: 'notif-1',
    title: 'Pre-Workout Macro Window Open',
    body: 'You are 75g short of your daily protein goal. Log your post-training meal within 60 minutes.',
    category: 'Nutrition',
    timeLabel: '12m ago',
    read: false,
  },
  {
    id: 'notif-2',
    title: 'Challenge Alert: Devon Vance Logged +3,200 kg',
    body: 'Complete your remaining 2 Squat sets (+1,440 kg) to close the gap in the 50,000 kg Volume Club.',
    category: 'Challenge',
    timeLabel: '45m ago',
    read: false,
  },
  {
    id: 'notif-3',
    title: 'Coach Marcus Live Form Check Scheduled',
    body: 'Tap "Live Coach · 07057124133" anytime during your heavy working sets for instant voice spotting or emergency support.',
    category: 'Coach Call',
    timeLabel: '2h ago',
    read: true,
  },
];
