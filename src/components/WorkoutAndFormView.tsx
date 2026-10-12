import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Volume2,
  Plus,
  Sparkles,
  Timer,
  Play,
  RotateCcw,
  Dumbbell,
  Video,
  VideoOff,
} from 'lucide-react';
import { WorkoutRoutine, FormAnalysisResult } from '../types';
import { ASSETS } from '../data/initialData';
import { playCoachAudio } from '../utils/audioPlayer';

interface WorkoutAndFormViewProps {
  routines: WorkoutRoutine[];
  activeRoutineId: string;
  onSelectRoutine: (id: string) => void;
  onToggleSet: (routineId: string, exerciseId: string, setId: string) => void;
  onAddSet: (routineId: string, exerciseId: string) => void;
  onUpdateSetValues: (
    routineId: string,
    exerciseId: string,
    setId: string,
    field: 'reps' | 'weightKg' | 'rpe',
    value: number
  ) => void;
  onAddRoutine: (routine: WorkoutRoutine) => void;
  formAnalysis: FormAnalysisResult;
  onUpdateFormAnalysis: (result: FormAnalysisResult) => void;
  readinessScore: number;
  onToast: (msg: string) => void;
}

export const WorkoutAndFormView: React.FC<WorkoutAndFormViewProps> = ({
  routines,
  activeRoutineId,
  onSelectRoutine,
  onToggleSet,
  onAddSet,
  onUpdateSetValues,
  onAddRoutine,
  formAnalysis,
  onUpdateFormAnalysis,
  readinessScore,
  onToast,
}) => {
  const activeRoutine = routines.find((r) => r.id === activeRoutineId) || routines[0];

  // Rest Timer state
  const [restSecondsLeft, setRestSecondsLeft] = useState<number>(0);
  const [restRunning, setRestRunning] = useState<boolean>(false);

  // Custom AI Routine Generator state
  const [targetMuscles, setTargetMuscles] = useState('Chest, Back & Posterior Delts');
  const [equipment, setEquipment] = useState('Barbell, Dumbbells & Cable Stack');
  const [durationMinutes, setDurationMinutes] = useState(50);
  const [goal, setGoal] = useState('Hypertrophy & Progressive Overload');
  const [isGeneratingRoutine, setIsGeneratingRoutine] = useState(false);

  // Real-Time Form Correction Studio state
  const [selectedExerciseForForm, setSelectedExerciseForForm] = useState(
    activeRoutine?.exercises[0]?.name || 'High-Bar Back Squat'
  );
  const [athleteNotes, setAthleteNotes] = useState(
    'Working at 85% 1RM; checking lumbar alignment and knee tracking out of the bottom.'
  );
  const [previewImage, setPreviewImage] = useState<string>(ASSETS.squatRefImg);
  const [uploadedBase64, setUploadedBase64] = useState<string | null>(null);
  const [isAnalyzingForm, setIsAnalyzingForm] = useState(false);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [autoCoachIntervalOn, setAutoCoachIntervalOn] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!restRunning || restSecondsLeft <= 0) {
      if (restSecondsLeft <= 0 && restRunning) {
        setRestRunning(false);
        onToast('Rest interval complete — brace up for your next working set.');
      }
      return;
    }
    const timer = setInterval(() => {
      setRestSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [restRunning, restSecondsLeft, onToast]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Periodic real-time webcam frame analysis if Auto-Coach is toggled on
  useEffect(() => {
    if (!isWebcamActive || !autoCoachIntervalOn) return;
    const interval = setInterval(() => {
      captureWebcamFrameAndAnalyze();
    }, 12000);
    return () => clearInterval(interval);
  }, [isWebcamActive, autoCoachIntervalOn, selectedExerciseForForm]);

  const startRestTimer = (seconds: number) => {
    setRestSecondsLeft(seconds);
    setRestRunning(true);
  };

  const toggleWebcam = async () => {
    if (isWebcamActive) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setIsWebcamActive(false);
      setAutoCoachIntervalOn(false);
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = mediaStream;
      setIsWebcamActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(() => {});
        }
      }, 100);
      onToast('Live camera feed active for real-time biomechanical form tracking.');
    } catch (err) {
      onToast('Camera access unavailable in this browser frame — using uploaded/reference frame mode.');
    }
  };

  const captureWebcamFrameAndAnalyze = async () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
    setPreviewImage(dataUrl);
    setUploadedBase64(dataUrl);
    await runFormAnalysis(dataUrl);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const resultStr = reader.result as string;
      setPreviewImage(resultStr);
      setUploadedBase64(resultStr);
      onToast(`Loaded frame "${file.name}" — ready for AI Biomechanical Inspection.`);
    };
    reader.readAsDataURL(file);
  };

  const runFormAnalysis = async (overrideBase64?: string | null) => {
    if (isAnalyzingForm) return;
    setIsAnalyzingForm(true);
    try {
      const response = await fetch('/api/ai/form-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exerciseName: selectedExerciseForForm,
          imageBase64: overrideBase64 ?? uploadedBase64,
          mimeType: 'image/jpeg',
          athleteNotes,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Form check failed');
      }

      const newResult: FormAnalysisResult = {
        score: data.score ?? 89,
        riskLevel: data.riskLevel || 'Nominal',
        primaryCorrection: data.primaryCorrection,
        bracingCue: data.bracingCue,
        spokenCue: data.spokenCue,
        jointCheckpoints: data.jointCheckpoints || [],
        audioBase64: data.audioBase64,
        timestamp: `Today · ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        exerciseName: selectedExerciseForForm,
      };

      onUpdateFormAnalysis(newResult);
      onToast(`Form check complete (${newResult.score}/100) — playing live audio correction.`);
      await playCoachAudio(newResult.audioBase64, newResult.spokenCue);
    } catch (err: any) {
      onToast(err?.message || 'Could not reach AI form analyzer.');
    } finally {
      setIsAnalyzingForm(false);
    }
  };

  const handleGenerateRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGeneratingRoutine) return;
    setIsGeneratingRoutine(true);
    try {
      const response = await fetch('/api/ai/workout-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetMuscles,
          equipment,
          durationMinutes,
          goal,
          readinessScore,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Workout generation failed');
      }

      const newRoutine: WorkoutRoutine = {
        id: `routine-${Date.now()}`,
        title: data.title || `Custom ${targetMuscles} Protocol`,
        focus: data.focus || targetMuscles,
        durationMinutes: data.durationMinutes || durationMinutes,
        coachNote: data.coachNote || 'Prioritize controlled eccentric tempo and full range of motion.',
        exercises: (data.exercises || []).map((ex: any, idx: number) => ({
          id: `ex-${Date.now()}-${idx}`,
          name: ex.name,
          muscleGroup: ex.muscleGroup,
          restSeconds: ex.restSeconds || 90,
          formCue: ex.formCue || 'Brace core before initiating movement.',
          sets: (ex.sets || []).map((s: any, sIdx: number) => ({
            id: `s-${Date.now()}-${idx}-${sIdx}`,
            reps: s.reps || 8,
            weightKg: s.weightKg ?? 60,
            rpe: s.rpe || 8,
            completed: false,
          })),
        })),
      };

      onAddRoutine(newRoutine);
      onToast(`Generated custom routine: "${newRoutine.title}"`);
    } catch (err: any) {
      onToast(err?.message || 'Failed to generate AI routine.');
    } finally {
      setIsGeneratingRoutine(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Section: Routine Selector & Rest Timer Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Strength & Conditioning Log</span>
            <span aria-hidden="true">·</span>
            <span>Readiness-Adjusted Load</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{activeRoutine.durationMinutes} min target</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-white uppercase tracking-wide mt-1">
            {activeRoutine.title}
          </h1>
        </div>

        {/* Interactive Routine Switcher & Rest Timer */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-[#131B2E] border border-slate-800 rounded-xl">
            {routines.map((rt) => (
              <button
                key={rt.id}
                onClick={() => onSelectRoutine(rt.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 truncate max-w-[190px] ${
                  rt.id === activeRoutine.id
                    ? 'bg-[#D4FF00] text-slate-950 font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {rt.title}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#131B2E] border border-slate-800">
            <Timer className="w-4 h-4 text-[#D4FF00]" />
            <span className="text-xs text-slate-400">Rest:</span>
            <span className="font-mono text-sm font-semibold text-white tabular-nums">
              {Math.floor(restSecondsLeft / 60)}:{String(restSecondsLeft % 60).padStart(2, '0')}
            </span>
            <button
              onClick={() => startRestTimer(90)}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-mono whitespace-nowrap shrink-0"
            >
              90s
            </button>
            <button
              onClick={() => startRestTimer(120)}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-mono whitespace-nowrap shrink-0"
            >
              120s
            </button>
            <button
              onClick={() => {
                setRestRunning(false);
                setRestSecondsLeft(0);
              }}
              className="p-1 text-slate-400 hover:text-white"
              title="Reset Rest Timer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Two-Column Split: Left = Active Workout Sets & AI Generator | Right = Real-Time AI Form Correction Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 7 Columns: Exercise Logger & Custom Routine Builder */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-5 rounded-2xl bg-[#131B2E] border border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-display font-bold text-white uppercase">
                  01. Active Session Set Logger
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">{activeRoutine.coachNote}</p>
              </div>
              <button
                onClick={() => playCoachAudio(null, activeRoutine.coachNote)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Volume2 className="w-3.5 h-3.5 text-[#D4FF00]" />
                Voice Cue
              </button>
            </div>

            <div className="space-y-6">
              {activeRoutine.exercises.map((exercise, exIndex) => (
                <div key={exercise.id} className="space-y-3 pb-6 border-b border-slate-800/80 last:border-b-0 last:pb-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="font-mono text-[#D4FF00]">0{exIndex + 1}</span>
                        <span aria-hidden="true">·</span>
                        <span>{exercise.muscleGroup}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">Rest {exercise.restSeconds}s</span>
                      </div>
                      <h3 className="text-base font-semibold text-white mt-0.5">{exercise.name}</h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedExerciseForForm(exercise.name);
                          onToast(`Selected "${exercise.name}" in AI Form Correction Studio.`);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                      >
                        <Camera className="w-3.5 h-3.5 text-[#D4FF00]" />
                        Check Form
                      </button>
                      <button
                        onClick={() => onAddSet(activeRoutine.id, exercise.id)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1 transition-colors whitespace-nowrap shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Set
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400">
                    Biomechanics Cue: <span className="text-slate-200">{exercise.formCue}</span>
                  </p>

                  {/* Tabular Set Log Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-[11px] text-slate-400 font-mono">
                          <th className="py-2 pr-3">Set</th>
                          <th className="py-2 px-3 text-right">Load (kg)</th>
                          <th className="py-2 px-3 text-right">Reps</th>
                          <th className="py-2 px-3 text-right">RPE</th>
                          <th className="py-2 pl-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50 text-sm font-mono tabular-nums">
                        {exercise.sets.map((set, sIdx) => (
                          <tr
                            key={set.id}
                            className={`transition-colors ${
                              set.completed ? 'bg-emerald-950/20 text-emerald-200' : 'hover:bg-slate-800/30'
                            }`}
                          >
                            <td className="py-2.5 pr-3 text-xs text-slate-400">#{sIdx + 1}</td>
                            <td className="py-2.5 px-3 text-right">
                              <input
                                type="number"
                                value={set.weightKg}
                                onChange={(e) =>
                                  onUpdateSetValues(
                                    activeRoutine.id,
                                    exercise.id,
                                    set.id,
                                    'weightKg',
                                    Number(e.target.value)
                                  )
                                }
                                className="w-20 text-right bg-[#0B0F17] border border-slate-800 rounded px-2 py-1 text-xs text-white font-mono tabular-nums focus:outline-none focus:border-[#D4FF00]"
                              />
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <input
                                type="number"
                                value={set.reps}
                                onChange={(e) =>
                                  onUpdateSetValues(
                                    activeRoutine.id,
                                    exercise.id,
                                    set.id,
                                    'reps',
                                    Number(e.target.value)
                                  )
                                }
                                className="w-16 text-right bg-[#0B0F17] border border-slate-800 rounded px-2 py-1 text-xs text-white font-mono tabular-nums focus:outline-none focus:border-[#D4FF00]"
                              />
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <input
                                type="number"
                                step="0.5"
                                min="5"
                                max="10"
                                value={set.rpe}
                                onChange={(e) =>
                                  onUpdateSetValues(
                                    activeRoutine.id,
                                    exercise.id,
                                    set.id,
                                    'rpe',
                                    Number(e.target.value)
                                  )
                                }
                                className="w-16 text-right bg-[#0B0F17] border border-slate-800 rounded px-2 py-1 text-xs text-white font-mono tabular-nums focus:outline-none focus:border-[#D4FF00]"
                              />
                            </td>
                            <td className="py-2.5 pl-3 text-right">
                              <button
                                onClick={() => {
                                  onToggleSet(activeRoutine.id, exercise.id, set.id);
                                  if (!set.completed) {
                                    startRestTimer(exercise.restSeconds);
                                  }
                                }}
                                className={`px-3 py-1 rounded-lg text-xs font-sans font-medium transition-colors whitespace-nowrap shrink-0 ${
                                  set.completed
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                                }`}
                              >
                                {set.completed ? 'Completed' : 'Log Set'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Custom AI Routine Builder */}
          <form
            onSubmit={handleGenerateRoutine}
            className="p-6 rounded-2xl bg-[#131B2E] border border-slate-800 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-display font-bold text-white uppercase">
                  02. Custom AI Routine Architect
                </h2>
                <p className="text-xs text-slate-400">
                  Generates a tailored hypertrophy, strength, or conditioning micro-cycle synced with your {readinessScore}% readiness.
                </p>
              </div>
              <Dumbbell className="w-5 h-5 text-[#D4FF00]" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Target Muscle Split</label>
                <input
                  type="text"
                  value={targetMuscles}
                  onChange={(e) => setTargetMuscles(e.target.value)}
                  className="w-full bg-[#0B0F17] border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#D4FF00]"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Available Equipment</label>
                <input
                  type="text"
                  value={equipment}
                  onChange={(e) => setEquipment(e.target.value)}
                  className="w-full bg-[#0B0F17] border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#D4FF00]"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Training Goal</label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full bg-[#0B0F17] border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#D4FF00]"
                >
                  <option value="Hypertrophy & Progressive Overload">Hypertrophy & Progressive Overload</option>
                  <option value="Maximal Neural Strength (Low Rep)">Maximal Neural Strength (Low Rep)</option>
                  <option value="Metabolic Conditioning & Density">Metabolic Conditioning & Density</option>
                  <option value="Joint Mobility & Deload Recovery">Joint Mobility & Deload Recovery</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Session Duration (<span className="font-mono tabular-nums">{durationMinutes} min</span>)
                </label>
                <input
                  type="range"
                  min={25}
                  max={90}
                  step={5}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full accent-[#D4FF00] mt-2"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isGeneratingRoutine}
              className="w-full py-3 rounded-xl bg-[#D4FF00] hover:bg-[#b8e600] disabled:opacity-50 text-slate-950 font-semibold text-sm flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              {isGeneratingRoutine ? 'Constructing Custom Periodized Routine...' : 'Generate Custom AI Workout Routine'}
            </button>
          </form>
        </div>

        {/* Right 5 Columns: Real-Time AI Biomechanical Form Correction Studio */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl bg-[#131B2E] border border-slate-800 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-display font-bold text-white uppercase">
                  03. Real-Time AI Form Studio
                </h2>
                <p className="text-xs text-slate-400">
                  Live camera & frame biomechanics inspection with spoken posture cues
                </p>
              </div>
              <div className="text-right font-mono tabular-nums">
                <span className="text-2xl font-bold text-[#D4FF00]">{formAnalysis.score}</span>
                <span className="text-xs text-slate-400">/100</span>
              </div>
            </div>

            {/* Exercise Selector & Camera Controls */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <select
                  value={selectedExerciseForForm}
                  onChange={(e) => setSelectedExerciseForForm(e.target.value)}
                  className="flex-1 bg-[#0B0F17] border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D4FF00]"
                >
                  <option value="High-Bar Back Squat">High-Bar Back Squat</option>
                  <option value="Romanian Deadlift (Barbell)">Romanian Deadlift (Barbell)</option>
                  <option value="Conventional Deadlift">Conventional Deadlift</option>
                  <option value="Overhead Barbell Press">Overhead Barbell Press</option>
                  <option value="Bulgarian Split Squat">Bulgarian Split Squat</option>
                  <option value="Incline Dumbbell Bench Press">Incline Dumbbell Bench Press</option>
                </select>

                <button
                  onClick={toggleWebcam}
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                    isWebcamActive
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  {isWebcamActive ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4 text-[#D4FF00]" />}
                  {isWebcamActive ? 'Stop Camera' : 'Live Camera'}
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                >
                  <Upload className="w-4 h-4 text-emerald-400" />
                  Upload Frame
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {/* Viewport Frame (Live Video or Reference/Uploaded Photo) */}
              <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-[#0B0F17] border border-slate-800">
                {isWebcamActive ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={previewImage}
                    alt={`Form analysis frame for ${selectedExerciseForForm}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                )}

                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-200">
                    <span className="font-semibold">{selectedExerciseForForm}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-emerald-400 font-mono">{formAnalysis.riskLevel}</span>
                  </div>
                  {isWebcamActive && (
                    <button
                      onClick={() => setAutoCoachIntervalOn((prev) => !prev)}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                        autoCoachIntervalOn
                          ? 'bg-[#D4FF00] text-slate-950 font-semibold'
                          : 'bg-slate-800/90 text-slate-200'
                      }`}
                    >
                      {autoCoachIntervalOn ? 'Auto-Scan Every 12s: ON' : 'Enable Auto-Scan'}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Lifter Sensations / Sticking Point Notes
                </label>
                <input
                  type="text"
                  value={athleteNotes}
                  onChange={(e) => setAthleteNotes(e.target.value)}
                  placeholder="e.g., Knees caving slightly on rep 5..."
                  className="w-full bg-[#0B0F17] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#D4FF00]"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    isWebcamActive ? captureWebcamFrameAndAnalyze() : runFormAnalysis()
                  }
                  disabled={isAnalyzingForm}
                  className="flex-1 py-2.5 rounded-xl bg-[#D4FF00] hover:bg-[#b8e600] disabled:opacity-50 text-slate-950 font-semibold text-xs flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0"
                >
                  <Play className="w-3.5 h-3.5" />
                  {isAnalyzingForm
                    ? 'Inspecting Joint Alignment...'
                    : isWebcamActive
                    ? 'Capture Live Frame & Analyze Form'
                    : 'Run AI Biomechanical Form Check'}
                </button>
                <button
                  onClick={() => playCoachAudio(formAnalysis.audioBase64, formAnalysis.spokenCue)}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                  title="Play Spoken Form Cue"
                >
                  <Volume2 className="w-4 h-4 text-[#D4FF00]" />
                  Audio Cue
                </button>
              </div>
            </div>

            {/* Diagnostic Breakdown */}
            <div className="pt-4 border-t border-slate-800 space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Primary Biomechanical Adjustment</span>
                  <span className="font-mono">{formAnalysis.timestamp}</span>
                </div>
                <p className="text-sm font-medium text-white leading-relaxed">
                  {formAnalysis.primaryCorrection}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0B0F17] border border-slate-800">
                <p className="text-xs text-slate-400">Intra-Abdominal Bracing & Tempo Cue</p>
                <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                  {formAnalysis.bracingCue}
                </p>
              </div>

              <div className="space-y-2.5">
                <p className="text-xs font-semibold text-slate-300">Joint & Vector Checkpoints</p>
                {formAnalysis.jointCheckpoints.map((cp, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-[#0B0F17] border border-slate-800/90 flex items-start gap-2.5"
                  >
                    {cp.status.toLowerCase().includes('nominal') ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    )}
                    <div className="text-xs">
                      <div className="flex items-center gap-1.5 text-slate-200 font-medium">
                        <span>{cp.joint}</span>
                        <span aria-hidden="true">·</span>
                        <span
                          className={
                            cp.status.toLowerCase().includes('nominal')
                              ? 'text-emerald-400'
                              : 'text-amber-400'
                          }
                        >
                          {cp.status}
                        </span>
                      </div>
                      <p className="text-slate-400 mt-0.5 leading-relaxed">{cp.observation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
