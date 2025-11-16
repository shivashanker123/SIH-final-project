import React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Download, Filter, TrendingDown, TrendingUp, AlertTriangle, Bell, Clock, Eye, MessageCircle, Shield } from 'lucide-react';

export const Results = () => {
  const recentResults = [
    {
      id: 1,
      studentName: "Sarah Johnson",
      studentId: "ST2024001",
      testType: "Depression Screening (PHQ-9)",
      score: 12,
      riskLevel: "Moderate",
      completedAt: "2024-01-15 10:30 AM",
      trend: "increased"
    },
    {
      id: 2,
      studentName: "Michael Chen",
      studentId: "ST2024002", 
      testType: "Anxiety Assessment (GAD-7)",
      score: 8,
      riskLevel: "Mild",
      completedAt: "2024-01-15 09:15 AM",
      trend: "stable"
    },
    {
      id: 3,
      studentName: "Emily Rodriguez",
      studentId: "ST2024003",
      testType: "Stress Level Evaluation",
      score: 15,
      riskLevel: "High",
      completedAt: "2024-01-14 02:45 PM",
      trend: "increased"
    },
    {
      id: 4,
      studentName: "David Thompson",
      studentId: "ST2024004",
      testType: "Sleep Quality Index",
      score: 4,
      riskLevel: "Low",
      completedAt: "2024-01-14 11:20 AM",
      trend: "decreased"
    },
    {
      id: 5,
      studentName: "Lisa Wang",
      studentId: "ST2024005",
      testType: "Depression Screening (PHQ-9)",
      score: 18,
      riskLevel: "High",
      completedAt: "2024-01-13 04:10 PM",
      trend: "increased"
    }
  ];

  const alerts = [
    {
      id: 1,
      type: "High Risk Score",
      severity: "Critical",
      studentName: "Emily Rodriguez",
      studentId: "ST2024003",
      message: "Depression screening score of 18 indicates severe depression symptoms",
      triggeredAt: "2024-01-15 11:45 AM",
      status: "Unread",
      actionRequired: "Immediate intervention recommended",
      testType: "PHQ-9"
    },
    {
      id: 2,
      type: "Crisis Keywords",
      severity: "Critical", 
      studentName: "Marcus Johnson",
      studentId: "ST2024007",
      message: "Self-harm keywords detected in assessment responses",
      triggeredAt: "2024-01-15 10:20 AM",
      status: "In Review",
      actionRequired: "Contact student immediately",
      testType: "Custom Assessment"
    },
    {
      id: 3,
      type: "Missed Appointments",
      severity: "High",
      studentName: "Sarah Chen",
      studentId: "ST2024001",
      message: "Student has missed 3 consecutive counseling appointments",
      triggeredAt: "2024-01-14 03:30 PM",
      status: "Acknowledged",
      actionRequired: "Follow-up contact needed",
      testType: "Attendance Tracking"
    },
    {
      id: 4,
      type: "Score Deterioration",
      severity: "Medium",
      studentName: "Alex Thompson",
      studentId: "ST2024005",
      message: "Anxiety scores increased by 40% over past 2 weeks",
      triggeredAt: "2024-01-14 09:15 AM",
      status: "Read",
      actionRequired: "Schedule check-in session",
      testType: "GAD-7"
    },
    {
      id: 5,
      type: "Repeated Testing",
      severity: "Low",
      studentName: "Jessica Wang",
      studentId: "ST2024009",
      message: "Student completed same assessment 5 times in 24 hours",
      triggeredAt: "2024-01-13 07:45 PM",
      status: "Read",
      actionRequired: "Monitor for unusual behavior",
      testType: "Stress Assessment"
    }
  ];

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Mild': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Moderate': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'High': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increased': return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'decreased': return <TrendingDown className="w-4 h-4 text-green-500" />;
      default: return <div className="w-4 h-4 rounded-full bg-gray-400" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'High': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Low': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Unread': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'In Review': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Acknowledged': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Read': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'Critical': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'High': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'Medium': return <Bell className="w-5 h-5 text-yellow-500" />;
      case 'Low': return <Bell className="w-5 h-5 text-blue-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Results & Alerts</h1>
            <p className="text-muted-foreground mt-2">
              Monitor student assessment results and critical alerts
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="glass-card">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button className="glass-card hover:scale-105 transition-all">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <Tabs defaultValue="results" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="results">Assessment Results</TabsTrigger>
            <TabsTrigger value="alerts">Alerts & Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="results" className="space-y-6">
            {/* Results Stats Overview */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="glass-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Results</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">164</div>
                  <p className="text-xs text-muted-foreground">+12 from yesterday</p>
                </CardContent>
              </Card>
              
              <Card className="glass-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">High Risk</CardTitle>
                  <TrendingUp className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">12</div>
                  <p className="text-xs text-muted-foreground">7.3% of total</p>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg. Score</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">6.8</div>
                  <p className="text-xs text-muted-foreground">-0.2 from last week</p>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Follow-ups</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">8</div>
                  <p className="text-xs text-muted-foreground">Require attention</p>
                </CardContent>
              </Card>
            </div>

            {/* Results Table */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Recent Assessment Results</CardTitle>
                <CardDescription>
                  Latest student assessment outcomes and risk indicators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentResults.map((result) => (
                    <div key={result.id} className="flex items-center justify-between p-4 rounded-lg border border-white/20 hover:bg-white/5 transition-all">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarFallback className="bg-gradient-primary text-white">
                            {result.studentName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{result.studentName}</p>
                          <p className="text-sm text-muted-foreground">{result.studentId}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-medium">{result.testType}</p>
                          <p className="text-sm text-muted-foreground">{result.completedAt}</p>
                        </div>
                        
                        <div className="text-center">
                          <p className="text-2xl font-bold text-wellness-calm">{result.score}</p>
                          <p className="text-xs text-muted-foreground">Score</p>
                        </div>
                        
                        <Badge className={getRiskColor(result.riskLevel)}>
                          {result.riskLevel}
                        </Badge>
                        
                        <div className="flex items-center">
                          {getTrendIcon(result.trend)}
                        </div>
                        
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            {/* Alerts Stats Overview */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="glass-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
                  <Bell className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">23</div>
                  <p className="text-xs text-muted-foreground">+7 from yesterday</p>
                </CardContent>
              </Card>
              
              <Card className="glass-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Critical</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">5</div>
                  <p className="text-xs text-muted-foreground">Immediate attention</p>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Unread</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">8</div>
                  <p className="text-xs text-muted-foreground">Require review</p>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Response Time</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1.2h</div>
                  <p className="text-xs text-muted-foreground">Average response</p>
                </CardContent>
              </Card>
            </div>

            {/* Alert Actions */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Active Alerts</h2>
              <div className="flex gap-2">
                <Button variant="outline" className="glass-card">
                  <Shield className="w-4 h-4 mr-2" />
                  Alert Settings
                </Button>
                <Button className="glass-card hover:scale-105 transition-all">
                  <Eye className="w-4 h-4 mr-2" />
                  Mark All Read
                </Button>
              </div>
            </div>

            {/* Alerts List */}
            <div className="space-y-4">
              {alerts.map((alert) => (
                <Card key={alert.id} className={`glass-card tilt-card transition-all ${alert.status === 'Unread' ? 'ring-2 ring-red-500/20' : ''}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="mt-1">
                          {getSeverityIcon(alert.severity)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <CardTitle className="text-lg">{alert.type}</CardTitle>
                            <Badge className={getSeverityColor(alert.severity)}>
                              {alert.severity}
                            </Badge>
                            <Badge className={getStatusColor(alert.status)}>
                              {alert.status}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 mb-2">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-gradient-primary text-white text-xs">
                                {alert.studentName.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{alert.studentName}</p>
                              <p className="text-xs text-muted-foreground">{alert.studentId}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm">{alert.message}</p>
                      
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                          Action Required: {alert.actionRequired}
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span>Triggered: {alert.triggeredAt}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Shield className="w-4 h-4 text-muted-foreground" />
                          <span>Source: {alert.testType}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-white/20">
                        <div className="flex space-x-2">
                          <Button size="sm" className="bg-red-600 hover:bg-red-700">
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            Take Action
                          </Button>
                          <Button size="sm" variant="outline">
                            <MessageCircle className="w-4 h-4 mr-1" />
                            Contact Student
                          </Button>
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </Button>
                        </div>
                        <Button size="sm" variant="ghost" className="text-muted-foreground">
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};