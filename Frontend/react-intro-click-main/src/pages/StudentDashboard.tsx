import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { AIInterface } from '@/components/AIInterface';
import { AIButton } from '@/components/AIButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Heart, 
  BookOpen, 
  Calendar, 
  TrendingUp, 
  Star,
  Clock,
  Target,
  Award
} from 'lucide-react';
import { ShimmerCard } from '@/components/LoadingSpinner';

export const StudentDashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isAIOpen, setIsAIOpen] = useState(false);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 1500);
    
    // Animate progress
    const progressTimer = setInterval(() => {
      setProgress(prev => prev < 75 ? prev + 1 : prev);
    }, 50);

    return () => {
      clearTimeout(timer);
      clearInterval(progressTimer);
    };
  }, []);

  const quickActions = [
    {
      title: 'Browse Resources',
      description: 'Access mental health resources and guides',
      icon: BookOpen,
      color: 'from-blue-500 to-blue-600',
      action: () => window.location.href = '/resources',
    },
    {
      title: 'Self-Care Activities',
      description: 'Practice mindfulness and wellness exercises',
      icon: Heart,
      color: 'from-pink-500 to-rose-600',
      action: () => window.location.href = '/self-care',
    },
    {
      title: 'Book Session',
      description: 'Schedule a counseling appointment',
      icon: Calendar,
      color: 'from-green-500 to-emerald-600',
      action: () => window.location.href = '/book-session',
    },
  ];

  const recentActivities = [
    { title: 'Completed mindfulness exercise', time: '2 hours ago', icon: Heart },
    { title: 'Read "Managing Stress" article', time: '1 day ago', icon: BookOpen },
    { title: 'Scheduled counseling session', time: '3 days ago', icon: Calendar },
  ];

  if (isLoading) {
    return (
      <DashboardLayout userType="student">
        <div className="space-y-8">
          <ShimmerCard className="h-32" />
          <div className="grid md:grid-cols-3 gap-6">
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
    <>
      <DashboardLayout userType="student">
        <div className="space-y-8 animate-fade-in">
        {/* Welcome Header */}
        <div className="glass-card p-8 text-center tilt-card">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-wellness-calm to-wellness-serene bg-clip-text text-transparent mb-4 text-reveal-item">
            Welcome Back, Student!
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            Your mental wellness journey continues here
          </p>
          
          <div className="max-w-md mx-auto space-y-3">
            <div className="flex justify-between text-sm">
              <span>Wellness Progress</span>
              <span className="font-semibold">{progress}%</span>
            </div>
            <Progress value={progress} className="h-3" />
            <p className="text-sm text-muted-foreground">
              Great progress! Keep up the excellent work.
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <Card
              key={action.title}
              className="glass-card border-0 hover:shadow-2xl transition-all duration-500 cursor-pointer tilt-card group"
              onClick={action.action}
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <CardHeader className="text-center pb-4">
                <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-r ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <action.icon className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl font-semibold">{action.title}</CardTitle>
                <CardDescription>{action.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button className="w-full btn-glass group-hover:bg-white/30">
                  Get Started
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6">
          <Card className="glass-card border-0 tilt-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sessions Completed</CardTitle>
              <Target className="h-4 w-4 text-wellness-calm" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-wellness-calm">12</div>
              <p className="text-xs text-muted-foreground">+2 from last month</p>
            </CardContent>
          </Card>

          <Card className="glass-card border-0 tilt-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Wellness Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-wellness-serene" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-wellness-serene">8.5</div>
              <p className="text-xs text-muted-foreground">Excellent progress</p>
            </CardContent>
          </Card>

          <Card className="glass-card border-0 tilt-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Streak Days</CardTitle>
              <Star className="h-4 w-4 text-wellness-warm" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-wellness-warm">15</div>
              <p className="text-xs text-muted-foreground">Keep it up!</p>
            </CardContent>
          </Card>

          <Card className="glass-card border-0 tilt-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Achievements</CardTitle>
              <Award className="h-4 w-4 text-wellness-peaceful" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-wellness-peaceful">7</div>
              <p className="text-xs text-muted-foreground">Badges earned</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity & Tips */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="glass-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-wellness-calm" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div 
                  key={index} 
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/20 transition-colors duration-300"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
                    <activity.icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="glass-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-wellness-warm" />
                Daily Wellness Tip
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-6 rounded-xl bg-gradient-warm/20 border border-wellness-warm/20">
                <h4 className="font-semibold mb-3 text-wellness-warm">Practice Deep Breathing</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Take 5 minutes today to practice deep breathing exercises. 
                  Inhale for 4 counts, hold for 4, and exhale for 6. This simple 
                  technique can help reduce stress and improve focus.
                </p>
                <Button size="sm" className="btn-glass">
                  Try Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        </div>
      </DashboardLayout>

      {/* AI Button */}
      <AIButton onClick={() => setIsAIOpen(true)} />

      {/* AI Interface */}
      <AIInterface isOpen={isAIOpen} onToggle={() => setIsAIOpen(false)} />
    </>
  );
};