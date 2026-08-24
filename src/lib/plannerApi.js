import {
  createDefaultUserData,
  INITIAL_WEEK_PLAN,
  isEmptyWeekPlan,
} from "@/lib/plannerDefaults";

function mapProfileToState(profile) {
  const defaults = createDefaultUserData(profile.name, profile.base);
  const userData = {
    name: profile.name || defaults.name,
    base: profile.base || defaults.base,
    categories:
      profile.categories && Object.keys(profile.categories).length > 0
        ? profile.categories
        : defaults.categories,
    weeklyTemplates: !isEmptyWeekPlan(profile.weekly_templates)
      ? profile.weekly_templates
      : defaults.weeklyTemplates,
    lastResetDate: profile.last_reset_date || defaults.lastResetDate,
    shiftTimes:
      profile.shift_times && Object.keys(profile.shift_times).length > 0
        ? profile.shift_times
        : defaults.shiftTimes,
  };

  const weekPlan = !isEmptyWeekPlan(profile.week_plan)
    ? profile.week_plan
    : JSON.parse(JSON.stringify(userData.weeklyTemplates));

  return {
    userData,
    weekPlan,
    completedTasks: new Set(profile.completed_tasks || []),
  };
}

export async function loadPlannerData(supabase, userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    const defaults = createDefaultUserData();
    const profile = {
      id: userId,
      name: defaults.name,
      base: defaults.base,
      last_reset_date: defaults.lastResetDate,
      categories: defaults.categories,
      shift_times: defaults.shiftTimes,
      weekly_templates: defaults.weeklyTemplates,
      week_plan: JSON.parse(JSON.stringify(INITIAL_WEEK_PLAN)),
      completed_tasks: [],
    };

    const { error: insertError } = await supabase.from("profiles").insert(profile);
    if (insertError) throw insertError;

    return mapProfileToState(profile);
  }

  return mapProfileToState(data);
}

export async function savePlannerData(supabase, userId, { userData, weekPlan, completedTasks }) {
  const { error } = await supabase
    .from("profiles")
    .update({
      name: userData.name,
      base: userData.base,
      last_reset_date: userData.lastResetDate,
      categories: userData.categories,
      shift_times: userData.shiftTimes,
      weekly_templates: userData.weeklyTemplates,
      week_plan: weekPlan,
      completed_tasks: Array.from(completedTasks),
    })
    .eq("id", userId);

  if (error) throw error;
}
