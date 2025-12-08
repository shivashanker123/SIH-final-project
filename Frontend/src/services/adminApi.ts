// Admin Dashboard API functions
// Separated into its own file to avoid module resolution issues

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export interface DashboardStats {
  total_students: number;
  active_sessions: number;
  pending_alerts: number;
  high_risk_cases: number;
}

export interface MonthlyWellnessData {
  month: string;
  overall: number;
  anxiety: number;
  depression: number;
  stress: number;
  satisfaction: number;
}

export interface DailyWellnessData {
  day: string;
  score: number;
  sessions: number;
}

// Get dashboard statistics
export function getDashboardStats(): Promise<DashboardStats> {
  return fetch(`${API_BASE_URL}/admin/stats`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }
      return response.json();
    });
}

// Get monthly wellness trends
export function getMonthlyWellness(months: number = 6): Promise<MonthlyWellnessData[]> {
  return fetch(`${API_BASE_URL}/admin/wellness/monthly?months=${months}`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch monthly wellness data');
      }
      return response.json();
    });
}

// Get daily wellness trends
export function getDailyWellness(days: number = 7): Promise<DailyWellnessData[]> {
  return fetch(`${API_BASE_URL}/admin/wellness/daily?days=${days}`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch daily wellness data');
      }
      return response.json();
    });
}

