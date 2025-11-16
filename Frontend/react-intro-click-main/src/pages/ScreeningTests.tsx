import React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Plus, Eye, TrendingUp, Users } from 'lucide-react';

export const ScreeningTests = () => {
  const screeningTests = [
    {
      id: 1,
      title: "Depression Screening (PHQ-9)",
      description: "9-question screening tool for depression",
      totalResponses: 45,
      averageScore: 7.2,
      riskLevel: "Moderate",
      lastUpdated: "2 hours ago"
    },
    {
      id: 2,
      title: "Anxiety Assessment (GAD-7)",
      description: "7-question generalized anxiety disorder assessment",
      totalResponses: 38,
      averageScore: 5.8,
      riskLevel: "Low-Moderate",
      lastUpdated: "4 hours ago"
    },
    {
      id: 3,
      title: "Stress Level Evaluation",
      description: "Comprehensive stress assessment questionnaire",
      totalResponses: 52,
      averageScore: 6.1,
      riskLevel: "Moderate",
      lastUpdated: "1 day ago"
    },
    {
      id: 4,
      title: "Sleep Quality Index",
      description: "Assessment of sleep patterns and quality",
      totalResponses: 29,
      averageScore: 4.3,
      riskLevel: "Low",
      lastUpdated: "3 days ago"
    }
  ];

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Low-Moderate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Moderate': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'High': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Screening Tests</h1>
            <p className="text-muted-foreground mt-2">
              Manage and monitor mental health screening assessments
            </p>
          </div>
          <Button className="glass-card hover:scale-105 transition-all">
            <Plus className="w-4 h-4 mr-2" />
            Create New Test
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4</div>
              <p className="text-xs text-muted-foreground">Active assessments</p>
            </CardContent>
          </Card>
          
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">164</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Completion</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">87%</div>
              <p className="text-xs text-muted-foreground">+2% from last month</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Risk</CardTitle>
              <TrendingUp className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">12</div>
              <p className="text-xs text-muted-foreground">Students need attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Screening Tests List */}
        <div className="grid gap-6">
          {screeningTests.map((test) => (
            <Card key={test.id} className="glass-card tilt-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">{test.title}</CardTitle>
                    <CardDescription className="mt-1">{test.description}</CardDescription>
                  </div>
                  <Badge className={getRiskColor(test.riskLevel)}>
                    {test.riskLevel} Risk
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-wellness-calm">{test.totalResponses}</p>
                    <p className="text-sm text-muted-foreground">Responses</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-wellness-serene">{test.averageScore}</p>
                    <p className="text-sm text-muted-foreground">Avg. Score</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Last Updated</p>
                    <p className="font-medium">{test.lastUpdated}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button size="sm" className="flex-1">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      Analytics
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};