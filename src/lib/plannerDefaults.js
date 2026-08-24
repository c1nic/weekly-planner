export const PREDEFINED_COLORS = [
  { name: "Purple", classes: "bg-purple-100 text-purple-800 border-purple-200" },
  { name: "Blue", classes: "bg-blue-100 text-blue-800 border-blue-200" },
  { name: "Red", classes: "bg-red-100 text-red-800 border-red-200" },
  { name: "Yellow", classes: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  { name: "Emerald", classes: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { name: "Gray", classes: "bg-gray-100 text-gray-800 border-gray-200" },
  { name: "Green", classes: "bg-green-100 text-green-800 border-green-300" },
  { name: "Pink", classes: "bg-pink-100 text-pink-800 border-pink-200" },
  { name: "Orange", classes: "bg-orange-100 text-orange-800 border-orange-200" },
  { name: "Indigo", classes: "bg-indigo-100 text-indigo-800 border-indigo-200" },
];

export const INITIAL_CATEGORIES = {
  spirit: "bg-purple-100 text-purple-800 border-purple-200",
  fitness: "bg-blue-100 text-blue-800 border-blue-200",
  youtube: "bg-red-100 text-red-800 border-red-200",
  study: "bg-yellow-100 text-yellow-800 border-yellow-200",
  finance: "bg-emerald-100 text-emerald-800 border-emerald-200",
  rest: "bg-gray-100 text-gray-800 border-gray-200",
  work: "bg-green-100 text-green-800 border-green-300",
};

export const INITIAL_WEEK_PLAN = {
  Monday: {
    tasks: [
      { id: "mon-1", title: "Read (45 min)", category: "spirit" },
      { id: "mon-2", title: "Pray", category: "spirit" },
      { id: "mon-3", title: "First draft finished (YouTube)", category: "youtube" },
      { id: "mon-4", title: "Vlog footage capture (30 min)", category: "youtube" },
      { id: "mon-5", title: "Structured Training", category: "fitness" },
    ],
    atWork: [{ id: "mon-w1", title: "Duolingo French", category: "study" }],
    goal: "Start the week strong. First draft must be done.",
  },
  Tuesday: {
    tasks: [
      { id: "tue-1", title: "Read (45 min)", category: "spirit" },
      { id: "tue-2", title: "Pray", category: "spirit" },
      { id: "tue-3", title: "Final Script", category: "youtube" },
      { id: "tue-4", title: "Put script in teleprompter", category: "youtube" },
      { id: "tue-5", title: "Shot & Footage list", category: "youtube" },
      { id: "tue-6", title: "Vlog footage capture (30 min)", category: "youtube" },
      { id: "tue-7", title: "Structured Training", category: "fitness" },
    ],
    atWork: [{ id: "tue-w1", title: "Duolingo French", category: "study" }],
    goal: "Lock down the script.",
  },
  Wednesday: {
    tasks: [
      { id: "wed-1", title: "Read (45 min)", category: "spirit" },
      { id: "wed-2", title: "Pray", category: "spirit" },
      { id: "wed-3", title: "Record A-roll", category: "youtube" },
      { id: "wed-4", title: "Collect footage together", category: "youtube" },
      { id: "wed-5", title: "Vlog footage capture (30 min)", category: "youtube" },
      { id: "wed-6", title: "Structured Training", category: "fitness" },
    ],
    atWork: [{ id: "wed-w1", title: "Duolingo French", category: "study" }],
    goal: "Get on camera.",
  },
  Thursday: {
    tasks: [
      { id: "thu-1", title: "Read (45 min)", category: "spirit" },
      { id: "thu-2", title: "Pray", category: "spirit" },
      { id: "thu-3", title: "Edit Video (70 min window)", category: "youtube" },
      { id: "thu-4", title: "Thumbnail & Description", category: "youtube" },
      { id: "thu-5", title: "Upload & Schedule", category: "youtube" },
      { id: "thu-6", title: "Vlog footage capture (30 min)", category: "youtube" },
    ],
    atWork: [{ id: "thu-w1", title: "Duolingo French", category: "study" }],
    goal: "Edit like a demon. Time is tight today.",
  },
  Friday: {
    tasks: [
      { id: "fri-1", title: "Read (45 min)", category: "spirit" },
      { id: "fri-2", title: "Pray", category: "spirit" },
      { id: "fri-3", title: "French Lesson (11:30am)", category: "study" },
      { id: "fri-4", title: "Publish YouTube Video (3 PM)", category: "youtube" },
      { id: "fri-5", title: "Monitor Comments", category: "youtube" },
      { id: "fri-6", title: "Vlog footage capture (30 min)", category: "youtube" },
    ],
    atWork: [{ id: "fri-w1", title: "Duolingo French", category: "study" }],
    goal: "Publish day. Engage with the audience.",
  },
  Saturday: {
    tasks: [
      { id: "sat-1", title: "Read (45 min)", category: "spirit" },
      { id: "sat-2", title: "Pray", category: "spirit" },
      { id: "sat-3", title: "Review Performance (What worked/didn't)", category: "youtube" },
      { id: "sat-4", title: "Adjust next week's title/thumbnail", category: "youtube" },
      { id: "sat-5", title: "Vlog footage capture (30 min)", category: "youtube" },
      { id: "sat-6", title: "Structured Training", category: "fitness" },
    ],
    atWork: [],
    goal: "Review and recover.",
  },
  Sunday: {
    tasks: [
      { id: "sun-1", title: "Read (45 min)", category: "spirit" },
      { id: "sun-2", title: "Pray", category: "spirit" },
      { id: "sun-3", title: "Church", category: "spirit" },
      { id: "sun-4", title: "Football Match", category: "fitness" },
      { id: "sun-5", title: "Canada PR Checkpoint", category: "study" },
      { id: "sun-6", title: "Growth & Savings Check-in", category: "finance" },
      { id: "sun-7", title: "Research next documentary", category: "youtube" },
      { id: "sun-8", title: "Vlog footage capture (30 min)", category: "youtube" },
    ],
    atWork: [],
    goal: "Rest, reflect, and prepare.",
  },
};

export const DEFAULT_SHIFT_TIMES = {
  Monday: { start: "20:00", end: "08:00", isWorking: true },
  Tuesday: { start: "20:00", end: "08:00", isWorking: true },
  Wednesday: { start: "20:00", end: "08:00", isWorking: true },
  Thursday: { start: "20:00", end: "08:00", isWorking: true },
  Friday: { start: "20:00", end: "08:00", isWorking: true },
  Saturday: { start: "20:00", end: "08:00", isWorking: false },
  Sunday: { start: "20:00", end: "08:00", isWorking: false },
};

export const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function createDefaultUserData(name = "User", base = "") {
  return {
    name,
    base,
    categories: { ...INITIAL_CATEGORIES },
    weeklyTemplates: JSON.parse(JSON.stringify(INITIAL_WEEK_PLAN)),
    lastResetDate: new Date().toISOString(),
    shiftTimes: { ...DEFAULT_SHIFT_TIMES },
  };
}

export function isEmptyWeekPlan(weekPlan) {
  if (!weekPlan || typeof weekPlan !== "object") return true;
  return Object.keys(weekPlan).length === 0;
}
