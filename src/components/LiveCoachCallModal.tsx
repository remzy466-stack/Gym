import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  ShieldAlert,
  Send,
  X,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { CallTurn, ReadinessState } from '../types';
import { ASSETS, EMERGENCY_HOTLINE } from '../data/initialData';
import { playCoachAudio, stopAllAudio } from '../utils/audioPlayer';

interface LiveCoachCallModalProps {
  isOpen: boolean;
  initialMode: 'incoming' | 'active' | 'emergency';
  onClose: () => void;
  readiness: ReadinessState;
  activeExerciseName: string;
  caloriesRemaining: number;
}

export const LiveCoachCallModal: React.FC<LiveCoachCallModalProps> = ({
  isOpen,
  initialMode,
  onClose,
  readiness,
  activeExerciseName,
  caloriesRemaining,
}) => {
  const [callState, setCallState] = useState<'incoming' | 'connected' | 'emergency'>(
    initialMode === 'incoming' ? 'incoming' : initialMode === 'emergency' ? 'emergency' : 'connected'
  );
  const [callDurationSec, setCallDurationSec] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isCoachSpeaking, setIsCoachSpeaking] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [turns, setTurns] = useState<CallTurn[]>([
    {
      id: 'turn-init',
      sender: 'coach',
      text: `Coach Marcus on the line. I see you're working on ${activeExerciseName} with ${caloriesRemaining} kcal remaining today. How is your body feeling on this set, or do you need immediate form or injury triage?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actionSteps: [
        'Keep 360-degree core intra-abdominal bracing active',
        'Speak or select a quick prompt below for live coaching',
        `Direct Emergency & Specialist Hotline ready: ${EMERGENCY_HOTLINE}`,
      ],
      triageClassification: 'Live Coaching Connected',
    },
  ]);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (initialMode === 'incoming') {
      setCallState('incoming');
    } else if (initialMode === 'emergency') {
      setCallState('emergency');
    } else {
      setCallState('connected');
    }
    setCallDurationSec(0);
  }, [initialMode, isOpen]);

  useEffect(() => {
    if (!isOpen || callState === 'incoming') return;
    const timer = setInterval(() => {
      setCallDurationSec((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, callState]);

  useEffect(() => {
    if (!isOpen) {
      stopAllAudio();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  const handleAnswerCall = async () => {
    setCallState('connected');
    setIsCoachSpeaking(true);
    await playCoachAudio(
      null,
      `Hey athlete, Coach Marcus here on your live check-in. You're queued up for ${activeExerciseName}. Let me know if your lower back or knees feel tight, or if we are pushing top-set weight today.`
    );
    setTimeout(() => setIsCoachSpeaking(false), 3500);
  };

  const sendLiveTurn = async (messageText: string, modeOverride?: string) => {
    const trimmed = messageText.trim();
    if (!trimmed || isLoading) return;

    const userTurn: CallTurn = {
      id: `turn-user-${Date.now()}`,
      sender: 'athlete',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setTurns((prev) => [...prev, userTurn]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/live-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: trimmed,
          callMode: modeOverride || (callState === 'emergency' ? 'Emergency Guidance' : 'Live Coaching'),
          athleteContext: {
            readiness,
            activeExerciseName,
            caloriesRemaining,
            hotline: EMERGENCY_HOTLINE,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get coach response');
      }

      const coachTurn: CallTurn = {
        id: `turn-coach-${Date.now()}`,
        sender: 'coach',
        text: data.spokenResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionSteps: data.actionSteps || [],
        escalateToHotline: data.escalateToHotline,
        triageClassification: data.triageClassification,
      };

      setTurns((prev) => [...prev, coachTurn]);

      if (data.escalateToHotline) {
        setCallState('emergency');
      }

      setIsCoachSpeaking(true);
      await playCoachAudio(data.audioBase64, data.spokenResponse);
      setTimeout(() => setIsCoachSpeaking(false), 4000);
    } catch (err: any) {
      const fallbackTurn: CallTurn = {
        id: `turn-err-${Date.now()}`,
        sender: 'coach',
        text: `I heard you: "${trimmed}". Rack the weight safely, take a deep nasal breath, and if you feel sharp pain, tap the direct hotline ${EMERGENCY_HOTLINE} immediately.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionSteps: [
          'Rack the barbell or drop dumbbells safely to the floor',
          `Dial ${EMERGENCY_HOTLINE} immediately if experiencing acute joint or chest pain`,
        ],
      };
      setTurns((prev) => [...prev, fallbackTurn]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMicrophoneSpeech = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      sendLiveTurn('Coach, walk me through my bracing and tempo for this next heavy set.');
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) {
        sendLiveTurn(transcript);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-3xl bg-[#131B2E] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Top Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0B0F17]">
          <div className="flex items-center gap-3">
            <PhoneCall className="w-5 h-5 text-[#D4FF00]" />
            <div>
              <h3 className="text-lg font-display font-bold tracking-wide text-white uppercase">
                Live Coaching & Emergency Dispatch Center
              </h3>
              <p className="text-xs text-slate-400 font-mono tabular-nums">
                Direct Line: {EMERGENCY_HOTLINE} · Session Timer: {formatTimer(callDurationSec)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={`tel:${EMERGENCY_HOTLINE}`}
              className="px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 font-mono tabular-nums"
            >
              <Phone className="w-3.5 h-3.5" />
              Call {EMERGENCY_HOTLINE}
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Close live call modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Incoming Call State */}
        {callState === 'incoming' ? (
          <div className="p-8 text-center space-y-6">
            <div className="relative w-24 h-24 mx-auto rounded-full overflow-hidden border-2 border-[#D4FF00]">
              <img
                src={ASSETS.coachAvatarImg}
                alt="Head Coach Marcus"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-widest text-[#D4FF00] font-mono">
                Incoming Live Trainer Check-In Call
              </p>
              <h2 className="text-3xl font-display font-bold text-white">
                Head Coach Marcus · APEX KINETIX
              </h2>
              <p className="text-sm text-slate-300 max-w-md mx-auto">
                Live Mid-Workout Check-In for <span className="text-white font-semibold">{activeExerciseName}</span> & Emergency Hotline (<span className="font-mono">{EMERGENCY_HOTLINE}</span>)
              </p>
            </div>

            <div className="flex items-center justify-center gap-4 pt-4">
              <button
                onClick={handleAnswerCall}
                className="px-6 py-3.5 rounded-xl bg-[#D4FF00] text-slate-950 font-semibold text-sm flex items-center gap-2.5 hover:bg-[#b8e600] transition-colors whitespace-nowrap shrink-0"
              >
                <PhoneIncoming className="w-4 h-4" />
                Pick Up Live Coaching Call
              </button>
              <a
                href={`tel:${EMERGENCY_HOTLINE}`}
                className="px-5 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 font-mono tabular-nums"
              >
                <Phone className="w-4 h-4 text-emerald-400" />
                Dial {EMERGENCY_HOTLINE}
              </a>
              <button
                onClick={onClose}
                className="px-4 py-3.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
              >
                <PhoneOff className="w-4 h-4 text-red-400" />
                Decline
              </button>
            </div>
          </div>
        ) : (
          /* Connected or Emergency Call View */
          <div className="p-6 space-y-5">
            {/* Emergency Banner if triggered */}
            {callState === 'emergency' && (
              <div className="p-4 rounded-xl bg-red-950/60 border border-red-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-red-200">
                      Emergency & Acute Injury Protocol Active
                    </h4>
                    <p className="text-xs text-red-300/90 mt-0.5">
                      Stop loading immediately. Stabilize the joint, control breathing, and connect directly with emergency response / live duty trainer at <span className="font-mono font-semibold text-white">{EMERGENCY_HOTLINE}</span>.
                    </p>
                  </div>
                </div>
                <a
                  href={`tel:${EMERGENCY_HOTLINE}`}
                  className="px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold font-mono tabular-nums whitespace-nowrap shrink-0 flex items-center gap-2"
                >
                  <Phone className="w-3.5 h-3.5" />
                  Emergency Dial {EMERGENCY_HOTLINE}
                </a>
              </div>
            )}

            {/* Coach Profile & Audio Status Strip */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-[#0B0F17] border border-slate-800">
              <div className="flex items-center gap-3.5">
                <img
                  src={ASSETS.coachAvatarImg}
                  alt="Head Coach Marcus"
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-full object-cover border border-slate-700"
                />
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="text-white font-semibold text-sm">Head Coach Marcus</span>
                    <span aria-hidden="true">·</span>
                    <span>AI Voice + Hotline Bridge</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono text-[#D4FF00]">{EMERGENCY_HOTLINE}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isCoachSpeaking
                      ? 'Speaking live audio guidance...'
                      : isListening
                      ? 'Listening to your microphone...'
                      : 'Line open — ask for form cues, spotter advice, or injury triage'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCallState(callState === 'emergency' ? 'connected' : 'emergency')}
                  className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                    callState === 'emergency'
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {callState === 'emergency' ? 'Emergency Mode On' : 'Emergency Triage'}
                </button>
                <button
                  onClick={() => {
                    const lastCoach = [...turns].reverse().find((t) => t.sender === 'coach');
                    if (lastCoach) {
                      playCoachAudio(null, lastCoach.text);
                    }
                  }}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                >
                  <Volume2 className="w-3.5 h-3.5 text-[#D4FF00]" />
                  Replay Audio
                </button>
              </div>
            </div>

            {/* Quick Voice Scenarios */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() =>
                  sendLiveTurn(
                    `Cue me through my next heavy set of ${activeExerciseName}. How should I breathe and brace?`
                  )
                }
                className="px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-xs text-slate-200 transition-colors whitespace-nowrap shrink-0"
              >
                Cue Next Heavy Set
              </button>
              <button
                onClick={() =>
                  sendLiveTurn(
                    'I felt a sudden tweak in my lower back on that last rep. What should I do right now?',
                    'Emergency Guidance'
                  )
                }
                className="px-3 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900/80 border border-red-800/60 text-xs text-red-200 transition-colors whitespace-nowrap shrink-0"
              >
                Acute Lower Back Tweak Triage
              </button>
              <button
                onClick={() =>
                  sendLiveTurn(
                    'I am feeling lightheaded and fatigued mid-workout. How should I adjust my session and hydration?'
                  )
                }
                className="px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-xs text-slate-200 transition-colors whitespace-nowrap shrink-0"
              >
                Dizziness / Fatigue Check
              </button>
              <button
                onClick={() =>
                  sendLiveTurn(
                    `Connect me with the specialist trainer on ${EMERGENCY_HOTLINE} and summarize my workout readiness.`
                  )
                }
                className="px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-xs text-slate-200 transition-colors whitespace-nowrap shrink-0 font-mono"
              >
                Escalate to {EMERGENCY_HOTLINE}
              </button>
            </div>

            {/* Live Conversation Transcript & Action Steps */}
            <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
              {turns.map((turn) => (
                <div
                  key={turn.id}
                  className={`p-4 rounded-xl border ${
                    turn.sender === 'coach'
                      ? 'bg-[#0B0F17] border-slate-800 text-slate-100'
                      : 'bg-slate-800/60 border-slate-700 text-white ml-8'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                    <span className="font-semibold text-slate-200">
                      {turn.sender === 'coach' ? 'Coach Marcus (Live Audio)' : 'You (Athlete)'}
                    </span>
                    <span className="font-mono tabular-nums">{turn.timestamp}</span>
                  </div>
                  <p className="text-sm leading-relaxed">{turn.text}</p>

                  {turn.actionSteps && turn.actionSteps.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1.5">
                      {turn.actionSteps.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#D4FF00] shrink-0 mt-0.5" />
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="p-4 rounded-xl bg-[#0B0F17] border border-slate-800 text-xs text-slate-400 font-mono">
                  Coach Marcus is analyzing telemetry and generating live voice response...
                </div>
              )}
            </div>

            {/* Bottom Voice & Text Input Bar */}
            <div className="flex items-center gap-3 pt-2 border-t border-slate-800">
              <button
                onClick={toggleMicrophoneSpeech}
                className={`p-3 rounded-xl font-medium text-xs flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 ${
                  isListening
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-[#D4FF00]" />}
                {isListening ? 'Stop Mic' : 'Speak to Coach'}
              </button>

              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') sendLiveTurn(inputMessage);
                }}
                placeholder="Ask Coach Marcus anything or describe symptoms on the call..."
                className="flex-1 bg-[#0B0F17] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#D4FF00]"
              />

              <button
                onClick={() => sendLiveTurn(inputMessage)}
                disabled={isLoading || !inputMessage.trim()}
                className="px-4 py-2.5 rounded-xl bg-[#D4FF00] hover:bg-[#b8e600] disabled:opacity-40 text-slate-950 font-semibold text-sm flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
