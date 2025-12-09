/**
 * Admin Dashboard Component
 * 
 * This component displays the admin dashboard with:
 * - Recent alerts from students
 * - Statistics cards (Total Students, Active Sessions, etc.)
 * - Monthly and daily wellness trend graphs
 * 
 * IMPLEMENTATION NOTES:
 * - All mock data has been removed and replaced with empty state arrays
 * - Data type templates are defined above for reference
 * - TODO: Implement real API calls in useEffect to populate data
 * - UI components handle empty states gracefully with "Data not available" messages
 * 
 * To implement real data:
 * 1. Uncomment and implement API calls in the useEffect hook
 * 2. Transform API responses to match the type templates
 * 3. Update state variables with real data
 * 4. Remove placeholder "Data not available" messages if desired
 */

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Community } from '@/components/Community';
import { StudentProvider } from '@/contexts/StudentContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Users, 
  ClipboardList, 
  BarChart3, 
  AlertTriangle, 
  TrendingUp,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  MessageSquare
} from 'lucide-react';
import { ShimmerCard } from '@/components/LoadingSpinner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { getPendingAlerts, getOutcomeSummary } from '@/services/api';
import { getDashboardStats, getMonthlyWellness, getDailyWellness } from '@/services/adminApi';

// ============================================================================
// DATA TYPE TEMPLATES - Replace with real API calls
// ============================================================================

/**
 * Stats Card Data Template
 * Expected format:
 * {
 *   title: string,        // e.g., "Total Students"
 *   value: string,        // e.g., "1,234" (formatted number)
 *   change: string,       // e.g., "+12%" or "-5%"
 *   icon: ReactComponent, // Lucide icon component
 *   color: string         // Tailwind color class
 * }
 */
type StatCard = {
  title: string;
  value: string;
  change: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
};

/**
 * Alert Data Template
 * Expected format (from getPendingAlerts API):
 * {
 *   id: number,
 *   student_id: string,
 *   studentName: string,
 *   type: string,         // e.g., "Crisis Keywords", "High Risk Score"
 *   severity: string,     // "Critical" | "High" | "Medium" | "Low"
 *   message: string,
 *   status: string,       // "Unread" | "In Review" | "Acknowledged" | "Read"
 *   triggeredAt: string,  // ISO date string
 *   actionRequired: string
 * }
 */
type AlertData = {
  id: number;
  student_id: string;
  studentName: string;
  type: string;
  severity: string;
  message: string;
  status: string;
  triggeredAt: string;
  actionRequired: string;
};

/**
 * Monthly Wellness Data Template
 * Expected format:
 * {
 *   month: string,        // "Jan", "Feb", etc.
 *   overall: number,      // Overall wellness score (0-100)
 *   anxiety: number,      // Anxiety score (0-100)
 *   depression: number,   // Depression score (0-100)
 *   stress: number,       // Stress score (0-100)
 *   satisfaction: number  // Satisfaction score (0-100)
 * }
 */
type MonthlyWellnessData = {
  month: string;
  overall: number;
  anxiety: number;
  depression: number;
  stress: number;
  satisfaction: number;
};

/**
 * Daily Wellness Data Template
 * Expected format:
 * {
 *   day: string,          // "Mon", "Tue", etc.
 *   score: number,         // Daily wellness score (0-100)
 *   sessions: number       // Number of counseling sessions
 * }
 */
type DailyWellnessData = {
  day: string;
  score: number;
  sessions: number;
};

export const AdminDashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCommunityMode, setIsCommunityMode] = useState(false);
  
  // ============================================================================
  // STATE VARIABLES - Replace with real API data
  // ============================================================================
  
  // Stats cards data - TODO: Fetch from API endpoint (e.g., /api/admin/stats)
  const [stats, setStats] = useState<StatCard[]>([]);
  
  // Recent alerts - TODO: Use getPendingAlerts() from api.ts
  const [recentAlerts, setRecentAlerts] = useState<AlertData[]>([]);
  
  // Monthly wellness trends - TODO: Fetch from API endpoint (e.g., /api/analytics/wellness/monthly)
  const [wellnessData, setWellnessData] = useState<MonthlyWellnessData[]>([]);
  
  // Daily wellness data - TODO: Fetch from API endpoint (e.g., /api/analytics/wellness/daily)
  const [dailyWellnessData, setDailyWellnessData] = useState<DailyWellnessData[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      // Set a timeout to ensure loading state is always cleared
      const timeoutId = setTimeout(() => {
        console.warn('Dashboard data fetch timeout - clearing loading state');
        setIsLoading(false);
      }, 8000); // 8 second safety timeout

      try {
        setIsLoading(true);
        
        // Fetch all data in parallel with individual error handling
        const [alertsResult, statsResult, monthlyResult, dailyResult] = await Promise.allSettled([
          getPendingAlerts(10).catch(err => {
            console.error('Error fetching alerts:', err);
            return [];
          }),
          getDashboardStats().catch(err => {
            console.error('Error fetching dashboard stats:', err);
            return null;
          }),
          getMonthlyWellness(6).catch(err => {
            console.error('Error fetching monthly wellness:', err);
            return [];
          }),
          getDailyWellness(7).catch(err => {
            console.error('Error fetching daily wellness:', err);
            return [];
          })
        ]);

        // Process alerts
        if (alertsResult.status === 'fulfilled') {
          setRecentAlerts(alertsResult.value);
        } else {
          setRecentAlerts([]);
        }

        // Process stats
        if (statsResult.status === 'fulfilled' && statsResult.value) {
          const statsData = statsResult.value;
          const statsCards: StatCard[] = [
            {
              title: "Total Students",
              value: statsData.total_students.toString(),
              change: "+0%",
              icon: Users,
              color: "text-blue-600"
            },
            {
              title: "Active Sessions",
              value: statsData.active_sessions.toString(),
              change: "+0%",
              icon: Calendar,
              color: "text-green-600"
            },
            {
              title: "Pending Alerts",
              value: statsData.pending_alerts.toString(),
              change: "+0%",
              icon: Clock,
              color: "text-orange-600"
            },
            {
              title: "High-Risk Cases",
              value: statsData.high_risk_cases.toString(),
              change: "+0%",
              icon: AlertTriangle,
              color: "text-red-600"
            }
          ];
          setStats(statsCards);
        }

        // Process wellness data
        if (monthlyResult.status === 'fulfilled') {
          setWellnessData(monthlyResult.value);
        } else {
          setWellnessData([]);
        }

        if (dailyResult.status === 'fulfilled') {
          setDailyWellnessData(dailyResult.value);
        } else {
          setDailyWellnessData([]);
        }
        
        clearTimeout(timeoutId);
        setIsLoading(false);
      } catch (error: any) {
        console.error('Error fetching dashboard data:', error);
        setError(error?.message || 'Failed to load dashboard data');
        clearTimeout(timeoutId);
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Error boundary - show error message if critical error
  if (error && !isLoading) {
    return (
      <DashboardLayout userType="admin">
        <div className="space-y-8 animate-fade-in">
          <Card className="glass-card border-0">
            <CardHeader>
              <CardTitle className="text-red-500">Error Loading Dashboard</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout userType="admin">
        <div className="space-y-8">
          <ShimmerCard className="h-32" />
          <div className="grid md:grid-cols-4 gap-6">
            <ShimmerCard />
            <ShimmerCard />
            <ShimmerCard />
            <ShimmerCard />
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <ShimmerCard />
            <ShimmerCard />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show community mode if toggled
  if (isCommunityMode) {
    // Ensure admin data is available for community
    const adminEmail = localStorage.getItem('admin_email');
    const adminId = localStorage.getItem('admin_id');
    const adminToken = localStorage.getItem('admin_token');
    if (adminEmail && adminId && adminToken) {
      // Store admin info for community access
      localStorage.setItem('admin_community_mode', 'true');
      // Set studentId in localStorage so Community component can access it
      localStorage.setItem('studentId', adminId);
      console.log('🔧 AdminDashboard: Set admin community mode', {
        adminId,
        adminEmail,
        adminToken: !!adminToken,
        adminCommunityMode: 'true'
      });
    } else {
      console.error('❌ AdminDashboard: Missing admin credentials', {
        adminEmail: !!adminEmail,
        adminId: !!adminId,
        adminToken: !!adminToken
      });
    }
    // Wrap Community in StudentProvider so useStudent hook works
    return (
      <StudentProvider>
        <Community onToggle={() => {
          // Cleanup admin community mode flags when exiting
          localStorage.removeItem('admin_community_mode');
          // Restore studentId if it was overwritten by admin ID
          const studentToken = localStorage.getItem('student_token');
          const adminId = localStorage.getItem('admin_id');
          const storedStudentId = localStorage.getItem('studentId');
          if (storedStudentId === adminId && studentToken) {
            // If studentId was set to admin ID but student token exists, clear it
            // The StudentContext will restore the correct student ID
            localStorage.removeItem('studentId');
          }
          setIsCommunityMode(false);
        }} />
      </StudentProvider>
    );
  }

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-8 animate-fade-in">
        {/* Welcome Header with Community Toggle */}
        <div className="glass-card p-8 text-center tilt-card relative">
          <div className="absolute top-4 right-4 flex items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-700/30 px-4 py-2 rounded-lg border border-gray-600/50">
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              <Label htmlFor="community-toggle" className="text-sm font-medium text-white cursor-pointer">
                Student Community
              </Label>
              <Switch
                id="community-toggle"
                checked={isCommunityMode}
                onCheckedChange={setIsCommunityMode}
                className="data-[state=checked]:bg-cyan-500"
              />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-wellness-serene to-wellness-peaceful bg-clip-text text-transparent mb-4">
            Wellness Analytics Dashboard
          </h1>
          <p className="text-xl text-muted-foreground">
            Monitor student wellness trends and manage counseling services
          </p>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Recent Alerts */}
            <Card className="glass-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Recent Alerts
                </CardTitle>
                <CardDescription>
                  High-priority notifications requiring immediate attention
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentAlerts.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No alerts at this time</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Alerts will appear here when students trigger risk assessments
                    </p>
                  </div>
                ) : (
                  <>
                    {recentAlerts.map((alert) => (
                      <div 
                        key={alert.id} 
                        className="flex items-start gap-3 p-4 rounded-lg hover:bg-white/20 transition-colors duration-300 border border-white/10"
                      >
                        <div className={`w-3 h-3 rounded-full mt-2 ${
                          alert.severity === 'Critical' ? 'bg-red-500' :
                          alert.severity === 'High' ? 'bg-orange-500' : 
                          alert.severity === 'Medium' ? 'bg-yellow-500' : 'bg-blue-500'
                        } animate-pulse-gentle`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm">{alert.studentName || alert.student_id}</p>
                            <Badge variant={alert.severity === 'Critical' || alert.severity === 'High' ? 'destructive' : 'secondary'} className="text-xs">
                              {alert.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">{alert.message}</p>
                          <p className="text-xs text-muted-foreground">{alert.triggeredAt}</p>
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="glass-card border-0">
                            <DialogHeader>
                              <DialogTitle>Alert Details - {alert.studentName || alert.student_id}</DialogTitle>
                              <DialogDescription>
                                Severity: <Badge variant={alert.severity === 'Critical' || alert.severity === 'High' ? 'destructive' : 'secondary'}>{alert.severity}</Badge>
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-medium mb-2">Summary</h4>
                                <p className="text-sm text-muted-foreground">{alert.message}</p>
                              </div>
                              <div>
                                <h4 className="font-medium mb-2">Action Required</h4>
                                <p className="text-sm text-muted-foreground">{alert.actionRequired}</p>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" className="btn-primary">Take Action</Button>
                                <Button size="sm" variant="outline">Schedule Follow-up</Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    ))}
                    <Button className="w-full btn-glass" onClick={() => window.location.href = '/admin-dashboard/alerts'}>
                      View All Alerts
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Wellness Graphs */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Dialog>
                <DialogTrigger asChild>
                  <Card className="glass-card border-0 cursor-pointer hover:shadow-2xl transition-all duration-500">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-blue-500" />
                        Monthly Wellness Trends
                      </CardTitle>
                      <CardDescription>
                        Overall wellness scores over the past 6 months
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {wellnessData.length === 0 ? (
                        <div className="h-[200px] flex items-center justify-center">
                          <p className="text-muted-foreground text-sm">Monthly wellness data not available</p>
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height={200}>
                          <LineChart data={wellnessData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="month" stroke="rgba(255,255,255,0.7)" />
                            <YAxis stroke="rgba(255,255,255,0.7)" />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'rgba(255,255,255,0.1)', 
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '8px',
                                backdropFilter: 'blur(10px)'
                              }} 
                            />
                            <Line type="monotone" dataKey="overall" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6' }} />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent className="glass-card border-0 max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Detailed Wellness Analytics</DialogTitle>
                    <DialogDescription>
                      Comprehensive view of student wellness trends and patterns
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6">
                    {wellnessData.length === 0 ? (
                      <div className="h-[400px] flex items-center justify-center">
                        <p className="text-muted-foreground">Monthly wellness data not available</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={400}>
                        <AreaChart data={wellnessData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                          <XAxis dataKey="month" stroke="rgba(255,255,255,0.7)" />
                          <YAxis stroke="rgba(255,255,255,0.7)" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(255,255,255,0.1)', 
                              border: '1px solid rgba(255,255,255,0.2)',
                              borderRadius: '8px',
                              backdropFilter: 'blur(10px)'
                            }} 
                          />
                          <Area type="monotone" dataKey="anxiety" stackId="1" stroke="#ef4444" fill="rgba(239,68,68,0.3)" />
                          <Area type="monotone" dataKey="depression" stackId="1" stroke="#f59e0b" fill="rgba(245,158,11,0.3)" />
                          <Area type="monotone" dataKey="stress" stackId="1" stroke="#8b5cf6" fill="rgba(139,92,246,0.3)" />
                          <Area type="monotone" dataKey="satisfaction" stackId="1" stroke="#10b981" fill="rgba(16,185,129,0.3)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <Card className="glass-card border-0 cursor-pointer hover:shadow-2xl transition-all duration-500">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-green-500" />
                        Daily Wellness Score
                      </CardTitle>
                      <CardDescription>
                        Weekly wellness patterns and session activity
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {dailyWellnessData.length === 0 ? (
                        <div className="h-[200px] flex items-center justify-center">
                          <p className="text-muted-foreground text-sm">Daily wellness data not available</p>
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height={200}>
                          <LineChart data={dailyWellnessData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="day" stroke="rgba(255,255,255,0.7)" />
                            <YAxis stroke="rgba(255,255,255,0.7)" />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'rgba(255,255,255,0.1)', 
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '8px',
                                backdropFilter: 'blur(10px)'
                              }} 
                            />
                            <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', strokeWidth: 2 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent className="glass-card border-0 max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Weekly Wellness Analysis</DialogTitle>
                    <DialogDescription>
                      Daily breakdown of wellness scores and counseling session activity
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6">
                    {dailyWellnessData.length === 0 ? (
                      <div className="h-[300px] flex items-center justify-center">
                        <p className="text-muted-foreground">Daily wellness data not available</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <ResponsiveContainer width="100%" height={300}>
                          <AreaChart data={dailyWellnessData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="day" stroke="rgba(255,255,255,0.7)" />
                            <YAxis stroke="rgba(255,255,255,0.7)" />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'rgba(255,255,255,0.1)', 
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '8px',
                                backdropFilter: 'blur(10px)'
                              }} 
                            />
                            <Area type="monotone" dataKey="score" stroke="#10b981" fill="rgba(16,185,129,0.3)" />
                          </AreaChart>
                        </ResponsiveContainer>
                        <ResponsiveContainer width="100%" height={300}>
                          <AreaChart data={dailyWellnessData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="day" stroke="rgba(255,255,255,0.7)" />
                            <YAxis stroke="rgba(255,255,255,0.7)" />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'rgba(255,255,255,0.1)', 
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '8px',
                                backdropFilter: 'blur(10px)'
                              }} 
                            />
                            <Area type="monotone" dataKey="sessions" stroke="#3b82f6" fill="rgba(59,130,246,0.3)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Stats Grid - Moved Below Graphs */}
            <div className="grid md:grid-cols-4 gap-6">
              {stats.length === 0 ? (
                // Default stat cards template - TODO: Replace with real data
                <>
                  <Card className="glass-card border-0 tilt-card hover:shadow-2xl transition-all duration-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                      <Users className="h-5 w-5 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-blue-600 mb-1">--</div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        <span className="text-muted-foreground">Data not available</span>
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="glass-card border-0 tilt-card hover:shadow-2xl transition-all duration-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                      <Calendar className="h-5 w-5 text-green-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-600 mb-1">--</div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        <span className="text-muted-foreground">Data not available</span>
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="glass-card border-0 tilt-card hover:shadow-2xl transition-all duration-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Pending Alerts</CardTitle>
                      <Clock className="h-5 w-5 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-orange-600 mb-1">--</div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        <span className="text-muted-foreground">Data not available</span>
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="glass-card border-0 tilt-card hover:shadow-2xl transition-all duration-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">High-Risk Cases</CardTitle>
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-red-600 mb-1">--</div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        <span className="text-muted-foreground">Data not available</span>
                      </p>
                    </CardContent>
                  </Card>
                </>
              ) : (
                stats.map((stat, index) => (
                  <Card 
                    key={stat.title} 
                    className="glass-card border-0 tilt-card hover:shadow-2xl transition-all duration-500"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </CardHeader>
                    <CardContent>
                      <div className={`text-3xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {stat.change} from last month
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card className="glass-card border-0">
              <CardHeader>
                <CardTitle>Advanced Analytics</CardTitle>
                <CardDescription>
                  Detailed wellness metrics and predictive insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Advanced analytics coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card className="glass-card border-0">
              <CardHeader>
                <CardTitle>Generated Reports</CardTitle>
                <CardDescription>
                  Export and download wellness reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <ClipboardList className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Report generation coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};