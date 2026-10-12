import React, { useState, useRef } from 'react';
import {
  Camera,
  Plus,
  Sparkles,
  Droplets,
  Utensils,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { MealLogItem, MacroTargets } from '../types';
import { ASSETS } from '../data/initialData';

interface NutritionMacroViewProps {
  meals: MealLogItem[];
  targets: MacroTargets;
  waterIntakeMl: number;
  onAddWater: (ml: number) => void;
  onAddMeal: (meal: MealLogItem) => void;
  onDeleteMeal: (id: string) => void;
  onUpdateTargets: (targets: MacroTargets) => void;
  onToast: (msg: string) => void;
}

export const NutritionMacroView: React.FC<NutritionMacroViewProps> = ({
  meals,
  targets,
  waterIntakeMl,
  onAddWater,
  onAddMeal,
  onDeleteMeal,
  onToast,
}) => {
  const [mealDescription, setMealDescription] = useState(
    '220g grilled chicken breast, 180g jasmine rice, 100g steamed broccoli, and 1 tbsp olive oil'
  );
  const [mealType, setMealType] = useState<MealLogItem['mealType']>('Post-Workout');
  const [previewPhoto, setPreviewPhoto] = useState<string>(ASSETS.mealBowlImg);
  const [uploadedPhotoBase64, setUploadedPhotoBase64] = useState<string | null>(null);
  const [isAnalyzingMeal, setIsAnalyzingMeal] = useState(false);

  // Manual quick entry state
  const [manualName, setManualName] = useState('');
  const [manualCalories, setManualCalories] = useState(450);
  const [manualProtein, setManualProtein] = useState(40);
  const [manualCarbs, setManualCarbs] = useState(45);
  const [manualFats, setManualFats] = useState(12);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const totalCalories = meals.reduce((acc, m) => acc + m.calories, 0);
  const totalProtein = meals.reduce((acc, m) => acc + m.protein, 0);
  const totalCarbs = meals.reduce((acc, m) => acc + m.carbs, 0);
  const totalFats = meals.reduce((acc, m) => acc + m.fats, 0);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPreviewPhoto(dataUrl);
      setUploadedPhotoBase64(dataUrl);
      onToast(`Loaded meal photo "${file.name}" for AI macro breakdown.`);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzeAndLogMeal = async () => {
    if (isAnalyzingMeal) return;
    setIsAnalyzingMeal(true);
    try {
      const response = await fetch('/api/ai/meal-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealDescription,
          mealType,
          imageBase64: uploadedPhotoBase64,
          mimeType: 'image/jpeg',
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze meal');
      }

      const newMeal: MealLogItem = {
        id: `meal-${Date.now()}`,
        mealName: data.mealName || 'AI Analyzed Performance Meal',
        mealType,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        calories: data.calories || 550,
        protein: data.protein || 45,
        carbs: data.carbs || 55,
        fats: data.fats || 16,
        fiber: data.fiber || 6,
        detectedItems: data.detectedItems || [mealDescription],
        nutritionistTip: data.nutritionistTip,
      };

      onAddMeal(newMeal);
      onToast(`Logged "${newMeal.mealName}" (+${newMeal.protein}g Protein · ${newMeal.calories} kcal)`);
    } catch (err: any) {
      onToast(err?.message || 'Error analyzing meal.');
    } finally {
      setIsAnalyzingMeal(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim()) return;
    const newMeal: MealLogItem = {
      id: `meal-manual-${Date.now()}`,
      mealName: manualName.trim(),
      mealType,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      calories: Number(manualCalories),
      protein: Number(manualProtein),
      carbs: Number(manualCarbs),
      fats: Number(manualFats),
      fiber: 5,
      detectedItems: [manualName.trim()],
      nutritionistTip: 'Logged via manual macro entry.',
    };
    onAddMeal(newMeal);
    setManualName('');
    onToast(`Added "${newMeal.mealName}" to daily nutrition log.`);
  };

  const pct = (val: number, max: number) => Math.min(100, Math.round((val / Math.max(1, max)) * 100));

  return (
    <div className="space-y-8">
      {/* Header & Daily Macro Telemetry Strip */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Integrated Performance Nutrition</span>
            <span aria-hidden="true">·</span>
            <span>Anabolic Macro Tracking</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{meals.length} meals logged today</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-white uppercase tracking-wide mt-1">
            Meal Logging & AI Macro Vision
          </h1>
        </div>

        {/* Hydration Counter */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#131B2E] border border-slate-800">
          <Droplets className="w-5 h-5 text-sky-400" />
          <div className="text-xs">
            <span className="text-slate-400">Hydration: </span>
            <span className="font-mono font-bold text-white tabular-nums">
              {waterIntakeMl} / {targets.waterMl} ml
            </span>
          </div>
          <button
            onClick={() => onAddWater(250)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-sky-300 transition-colors whitespace-nowrap shrink-0"
          >
            +250ml
          </button>
          <button
            onClick={() => onAddWater(500)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-sky-300 transition-colors whitespace-nowrap shrink-0"
          >
            +500ml
          </button>
        </div>
      </div>

      {/* 4-Column Macro Target Summary Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Daily Calories',
            current: totalCalories,
            target: targets.calories,
            unit: 'kcal',
            barColor: 'bg-[#D4FF00]',
          },
          {
            label: 'Protein Synthesis',
            current: totalProtein,
            target: targets.protein,
            unit: 'g',
            barColor: 'bg-emerald-400',
          },
          {
            label: 'Glycogen Carbs',
            current: totalCarbs,
            target: targets.carbs,
            unit: 'g',
            barColor: 'bg-sky-400',
          },
          {
            label: 'Essential Fats',
            current: totalFats,
            target: targets.fats,
            unit: 'g',
            barColor: 'bg-amber-400',
          },
        ].map((item) => {
          const percent = pct(item.current, item.target);
          return (
            <div
              key={item.label}
              className="p-5 rounded-2xl bg-[#131B2E] border border-slate-800 space-y-3"
            >
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{item.label}</span>
                <span className="font-mono tabular-nums">{percent}%</span>
              </div>
              <div className="font-mono tabular-nums">
                <span className="text-2xl font-bold text-white">{item.current}</span>
                <span className="text-xs text-slate-400">
                  {' '}
                  / {item.target} {item.unit}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#0B0F17] overflow-hidden">
                <div
                  className={`h-full ${item.barColor} transition-all duration-300`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Two-Column Split: Left = AI Meal Photo & Text Analyzer | Right = Logged Meals Feed & Manual Entry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 5 Columns: AI Vision & Natural Language Meal Scanner */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-[#131B2E] border border-slate-800 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-display font-bold text-white uppercase">
                01. AI Meal Photo & Macro Scanner
              </h2>
              <p className="text-xs text-slate-400">
                Upload a plate photo or describe ingredients for instant macro calculation
              </p>
            </div>
            <Utensils className="w-5 h-5 text-[#D4FF00]" />
          </div>

          <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-[#0B0F17] border border-slate-800">
            <img
              src={previewPhoto}
              alt="Meal plate preview"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex items-center justify-between">
              <span className="text-xs text-slate-200 font-medium">
                {uploadedPhotoBase64 ? 'Custom Meal Photo Loaded' : 'Sample Wild Salmon Recovery Bowl'}
              </span>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg bg-[#D4FF00] text-slate-950 font-semibold text-xs flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Camera className="w-3.5 h-3.5" />
                Upload Meal Photo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Meal Timing Window</label>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value as MealLogItem['mealType'])}
                className="w-full bg-[#0B0F17] border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#D4FF00]"
              >
                <option value="Breakfast">Breakfast</option>
                <option value="Pre-Workout">Pre-Workout</option>
                <option value="Post-Workout">Post-Workout</option>
                <option value="Lunch">Lunch</option>
                <option value="Dinner">Dinner</option>
                <option value="Snack">Snack</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Meal Description / Portion Notes
              </label>
              <textarea
                rows={3}
                value={mealDescription}
                onChange={(e) => setMealDescription(e.target.value)}
                placeholder="Describe portions or ingredients (e.g., 200g steak, 150g sweet potato, avocado)..."
                className="w-full bg-[#0B0F17] border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#D4FF00]"
              />
            </div>

            <button
              onClick={handleAnalyzeAndLogMeal}
              disabled={isAnalyzingMeal}
              className="w-full py-3 rounded-xl bg-[#D4FF00] hover:bg-[#b8e600] disabled:opacity-50 text-slate-950 font-semibold text-sm flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              {isAnalyzingMeal ? 'Calculating Macros & Portions...' : 'Analyze & Log Meal with AI'}
            </button>
          </div>
        </div>

        {/* Right 7 Columns: Daily Meal Ledger & Quick Manual Entry */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-2xl bg-[#131B2E] border border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-display font-bold text-white uppercase">
                  02. Today’s Nutrition & Macro Ledger
                </h2>
                <p className="text-xs text-slate-400">
                  Verified meal entries and performance dietitian notes
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-400 tabular-nums">
                {Math.max(0, targets.protein - totalProtein)}g protein remaining
              </span>
            </div>

            {meals.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <p className="text-sm text-slate-400">
                  No meals logged yet today. Use the AI Meal Photo Scanner or quick form below to log your first meal.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {meals.map((meal) => (
                  <div
                    key={meal.id}
                    className="p-4 rounded-xl bg-[#0B0F17] border border-slate-800/90 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span className="text-[#D4FF00] font-medium">{meal.mealType}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">{meal.timestamp}</span>
                        </div>
                        <h3 className="text-base font-semibold text-white mt-0.5">
                          {meal.mealName}
                        </h3>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right font-mono tabular-nums">
                          <span className="text-base font-bold text-white">{meal.calories}</span>
                          <span className="text-xs text-slate-400"> kcal</span>
                        </div>
                        <button
                          onClick={() => onDeleteMeal(meal.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
                          title="Remove Meal Entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Unboxed Macro Strip */}
                    <div className="flex flex-wrap items-center gap-3 text-xs font-mono tabular-nums text-slate-300 pt-1">
                      <span>
                        Protein: <strong className="text-emerald-400">{meal.protein}g</strong>
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        Carbs: <strong className="text-sky-400">{meal.carbs}g</strong>
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        Fats: <strong className="text-amber-400">{meal.fats}g</strong>
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        Fiber: <strong className="text-slate-200">{meal.fiber}g</strong>
                      </span>
                    </div>

                    {meal.detectedItems && meal.detectedItems.length > 0 && (
                      <div className="text-xs text-slate-400 space-y-1">
                        {meal.detectedItems.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {meal.nutritionistTip && (
                      <p className="text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                        Coach Dietitian Note: <span className="text-slate-200">{meal.nutritionistTip}</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Manual Macro Logger */}
          <form
            onSubmit={handleManualSubmit}
            className="p-6 rounded-2xl bg-[#131B2E] border border-slate-800 space-y-4"
          >
            <h3 className="text-lg font-display font-bold text-white uppercase">
              03. Quick Manual Macro Entry
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] text-slate-400 mb-1">Meal / Shake Name</label>
                <input
                  type="text"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="e.g., Post-Lift Whey & Oats"
                  className="w-full bg-[#0B0F17] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4FF00]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Calories</label>
                <input
                  type="number"
                  value={manualCalories}
                  onChange={(e) => setManualCalories(Number(e.target.value))}
                  className="w-full bg-[#0B0F17] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono tabular-nums focus:outline-none focus:border-[#D4FF00]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Protein (g)</label>
                <input
                  type="number"
                  value={manualProtein}
                  onChange={(e) => setManualProtein(Number(e.target.value))}
                  className="w-full bg-[#0B0F17] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono tabular-nums focus:outline-none focus:border-[#D4FF00]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Carbs / Fats (g)</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={manualCarbs}
                    onChange={(e) => setManualCarbs(Number(e.target.value))}
                    className="w-1/2 bg-[#0B0F17] border border-slate-800 rounded-xl px-2 py-2 text-xs text-white font-mono tabular-nums"
                    title="Carbs (g)"
                  />
                  <input
                    type="number"
                    value={manualFats}
                    onChange={(e) => setManualFats(Number(e.target.value))}
                    className="w-1/2 bg-[#0B0F17] border border-slate-800 rounded-xl px-2 py-2 text-xs text-white font-mono tabular-nums"
                    title="Fats (g)"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4 text-[#D4FF00]" />
              Add Manual Macro Entry
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
