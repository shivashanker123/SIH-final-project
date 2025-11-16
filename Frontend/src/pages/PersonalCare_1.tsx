import React, { useState, useRef, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Community } from '@/components/Community';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Heart, Send, Bot, User } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'haven';
  timestamp: Date;
}

export const PersonalCare: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hello! I'm Haven, your personal mental health companion. I'm here to listen, support, and guide you on your wellness journey. How are you feeling today?",
      sender: 'haven',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isCommunityMode, setIsCommunityMode] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate Haven's response
    setTimeout(() => {
      const havenResponses = [
        "Thank you for sharing that with me. It takes courage to open up about how you're feeling. Can you tell me more about what's been on your mind lately?",
        "I hear you, and your feelings are completely valid. Many people experience similar challenges. What usually helps you feel better when you're going through tough times?",
        "That sounds really challenging. You're being incredibly strong by reaching out and talking about it. Have you tried any relaxation techniques that might help?",
        "I'm glad you felt comfortable sharing that with me. Remember, it's okay to not be okay sometimes. What's one small thing that brought you joy recently?",
        "Your awareness of your emotions shows great self-insight. That's actually a strength. Would you like to explore some coping strategies that might help?",
        "I appreciate you trusting me with your thoughts. Taking care of your mental health is just as important as your physical health. How has your sleep been lately?"
      ];

      const randomResponse = havenResponses[Math.floor(Math.random() * havenResponses.length)];
      
      const havenMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: randomResponse,
        sender: 'haven',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, havenMessage]);
      setIsTyping(false);
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isCommunityMode) {
    return <Community onToggle={() => setIsCommunityMode(false)} />;
  }

  return (
    <DashboardLayout userType="student" onCommunityToggle={() => setIsCommunityMode(true)}>
      <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
        {/* Header */}
        <div className="glass-card p-6 text-center tilt-card">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-haven flex items-center justify-center">
              <Heart 
                className="w-6 h-6 text-haven-deepAqua" 
                style={{ 
                  filter: 'drop-shadow(0 0 4px rgba(102, 252, 241, 0.3))' 
                }}
              />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-haven-softGlowAqua to-haven-mutedGrayAqua bg-clip-text text-transparent">
              Chat with Haven
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Your personal AI companion for mental health support and guidance
          </p>
        </div>

        {/* Chat Interface */}
        <Card className="glass-card border-0 h-[600px] flex flex-col">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bot className="w-5 h-5 text-haven-softGlowAqua" />
              Personal Care Session
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages Area */}
            <ScrollArea className="flex-1 px-6" ref={scrollAreaRef}>
              <div className="space-y-4 pb-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.sender === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.sender === 'haven' && (
                      <Avatar className="w-8 h-8 mt-1">
                        <AvatarFallback className="bg-gradient-haven text-haven-deepAqua text-sm font-semibold">
                          H
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        message.sender === 'user'
                          ? 'bg-primary text-primary-foreground ml-auto'
                          : 'bg-haven-mutedTeal/20 text-foreground border border-haven-softGlowAqua/20'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      <p className="text-xs opacity-70 mt-2">
                        {message.timestamp.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>

                    {message.sender === 'user' && (
                      <Avatar className="w-8 h-8 mt-1">
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                          <User className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}

                {isTyping && (
                  <div className="flex gap-3">
                    <Avatar className="w-8 h-8 mt-1">
                      <AvatarFallback className="bg-gradient-haven text-haven-deepAqua text-sm font-semibold">
                        H
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-haven-mutedTeal/20 text-foreground border border-haven-softGlowAqua/20 rounded-2xl px-4 py-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-haven-softGlowAqua rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-haven-softGlowAqua rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-haven-softGlowAqua rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t border-border/50 p-4">
              <div className="flex gap-3">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Share your thoughts with Haven..."
                  className="flex-1 bg-white/50 dark:bg-gray-800/50 border-haven-softGlowAqua/30 focus:border-haven-softGlowAqua focus:ring-haven-softGlowAqua/20"
                  disabled={isTyping}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                  className="bg-gradient-haven text-haven-deepAqua hover:scale-105 transition-transform duration-300"
                  style={{
                    boxShadow: '0 0 10px 2px rgba(102, 252, 241, 0.2)'
                  }}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Haven is an AI companion designed to provide support and guidance. For emergency situations, please contact a crisis helpline.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};