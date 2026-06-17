export type LevelKey = "debutant" | "intermediaire" | "avance";

export type AuthUser = {
  id?: string | number;
  username: string;
  email: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthResponse = {
  access: string;
  refresh: string;
  user?: AuthUser;
  profile_id?: number;
  profile?: {
    name?: string;
    email?: string;
  };
};

export type ApiErrorPayload = {
  detail?: string;
  message?: string;
  non_field_errors?: string[];
  [key: string]: unknown;
};

export type DeviceStatus = {
  device_name: string;
  battery_pct: number;
  signal_level?: string;
  connected: boolean;
};

export type DashboardSession = {
  id: number;
  title: string;
  duration: string;
  level: string;
  color: string;
};

export type DashboardTip = {
  id: number;
  text: string;
  icon: string;
};

export type DashboardResponse = {
  first_name?: string;
  profile_name?: string;
  level?: { label: string };
  streak_days: number;
  sessions_this_week: number;
  total_seconds: number;
  total_time_formatted: string;
  objective_percent: number;
  upcoming_sessions: DashboardSession[];
  tips: DashboardTip[];
  device: DeviceStatus;
};

export type Exercise = {
  id: number;
  name: string;
  description: string;
  icon: string;
  duration_minutes: number;
  timer_duration_seconds: number;
};

export type TrainingLevel = {
  key: LevelKey;
  label: string;
  color: string;
  sessions: number;
};

export type TrainingProgramResponse = {
  levels: TrainingLevel[];
  selected_level: {
    key: LevelKey;
    label: string;
    color: string;
  };
  exercises: Exercise[];
  summary: {
    total_duration_minutes: number;
    total_duration_seconds: number;
    exercises_count: number;
    objective_percent: number;
  };
};

export type WeeklyStat = {
  day: string;
  value: number;
};

export type Achievement = {
  id: number;
  code?: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  progress?: number;
  target?: number;
  percent?: number;
};

export type HistoryItem = {
  id: number;
  date: string;
  duration: string;
  exercises: number;
  level: string;
};

export type ProgressResponse = {
  overall: {
    sessions_total: number;
    streak_days: number;
    time_total_seconds: number;
    time_total_formatted: string;
    badges_count: number;
    xp?: number;
  };
  weekly: {
    data: WeeklyStat[];
    max_value: number;
  };
  monthly_goal: {
    done: number;
    target: number;
    remaining: number;
    percent: number;
  };
  achievements: Achievement[];
  history: HistoryItem[];
};

export type ProfileInfoItem = {
  label: string;
  value: string;
};

export type ProfileResponse = {
  onboarding_completed?: boolean;
  has_probe?: boolean | null;
  profile_fields?: {
    name: string;
    age: number;
    objective: string;
    level_key: LevelKey;
    training_frequency: string;
    symptoms: string[];
    birth_context: string;
    has_probe: boolean | null;
    health_notes: string;
    monthly_goal_sessions_target: number;
  };
  personalInfo: ProfileInfoItem[];
  stats: {
    sessions_total: number;
    time_total_seconds?: number;
    time_total_formatted: string;
    streak_days: number;
    badges_count: number;
    xp?: number;
  };
  settings: {
    reminders: boolean;
    notifications: boolean;
    darkMode: boolean;
  };
  device: DeviceStatus;
  level: {
    key?: LevelKey;
    label: string;
  };
};

export type ProfileUpdatePayload = {
  name?: string;
  age?: number;
  objective?: string;
  level_key?: LevelKey;
  training_frequency?: string;
  symptoms?: string[];
  birth_context?: string;
  has_probe?: boolean;
  health_notes?: string;
  monthly_goal_sessions_target?: number;
  onboarding_completed?: boolean;
  reminders?: boolean;
  notifications?: boolean;
  darkMode?: boolean;
};
