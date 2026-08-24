"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { loadPlannerData, savePlannerData } from "@/lib/plannerApi";
import {
  PREDEFINED_COLORS,
  DAYS_OF_WEEK,
  INITIAL_WEEK_PLAN,
  createDefaultUserData,
} from "@/lib/plannerDefaults";

export default function Planner() {
  const supabaseRef = useRef(null);
  const todayIndex = new Date().getDay();
  const [activeDay, setActiveDay] = useState(DAYS_OF_WEEK[todayIndex]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const [userId, setUserId] = useState(null);
  const hasLoadedRef = useRef(false);

  const [completedTasks, setCompletedTasks] = useState(new Set());
  const [weekPlan, setWeekPlan] = useState(INITIAL_WEEK_PLAN);
  const [userData, setUserData] = useState(createDefaultUserData());

  useEffect(() => {
    let cancelled = false;
    supabaseRef.current = createClient();
    const supabase = supabaseRef.current;

    async function loadData() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;
        if (!user) {
          window.location.href = "/login";
          return;
        }

        const plannerData = await loadPlannerData(supabase, user.id);
        if (cancelled) return;

        setUserId(user.id);
        setUserData(plannerData.userData);
        setWeekPlan(plannerData.weekPlan);
        setCompletedTasks(plannerData.completedTasks);
        hasLoadedRef.current = true;
      } catch (error) {
        if (!cancelled) {
          setLoadError(error.message || "Failed to load planner data.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedRef.current || !userId) return;

    const supabase = supabaseRef.current;
    if (!supabase) return;

    setSaveStatus("Saving...");
    const timeoutId = setTimeout(async () => {
      try {
        await savePlannerData(supabase, userId, {
          userData,
          weekPlan,
          completedTasks,
        });
        setSaveStatus("Saved");
      } catch (error) {
        setSaveStatus("Save failed");
        console.error(error);
      }
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [userId, userData, weekPlan, completedTasks]);

  const handleSignOut = async () => {
    const supabase = supabaseRef.current;
    if (!supabase) return;
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  // Sunday Reset Logic
  useEffect(() => {
    const checkRollover = () => {
      const now = new Date();
      const lastReset = new Date(userData.lastResetDate);
      
      const mostRecentSunday = new Date(now);
      mostRecentSunday.setHours(0, 0, 0, 0);
      mostRecentSunday.setDate(now.getDate() - now.getDay());
      
      if (lastReset < mostRecentSunday) {
        // A Sunday has passed since our last reset!
        setCompletedTasks(new Set());
        setWeekPlan(JSON.parse(JSON.stringify(userData.weeklyTemplates)));
        setUserData(prev => ({ ...prev, lastResetDate: now.toISOString() }));
        console.log("Sunday Reset Triggered!");
      }
    };
    checkRollover();
  }, [userData.lastResetDate, userData.weeklyTemplates]);
  
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isUserSectionOpen, setIsUserSectionOpen] = useState(false);
  const [settingsActiveTab, setSettingsActiveTab] = useState("profile"); // profile, schedule, categories, templates
  
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState("youtube");
  const [isAtWork, setIsAtWork] = useState(false);

  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [editingGoalText, setEditingGoalText] = useState("");

  const toggleTask = (taskId) => {
    setCompletedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask = {
      id: `custom-${Date.now()}`,
      title: newTaskTitle.trim(),
      category: newTaskCategory,
    };

    setWeekPlan(prev => {
      const dayData = prev[activeDay];
      const updatedDayData = isAtWork 
        ? { ...dayData, atWork: [...dayData.atWork, newTask] }
        : { ...dayData, tasks: [...dayData.tasks, newTask] };

      return {
        ...prev,
        [activeDay]: updatedDayData
      };
    });

    setNewTaskTitle("");
    setIsAddingTask(false);
  };

  const handleEditTask = (taskId, newTitle, isWorkTask) => {
    setWeekPlan(prev => {
      const dayData = prev[activeDay];
      const listKey = isWorkTask ? 'atWork' : 'tasks';
      
      const updatedList = dayData[listKey].map(task => 
        task.id === taskId ? { ...task, title: newTitle } : task
      );

      return {
        ...prev,
        [activeDay]: {
          ...dayData,
          [listKey]: updatedList
        }
      };
    });
  };

  const handleDeleteTask = (taskId, isWorkTask) => {
    setWeekPlan(prev => {
      const dayData = prev[activeDay];
      const listKey = isWorkTask ? 'atWork' : 'tasks';
      
      const updatedList = dayData[listKey].filter(task => task.id !== taskId);

      if (completedTasks.has(taskId)) {
        setCompletedTasks(prevCompleted => {
          const next = new Set(prevCompleted);
          next.delete(taskId);
          return next;
        });
      }

      return {
        ...prev,
        [activeDay]: {
          ...dayData,
          [listKey]: updatedList
        }
      };
    });
  };

  const handleStartEditingGoal = () => {
    setEditingGoalText(weekPlan[activeDay].goal);
    setIsEditingGoal(true);
  };

  const handleSaveGoal = () => {
    if (!editingGoalText.trim()) return;
    
    setWeekPlan(prev => ({
      ...prev,
      [activeDay]: {
        ...prev[activeDay],
        goal: editingGoalText.trim()
      }
    }));
    
    setIsEditingGoal(false);
  };

  const handleDaySwitch = (day) => {
    setActiveDay(day);
    if (isEditingGoal) {
      setIsEditingGoal(false);
    }
  };

  const openSettingsToTab = (tabName) => {
    setSettingsActiveTab(tabName);
    setIsUserSectionOpen(true);
  };

  const dayData = weekPlan[activeDay];
  const allTasksForDay = [...dayData.tasks, ...dayData.atWork];
  const completedCount = allTasksForDay.filter(t => completedTasks.has(t.id)).length;
  const progressPercent = allTasksForDay.length === 0 ? 0 : Math.round((completedCount / allTasksForDay.length) * 100);

  const activeShiftInfo = userData.shiftTimes[activeDay];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-mono text-gray-500" style={{ fontFamily: "var(--font-dm-mono)" }}>
          Loading your planner...
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md text-center space-y-4">
          <p className="text-red-600 font-mono" style={{ fontFamily: "var(--font-dm-mono)" }}>
            {loadError}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-black text-white rounded-md font-mono"
            style={{ fontFamily: "var(--font-dm-mono)" }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 pb-24">
      {/* Header Area */}
      <header className="mb-6 flex justify-between items-start gap-4">
        <div>
          <h1 className="text-4xl font-bold text-black" style={{ fontFamily: "var(--font-playfair)" }}>
            Life & Content Planner
          </h1>
          {saveStatus && (
            <p className="text-xs text-gray-400 font-mono mt-1" style={{ fontFamily: "var(--font-dm-mono)" }}>
              {saveStatus}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSignOut}
            className="px-3 py-1.5 text-xs font-mono text-gray-500 hover:text-black border border-gray-200 rounded-md hover:bg-gray-50"
            style={{ fontFamily: "var(--font-dm-mono)" }}
          >
            Sign out
          </button>
          <button
            onClick={() => openSettingsToTab("profile")}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-black text-white hover:bg-gray-800 transition-colors shadow-sm ring-2 ring-transparent hover:ring-gray-300"
            title="User Profile & Settings"
          >
            <span className="font-bold font-mono text-sm" style={{ fontFamily: "var(--font-dm-mono)" }}>
              {userData.name.charAt(0).toUpperCase()}
            </span>
          </button>
        </div>
      </header>

      {/* Shift Countdown Card */}
      <div className="mb-8">
        <ShiftCountdown 
          shiftTimes={userData.shiftTimes} 
          onSettingsClick={() => openSettingsToTab("schedule")}
        />
      </div>

      {/* Tabs */}
      <nav className="flex overflow-x-auto space-x-2 border-b border-gray-200 mb-6 pb-2 no-scrollbar">
        {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
          <button
            key={day}
            onClick={() => handleDaySwitch(day)}
            className={`px-4 py-2 rounded-t-lg font-mono text-sm whitespace-nowrap transition-colors ${
              activeDay === day 
                ? "bg-black text-white" 
                : "text-gray-600 hover:bg-gray-100"
            }`}
            style={{ fontFamily: "var(--font-dm-mono)" }}
          >
            {day}
          </button>
        ))}
      </nav>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm font-mono text-gray-500 mb-2" style={{ fontFamily: "var(--font-dm-mono)" }}>
          <span>Daily Progress</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-black h-full transition-all duration-500 ease-out" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Pinned Goal (Directive) */}
      <section className="mb-8 p-6 bg-gray-50 border border-gray-200 rounded-xl relative group shadow-sm">
        <div className="flex items-start space-x-4 w-full">
          <div className="text-2xl mt-1">🎯</div>
          <div className="flex-grow pr-16">
            <h3 className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-2" style={{ fontFamily: "var(--font-dm-mono)" }}>
              {activeDay}'s Directive
            </h3>
            
            {isEditingGoal ? (
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <input
                  type="text"
                  value={editingGoalText}
                  onChange={(e) => setEditingGoalText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveGoal()}
                  className="flex-grow border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-black focus:outline-none text-lg text-gray-900 italic"
                  style={{ fontFamily: "var(--font-playfair)" }}
                  autoFocus
                />
                <button 
                  onClick={handleSaveGoal}
                  className="px-4 py-2 bg-black text-white rounded-md text-sm font-mono hover:bg-gray-800 transition-colors"
                  style={{ fontFamily: "var(--font-dm-mono)" }}
                >
                  Save
                </button>
              </div>
            ) : (
              <p className="text-lg text-gray-900 italic break-words" style={{ fontFamily: "var(--font-playfair)" }}>
                "{dayData.goal}"
              </p>
            )}
          </div>
        </div>

        {!isEditingGoal && (
          <button 
            onClick={handleStartEditingGoal}
            className="absolute top-6 right-6 px-3 py-1 bg-white border border-gray-200 text-gray-600 rounded-md text-sm font-mono hover:bg-gray-100 hover:text-black opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-sm"
            style={{ fontFamily: "var(--font-dm-mono)" }}
          >
            Edit
          </button>
        )}
      </section>

      <main className="space-y-8">
        {/* Core Tasks */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-playfair)" }}>Core Tasks</h2>
            <button 
              onClick={() => setIsAddingTask(true)}
              className="px-3 py-1 bg-black text-white rounded-md text-sm font-mono hover:bg-gray-800 transition-colors shadow-sm"
              style={{ fontFamily: "var(--font-dm-mono)" }}
            >
              + Add Task
            </button>
          </div>
          <div className="grid gap-3">
            {dayData.tasks.map(task => (
              <TaskRow 
                key={task.id} 
                task={task} 
                isCompleted={completedTasks.has(task.id)}
                onToggle={() => toggleTask(task.id)}
                onEdit={(newTitle) => handleEditTask(task.id, newTitle, false)}
                onDelete={() => handleDeleteTask(task.id, false)}
                categories={userData.categories}
              />
            ))}
            {dayData.tasks.length === 0 && (
              <p className="text-gray-400 italic px-2">No core tasks scheduled.</p>
            )}
          </div>
        </section>

        {/* At Work Section */}
        {activeShiftInfo.isWorking ? (
          <section className="bg-green-50/50 p-6 rounded-xl border border-green-100 shadow-sm">
            <h2 className="text-xl font-bold mb-4 text-green-900 flex items-center justify-between" style={{ fontFamily: "var(--font-playfair)" }}>
              <span>At Work ({activeShiftInfo.start} - {activeShiftInfo.end})</span>
            </h2>
            <div className="grid gap-3">
              {dayData.atWork.map(task => (
                <TaskRow 
                  key={task.id} 
                  task={task} 
                  isCompleted={completedTasks.has(task.id)}
                  onToggle={() => toggleTask(task.id)}
                  categoryOverride="work"
                  onEdit={(newTitle) => handleEditTask(task.id, newTitle, true)}
                  onDelete={() => handleDeleteTask(task.id, true)}
                  categories={userData.categories}
                />
              ))}
              {dayData.atWork.length === 0 && (
                <p className="text-green-700/50 italic px-2">No work tasks scheduled.</p>
              )}
            </div>
          </section>
        ) : (
          <section className="bg-gray-50 p-6 rounded-xl border border-gray-200 border-dashed text-center">
            <p className="text-gray-500 italic font-mono text-sm" style={{ fontFamily: "var(--font-dm-mono)" }}>No shift scheduled for {activeDay}. Enjoy your day off!</p>
          </section>
        )}
      </main>

      {/* Tabbed User Settings Modal */}
      {isUserSectionOpen && (
        <UserSettingsModal 
          userData={userData}
          setUserData={setUserData}
          setWeekPlan={setWeekPlan}
          setCompletedTasks={setCompletedTasks}
          onClose={() => setIsUserSectionOpen(false)}
          activeTab={settingsActiveTab}
          setActiveTab={setSettingsActiveTab}
        />
      )}

      {/* Add Task Modal */}
      {isAddingTask && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-2xl font-bold mb-4" style={{ fontFamily: "var(--font-playfair)" }}>Add New Task</h3>
            <form onSubmit={handleAddTask} className="space-y-4">
              
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setIsAtWork(false)}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                    !isAtWork ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'
                  }`}
                >
                  Core Task
                </button>
                <button
                  type="button"
                  onClick={() => setIsAtWork(true)}
                  disabled={!activeShiftInfo.isWorking}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                    isAtWork ? 'bg-green-100 text-green-800 shadow-sm border border-green-200' : 'text-gray-500 hover:text-black'
                  } ${!activeShiftInfo.isWorking ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Night Shift Task
                </button>
              </div>

              <div>
                <label className="block text-sm font-mono text-gray-600 mb-1" style={{ fontFamily: "var(--font-dm-mono)" }}>Task Title</label>
                <input 
                  type="text" 
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-black focus:outline-none"
                  placeholder="e.g., Review analytics"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-mono text-gray-600 mb-1" style={{ fontFamily: "var(--font-dm-mono)" }}>Category</label>
                <select 
                  value={newTaskCategory}
                  onChange={(e) => setNewTaskCategory(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-black focus:outline-none capitalize"
                >
                  {Object.keys(userData.categories).filter(c => c !== 'work').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              <div className="pt-4 flex justify-end space-x-2">
                <button 
                  type="button" 
                  onClick={() => setIsAddingTask(false)}
                  className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 rounded-md bg-black text-white hover:bg-gray-800 font-mono"
                  style={{ fontFamily: "var(--font-dm-mono)" }}
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// User Settings Modal Component
function UserSettingsModal({ userData, setUserData, setWeekPlan, setCompletedTasks, onClose, activeTab, setActiveTab }) {
  
  const updateShiftSetting = (day, field, value) => {
    setUserData(prev => ({
      ...prev,
      shiftTimes: {
        ...prev.shiftTimes,
        [day]: {
          ...prev.shiftTimes[day],
          [field]: value
        }
      }
    }));
  };

  // Categories State
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState(PREDEFINED_COLORS[0].classes);

  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const key = newCatName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!key) return;

    setUserData(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [key]: newCatColor
      }
    }));
    setNewCatName("");
  };

  const handleDeleteCategory = (catKey) => {
    if (catKey === 'work') return; // protect work category
    if (!confirm(`Delete category "${catKey}"?`)) return;
    
    setUserData(prev => {
      const newCats = { ...prev.categories };
      delete newCats[catKey];
      return { ...prev, categories: newCats };
    });
  };

  // Templates State
  const [templateDay, setTemplateDay] = useState("Monday");
  const [newTemplateTaskTitle, setNewTemplateTaskTitle] = useState("");
  const [newTemplateTaskCategory, setNewTemplateTaskCategory] = useState(Object.keys(userData.categories)[0] || 'spirit');
  const [isTemplateWorkTask, setIsTemplateWorkTask] = useState(false);

  const handleUpdateTemplateGoal = (e) => {
    setUserData(prev => ({
      ...prev,
      weeklyTemplates: {
        ...prev.weeklyTemplates,
        [templateDay]: {
          ...prev.weeklyTemplates[templateDay],
          goal: e.target.value
        }
      }
    }));
  };

  const handleAddTemplateTask = (e) => {
    e.preventDefault();
    if (!newTemplateTaskTitle.trim()) return;

    const newTask = {
      id: `tmpl-${Date.now()}`,
      title: newTemplateTaskTitle.trim(),
      category: isTemplateWorkTask ? 'work' : newTemplateTaskCategory,
    };

    setUserData(prev => {
      const dayData = prev.weeklyTemplates[templateDay];
      const listKey = isTemplateWorkTask ? 'atWork' : 'tasks';
      return {
        ...prev,
        weeklyTemplates: {
          ...prev.weeklyTemplates,
          [templateDay]: {
            ...dayData,
            [listKey]: [...dayData[listKey], newTask]
          }
        }
      };
    });

    setNewTemplateTaskTitle("");
  };

  const handleDeleteTemplateTask = (taskId, isWorkTask) => {
    setUserData(prev => {
      const dayData = prev.weeklyTemplates[templateDay];
      const listKey = isWorkTask ? 'atWork' : 'tasks';
      return {
        ...prev,
        weeklyTemplates: {
          ...prev.weeklyTemplates,
          [templateDay]: {
            ...dayData,
            [listKey]: dayData[listKey].filter(t => t.id !== taskId)
          }
        }
      };
    });
  };

  const forceStartNewWeek = () => {
    if (confirm("Are you sure? This will wipe your current week's checked tasks and overwrite your active week with these templates.")) {
      setCompletedTasks(new Set());
      setWeekPlan(JSON.parse(JSON.stringify(userData.weeklyTemplates)));
      setUserData(prev => ({ ...prev, lastResetDate: new Date().toISOString() }));
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-2 sm:p-4 z-50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-xl w-full sm:w-[95%] max-w-3xl shadow-2xl my-4 sm:my-8 flex flex-col max-h-[95vh] sm:max-h-[90vh]">
        
        {/* Modal Header & Tabs */}
        <div className="px-4 sm:px-6 pt-4 sm:pt-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h3 className="text-xl sm:text-2xl font-bold" style={{ fontFamily: "var(--font-playfair)" }}>User Settings</h3>
            <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 hover:text-black rounded-full transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          
          <nav className="flex space-x-4 sm:space-x-6 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: 'profile', label: 'Profile' },
              { id: 'schedule', label: 'Shift Schedule' },
              { id: 'categories', label: 'Categories' },
              { id: 'templates', label: 'Weekly Templates' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 font-mono text-xs sm:text-sm border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.id 
                    ? 'border-black text-black font-bold' 
                    : 'border-transparent text-gray-500 hover:text-black'
                }`}
                style={{ fontFamily: "var(--font-dm-mono)" }}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Modal Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-grow">
          
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="space-y-6 max-w-lg">
              <p className="text-sm text-gray-500 mb-4 font-mono" style={{ fontFamily: "var(--font-dm-mono)" }}>
                Manage your personal details.
              </p>
              <div>
                <label className="block text-sm font-mono text-gray-600 mb-1" style={{ fontFamily: "var(--font-dm-mono)" }}>Name</label>
                <input 
                  type="text" 
                  value={userData.name}
                  onChange={(e) => setUserData({...userData, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-black focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-mono text-gray-600 mb-1" style={{ fontFamily: "var(--font-dm-mono)" }}>Base Location</label>
                <input 
                  type="text" 
                  value={userData.base}
                  onChange={(e) => setUserData({...userData, base: e.target.value})}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-black focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* SCHEDULE TAB */}
          {activeTab === 'schedule' && (
            <div className="space-y-4 max-w-xl">
              <p className="text-sm text-gray-500 mb-4 font-mono" style={{ fontFamily: "var(--font-dm-mono)" }}>
                Configure your working hours. This drives the countdown clock and At-Work task availability.
              </p>
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                <div key={day} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-3 sm:w-32">
                    <input 
                      type="checkbox"
                      checked={userData.shiftTimes[day].isWorking}
                      onChange={(e) => updateShiftSetting(day, 'isWorking', e.target.checked)}
                      className="w-4 h-4 text-black focus:ring-black border-gray-300 rounded cursor-pointer"
                    />
                    <span className={`text-sm font-mono ${userData.shiftTimes[day].isWorking ? 'text-black' : 'text-gray-400'}`} style={{ fontFamily: "var(--font-dm-mono)" }}>
                      {day}
                    </span>
                  </div>
                  
                  {userData.shiftTimes[day].isWorking ? (
                    <div className="flex flex-col sm:flex-row gap-2 flex-grow max-w-xs mt-2 sm:mt-0">
                      <input 
                        type="time" 
                        value={userData.shiftTimes[day].start}
                        onChange={(e) => updateShiftSetting(day, 'start', e.target.value)}
                        className="flex-1 border border-gray-300 rounded text-sm p-1.5 focus:ring-1 focus:ring-black focus:outline-none"
                      />
                      <span className="text-gray-400 self-center hidden sm:block">to</span>
                      <input 
                        type="time" 
                        value={userData.shiftTimes[day].end}
                        onChange={(e) => updateShiftSetting(day, 'end', e.target.value)}
                        className="flex-1 border border-gray-300 rounded text-sm p-1.5 focus:ring-1 focus:ring-black focus:outline-none"
                      />
                    </div>
                  ) : (
                    <div className="flex-grow max-w-xs text-sm text-gray-400 italic mt-2 sm:mt-0">Off Shift</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* CATEGORIES TAB */}
          {activeTab === 'categories' && (
            <div className="space-y-8 max-w-xl">
              <div>
                <p className="text-sm text-gray-500 mb-4 font-mono" style={{ fontFamily: "var(--font-dm-mono)" }}>
                  Manage the categories and colors you use to tag your tasks.
                </p>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {Object.entries(userData.categories).map(([key, classes]) => (
                    <div key={key} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-wide border ${classes}`}>
                      <span>{key}</span>
                      {key !== 'work' && (
                        <button onClick={() => handleDeleteCategory(key)} className="opacity-50 hover:opacity-100 ml-1">
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-bold font-mono text-sm mb-3">Add New Category</h4>
                <form onSubmit={handleAddCategory} className="space-y-4">
                  <div className="flex gap-4">
                    <input 
                      type="text" 
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder="Category name (e.g. Health)"
                      className="flex-1 border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-black focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-gray-500 mb-2 uppercase">Select Color</label>
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                      {PREDEFINED_COLORS.map(color => (
                        <button
                          key={color.name}
                          type="button"
                          onClick={() => setNewCatColor(color.classes)}
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 ${color.classes.split(' ')[0]} ${newCatColor === color.classes ? 'border-black scale-110 shadow-sm' : 'border-transparent opacity-70 hover:opacity-100'}`}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                  <button type="submit" className="px-4 py-2 bg-black text-white rounded-md text-sm font-mono w-full hover:bg-gray-800">
                    Add Category
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TEMPLATES TAB */}
          {activeTab === 'templates' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-b pb-4">
                <p className="text-xs sm:text-sm text-gray-500 font-mono" style={{ fontFamily: "var(--font-dm-mono)" }}>
                  Design the blueprint for your weeks.
                </p>
                <select 
                  value={templateDay}
                  onChange={(e) => setTemplateDay(e.target.value)}
                  className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-black font-mono text-sm bg-gray-50 w-full sm:w-auto"
                >
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-mono text-gray-600 mb-1 uppercase tracking-wide">Default Directive</label>
                  <input 
                    type="text" 
                    value={userData.weeklyTemplates[templateDay].goal}
                    onChange={handleUpdateTemplateGoal}
                    className="w-full border border-gray-300 rounded-md p-2 sm:p-3 focus:ring-2 focus:ring-black focus:outline-none italic text-base sm:text-lg"
                    style={{ fontFamily: "var(--font-playfair)" }}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4 sm:gap-6 pt-4">
                  
                  {/* Core Tasks Template */}
                  <div className="border rounded-xl p-3 sm:p-4 bg-white shadow-sm">
                    <h4 className="font-bold font-mono text-xs sm:text-sm mb-3">Default Core Tasks</h4>
                    <div className="space-y-2 mb-4 max-h-48 sm:max-h-60 overflow-y-auto pr-1">
                      {userData.weeklyTemplates[templateDay].tasks.map(task => (
                        <div key={task.id} className="flex justify-between items-center p-2 bg-gray-50 rounded border text-xs sm:text-sm">
                          <span className="truncate pr-2">{task.title}</span>
                          <button onClick={() => handleDeleteTemplateTask(task.id, false)} className="text-red-500 hover:text-red-700 flex-shrink-0 text-lg leading-none">×</button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* At Work Template */}
                  <div className="border rounded-xl p-3 sm:p-4 bg-green-50/50 shadow-sm border-green-100">
                    <h4 className="font-bold font-mono text-xs sm:text-sm mb-3 text-green-900">Default At-Work Tasks</h4>
                    <div className="space-y-2 mb-4 max-h-48 sm:max-h-60 overflow-y-auto pr-1">
                      {userData.weeklyTemplates[templateDay].atWork.map(task => (
                        <div key={task.id} className="flex justify-between items-center p-2 bg-white rounded border border-green-100 text-xs sm:text-sm">
                          <span className="truncate pr-2">{task.title}</span>
                          <button onClick={() => handleDeleteTemplateTask(task.id, true)} className="text-red-500 hover:text-red-700 flex-shrink-0 text-lg leading-none">×</button>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Add new default task form */}
                <form onSubmit={handleAddTemplateTask} className="flex flex-col sm:flex-row gap-2 sm:gap-3 bg-gray-50 p-3 sm:p-4 rounded-lg border mt-2">
                  <input 
                    type="text" 
                    value={newTemplateTaskTitle}
                    onChange={(e) => setNewTemplateTaskTitle(e.target.value)}
                    placeholder="New default task..."
                    className="flex-grow border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-black focus:outline-none"
                  />
                  <select 
                    value={isTemplateWorkTask ? 'work' : newTemplateTaskCategory}
                    onChange={(e) => {
                      if (e.target.value === 'work') {
                        setIsTemplateWorkTask(true);
                      } else {
                        setIsTemplateWorkTask(false);
                        setNewTemplateTaskCategory(e.target.value);
                      }
                    }}
                    className="border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-black capitalize bg-white w-full sm:w-auto"
                  >
                    <optgroup label="Placement">
                      <option value="work">At Work (Night Shift)</option>
                    </optgroup>
                    <optgroup label="Core Categories">
                      {Object.keys(userData.categories).filter(c => c !== 'work').map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </optgroup>
                  </select>
                  <button type="submit" className="px-4 py-2 bg-black text-white rounded-md text-sm font-mono w-full sm:w-auto hover:bg-gray-800">
                    Add Default
                  </button>
                </form>

                <div className="pt-6 border-t mt-8">
                  <h4 className="text-sm font-bold text-red-600 mb-2">Apply Templates</h4>
                  <p className="text-xs text-gray-500 mb-3 font-mono">
                    Changes to templates will automatically apply next week. Click below to forcefully apply them to your current week now.
                  </p>
                  <button 
                    onClick={forceStartNewWeek}
                    className="w-full py-2 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm font-mono hover:bg-red-100 transition-colors"
                    style={{ fontFamily: "var(--font-dm-mono)" }}
                  >
                    Force Start New Week (Wipe Current Data)
                  </button>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Shift Countdown Component
function ShiftCountdown({ shiftTimes, onSettingsClick }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      
      const yesterdayIndex = (now.getDay() - 1 + 7) % 7;
      const yesterdayName = DAYS_OF_WEEK[yesterdayIndex];
      const yesterdayShift = shiftTimes[yesterdayName];
      
      if (yesterdayShift && yesterdayShift.isWorking) {
        const [startH, startM] = yesterdayShift.start.split(":").map(Number);
        const [endH, endM] = yesterdayShift.end.split(":").map(Number);
        
        if (endH < startH) { 
          const shiftEnd = new Date(now);
          shiftEnd.setHours(endH, endM, 0, 0);
          if (now < shiftEnd) {
             const diffMs = shiftEnd - now;
             const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
             const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
             setStatus("Shift Active");
             setTimeLeft(`${diffHrs}h ${diffMins}m remaining`);
             return; 
          }
        }
      }

      const todayIndex = now.getDay();
      const todayName = DAYS_OF_WEEK[todayIndex];
      const todayShift = shiftTimes[todayName];

      if (todayShift && todayShift.isWorking) {
        const [startH, startM] = todayShift.start.split(":").map(Number);
        const [endH, endM] = todayShift.end.split(":").map(Number);
        
        const shiftStart = new Date(now);
        shiftStart.setHours(startH, startM, 0, 0);
        
        const shiftEnd = new Date(now);
        shiftEnd.setHours(endH, endM, 0, 0);
        if (endH < startH) shiftEnd.setDate(shiftEnd.getDate() + 1);

        if (now >= shiftStart && now < shiftEnd) {
           const diffMs = shiftEnd - now;
           const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
           const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
           setStatus("Shift Active");
           setTimeLeft(`${diffHrs}h ${diffMins}m remaining`);
           return;
        }
      }

      let nextShiftDate = null;
      let nextShiftDayName = "";

      for (let offset = 0; offset <= 7; offset++) {
        const checkDate = new Date(now);
        checkDate.setDate(now.getDate() + offset);
        const checkDayName = DAYS_OF_WEEK[checkDate.getDay()];
        const shift = shiftTimes[checkDayName];

        if (shift && shift.isWorking) {
          const [startH, startM] = shift.start.split(":").map(Number);
          const startDateTime = new Date(checkDate);
          startDateTime.setHours(startH, startM, 0, 0);

          if (startDateTime > now) {
            nextShiftDate = startDateTime;
            nextShiftDayName = checkDayName;
            break; 
          }
        }
      }

      if (nextShiftDate) {
        const diffMs = nextShiftDate - now;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHrs = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        setStatus(diffDays === 0 ? "Starts Today" : `Next Shift (${nextShiftDayName.substring(0,3)})`);
        
        if (diffDays > 0) {
          setTimeLeft(`In ${diffDays}d ${diffHrs}h ${diffMins}m`);
        } else {
          setTimeLeft(`In ${diffHrs}h ${diffMins}m`);
        }
      } else {
        setStatus("Off Schedule");
        setTimeLeft("No working days set");
      }
    };

    calculateTime();
    const timer = setInterval(calculateTime, 60000); 
    return () => clearInterval(timer);
  }, [shiftTimes]);

  const isShiftActive = status === "Shift Active";

  return (
    <div className={`relative group flex items-center justify-between p-6 rounded-xl border transition-all ${
      isShiftActive ? 'bg-green-50 border-green-200 text-green-900 shadow-md' : 'bg-white border-gray-200 text-gray-800 shadow-sm hover:shadow-md'
    }`}>
      <div className="flex items-center">
        <div className={`flex items-center justify-center w-12 h-12 rounded-full mr-4 ${isShiftActive ? 'bg-green-200 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-mono uppercase tracking-widest opacity-70 mb-1" style={{ fontFamily: "var(--font-dm-mono)" }}>
            {status}
          </span>
          <span className="text-2xl font-bold font-mono" style={{ fontFamily: "var(--font-dm-mono)" }}>
            {timeLeft}
          </span>
        </div>
      </div>
      
      <button 
        onClick={onSettingsClick}
        className={`opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full ${
          isShiftActive ? 'hover:bg-green-100 text-green-700' : 'hover:bg-gray-100 text-gray-400 hover:text-black'
        }`}
        title="Edit Shift Settings"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      </button>
    </div>
  );
}

function TaskRow({ task, isCompleted, onToggle, categoryOverride, onEdit, onDelete, categories }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);

  const cat = categoryOverride || task.category;
  const colorClass = categories[cat] || "bg-gray-100 text-gray-800 border-gray-200";

  const handleSave = () => {
    if (editTitle.trim() && editTitle !== task.title) {
      onEdit(editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditTitle(task.title);
      setIsEditing(false);
    }
  };

  return (
    <div className={`
      flex items-center p-4 rounded-lg border group transition-all relative
      ${isCompleted ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'}
    `}>
      <input 
        type="checkbox" 
        checked={isCompleted}
        onChange={onToggle}
        className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black cursor-pointer flex-shrink-0" 
      />
      
      {isEditing ? (
        <input 
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="ml-4 flex-grow text-lg bg-transparent border-b border-gray-400 focus:border-black focus:outline-none"
          autoFocus
        />
      ) : (
        <span className={`ml-4 flex-grow text-lg truncate ${isCompleted ? 'line-through text-gray-400' : 'text-gray-900'}`}>
          {task.title}
        </span>
      )}
      
      <span className={`ml-4 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wide border whitespace-nowrap ${colorClass}`} style={{ fontFamily: "var(--font-dm-mono)" }}>
        {task.category}
      </span>

      {!isEditing && (
        <div className="absolute right-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur px-2 py-1 rounded-md shadow-sm">
          <button 
            onClick={() => setIsEditing(true)}
            className="p-1 text-gray-400 hover:text-black transition-colors"
            title="Edit task"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button 
            onClick={onDelete}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            title="Delete task"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18"></path>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
