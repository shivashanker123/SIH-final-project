import React, { useState, useRef, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Community } from '@/components/Community';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Heart, Send, Bot, User, Mic, MessageSquare, Clock, X, Download } from 'lucide-react';
import { processMessage, getSessions, getSessionMessages, Session, ChatMessage as ApiChatMessage } from '@/services/api';
import { useStudent } from '@/contexts/StudentContext';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'haven';
  timestamp: Date;
}

export const PersonalCare: React.FC = () => {
  const { studentId } = useStudent();
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
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [showPreviousChats, setShowPreviousChats] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Refs to prevent infinite loops
  const isLoadingSessionsRef = useRef(false);
  const loadedStudentIdRef = useRef<string | null>(null);

  // Load sessions on mount - with guards to prevent infinite loops
  useEffect(() => {
    if (!studentId) {
      setIsLoadingSessions(false);
      return;
    }
    
    // Block admin IDs
    if (studentId.startsWith('admin_')) {
      console.error('❌ PersonalCare: Admin IDs not allowed');
      setIsLoadingSessions(false);
      return;
    }
    
    // Prevent multiple simultaneous loads
    if (isLoadingSessionsRef.current) {
      console.log('🔍 Already loading sessions, skipping');
      return;
    }
    
    // If we already loaded for this studentId, skip
    if (loadedStudentIdRef.current === studentId) {
      console.log('🔍 Already loaded sessions for this studentId, skipping');
      setIsLoadingSessions(false);
      return;
    }
    
    const loadSessions = async () => {
      isLoadingSessionsRef.current = true;
      loadedStudentIdRef.current = studentId;
      setIsLoadingSessions(true);
      try {
        const sessionsData = await getSessions(studentId);
        setSessions(sessionsData);
      } catch (error) {
        console.error('Error loading sessions:', error);
      } finally {
        isLoadingSessionsRef.current = false;
        setIsLoadingSessions(false);
      }
    };

    loadSessions();
  }, [studentId]);

  // Initialize with new chat by default when component mounts or studentId changes
  useEffect(() => {
    if (!studentId) return;
    
    // Only initialize if we don't have messages yet and no session is selected
    // This ensures we start with a fresh chat by default
    if (messages.length === 0 && selectedSessionId === null) {
      setMessages([{
        id: '1',
        content: "Hello! I'm Haven, your personal mental health companion. I'm here to listen, support, and guide you on your wellness journey. How are you feeling today?",
        sender: 'haven',
        timestamp: new Date()
      }]);
    }
  }, [studentId]);

  // Load messages when a session is selected
  const handleSelectSession = async (sessionId: number) => {
    if (!studentId) return;
    
    setSelectedSessionId(sessionId);
    setIsTyping(true);
    
    try {
      const sessionMessages = await getSessionMessages(sessionId, studentId);
      const convertedMessages: Message[] = sessionMessages.map((msg: ApiChatMessage) => ({
        id: msg.id,
        content: msg.content,
        sender: msg.sender === 'user' ? 'user' : 'haven',
        timestamp: new Date(msg.timestamp)
      }));
      setMessages(convertedMessages);
      setShowPreviousChats(false);
    } catch (error) {
      console.error('Error loading session messages:', error);
    } finally {
      setIsTyping(false);
    }
  };

  // Start new chat
  const handleNewChat = () => {
    setSelectedSessionId(null);
    setMessages([
      {
        id: '1',
        content: "Hello! I'm Haven, your personal mental health companion. I'm here to listen, support, and guide you on your wellness journey. How are you feeling today?",
        sender: 'haven',
        timestamp: new Date()
      }
    ]);
    setShowPreviousChats(false);
  };

  // Export chat function
  const handleExportChat = () => {
    if (messages.length === 0) {
      alert('No messages to export');
      return;
    }

    try {

    const sessionInfo = selectedSessionId 
      ? sessions.find(s => s.id === selectedSessionId)
      : null;

    // Create a readable text format
    const textContent = `Haven Personal Care Chat Export
${sessionInfo ? `Session #${sessionInfo.session_number}` : 'Current Session'}
${sessionInfo ? `Date: ${new Date(sessionInfo.created_at).toLocaleString('en-US', { 
  month: 'long', 
  day: 'numeric', 
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})}` : `Exported: ${new Date().toLocaleString('en-US', { 
  month: 'long', 
  day: 'numeric', 
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})}`}
${'='.repeat(60)}

${messages.map((msg, index) => {
  const sender = msg.sender === 'user' ? 'You' : 'Haven';
  const timestamp = msg.timestamp.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  return `[${timestamp}] ${sender}:\n${msg.content}\n`;
}).join('\n')}

${'='.repeat(60)}
End of Chat Export
`;

    // Create JSON format for programmatic access
    const jsonContent = JSON.stringify({
      sessionInfo: sessionInfo ? {
        id: sessionInfo.id,
        session_number: sessionInfo.session_number,
        created_at: sessionInfo.created_at,
        message_count: sessionInfo.message_count
      } : null,
      exportDate: new Date().toISOString(),
      messages: messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        sender: msg.sender,
        timestamp: msg.timestamp.toISOString()
      }))
    }, null, 2);

    // Create and download text file
    const textBlob = new Blob([textContent], { type: 'text/plain' });
    const textUrl = URL.createObjectURL(textBlob);
    const textLink = document.createElement('a');
    textLink.href = textUrl;
    textLink.download = `haven-chat-${sessionInfo ? `session-${sessionInfo.session_number}` : 'current'}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(textLink);
    textLink.click();
    document.body.removeChild(textLink);
    URL.revokeObjectURL(textUrl);

    // Also download JSON file
    const jsonBlob = new Blob([jsonContent], { type: 'application/json' });
    const jsonUrl = URL.createObjectURL(jsonBlob);
    const jsonLink = document.createElement('a');
    jsonLink.href = jsonUrl;
    jsonLink.download = `haven-chat-${sessionInfo ? `session-${sessionInfo.session_number}` : 'current'}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(jsonLink);
    jsonLink.click();
    document.body.removeChild(jsonLink);
    URL.revokeObjectURL(jsonUrl);

    // Show success message
    alert('Chat exported successfully! Two files have been downloaded:\n- Text file (.txt) for easy reading\n- JSON file (.json) for data access');
    } catch (error) {
      console.error('Error exporting chat:', error);
      alert('Failed to export chat. Please try again.');
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = inputMessage;
    setInputMessage('');
    setIsTyping(true);

    try {
      const currentStudentId = studentId || 'student123';

      const response = await processMessage({
        student_id: currentStudentId,
        message_text: currentMessage,
        session_id: selectedSessionId || undefined, // Pass current session ID if available
        metadata: {},
      });

      const aiResponseText = response.response_text || 
        "I understand. How can I help you further?";
      
      const havenMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponseText,
        sender: 'haven',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, havenMessage]);

      // Refresh sessions list after sending message
      // If we have a selected session, reload its messages to show the saved ones
      // If no session is selected (new chat), refresh the list and optionally select the newly created session
      if (studentId) {
        try {
          const sessionsData = await getSessions(studentId);
          setSessions(sessionsData);
          
          // Only reload messages if we have an active session selected
          if (selectedSessionId) {
            const updatedSession = sessionsData.find(s => s.id === selectedSessionId);
            if (updatedSession) {
              // Reload messages for the current session to get the saved ones
              await handleSelectSession(selectedSessionId);
            }
          } else {
            // For new chats (selectedSessionId === null), the backend creates a new session
            // We can optionally select the latest session to show it's been saved, but keep messages visible
            // For now, we'll just refresh the list - the user can see their messages are saved
            // and can access the session later from the sidebar
          }
        } catch (error) {
          console.error('Error refreshing sessions:', error);
        }
      }

      // Handle crisis protocol - discreetly logged, no popup for students
      if (response.crisis_protocol_triggered) {
        console.log('Crisis protocol triggered - alert sent to admin dashboard');
      } else if (response.concern_indicators && response.concern_indicators.length > 0) {
        console.log('Concern indicators detected:', response.concern_indicators);
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Provide more detailed error message
      let errorContent = 'I apologize, but I encountered an error connecting to the AI. ';
      
      if (error.message) {
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          errorContent += 'The backend server appears to be offline. Please make sure the backend is running on http://localhost:8000';
        } else if (error.message.includes('500')) {
          errorContent += 'The backend encountered an internal error. Please check the backend logs for more details.';
        } else {
          errorContent += `Error: ${error.message}`;
        }
      } else {
        errorContent += 'Please make sure the backend is running and try again.';
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: errorContent,
        sender: 'haven',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleMicClick = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      // Stop all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      return;
    }

    // Start recording
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsRecording(false);
        setIsProcessingAudio(true);

        // Create blob and send to STT server
        const blob = new Blob(audioChunksRef.current, { 
          type: audioChunksRef.current[0]?.type || 'audio/webm' 
        });

        const formData = new FormData();
        formData.append('audio', blob, 'audio.webm');

        try {
          const response = await fetch('http://127.0.0.1:5000/stt', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Server error' }));
            throw new Error(error.error || `Server returned ${response.status}`);
          }

          const data = await response.json();
          const transcribedText = data.text || '';
          
          if (transcribedText) {
            setInputMessage(prev => prev ? `${prev} ${transcribedText}` : transcribedText);
          }
        } catch (error: any) {
          console.error('STT error:', error);
          // Show error message to user
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: `I couldn't process your voice input. ${error.message || 'Please try typing your message instead.'}`,
            sender: 'haven',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorMessage]);
        } finally {
          setIsProcessingAudio(false);
          // Clean up stream
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error: any) {
      console.error('Microphone access error:', error);
      alert(`Microphone access denied or not available: ${error.message}`);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  if (isCommunityMode) {
    return <Community onToggle={() => {
      // Ensure admin flags are cleared when student accesses community
      localStorage.removeItem('admin_community_mode');
      setIsCommunityMode(false);
    }} />;
  }

  return (
    <DashboardLayout userType="student" onCommunityToggle={() => setIsCommunityMode(true)}>
      <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
        {/* Header - Removed for dark theme */}

        <div className="flex gap-6">
          {/* Previous Chats Sidebar */}
          <div className={`w-80 flex-shrink-0 transition-all duration-300 ${showPreviousChats ? 'block' : 'hidden lg:block'}`}>
            <Card className="bg-gray-800/95 backdrop-blur-md border border-gray-700/50 rounded-2xl h-[600px] flex flex-col shadow-2xl">
              <CardHeader className="pb-4 border-b border-gray-700/50">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg text-white">
                    <MessageSquare className="w-5 h-5 text-cyan-400" />
                    Previous Chats
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPreviousChats(false)}
                    className="lg:hidden text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0 bg-gray-800/80">
                <div className="p-4 border-b border-gray-700/50">
                  <Button
                    onClick={handleNewChat}
                    className="w-full bg-cyan-500 hover:bg-cyan-600 text-gray-900"
                    size="sm"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    New Chat
                  </Button>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-4 space-y-2">
                    {isLoadingSessions ? (
                      <div className="text-center text-gray-400 py-8">Loading chats...</div>
                    ) : sessions.length === 0 ? (
                      <div className="text-center text-gray-400 py-8">
                        <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No previous chats</p>
                      </div>
                    ) : (
                      sessions.map((session) => (
                        <button
                          key={session.id}
                          onClick={() => handleSelectSession(session.id)}
                          className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                            selectedSessionId === session.id
                              ? 'bg-cyan-500/20 border border-cyan-500/50'
                              : 'bg-gray-700/30 border border-gray-700/50 hover:bg-gray-700/50'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <Clock className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-400">
                                {new Date(session.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {session.message_count} msgs
                            </span>
                          </div>
                          <div className="text-xs text-gray-300 mt-1">
                            {new Date(session.created_at).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Chat Interface */}
          <div className="flex-1">
            <Card className="bg-gray-800/95 backdrop-blur-md border border-gray-700/50 rounded-2xl h-[600px] flex flex-col shadow-2xl">
              <CardHeader className="pb-4 border-b border-gray-700/50">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg text-white">
                    <Bot className="w-5 h-5 text-cyan-400" />
                    Personal Care Session
                    {selectedSessionId && (
                      <span className="text-sm text-gray-400 font-normal">
                        (Session #{sessions.find(s => s.id === selectedSessionId)?.session_number})
                      </span>
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleExportChat}
                      className="text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10"
                      title="Export chat"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowPreviousChats(!showPreviousChats)}
                      className="lg:hidden text-gray-400 hover:text-white"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0 bg-gray-800/80">
            {/* Messages Area */}
            <ScrollArea className="flex-1 px-6 bg-transparent" ref={scrollAreaRef}>
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
                        <AvatarFallback className="bg-cyan-500 text-gray-900 text-sm font-semibold">
                          H
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        message.sender === 'user'
                          ? 'bg-blue-600 text-white ml-auto'
                          : 'bg-gray-700/90 text-white'
                      }`}
                    >
                      <p className="text-sm leading-relaxed text-white">{message.content}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {message.timestamp.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>

                    {message.sender === 'user' && (
                      <Avatar className="w-8 h-8 mt-1">
                        <AvatarFallback className="bg-blue-600 text-white text-sm">
                          <User className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}

                {isTyping && (
                  <div className="flex gap-3">
                    <Avatar className="w-8 h-8 mt-1">
                      <AvatarFallback className="bg-cyan-500 text-gray-900 text-sm font-semibold">
                        H
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-gray-700/90 text-white rounded-2xl px-4 py-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t border-gray-700/50 p-4">
              <div className="flex gap-3">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Share your thoughts with Haven..."
                  className="flex-1 bg-gray-700/50 border border-gray-600 text-white placeholder:text-gray-400 focus:border-cyan-400 focus:ring-cyan-400/20"
                  disabled={isTyping}
                />
                <Button
                  onClick={handleMicClick}
                  disabled={isTyping || isProcessingAudio}
                  className={`rounded-full w-10 h-10 p-0 hover:scale-105 transition-transform duration-300 ${
                    isRecording 
                      ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                      : isProcessingAudio
                      ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-white'
                  }`}
                  title={isRecording ? 'Stop recording' : isProcessingAudio ? 'Processing audio...' : 'Start voice input'}
                >
                  <Mic className="w-4 h-4" />
                </Button>
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                  className="bg-cyan-500 hover:bg-cyan-600 text-gray-900 rounded-full w-10 h-10 p-0 hover:scale-105 transition-transform duration-300"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                Haven is an AI companion designed to provide support and guidance. For emergency situations, please contact a crisis helpline.
              </p>
            </div>
          </CardContent>
        </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
