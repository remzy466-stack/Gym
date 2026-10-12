import React, { useState } from 'react';
import {
  Trophy,
  Bell,
  Users,
  Plus,
  CheckCircle2,
  Send,
  PhoneIncoming,
} from 'lucide-react';
import { SocialChallenge, PushNotificationAlert } from '../types';
import { EMERGENCY_HOTLINE } from '../data/initialData';

interface ChallengesAndNotificationsViewProps {
  challenges: SocialChallenge[];
  notifications: PushNotificationAlert[];
  onToggleJoinChallenge: (id: string) => void;
  onLogChallengeProgress: (id: string, delta: number) => void;
  onTriggerPushAlert: (title: string, body: string, category: PushNotificationAlert['category']) => void;
  onMarkNotificationRead: (id: string) => void;
  onSimulateIncomingCall: () => void;
  onToast: (msg: string) => void;
}

export const ChallengesAndNotificationsView: React.FC<ChallengesAndNotificationsViewProps> = ({
  challenges,
  notifications,
  onToggleJoinChallenge,
  onLogChallengeProgress,
  onTriggerPushAlert,
  onMarkNotificationRead,
  onSimulateIncomingCall,
  onToast,
}) => {
  const [filterCategory, setFilterCategory] = useState<'All' | 'Strength' | 'Nutrition' | 'Consistency'>('All');
  const [checkInNote, setCheckInNote] = useState('');
  const [communityFeed, setCommunityFeed] = useState([
    {
      id: 'feed-1',
      athlete: 'Elena Rostova',
      action: 'completed 4x6 High-Bar Back Squat @ 125kg · AI Form Score 94/100',
      time: '18m ago',
    },
    {
      id: 'feed-2',
      athlete: 'Marcus Sterling',
      action: 'logged 210g protein for Day 22 of the 30-Day Protein Streak',
      time: '42m ago',
    },
    {
      id: 'feed-3',
      athlete: 'Devon Vance',
      action: 'hit a new Romanian Deadlift Volume PR (+3,200 kg session volume)',
      time: '1h ago',
    },
  ]);

  // Push Notification preferences
  const [pushSettings, setPushSettings] = useState({
    workoutReminders: true,
    macroWindowAlerts: true,
    leaderboardOvertakes: true,
    liveCoachCheckInCalls: true,
  });

  const filteredChallenges =
    filterCategory === 'All'
      ? challenges
      : challenges.filter((c) => c.category === filterCategory);

  const handleRequestBrowserPushPermission = async () => {
    if ('Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          new Notification('APEX KINETIX Push Notifications Enabled', {
            body: `Accountability alerts and Coach Marcus live calls (${EMERGENCY_HOTLINE}) are active.`,
          });
          onToast('Browser push notifications enabled.');
          return;
        }
      } catch {
        // fallback to in-app push
      }
    }
    onTriggerPushAlert(
      'Accountability Push Alert Test',
      'Stay locked in! Complete your final compound set and log your post-workout meal.',
      'Workout'
    );
  };

  const handlePostAccountabilityCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInNote.trim()) return;
    setCommunityFeed((prev) => [
      {
        id: `feed-${Date.now()}`,
        athlete: 'You (Athlete)',
        action: checkInNote.trim(),
        time: 'Just now',
      },
      ...prev,
    ]);
    setCheckInNote('');
    onToast('Posted accountability check-in to the community feed.');
  };

  return (
    <div className="space-y-8">
      {/* Header & Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Customer Engagement & Accountability</span>
            <span aria-hidden="true">·</span>
            <span>Live Leaderboards & Push Dispatch</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-white uppercase tracking-wide mt-1">
            Social Challenges & Push Notification Center
          </h1>
        </div>

        {/* Interactive Category Filter */}
        <div className="flex items-center gap-1 p-1 bg-[#131B2E] border border-slate-800 rounded-xl">
          {(['All', 'Strength', 'Nutrition', 'Consistency'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                filterCategory === cat
                  ? 'bg-[#D4FF00] text-slate-950 font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Split: Left 7 Cols = Active Social Challenges & Leaderboards | Right 5 Cols = Push Notification Engine & Community Check-In */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-6">
          {filteredChallenges.map((chal) => {
            const pct = Math.min(100, Math.round((chal.userProgress / chal.targetMetric) * 100));
            const incrementAmount =
              chal.category === 'Strength' ? 1250 : 1;

            return (
              <div
                key={chal.id}
                className="p-6 rounded-2xl bg-[#131B2E] border border-slate-800 space-y-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="text-[#D4FF00] font-medium">{chal.category} Challenge</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{chal.participantsCount} athletes</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{chal.daysRemaining}d remaining</span>
                    </div>
                    <h2 className="text-xl font-display font-bold text-white uppercase mt-1">
                      {chal.title}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Milestone Recognition: <span className="text-slate-200">{chal.rewardLabel}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {chal.joined && (
                      <button
                        onClick={() => onLogChallengeProgress(chal.id, incrementAmount)}
                        className="px-3.5 py-2 rounded-xl bg-[#D4FF00] hover:bg-[#b8e600] text-slate-950 font-semibold text-xs flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 font-mono tabular-nums"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Log +{incrementAmount} {chal.unit}
                      </button>
                    )}
                    <button
                      onClick={() => onToggleJoinChallenge(chal.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                        chal.joined
                          ? 'bg-slate-800 text-emerald-400 hover:bg-slate-700'
                          : 'bg-white text-slate-950 font-semibold hover:bg-slate-200'
                      }`}
                    >
                      {chal.joined ? 'Joined · Leave' : 'Join Challenge'}
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                    <span className="text-slate-300">
                      Your Progress: <strong className="text-white">{chal.userProgress.toLocaleString()}</strong> /{' '}
                      {chal.targetMetric.toLocaleString()} {chal.unit}
                    </span>
                    <span className="text-[#D4FF00] font-bold">{pct}%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-[#0B0F17] overflow-hidden">
                    <div
                      className="h-full bg-[#D4FF00] transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Live Leaderboard Table */}
                <div className="pt-3 border-t border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-[#D4FF00]" />
                      Live Accountability Standings
                    </span>
                    <span>Streak · Total</span>
                  </div>
                  <div className="divide-y divide-slate-800/60 text-xs font-mono tabular-nums">
                    {chal.leaderboard.map((row) => (
                      <div
                        key={row.athleteName}
                        className={`py-2 px-3 rounded-lg flex items-center justify-between ${
                          row.isCurrentUser ? 'bg-[#0B0F17] text-[#D4FF00] font-semibold' : 'text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 font-sans">
                          <span className="font-mono text-slate-400 w-5">#{row.rank}</span>
                          <span>{row.athleteName}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400">{row.streakDays}d streak</span>
                          <span aria-hidden="true">·</span>
                          <span className="text-white font-semibold">
                            {row.progress.toLocaleString()} {chal.unit}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right 5 Columns: Push Notifications & Community Check-In Feed */}
        <div className="lg:col-span-5 space-y-6">
          {/* Smart Push Notification Center */}
          <div className="p-6 rounded-2xl bg-[#131B2E] border border-slate-800 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-display font-bold text-white uppercase">
                  01. Push Notification & Call Triggers
                </h2>
                <p className="text-xs text-slate-400">
                  Real-time retention alerts, macro reminders, and incoming coach call pickup
                </p>
              </div>
              <Bell className="w-5 h-5 text-[#D4FF00]" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={handleRequestBrowserPushPermission}
                className="py-2.5 px-3.5 rounded-xl bg-[#D4FF00] hover:bg-[#b8e600] text-slate-950 font-semibold text-xs flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0"
              >
                <Bell className="w-3.5 h-3.5" />
                Send Test Push Alert
              </button>
              <button
                onClick={onSimulateIncomingCall}
                className="py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0"
              >
                <PhoneIncoming className="w-3.5 h-3.5 text-emerald-400" />
                Simulate Incoming Coach Call
              </button>
            </div>

            {/* Notification Toggle Switches */}
            <div className="space-y-2.5 pt-2 border-t border-slate-800">
              {[
                {
                  key: 'workoutReminders' as const,
                  label: 'Training Window & Rest Interval Push Alerts',
                },
                {
                  key: 'macroWindowAlerts' as const,
                  label: 'Anabolic Protein & Hydration Target Alerts',
                },
                {
                  key: 'leaderboardOvertakes' as const,
                  label: 'Social Challenge Leaderboard Position Changes',
                },
                {
                  key: 'liveCoachCheckInCalls' as const,
                  label: `Auto-Pickup Live Coach & Emergency Line (${EMERGENCY_HOTLINE})`,
                },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#0B0F17] border border-slate-800"
                >
                  <span className="text-xs text-slate-200">{item.label}</span>
                  <button
                    onClick={() => {
                      setPushSettings((prev) => ({
                        ...prev,
                        [item.key]: !prev[item.key],
                      }));
                      onToast(`Updated notification setting: ${item.label}`);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors whitespace-nowrap shrink-0 ${
                      pushSettings[item.key]
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {pushSettings[item.key] ? 'ON' : 'OFF'}
                  </button>
                </div>
              ))}
            </div>

            {/* Recent Notification Feed */}
            <div className="space-y-2.5 pt-3 border-t border-slate-800">
              <p className="text-xs font-semibold text-slate-300">Recent Dispatched Alerts</p>
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => onMarkNotificationRead(n.id)}
                  className={`p-3.5 rounded-xl border transition-colors cursor-pointer ${
                    n.read
                      ? 'bg-[#0B0F17]/60 border-slate-800/70 text-slate-400'
                      : 'bg-[#0B0F17] border-[#D4FF00]/40 text-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span className="text-[#D4FF00] font-medium">{n.category}</span>
                    <span className="font-mono tabular-nums">{n.timeLabel}</span>
                  </div>
                  <p className="text-xs font-semibold text-white">{n.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{n.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Community Accountability Feed */}
          <div className="p-6 rounded-2xl bg-[#131B2E] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-display font-bold text-white uppercase">
                02. Squad Accountability Check-In
              </h2>
              <Users className="w-5 h-5 text-[#D4FF00]" />
            </div>

            <form onSubmit={handlePostAccountabilityCheckIn} className="flex items-center gap-2">
              <input
                type="text"
                value={checkInNote}
                onChange={(e) => setCheckInNote(e.target.value)}
                placeholder="Share today's PR, macro streak, or form score..."
                className="flex-1 bg-[#0B0F17] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#D4FF00]"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl bg-[#D4FF00] hover:bg-[#b8e600] text-slate-950 font-semibold text-xs flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                Post
              </button>
            </form>

            <div className="space-y-2.5 pt-2">
              {communityFeed.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-[#0B0F17] border border-slate-800 flex items-start gap-2.5 text-xs"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="font-semibold text-white">{item.athlete}</span>
                      <span className="font-mono tabular-nums">{item.time}</span>
                    </div>
                    <p className="text-slate-300 mt-0.5">{item.action}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
