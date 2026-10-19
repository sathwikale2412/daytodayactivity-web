import React, { useMemo } from 'react';
import { 
  ArrowLeft, 
  BarChart3, 
  TrendingUp, 
  CheckCircle, 
  Flame, 
  Target, 
  Calendar, 
  Zap, 
  Lightbulb,
  Award
} from 'lucide-react';
import GlassCard from './GlassCard';

export default function AnalyticsScreen({ weeklyData, onBack }) {
  const { days = [], totalCreated = 0, totalCompleted = 0, overallRate = 0 } = weeklyData || {};

  // Compute 7-day average rate
  const avgRate = useMemo(() => {
    if (!days.length) return 0;
    const sum = days.reduce((acc, d) => acc + d.rate, 0);
    return Math.round(sum / days.length);
  }, [days]);

  // Compute active streak (consecutive days with completed >= 1)
  const streak = useMemo(() => {
    let count = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].completed > 0) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }, [days]);

  // Find best day
  const bestDay = useMemo(() => {
    if (!days.length) return null;
    return [...days].sort((a, b) => b.rate - a.rate)[0];
  }, [days]);

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <GlassCard className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            onClick={onBack}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors flex items-center gap-1 text-xs mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Scheduler</span>
          </button>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Consistency Analytics <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">7-Day Trend</span>
          </h2>
          <p className="text-xs md:text-sm text-white/70 mt-1 max-w-xl">
            Analytics help you understand your habits and optimize your daily routine for peak productivity.
          </p>
        </div>

        {/* Current Streak Badge */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
            <Flame className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-amber-400/80">Active Streak</p>
            <p className="text-lg font-extrabold text-white font-mono">{streak} {streak === 1 ? 'Day' : 'Days'}</p>
          </div>
        </div>
      </GlassCard>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white/60">7-Day Average</span>
            <TrendingUp className="w-4 h-4 text-accent-teal" />
          </div>
          <p className="text-2xl md:text-3xl font-extrabold text-white font-mono mt-2">{avgRate}%</p>
          <p className="text-[11px] text-white/50 mt-1">Average daily completion</p>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white/60">Total Tasks</span>
            <Target className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl md:text-3xl font-extrabold text-white font-mono mt-2">{totalCreated}</p>
          <p className="text-[11px] text-white/50 mt-1">Recorded in database</p>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white/60">Completed</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl md:text-3xl font-extrabold text-emerald-400 font-mono mt-2">{totalCompleted}</p>
          <p className="text-[11px] text-white/50 mt-1">Activities finalized</p>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white/60">Best Day</span>
            <Award className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl md:text-3xl font-extrabold text-purple-300 font-mono mt-2">
            {bestDay && bestDay.rate > 0 ? `${bestDay.rate}%` : 'N/A'}
          </p>
          <p className="text-[11px] text-white/50 mt-1">
            {bestDay && bestDay.rate > 0 ? `${bestDay.dayName} (${bestDay.formattedDate})` : 'Start logging tasks'}
          </p>
        </GlassCard>
      </div>

      {/* Main 7-Day Completion Bar Chart */}
      <GlassCard className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-accent-teal" />
              Task Completion Rate (Last 7 Days)
            </h3>
            <p className="text-xs text-white/50 mt-0.5">
              Percentage of scheduled tasks completed each day
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs text-white/60">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-t from-primary to-accent-teal" />
              Completion Rate %
            </span>
          </div>
        </div>

        {/* SVG Interactive Chart */}
        <div className="pt-6 pb-2">
          <div className="h-64 flex items-end justify-between gap-2 md:gap-6 px-2 md:px-6 border-b border-white/10 relative">
            {/* Horizontal guide lines */}
            <div className="absolute inset-x-0 top-0 border-t border-white/5 pointer-events-none flex justify-end pr-2 text-[10px] font-mono text-white/30">100%</div>
            <div className="absolute inset-x-0 top-1/2 border-t border-white/5 pointer-events-none flex justify-end pr-2 text-[10px] font-mono text-white/30">50%</div>

            {days.map((day, idx) => {
              const barHeight = Math.max(8, day.rate); // min 8% for visibility
              const isToday = idx === days.length - 1;

              return (
                <div key={day.date} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  
                  {/* Tooltip on hover */}
                  <div className="absolute -top-14 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-20 whitespace-nowrap px-2.5 py-1.5 rounded-xl bg-dark-surface/95 border border-white/20 text-center shadow-xl">
                    <p className="text-[11px] font-bold text-white">{day.dayName}, {day.formattedDate}</p>
                    <p className="text-[10px] text-accent-teal font-mono">
                      {day.completed}/{day.total} tasks ({day.rate}%)
                    </p>
                  </div>

                  {/* Percentage label above bar */}
                  <span className={`text-[11px] font-mono font-semibold mb-1 transition-colors ${
                    isToday ? 'text-accent-teal' : 'text-white/60'
                  }`}>
                    {day.rate}%
                  </span>

                  {/* Bar */}
                  <div className="w-full max-w-[48px] h-full flex items-end">
                    <div
                      style={{ height: `${barHeight}%` }}
                      className={`w-full rounded-t-xl transition-all duration-500 group-hover:scale-105 ${
                        day.rate >= 80
                          ? 'bg-gradient-to-t from-emerald-600 to-accent-teal shadow-glow-teal'
                          : day.rate >= 40
                          ? 'bg-gradient-to-t from-primary to-secondary-indigo shadow-glow-blue'
                          : 'bg-gradient-to-t from-white/10 to-white/30'
                      }`}
                    />
                  </div>

                  {/* Day label beneath */}
                  <div className="text-center mt-3">
                    <p className={`text-xs font-semibold ${isToday ? 'text-accent-teal font-bold' : 'text-white/80'}`}>
                      {day.dayName}
                    </p>
                    <p className="text-[10px] text-white/40 font-mono">
                      {day.formattedDate}
                    </p>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      </GlassCard>

      {/* Habit Insights Card */}
      <GlassCard className="flex items-start gap-4 p-5 bg-gradient-to-r from-primary/10 via-white/5 to-transparent border-primary/20">
        <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center text-accent-teal shrink-0 mt-0.5">
          <Lightbulb className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-white">Productivity & Habit Recommendation</h4>
          <p className="text-xs text-white/70 leading-relaxed">
            {avgRate >= 80 
              ? 'Outstanding performance! Your consistency is in the top tier. Keep maintaining your routines and remember to pace yourself with proper breaks.'
              : avgRate >= 50
              ? 'Solid momentum! You are completing more than half of your daily planned activities. Try clustering related tasks together or scheduling them during your highest energy routine windows.'
              : 'Small consistent steps build lasting habits. Focus on completing at least 2 key priority tasks every day to build a steady winning streak!'}
          </p>
        </div>
      </GlassCard>

    </div>
  );
}
