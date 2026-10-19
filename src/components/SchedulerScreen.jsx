import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertCircle, 
  Calendar as CalendarIcon, 
  Sparkles, 
  Check, 
  Filter,
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  Award
} from 'lucide-react';
import confetti from 'canvas-confetti';
import GlassCard from './GlassCard';
import { soundService } from '../services/sound';
import { notificationService } from '../services/notifications';
import { toDateStr, todayStr } from '../lib/date';

export default function SchedulerScreen({
  tasks,
  profileName,
  goalCount,
  currentTime,
  selectedDate,
  setSelectedDate,
  onToggleTask,
  onDeleteTask,
  onOpenAddTask,
  onNavigateToRoutine,
  onNavigateToAnalytics
}) {
  const [filter, setFilter] = useState('all'); // all, active, pending, completed
  const [hasCelebratedGoal, setHasCelebratedGoal] = useState(false);

  // Compute completed tasks for selected date
  const completedCount = useMemo(() => {
    return tasks.filter(t => t.isCompleted).length;
  }, [tasks]);

  const totalCount = tasks.length;
  const targetGoal = goalCount > 0 ? goalCount : 5;
  const progressRatio = Math.min(1, completedCount / targetGoal);
  const progressPercent = Math.round(progressRatio * 100);

  // Trigger celebration when goal is reached
  useEffect(() => {
    if (completedCount >= targetGoal && targetGoal > 0 && !hasCelebratedGoal) {
      setHasCelebratedGoal(true);
      soundService.playCelebration();
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // ignore
      }
    } else if (completedCount < targetGoal) {
      setHasCelebratedGoal(false);
    }
  }, [completedCount, targetGoal, hasCelebratedGoal]);

  // Check for active tasks and trigger notification/alert
  useEffect(() => {
    tasks.forEach(task => {
      const isNow = currentTime >= task.startTime && currentTime <= task.endTime;
      if (isNow && !task.isCompleted) {
        notificationService.notifyTaskStarted(task);
      }
    });
  }, [currentTime, tasks]);

  // Date Navigation Helpers
  const isToday = useMemo(() => {
    return selectedDate === todayStr();
  }, [selectedDate]);

  const changeDateBy = (days) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const next = new Date(y, m - 1, d);
    next.setDate(next.getDate() + days);
    setSelectedDate(toDateStr(next));
  };

  const formattedSelectedDate = useMemo(() => {
    const parts = selectedDate.split('-');
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
    }
    return selectedDate;
  }, [selectedDate]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const isActive = currentTime >= task.startTime && currentTime <= task.endTime;
      if (filter === 'active') return isActive;
      if (filter === 'pending') return !task.isCompleted;
      if (filter === 'completed') return task.isCompleted;
      return true;
    });
  }, [tasks, filter, currentTime]);

  const formatTime = (ts) => {
    if (!ts) return '--:--';
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      
      {/* Top Greeting & Goal Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Welcome Glass Card */}
        <GlassCard className="lg:col-span-2 flex flex-col justify-between relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/20 text-accent-teal border border-primary/30">
                  {isToday ? "Today's Schedule" : "Historical View"}
                </span>
                <span className="text-xs text-white/50">{formattedSelectedDate}</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white mt-2 tracking-tight">
                Hello, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent-teal">{profileName}</span>!
              </h2>
              <p className="text-xs md:text-sm text-white/70 mt-1">
                {completedCount >= targetGoal
                  ? "🎉 Amazing work! You have reached your daily activity goal!"
                  : `Focus on consistency. Complete ${Math.max(0, targetGoal - completedCount)} more task${targetGoal - completedCount === 1 ? '' : 's'} to hit today's target.`}
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={onNavigateToRoutine}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white/90 hover:text-white transition-all flex items-center gap-1.5"
              >
                <Clock className="w-3.5 h-3.5 text-accent-teal" />
                <span>ROUTINE</span>
              </button>
              <button
                onClick={onNavigateToAnalytics}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white/90 hover:text-white transition-all flex items-center gap-1.5"
              >
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>ANALYTICS</span>
              </button>
            </div>
          </div>

          {/* Goal Progress Bar */}
          <div className="mt-6 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between text-xs font-medium mb-2">
              <span className="text-white/80 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-accent-teal" />
                Daily Goal: <strong className="text-white">{completedCount}</strong> / {targetGoal} tasks
              </span>
              <span className="text-accent-teal font-mono font-bold">{progressPercent}%</span>
            </div>
            
            <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden p-0.5 border border-white/5">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-primary via-accent-teal to-emerald-400 transition-all duration-500 shadow-glow-blue"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </GlassCard>

        {/* Date Navigator & Quick Stats Card */}
        <GlassCard className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/50">Date Navigator</span>
              {isToday && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  LIVE
                </span>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-white/5 border border-white/10">
              <button
                onClick={() => changeDateBy(-1)}
                title="Previous Day"
                className="p-1.5 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <div className="flex-1 text-center">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-white text-xs font-medium text-center focus:outline-none cursor-pointer"
                />
              </div>

              <button
                onClick={() => changeDateBy(1)}
                title="Next Day"
                className="p-1.5 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {!isToday && (
              <button
                onClick={() => setSelectedDate(todayStr())}
                className="w-full mt-2 py-1.5 rounded-xl bg-primary/20 hover:bg-primary/30 text-accent-teal text-xs font-semibold transition-colors"
              >
                Jump to Today
              </button>
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-center pt-3 border-t border-white/10">
            <div className="p-2 rounded-xl bg-white/5">
              <p className="text-[10px] text-white/50 uppercase font-semibold">Scheduled</p>
              <p className="text-lg font-bold text-white font-mono">{totalCount}</p>
            </div>
            <div className="p-2 rounded-xl bg-white/5">
              <p className="text-[10px] text-white/50 uppercase font-semibold">Completed</p>
              <p className="text-lg font-bold text-emerald-400 font-mono">{completedCount}</p>
            </div>
          </div>
        </GlassCard>

      </div>

      {/* Task Controls & Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/5 border border-white/10">
          {[
            { id: 'all', label: `All (${totalCount})` },
            { id: 'active', label: 'Active Now' },
            { id: 'pending', label: 'Pending' },
            { id: 'completed', label: 'Completed' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filter === t.id 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <button
          onClick={onOpenAddTask}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary hover:bg-primary/90 text-white font-semibold text-xs md:text-sm shadow-glow-blue hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Task</span>
        </button>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <GlassCard className="py-16 text-center">
            <div className="w-14 h-14 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 text-white/40">
              <CalendarIcon className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-white">No tasks found</h3>
            <p className="text-xs text-white/50 max-w-sm mx-auto mt-1">
              {filter !== 'all' 
                ? `No tasks match the "${filter}" filter. Switch to "All" or create a new task.`
                : 'Your schedule for this date is currently clear. Add a task to stay consistent!'}
            </p>
            <button
              onClick={onOpenAddTask}
              className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors border border-white/10"
            >
              <Plus className="w-3.5 h-3.5 text-accent-teal" />
              <span>Create First Task</span>
            </button>
          </GlassCard>
        ) : (
          filteredTasks.map((task) => {
            const isActive = currentTime >= task.startTime && currentTime <= task.endTime;
            const isPast = currentTime > task.endTime && !task.isCompleted;

            return (
              <GlassCard
                key={task.id}
                isActive={isActive}
                isPast={isPast}
                className="group hover:border-white/20 transition-all duration-200"
              >
                <div className="flex items-start md:items-center justify-between gap-3">
                  
                  {/* Left: Checkbox & Info */}
                  <div className="flex items-start md:items-center gap-3.5 flex-1 min-w-0">
                    <button
                      onClick={() => {
                        onToggleTask(task);
                        if (!task.isCompleted) soundService.playTaskComplete();
                      }}
                      title={task.isCompleted ? 'Mark Pending' : 'Mark Completed'}
                      className={`mt-0.5 md:mt-0 p-1 rounded-xl transition-all ${
                        task.isCompleted 
                          ? 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20' 
                          : 'text-white/40 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {task.isCompleted ? (
                        <CheckCircle2 className="w-6 h-6 fill-emerald-500/20" />
                      ) : (
                        <Circle className="w-6 h-6 stroke-[1.5]" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className={`text-sm md:text-base font-semibold tracking-tight transition-all truncate ${
                          task.isCompleted ? 'line-through text-white/40' : 'text-white'
                        }`}>
                          {task.title}
                        </h4>

                        {/* NOW Tag (Android exact feature) */}
                        {isActive && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary text-white text-[10px] font-bold tracking-wide uppercase shadow-glow-blue animate-pulse">
                            NOW
                          </span>
                        )}

                        {/* Category Tag */}
                        {task.category && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/60 font-mono">
                            {task.category}
                          </span>
                        )}
                      </div>

                      {task.description && (
                        <p className={`text-xs mt-0.5 line-clamp-2 ${task.isCompleted ? 'text-white/30' : 'text-white/60'}`}>
                          {task.description}
                        </p>
                      )}

                      {/* Time Span & Past Indicator */}
                      <div className="flex items-center gap-2 mt-1.5 text-xs font-mono">
                        <Clock className="w-3.5 h-3.5 text-white/40" />
                        <span className={isPast ? 'text-rose-400 font-semibold' : 'text-white/60'}>
                          {formatTime(task.startTime)} - {formatTime(task.endTime)}
                        </span>
                        {isPast && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-sans">
                            Overdue
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onDeleteTask(task)}
                      title="Delete Task"
                      className="p-2 rounded-xl text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              </GlassCard>
            );
          })
        )}
      </div>

    </div>
  );
}
