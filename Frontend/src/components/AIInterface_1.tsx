import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Brain, 
  Activity, 
  TrendingUp,
  MessageCircle,
  Zap,
  Target
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface AIInterfaceProps {
  isOpen: boolean;
  onToggle: () => void;
}

const mockData = [
  { name: 'Mon', wellness: 65, anxiety: 30, mood: 70 },
  { name: 'Tue', wellness: 72, anxiety: 25, mood: 75 },
  { name: 'Wed', wellness: 68, anxiety: 35, mood: 65 },
  { name: 'Thu', wellness: 78, anxiety: 20, mood: 80 },
  { name: 'Fri', wellness: 85, anxiety: 15, mood: 85 },
  { name: 'Sat', wellness: 82, anxiety: 18, mood: 88 },
  { name: 'Sun', wellness: 90, anxiety: 12, mood: 92 },
];

const aiInsights = [
  { 
    icon: TrendingUp, 
    title: "Mood Trending Up", 
    description: "Your mood has improved 25% this week",
    color: "text-green-500"
  },
  { 
    icon: Target, 
    title: "Stress Reduction", 
    description: "Meditation sessions showing positive impact",
    color: "text-blue-500"
  },
  { 
    icon: Activity, 
    title: "Sleep Pattern", 
    description: "Consider earlier bedtime for better wellness",
    color: "text-purple-500"
  }
];

export const AIInterface: React.FC<AIInterfaceProps> = ({ isOpen, onToggle }) => {
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { role: 'ai', content: 'Hello! I\'m your AI wellness companion. How can I help you today?' }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = { role: 'user', content: message };
    setChatMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        role: 'ai',
        content: 'I understand you\'re looking for wellness support. Based on your recent activity, I recommend trying our guided meditation or speaking with a counselor.'
      };
      setChatMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background/95 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden animate-scale-in">
        <div className="bg-gradient-primary p-6 border-b border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">AI Wellness Assistant</h2>
                <p className="text-white/80">Your personal mental health companion</p>
              </div>
            </div>
            <Button
              onClick={onToggle}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 rounded-xl"
            >
              ×
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          {/* Chat Interface */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="glass-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-wellness-calm" />
                  Chat with AI
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-64 overflow-y-auto space-y-3 p-4 bg-muted/30 rounded-xl">
                  {chatMessages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-2xl ${
                          msg.role === 'user'
                            ? 'bg-gradient-primary text-white'
                            : 'bg-card border border-border'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-card border border-border p-3 rounded-2xl">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-wellness-calm rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-wellness-calm rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-2 h-2 bg-wellness-calm rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ask about your wellness..."
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} className="px-6">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* AI Insights */}
            <Card className="glass-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-wellness-serene" />
                  AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {aiInsights.map((insight, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors">
                      <insight.icon className={`w-5 h-5 ${insight.color}`} />
                      <div className="flex-1">
                        <h4 className="font-medium">{insight.title}</h4>
                        <p className="text-sm text-muted-foreground">{insight.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analytics Dashboard */}
          <div className="space-y-4">
            <Card className="glass-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-wellness-peaceful" />
                  Wellness Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mockData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '12px'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="wellness"
                        stroke="hsl(var(--wellness-calm))"
                        fill="hsl(var(--wellness-calm) / 0.2)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-wellness-warm" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Bot className="w-4 h-4 mr-2" />
                  Mood Check-in
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Brain className="w-4 h-4 mr-2" />
                  Stress Assessment
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Activity className="w-4 h-4 mr-2" />
                  Wellness Plan
                </Button>
              </CardContent>
            </Card>

            <Card className="glass-card border-0">
              <CardHeader>
                <CardTitle>Today's Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-wellness-calm mb-2">85</div>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    Excellent
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-2">
                    Keep up the great work!
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};