import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  Eye
} from 'lucide-react';
import { ShimmerCard } from '@/components/LoadingSpinner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export const AdminDashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const stats = [
    { title: 'Total Students', value: '1,234', change: '+12%', icon: Users, color: 'text-blue-600' },
    { title: 'Active Sessions', value: '89', change: '+5%', icon: Calendar, color: 'text-green-600' },
    { title: 'Pending Requests', value: '23', change: '-8%', icon: Clock, color: 'text-orange-600' },
    { title: 'High-Risk Cases', value: '7', change: '+2', icon: AlertTriangle, color: 'text-red-600' },
  ];

  const recentAlerts = [
    { id: 1, student: 'Student A', severity: 'high', message: 'Screening test indicates high stress levels', time: '10 min ago', description: 'Student A has shown consistent patterns of high stress over the past 2 weeks. Recent screening test scores indicate anxiety levels at 85% and depression indicators at 72%. Recommended immediate intervention with counseling sessions and stress management techniques.' },
    { id: 2, student: 'Student B', severity: 'medium', message: 'Missed 3 consecutive appointments', time: '1 hour ago', description: 'Student B has failed to attend scheduled counseling sessions for the past 3 weeks. This pattern suggests possible avoidance behavior or external barriers preventing attendance. Follow-up contact recommended to assess current status and reschedule appropriately.' },
    { id: 3, student: 'Student C', severity: 'low', message: 'Requested additional resources', time: '2 hours ago', description: 'Student C has proactively requested access to additional mental health resources including mindfulness apps and stress management workshops. This positive engagement indicates good self-awareness and motivation for self-care improvement.' },
  ];

  // Wellness data for graphs
  const wellnessData = [
    { month: 'Jan', overall: 72, anxiety: 65, depression: 58, stress: 70, satisfaction: 78 },
    { month: 'Feb', overall: 68, anxiety: 72, depression: 62, stress: 75, satisfaction: 74 },
    { month: 'Mar', overall: 75, anxiety: 68, depression: 55, stress: 68, satisfaction: 82 },
    { month: 'Apr', overall: 78, anxiety: 63, depression: 52, stress: 65, satisfaction: 85 },
    { month: 'May', overall: 82, anxiety: 58, depression: 48, stress: 60, satisfaction: 88 },
    { month: 'Jun', overall: 76, anxiety: 61, depression: 51, stress: 63, satisfaction: 84 },
  ];

  const dailyWellnessData = [
    { day: 'Mon', score: 75, sessions: 12 },
    { day: 'Tue', score: 78, sessions: 15 },
    { day: 'Wed', score: 72, sessions: 18 },
    { day: 'Thu', score: 80, sessions: 14 },
    { day: 'Fri', score: 85, sessions: 10 },
    { day: 'Sat', score: 82, sessions: 8 },
    { day: 'Sun', score: 79, sessions: 6 },
  ];

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

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-8 animate-fade-in">
        {/* Welcome Header */}
        <div className="glass-card p-8 text-center tilt-card">
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
                {recentAlerts.map((alert) => (
                  <div 
                    key={alert.id} 
                    className="flex items-start gap-3 p-4 rounded-lg hover:bg-white/20 transition-colors duration-300 border border-white/10"
                  >
                    <div className={`w-3 h-3 rounded-full mt-2 ${
                      alert.severity === 'high' ? 'bg-red-500' :
                      alert.severity === 'medium' ? 'bg-orange-500' : 'bg-yellow-500'
                    } animate-pulse-gentle`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm">{alert.student}</p>
                        <Badge variant={alert.severity === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                          {alert.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{alert.message}</p>
                      <p className="text-xs text-muted-foreground">{alert.time}</p>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="glass-card border-0">
                        <DialogHeader>
                          <DialogTitle>Alert Details - {alert.student}</DialogTitle>
                          <DialogDescription>
                            Severity: <Badge variant={alert.severity === 'high' ? 'destructive' : 'secondary'}>{alert.severity}</Badge>
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">Summary</h4>
                            <p className="text-sm text-muted-foreground">{alert.message}</p>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">Detailed Description</h4>
                            <p className="text-sm text-muted-foreground">{alert.description}</p>
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
                <Button className="w-full btn-glass">
                  View All Alerts
                </Button>
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
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Stats Grid - Moved Below Graphs */}
            <div className="grid md:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
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
              ))}
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