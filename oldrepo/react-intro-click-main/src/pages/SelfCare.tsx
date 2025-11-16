import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  Brain, 
  Moon, 
  Zap, 
  Flower, 
  Wind,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  Timer,
  Target,
  Award,
  Calendar
} from 'lucide-react';
import { ShimmerCard } from '@/components/LoadingSpinner';

interface Activity {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  category: 'breathing' | 'meditation' | 'movement' | 'journaling' | 'mindfulness';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  completed: boolean;
  streak: number;
}

interface TimerState {
  isActive: boolean;
  timeLeft: number;
  totalTime: number;
  currentActivity: string | null;
}

export const SelfCare: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [completedToday, setCompletedToday] = useState(3);
  const [dailyGoal] = useState(5);
  const [timer, setTimer] = useState<TimerState>({
    isActive: false,
    timeLeft: 0,
    totalTime: 0,
    currentActivity: null
  });

  useEffect(() => {
    const loadTimer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(loadTimer);
  }, []);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer.isActive && timer.timeLeft > 0) {
      interval = setInterval(() => {
        setTimer(prev => ({
          ...prev,
          timeLeft: prev.timeLeft - 1
        }));
      }, 1000);
    } else if (timer.timeLeft === 0 && timer.isActive) {
      setTimer(prev => ({ ...prev, isActive: false }));
      // Show completion notification
    }
    return () => clearInterval(interval);
  }, [timer.isActive, timer.timeLeft]);

  const activities: Activity[] = [
    {
      id: '1',
      title: '4-7-8 Breathing Exercise',
      description: 'A simple breathing technique to reduce anxiety and promote relaxation.',
      duration: 5,
      category: 'breathing',
      difficulty: 'beginner',
      completed: true,
      streak: 7
    },
    {
      id: '2',
      title: 'Mindful Body Scan',
      description: 'Progressive relaxation technique focusing on each part of your body.',
      duration: 15,
      category: 'meditation',
      difficulty: 'intermediate',
      completed: false,
      streak: 3
    },
    {
      id: '3',
      title: 'Gentle Morning Stretch',
      description: 'Easy stretching routine to start your day with positive energy.',
      duration: 10,
      category: 'movement',
      difficulty: 'beginner',
      completed: true,
      streak: 12
    },
    {
      id: '4',
      title: 'Gratitude Journaling',
      description: 'Write down three things you\'re grateful for today.',
      duration: 8,
      category: 'journaling',
      difficulty: 'beginner',
      completed: true,
      streak: 5
    },
    {
      id: '5',
      title: 'Walking Meditation',
      description: 'Mindful walking practice to connect with the present moment.',
      duration: 20,
      category: 'mindfulness',
      difficulty: 'intermediate',
      completed: false,
      streak: 0
    },
    {
      id: '6',
      title: 'Progressive Muscle Relaxation',
      description: 'Systematic tensing and relaxing of muscle groups.',
      duration: 25,
      category: 'meditation',
      difficulty: 'advanced',
      completed: false,
      streak: 1
    }
  ];

  const categories = [
    { id: 'all', label: 'All Activities', icon: Heart, color: 'from-pink-500 to-rose-500' },
    { id: 'breathing', label: 'Breathing', icon: Wind, color: 'from-blue-500 to-cyan-500' },
    { id: 'meditation', label: 'Meditation', icon: Brain, color: 'from-purple-500 to-indigo-500' },
    { id: 'movement', label: 'Movement', icon: Zap, color: 'from-orange-500 to-red-500' },
    { id: 'journaling', label: 'Journaling', icon: Flower, color: 'from-green-500 to-teal-500' },
    { id: 'mindfulness', label: 'Mindfulness', icon: Moon, color: 'from-indigo-500 to-purple-500' }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500';
      case 'intermediate': return 'bg-yellow-500';
      case 'advanced': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredActivities = selectedCategory === 'all' 
    ? activities 
    : activities.filter(activity => activity.category === selectedCategory);

  const startActivity = (activity: Activity) => {
    setTimer({
      isActive: true,
      timeLeft: activity.duration * 60, // Convert to seconds
      totalTime: activity.duration * 60,
      currentActivity: activity.id
    });
  };

  const pauseTimer = () => {
    setTimer(prev => ({ ...prev, isActive: !prev.isActive }));
  };

  const resetTimer = () => {
    setTimer({
      isActive: false,
      timeLeft: 0,
      totalTime: 0,
      currentActivity: null
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = (completedToday / dailyGoal) * 100;

  if (isLoading) {
    return (
      <DashboardLayout userType="student">
        <div className="space-y-8">
          <ShimmerCard className="h-32" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ShimmerCard />
            <ShimmerCard />
            <ShimmerCard />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="student">
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="glass-card p-8 text-center tilt-card">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-wellness-calm to-wellness-peaceful bg-clip-text text-transparent mb-4">
            Self-Care Activities
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            Take a moment for yourself with guided wellness activities
          </p>
          
          {/* Daily Progress */}
          <div className="max-w-md mx-auto space-y-3">
            <div className="flex justify-between text-sm">
              <span>Daily Goal Progress</span>
              <span className="font-semibold">{completedToday}/{dailyGoal} activities</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
            <p className="text-sm text-muted-foreground">
              {completedToday >= dailyGoal 
                ? "🎉 Goal achieved! Keep up the great work!" 
                : `${dailyGoal - completedToday} more activities to reach your daily goal`
              }
            </p>
          </div>
        </div>

        {/* Active Timer */}
        {timer.currentActivity && (
          <Card className="glass-card border-0 bg-gradient-to-r from-wellness-calm/20 to-wellness-peaceful/20">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Timer className="w-5 h-5" />
                Activity in Progress
              </CardTitle>
              <CardDescription>
                {activities.find(a => a.id === timer.currentActivity)?.title}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div className="text-6xl font-mono font-bold text-wellness-calm">
                {formatTime(timer.timeLeft)}
              </div>
              
              <div className="space-y-2">
                <Progress 
                  value={((timer.totalTime - timer.timeLeft) / timer.totalTime) * 100} 
                  className="h-2" 
                />
                <p className="text-sm text-muted-foreground">
                  {Math.round(((timer.totalTime - timer.timeLeft) / timer.totalTime) * 100)}% complete
                </p>
              </div>

              <div className="flex justify-center gap-4">
                <Button
                  onClick={pauseTimer}
                  variant="outline"
                  size="lg"
                  className="btn-glass"
                >
                  {timer.isActive ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
                  {timer.isActive ? 'Pause' : 'Resume'}
                </Button>
                <Button
                  onClick={resetTimer}
                  variant="outline"
                  size="lg"
                  className="btn-glass"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="glass-card border-0 tilt-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Activities</CardTitle>
              <CheckCircle className="h-4 w-4 text-wellness-calm" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-wellness-calm">{completedToday}</div>
              <p className="text-xs text-muted-foreground">
                {progressPercentage >= 100 ? "Goal achieved!" : `${dailyGoal - completedToday} remaining`}
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card border-0 tilt-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
              <Target className="h-4 w-4 text-wellness-serene" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-wellness-serene">12</div>
              <p className="text-xs text-muted-foreground">days in a row</p>
            </CardContent>
          </Card>

          <Card className="glass-card border-0 tilt-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Minutes</CardTitle>
              <Award className="h-4 w-4 text-wellness-peaceful" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-wellness-peaceful">247</div>
              <p className="text-xs text-muted-foreground">this week</p>
            </CardContent>
          </Card>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-3 justify-center">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                variant={selectedCategory === category.id ? "default" : "outline"}
                className={`btn-glass ${selectedCategory === category.id ? 'bg-white/30' : ''}`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {category.label}
              </Button>
            );
          })}
        </div>

        {/* Activities Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredActivities.map((activity, index) => {
            const category = categories.find(c => c.id === activity.category);
            const Icon = category?.icon || Heart;
            const isActive = timer.currentActivity === activity.id;
            
            return (
              <Card
                key={activity.id}
                className={`glass-card border-0 hover:shadow-xl transition-all duration-500 cursor-pointer tilt-card group ${
                  isActive ? 'ring-2 ring-wellness-calm bg-wellness-calm/10' : ''
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${category?.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getDifficultyColor(activity.difficulty)} text-white`}
                      >
                        {activity.difficulty}
                      </Badge>
                      {activity.completed && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-lg">{activity.title}</CardTitle>
                  <CardDescription>{activity.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Timer className="w-4 h-4" />
                      {activity.duration} min
                    </div>
                    {activity.streak > 0 && (
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="w-4 h-4 text-wellness-warm" />
                        <span className="font-medium">{activity.streak}</span>
                      </div>
                    )}
                  </div>
                  <Button 
                    className="w-full btn-glass group-hover:bg-white/30"
                    onClick={() => startActivity(activity)}
                    disabled={isActive}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {isActive ? 'In Progress' : 'Start Activity'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};