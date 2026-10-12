import React, { useState, useEffect, useCallback } from 'react';
import {
  Phone,
  PhoneIncoming,
  Volume2,
  Sparkles,
  Dumbbell,
  Utensils,
  Trophy,
  Camera,
  Bell,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
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
import {
  ASSETS,
  EMERGENCY_HOTLINE,
  INITIAL_READINESS,
  INITIAL_DAILY_ADVICE,
  INITIAL_MACRO_TARGETS,
  INITIAL_MEALS,
  INITIAL_ROUTINES,
  INITIAL_FORM_ANALYSIS,
  INITIAL_CHALLENGES,
  INITIAL_NOTIFICATIONS,
} from './data/initialData';
import { WorkoutAndFormView } from './components/WorkoutAndFormView';
import { NutritionMacroView } from './components/NutritionMacroView';
import { ChallengesAndNotificationsView } from './components/ChallengesAndNotificationsView';
import { LiveCoachCallModal } from './components/LiveCoachCallModal';
import { playCoachAudio } from './utils/audioPlayer';

type ActiveTab = 'dashboard' | 'workouts' | 'nutrition' | 'challenges';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Persistent State Hooks
  const [readiness, setReadiness] = useState<ReadinessState>(() => {
    const saved = localStorage.getItem('apex_readiness');
    return saved ? JSON.parse(saved) : INITIAL_READINESS;
  });

  const [dailyAdvice, setDailyAdvice] = useState<DailyAdviceBrief>(() => {
    const saved = localStorage.getItem('apex_daily_advice');
    return saved ? JSON.parse(saved) : INITIAL_DAILY_ADVICE;
  });

  const [routines, setRoutines] = useState<WorkoutRoutine[]>(() => {
    const saved = localStorage.getItem('apex_routines');
    return saved ? JSON.parse(saved) : INITIAL_ROUTINES;
  });

  const [activeRoutineId, setActiveRoutineId] = useState<string>(() => {
    return INITIAL_ROUTINES[0].id;
  });

  const [meals, setMeals] = useState<MealLogItem[]>(() => {
    const saved = localStorage.getItem('apex_meals');
    return saved ? JSON.parse(saved) : INITIAL_MEALS;
  });

  const [macroTargets, setMacroTargets] = useState<MacroTargets>(() => {
    const saved = localStorage.getItem('apex_macro_targets');
    return saved ? JSON.parse(saved) : INITIAL_MACRO_TARGETS;
  });

  const [waterIntakeMl, setWaterIntakeMl] = useState<number>(() => {
    const saved = localStorage.getItem('apex_water_ml');
    return saved ? Number(saved) : 2250;
  });

  const [formAnalysis, setFormAnalysis] = useState<FormAnalysisResult>(() => {
    const saved = localStorage.getItem('apex_form_analysis');
    return saved ? JSON.parse(saved) : INITIAL_FORM_ANALYSIS;
  });

  const [challenges, setChallenges] = useState<SocialChallenge[]>(() => {
    const saved = localStorage.getItem('apex_challenges');
    return saved ? JSON.parse(saved) : INITIAL_CHALLENGES;
  });

  const [notifications, setNotifications] = useState<PushNotificationAlert[]>(() => {
    const saved = localStorage.getItem('apex_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  // Live Call & Emergency Modal state
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [callModalMode, setCallModalMode] = useState<'incoming' | 'active' | 'emergency'>('active');
  const [incomingCallBannerVisible, setIncomingCallBannerVisible] = useState(true);

  // Loading & Toast state
  const [isGeneratingAdvice, setIsGeneratingAdvice] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  }, []);

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem('apex_readiness', JSON.stringify(readiness));
  }, [readiness]);

  useEffect(() => {
    localStorage.setItem('apex_daily_advice', JSON.stringify(dailyAdvice));
  }, [dailyAdvice]);

  useEffect(() => {
    localStorage.setItem('apex_routines', JSON.stringify(routines));
  }, [routines]);

  useEffect(() => {
    localStorage.setItem('apex_meals', JSON.stringify(meals));
  }, [meals]);

  useEffect(() => {
    localStorage.setItem('apex_water_ml', String(waterIntakeMl));
  }, [waterIntakeMl]);

  useEffect(() => {
    localStorage.setItem('apex_form_analysis', JSON.stringify(formAnalysis));
  }, [formAnalysis]);

  useEffect(() => {
    localStorage.setItem('apex_challenges', JSON.stringify(challenges));
  }, [challenges]);

  useEffect(() => {
    localStorage.setItem('apex_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Computed Metrics
  const readinessScore = Math.min(
    99,
    Math.max(
      35,
      Math.round(
        (readiness.sleepHours / 8.5) * 40 +
          ((11 - readiness.soreness) / 10) * 30 +
          (readiness.energy / 10) * 30
      )
    )
  );

  const totalCaloriesLogged = meals.reduce((acc, m) => acc + m.calories, 0);
  const totalProteinLogged = meals.reduce((acc, m) => acc + m.protein, 0);
  const totalCarbsLogged = meals.reduce((acc, m) => acc + m.carbs, 0);
  const totalFatsLogged = meals.reduce((acc, m) => acc + m.fats, 0);
  const caloriesRemaining = Math.max(0, macroTargets.calories - totalCaloriesLogged);

  const activeRoutine = routines.find((r) => r.id === activeRoutineId) || routines[0];
  const allSets = activeRoutine.exercises.flatMap((ex) => ex.sets);
  const completedSetsCount = allSets.filter((s) => s.completed).length;
  const totalVolumeKg = activeRoutine.exercises.reduce(
    (acc, ex) =>
      acc +
      ex.sets
        .filter((s) => s.completed)
        .reduce((sAcc, s) => sAcc + s.reps * s.weightKg, 0),
    0
  );

  // Handlers
  const handleGenerateDailyAdvice = async () => {
    if (isGeneratingAdvice) return;
    setIsGeneratingAdvice(true);
    try {
      const response = await fetch('/api/ai/daily-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sleepHours: readiness.sleepHours,
          soreness: readiness.soreness,
          energy: readiness.energy,
          goal: readiness.goal,
          caloriesLogged: totalCaloriesLogged,
          proteinLogged: totalProteinLogged,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate daily coaching brief');
      }

      setDailyAdvice(data);
      showToast('Updated AI Daily Coaching Brief — playing spoken summary.');
      await playCoachAudio(data.audioBase64, data.spokenSummary);
    } catch (err: any) {
      showToast(err?.message || 'Could not refresh daily advice.');
    } finally {
      setIsGeneratingAdvice(false);
    }
  };

  const handleToggleSet = (routineId: string, exerciseId: string, setId: string) => {
    setRoutines((prev) =>
      prev.map((rt) => {
        if (rt.id !== routineId) return rt;
        return {
          ...rt,
          exercises: rt.exercises.map((ex) => {
            if (ex.id !== exerciseId) return ex;
            return {
              ...ex,
              sets: ex.sets.map((s) => {
                if (s.id !== setId) return s;
                const nextCompleted = !s.completed;
                if (nextCompleted) {
                  showToast(`Logged ${ex.name}: ${s.weightKg}kg × ${s.reps} reps`);
                }
                return { ...s, completed: nextCompleted };
              }),
            };
          }),
        };
      })
    );
  };

  const handleAddSet = (routineId: string, exerciseId: string) => {
    setRoutines((prev) =>
      prev.map((rt) => {
        if (rt.id !== routineId) return rt;
        return {
          ...rt,
          exercises: rt.exercises.map((ex) => {
            if (ex.id !== exerciseId) return ex;
            const lastSet = ex.sets[ex.sets.length - 1] || {
              reps: 8,
              weightKg: 60,
              rpe: 8,
            };
            return {
              ...ex,
              sets: [
                ...ex.sets,
                {
                  id: `s-${Date.now()}`,
                  reps: lastSet.reps,
                  weightKg: lastSet.weightKg,
                  rpe: lastSet.rpe,
                  completed: false,
                },
              ],
            };
          }),
        };
      })
    );
    showToast('Added working set to exercise.');
  };

  const handleUpdateSetValues = (
    routineId: string,
    exerciseId: string,
    setId: string,
    field: 'reps' | 'weightKg' | 'rpe',
    value: number
  ) => {
    setRoutines((prev) =>
      prev.map((rt) => {
        if (rt.id !== routineId) return rt;
        return {
          ...rt,
          exercises: rt.exercises.map((ex) => {
            if (ex.id !== exerciseId) return ex;
            return {
              ...ex,
              sets: ex.sets.map((s) => (s.id === setId ? { ...s, [field]: value } : s)),
            };
          }),
        };
      })
    );
  };

  const handleAddRoutine = (newRoutine: WorkoutRoutine) => {
    setRoutines((prev) => [newRoutine, ...prev]);
    setActiveRoutineId(newRoutine.id);
  };

  const handleAddMeal = (meal: MealLogItem) => {
    setMeals((prev) => [meal, ...prev]);
  };

  const handleDeleteMeal = (id: string) => {
    setMeals((prev) => prev.filter((m) => m.id !== id));
    showToast('Removed meal entry.');
  };

  const handleToggleJoinChallenge = (id: string) => {
    setChallenges((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const nextJoined = !c.joined;
        showToast(nextJoined ? `Joined "${c.title}"` : `Left "${c.title}"`);
        return {
          ...c,
          joined: nextJoined,
          participantsCount: nextJoined ? c.participantsCount + 1 : c.participantsCount - 1,
        };
      })
    );
  };

  const handleLogChallengeProgress = (id: string, delta: number) => {
    setChallenges((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const nextProg = Math.min(c.targetMetric, c.userProgress + delta);
        const updatedBoard = c.leaderboard
          .map((row) => (row.isCurrentUser ? { ...row, progress: nextProg } : row))
          .sort((a, b) => b.progress - a.progress)
          .map((row, idx) => ({ ...row, rank: idx + 1 }));
        return {
          ...c,
          userProgress: nextProg,
          leaderboard: updatedBoard,
        };
      })
    );
    showToast(`Logged +${delta} progress toward challenge leaderboard!`);
  };

  const handleTriggerPushAlert = (
    title: string,
    body: string,
    category: PushNotificationAlert['category']
  ) => {
    const newNotif: PushNotificationAlert = {
      id: `notif-${Date.now()}`,
      title,
      body,
      category,
      timeLabel: 'Just now',
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
    showToast(`Push Notification: ${title}`);
  };

  const handleMarkNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const openCallModal = (mode: 'incoming' | 'active' | 'emergency') => {
    setCallModalMode(mode);
    setCallModalOpen(true);
    setIncomingCallBannerVisible(false);
  };

  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col">
      {/* Mandatory 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-6 py-4 bg-[#0B0F17]/90 backdrop-blur-md border-b border-slate-800">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('dashboard');
          }}
          className="text-xl font-display font-bold tracking-wider text-white uppercase whitespace-nowrap shrink-0"
        >
          APEX KINETIX
        </a>

        {/* Zone 2: 4 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'dashboard'
                ? 'text-[#D4FF00] underline underline-offset-8 decoration-2'
                : 'hover:text-white'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('workouts')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'workouts'
                ? 'text-[#D4FF00] underline underline-offset-8 decoration-2'
                : 'hover:text-white'
            }`}
          >
            Workouts & Form
          </button>
          <button
            onClick={() => setActiveTab('nutrition')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'nutrition'
                ? 'text-[#D4FF00] underline underline-offset-8 decoration-2'
                : 'hover:text-white'
            }`}
          >
            Nutrition
          </button>
          <button
            onClick={() => setActiveTab('challenges')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'challenges'
                ? 'text-[#D4FF00] underline underline-offset-8 decoration-2'
                : 'hover:text-white'
            }`}
          >
            Challenges ({unreadNotifsCount})
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => openCallModal('active')}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-[#D4FF00] rounded-lg hover:bg-[#b8e600] transition-colors whitespace-nowrap shrink-0 font-mono tabular-nums"
          >
            Live Coach · {EMERGENCY_HOTLINE}
          </button>
        </div>
      </header>

      {/* Incoming Live Coach Call Alert Strip (Allows 1-click pickup for live coaching or emergency) */}
      {incomingCallBannerVisible && (
        <div className="bg-[#131B2E] border-b border-[#D4FF00]/30 px-6 py-2.5">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-xs">
              <PhoneIncoming className="w-4 h-4 text-[#D4FF00] shrink-0" />
              <span className="font-semibold text-white">
                Incoming Trainer Check-In Call: Head Coach Marcus
              </span>
              <span aria-hidden="true" className="text-slate-500">·</span>
              <span className="text-slate-300">
                Ready for live voice spotting on <strong className="text-white">{activeRoutine.exercises[0]?.name}</strong> or emergency hotline (<span className="font-mono text-[#D4FF00]">{EMERGENCY_HOTLINE}</span>)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => openCallModal('incoming')}
                className="px-3 py-1 rounded-lg bg-[#D4FF00] text-slate-950 font-semibold text-xs hover:bg-[#b8e600] transition-colors whitespace-nowrap shrink-0"
              >
                Pick Up Call
              </button>
              <a
                href={`tel:${EMERGENCY_HOTLINE}`}
                className="px-3 py-1 rounded-lg bg-red-600/90 hover:bg-red-500 text-white font-semibold text-xs font-mono tabular-nums transition-colors whitespace-nowrap shrink-0"
              >
                Dial {EMERGENCY_HOTLINE}
              </a>
              <button
                onClick={() => setIncomingCallBannerVisible(false)}
                className="px-2 py-1 text-xs text-slate-400 hover:text-white whitespace-nowrap shrink-0"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Feedback Banner */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-6 right-6 z-40 max-w-md px-4 py-3 rounded-xl bg-[#131B2E] border border-[#D4FF00] text-xs text-white shadow-2xl flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-[#D4FF00] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 pb-24 md:pb-12">
        {activeTab === 'dashboard' && (
          <div className="space-y-10">
            {/* Hero 2-Column Split: Left = Readiness & AI Daily Coach | Right = Full-Height Hero Visual Card */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              {/* Left 7 Columns: Daily Readiness Check-In & AI Personalized Coaching Brief */}
              <div className="lg:col-span-7 p-6 sm:p-8 rounded-2xl bg-[#131B2E] border border-slate-800 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <span>Daily Biometric Readiness</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-emerald-400 font-mono tabular-nums">
                        {readinessScore}% CNS Recovery
                      </span>
                    </div>
                    <button
                      onClick={() => playCoachAudio(dailyAdvice.audioBase64, dailyAdvice.spokenSummary)}
                      className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-[#D4FF00]" />
                      Hear Coach Brief
                    </button>
                  </div>

                  <h1 className="text-3xl sm:text-4xl font-display font-bold text-white uppercase tracking-wide leading-tight">
                    {dailyAdvice.headline}
                  </h1>

                  {/* 3 Readiness Sliders */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <div className="p-3.5 rounded-xl bg-[#0B0F17] border border-slate-800">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                        <span>Sleep Duration</span>
                        <span className="font-mono text-white font-semibold tabular-nums">
                          {readiness.sleepHours}h
                        </span>
                      </div>
                      <input
                        type="range"
                        min={4}
                        max={10}
                        step={0.5}
                        value={readiness.sleepHours}
                        onChange={(e) =>
                          setReadiness((prev) => ({
                            ...prev,
                            sleepHours: Number(e.target.value),
                          }))
                        }
                        className="w-full accent-[#D4FF00]"
                      />
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#0B0F17] border border-slate-800">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                        <span>Muscle Soreness</span>
                        <span className="font-mono text-white font-semibold tabular-nums">
                          {readiness.soreness}/10
                        </span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={10}
                        step={1}
                        value={readiness.soreness}
                        onChange={(e) =>
                          setReadiness((prev) => ({
                            ...prev,
                            soreness: Number(e.target.value),
                          }))
                        }
                        className="w-full accent-[#D4FF00]"
                      />
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#0B0F17] border border-slate-800">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                        <span>Energy & Drive</span>
                        <span className="font-mono text-white font-semibold tabular-nums">
                          {readiness.energy}/10
                        </span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={10}
                        step={1}
                        value={readiness.energy}
                        onChange={(e) =>
                          setReadiness((prev) => ({
                            ...prev,
                            energy: Number(e.target.value),
                          }))
                        }
                        className="w-full accent-[#D4FF00]"
                      />
                    </div>
                  </div>

                  {/* Structured Daily Prescription */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div className="p-3.5 rounded-xl bg-[#0B0F17] border border-slate-800/80">
                      <p className="text-[11px] text-[#D4FF00] font-semibold">Training Load</p>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {dailyAdvice.workoutAdjustment}
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#0B0F17] border border-slate-800/80">
                      <p className="text-[11px] text-emerald-400 font-semibold">Macro Timing</p>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {dailyAdvice.nutritionFocus}
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#0B0F17] border border-slate-800/80">
                      <p className="text-[11px] text-sky-400 font-semibold">Mobility & CNS</p>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {dailyAdvice.recoveryProtocol}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Row */}
                <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-800">
                  <button
                    onClick={handleGenerateDailyAdvice}
                    disabled={isGeneratingAdvice}
                    className="px-5 py-2.5 rounded-xl bg-[#D4FF00] hover:bg-[#b8e600] disabled:opacity-50 text-slate-950 font-semibold text-xs flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
                  >
                    <Sparkles className="w-4 h-4" />
                    {isGeneratingAdvice
                      ? 'Recalculating Daily AI Prescription...'
                      : 'Generate Personalized Daily Advice'}
                  </button>

                  <button
                    onClick={() => openCallModal('active')}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    Live Voice Session
                  </button>

                  <button
                    onClick={() => openCallModal('emergency')}
                    className="px-4 py-2.5 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-700/50 text-red-200 font-medium text-xs flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 font-mono tabular-nums"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                    Emergency: {EMERGENCY_HOTLINE}
                  </button>
                </div>
              </div>

              {/* Right 5 Columns: Full-Height Athletic Studio Visual + Live Coach Card */}
              <div className="lg:col-span-5 relative rounded-2xl overflow-hidden border border-slate-800 min-h-[360px] flex flex-col justify-end">
                <img
                  src={ASSETS.heroGymImg}
                  alt="APEX KINETIX Performance Lab"
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />

                <div className="relative z-10 p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={ASSETS.coachAvatarImg}
                      alt="Head Coach Marcus"
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-full object-cover border-2 border-[#D4FF00]"
                    />
                    <div>
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <span className="font-semibold text-white">Head Coach Marcus</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-[#D4FF00] font-mono">{EMERGENCY_HOTLINE}</span>
                      </div>
                      <p className="text-xs text-slate-300">
                        On-Call Biomechanics & Emergency Guidance
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-slate-200 leading-relaxed">
                    “{dailyAdvice.spokenSummary}”
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      onClick={() => setActiveTab('workouts')}
                      className="px-4 py-2 rounded-xl bg-white text-slate-950 font-semibold text-xs flex items-center gap-1.5 hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      Launch AI Form Check
                    </button>
                    <a
                      href={`tel:${EMERGENCY_HOTLINE}`}
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 font-mono tabular-nums"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      Direct Call {EMERGENCY_HOTLINE}
                    </a>
                  </div>
                </div>
              </div>
            </section>

            {/* Full-Width 4-Column KPI Telemetry Row Below Hero Split */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-[#131B2E] border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400">Active Session Volume</span>
                <div className="text-2xl font-bold text-white font-mono tabular-nums">
                  {totalVolumeKg.toLocaleString()} kg
                </div>
                <p className="text-xs text-slate-400 font-mono tabular-nums">
                  {completedSetsCount} / {allSets.length} sets logged today
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#131B2E] border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400">Daily Macro Compliance</span>
                <div className="text-2xl font-bold text-emerald-400 font-mono tabular-nums">
                  {totalProteinLogged}g / {macroTargets.protein}g P
                </div>
                <p className="text-xs text-slate-400 font-mono tabular-nums">
                  {totalCaloriesLogged} / {macroTargets.calories} kcal ({caloriesRemaining} left)
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#131B2E] border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400">Latest Biomechanical Score</span>
                <div className="text-2xl font-bold text-[#D4FF00] font-mono tabular-nums">
                  {formAnalysis.score} / 100
                </div>
                <p className="text-xs text-slate-400 truncate">
                  {formAnalysis.exerciseName} · {formAnalysis.riskLevel}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#131B2E] border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400">Accountability Rank</span>
                <div className="text-2xl font-bold text-white font-mono tabular-nums">
                  #3 of 1,420
                </div>
                <p className="text-xs text-slate-400">
                  50,000 kg Compound Volume Club
                </p>
              </div>
            </section>

            {/* Prioritized 4-Pillar Command Grid (Workout & Form + Meal & Macro Logger + Challenges & Notifications) */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Pillar 1: Quick Workout & Real-Time Form Preview (4 cols) */}
              <div className="lg:col-span-4 p-6 rounded-2xl bg-[#131B2E] border border-slate-800 flex flex-col justify-between space-y-5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-[#D4FF00] font-mono">01 · Training & Form</span>
                      <h2 className="text-xl font-display font-bold text-white uppercase mt-0.5">
                        {activeRoutine.title}
                      </h2>
                    </div>
                    <Dumbbell className="w-5 h-5 text-[#D4FF00] shrink-0" />
                  </div>

                  <div className="space-y-2.5">
                    {activeRoutine.exercises.slice(0, 3).map((ex) => {
                      const doneCount = ex.sets.filter((s) => s.completed).length;
                      return (
                        <div
                          key={ex.id}
                          className="p-3 rounded-xl bg-[#0B0F17] border border-slate-800 flex items-center justify-between text-xs"
                        >
                          <div>
                            <p className="font-semibold text-white">{ex.name}</p>
                            <p className="text-slate-400">{ex.muscleGroup}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono tabular-nums text-slate-300">
                              {doneCount}/{ex.sets.length} sets
                            </span>
                            <button
                              onClick={() => {
                                const nextSet = ex.sets.find((s) => !s.completed) || ex.sets[0];
                                if (nextSet) {
                                  handleToggleSet(activeRoutine.id, ex.id, nextSet.id);
                                }
                              }}
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[#D4FF00] font-medium whitespace-nowrap shrink-0"
                            >
                              +Set
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Mini Form Check Summary */}
                  <div className="p-3.5 rounded-xl bg-[#0B0F17] border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">AI Form Correction Cue</span>
                      <span className="font-mono text-emerald-400">{formAnalysis.score}/100</span>
                    </div>
                    <p className="text-xs text-slate-200 line-clamp-2">
                      {formAnalysis.primaryCorrection}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('workouts')}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0"
                >
                  Open Routine Builder & Live Form Studio
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Pillar 2: Integrated Meal & Macro Snapshot (4 cols) */}
              <div className="lg:col-span-4 p-6 rounded-2xl bg-[#131B2E] border border-slate-800 flex flex-col justify-between space-y-5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-emerald-400 font-mono">02 · Fuel & Macros</span>
                      <h2 className="text-xl font-display font-bold text-white uppercase mt-0.5">
                        Daily Nutrition & Meal Log
                      </h2>
                    </div>
                    <Utensils className="w-5 h-5 text-emerald-400 shrink-0" />
                  </div>

                  {/* Macro Breakdown Bars */}
                  <div className="space-y-3 p-3.5 rounded-xl bg-[#0B0F17] border border-slate-800">
                    {[
                      {
                        label: 'Protein',
                        val: totalProteinLogged,
                        max: macroTargets.protein,
                        color: 'bg-emerald-400',
                      },
                      {
                        label: 'Carbohydrates',
                        val: totalCarbsLogged,
                        max: macroTargets.carbs,
                        color: 'bg-sky-400',
                      },
                      {
                        label: 'Dietary Fats',
                        val: totalFatsLogged,
                        max: macroTargets.fats,
                        color: 'bg-amber-400',
                      },
                    ].map((m) => {
                      const p = Math.min(100, Math.round((m.val / m.max) * 100));
                      return (
                        <div key={m.label} className="space-y-1">
                          <div className="flex justify-between text-xs font-mono tabular-nums">
                            <span className="text-slate-300 font-sans">{m.label}</span>
                            <span className="text-white">
                              {m.val}g / {m.max}g ({p}%)
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div className={`h-full ${m.color}`} style={{ width: `${p}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Recent Logged Meals */}
                  <div className="space-y-2">
                    {meals.slice(0, 2).map((meal) => (
                      <div
                        key={meal.id}
                        className="p-3 rounded-xl bg-[#0B0F17] border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div className="truncate pr-2">
                          <p className="font-semibold text-white truncate">{meal.mealName}</p>
                          <p className="text-slate-400 font-mono tabular-nums">
                            {meal.mealType} · {meal.protein}g Protein
                          </p>
                        </div>
                        <span className="font-mono font-semibold text-[#D4FF00] tabular-nums shrink-0">
                          {meal.calories} kcal
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('nutrition')}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0"
                >
                  Open AI Meal Photo Scanner & Macro Log
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Pillar 3: Social Challenges & Smart Notifications (4 cols) */}
              <div className="lg:col-span-4 p-6 rounded-2xl bg-[#131B2E] border border-slate-800 flex flex-col justify-between space-y-5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-amber-400 font-mono">03 · Accountability</span>
                      <h2 className="text-xl font-display font-bold text-white uppercase mt-0.5">
                        Challenges & Push Alerts
                      </h2>
                    </div>
                    <Trophy className="w-5 h-5 text-amber-400 shrink-0" />
                  </div>

                  {/* Active Challenge Card */}
                  {challenges.slice(0, 2).map((ch) => {
                    const p = Math.min(100, Math.round((ch.userProgress / ch.targetMetric) * 100));
                    return (
                      <div
                        key={ch.id}
                        className="p-3.5 rounded-xl bg-[#0B0F17] border border-slate-800 space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-white truncate pr-2">{ch.title}</span>
                          <span className="font-mono text-[#D4FF00] tabular-nums">{p}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div className="h-full bg-[#D4FF00]" style={{ width: `${p}%` }} />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono tabular-nums">
                          <span>{ch.participantsCount} athletes</span>
                          <button
                            onClick={() =>
                              handleLogChallengeProgress(
                                ch.id,
                                ch.category === 'Strength' ? 1000 : 1
                              )
                            }
                            className="text-emerald-400 hover:underline font-sans font-medium"
                          >
                            +Quick Log Progress
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Latest Push Notification Preview */}
                  {notifications[0] && (
                    <div className="p-3.5 rounded-xl bg-[#0B0F17] border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="flex items-center gap-1 text-[#D4FF00] font-medium">
                          <Bell className="w-3 h-3" />
                          Latest Push Alert
                        </span>
                        <span className="font-mono">{notifications[0].timeLabel}</span>
                      </div>
                      <p className="text-xs font-semibold text-white">{notifications[0].title}</p>
                      <p className="text-xs text-slate-400 line-clamp-2">{notifications[0].body}</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setActiveTab('challenges')}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0"
                >
                  Open Leaderboards & Notification Center
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'workouts' && (
          <WorkoutAndFormView
            routines={routines}
            activeRoutineId={activeRoutineId}
            onSelectRoutine={setActiveRoutineId}
            onToggleSet={handleToggleSet}
            onAddSet={handleAddSet}
            onUpdateSetValues={handleUpdateSetValues}
            onAddRoutine={handleAddRoutine}
            formAnalysis={formAnalysis}
            onUpdateFormAnalysis={setFormAnalysis}
            readinessScore={readinessScore}
            onToast={showToast}
          />
        )}

        {activeTab === 'nutrition' && (
          <NutritionMacroView
            meals={meals}
            targets={macroTargets}
            waterIntakeMl={waterIntakeMl}
            onAddWater={(ml) => {
              setWaterIntakeMl((prev) => prev + ml);
              showToast(`Logged +${ml}ml hydration.`);
            }}
            onAddMeal={handleAddMeal}
            onDeleteMeal={handleDeleteMeal}
            onUpdateTargets={setMacroTargets}
            onToast={showToast}
          />
        )}

        {activeTab === 'challenges' && (
          <ChallengesAndNotificationsView
            challenges={challenges}
            notifications={notifications}
            onToggleJoinChallenge={handleToggleJoinChallenge}
            onLogChallengeProgress={handleLogChallengeProgress}
            onTriggerPushAlert={handleTriggerPushAlert}
            onMarkNotificationRead={handleMarkNotificationRead}
            onSimulateIncomingCall={() => openCallModal('incoming')}
            onToast={showToast}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar (Ergonomic Thumb Zone) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#0B0F17]/95 backdrop-blur-md border-t border-slate-800 grid grid-cols-4 items-center h-16">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center h-full ${
            activeTab === 'dashboard' ? 'text-[#D4FF00]' : 'text-slate-400'
          }`}
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-1">Dashboard</span>
        </button>
        <button
          onClick={() => setActiveTab('workouts')}
          className={`flex flex-col items-center justify-center h-full ${
            activeTab === 'workouts' ? 'text-[#D4FF00]' : 'text-slate-400'
          }`}
        >
          <Dumbbell className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-1">Workouts</span>
        </button>
        <button
          onClick={() => setActiveTab('nutrition')}
          className={`flex flex-col items-center justify-center h-full ${
            activeTab === 'nutrition' ? 'text-[#D4FF00]' : 'text-slate-400'
          }`}
        >
          <Utensils className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-1">Nutrition</span>
        </button>
        <button
          onClick={() => setActiveTab('challenges')}
          className={`flex flex-col items-center justify-center h-full ${
            activeTab === 'challenges' ? 'text-[#D4FF00]' : 'text-slate-400'
          }`}
        >
          <Trophy className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-1">Challenges</span>
        </button>
      </nav>

      {/* Quiet Footer with Real User Actions */}
      <footer className="border-t border-slate-800/80 py-6 px-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-white uppercase tracking-wider">
              APEX KINETIX
            </span>
            <span aria-hidden="true">·</span>
            <span>AI Personal Trainer, Biomechanics & Nutrition Hub</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => openCallModal('incoming')}
              className="hover:text-white transition-colors"
            >
              Simulate Incoming Trainer Call
            </button>
            <span aria-hidden="true">·</span>
            <a
              href={`tel:${EMERGENCY_HOTLINE}`}
              className="text-[#D4FF00] hover:underline font-mono tabular-nums"
            >
              24/7 Live Coach & Emergency Line: {EMERGENCY_HOTLINE}
            </a>
          </div>
        </div>
      </footer>

      {/* Live Coaching & Emergency Call Center Modal */}
      <LiveCoachCallModal
        isOpen={callModalOpen}
        initialMode={callModalMode}
        onClose={() => setCallModalOpen(false)}
        readiness={readiness}
        activeExerciseName={activeRoutine.exercises[0]?.name || 'High-Bar Back Squat'}
        caloriesRemaining={caloriesRemaining}
      />
    </div>
  );
}
