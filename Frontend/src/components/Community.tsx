import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Home, 
  User, 
  Mail, 
  Users, 
  Briefcase, 
  Settings, 
  ArrowLeft, 
  Search,
  Bell,
  Plus,
  LogOut,
  Heart,
  MessageCircle,
  Share,
  Camera,
  Video,
  Edit,
  Check,
  X,
  UserPlus,
  UserMinus,
  Send,
  Image,
  FileVideo,
  MapPin,
  Calendar,
  Star,
  UserCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { useStudent } from '@/contexts/StudentContext';
import {
  getUserProfile,
  updateUserProfile,
  listCommunities,
  createCommunity,
  joinCommunity as joinCommunityAPI,
  leaveCommunity as leaveCommunityAPI,
  listPosts,
  createPost as createPostAPI,
  likePost as likePostAPI,
  listConnections,
  sendConnectionRequest,
  acceptConnection,
  rejectConnection,
  getMessages,
  sendMessage as sendMessageAPI,
  searchUsers,
  type UserProfile as UserProfileType,
  type Community as CommunityType,
  type Post as PostType,
  type Connection as ConnectionType,
  type Message as MessageType,
  type UserSearchResult
} from '@/services/api';

// Using types from API service

interface CommunityProps {
  onToggle: () => void;
}

export const Community: React.FC<CommunityProps> = ({ onToggle }) => {
  const { studentId } = useStudent();
  const [activeView, setActiveView] = useState<'home' | 'profile' | 'messages' | 'matching' | 'communities'>('home');
  const [activeFilter, setActiveFilter] = useState<'all' | 'trending' | 'new' | 'following' | 'recommended'>('all');
  
  // States
  const [posts, setPosts] = useState<PostType[]>([]);
  const [communities, setCommunities] = useState<CommunityType[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfileType | null>(null);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [connections, setConnections] = useState<ConnectionType[]>([]);
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedCommunity, setSelectedCommunity] = useState('');
  const [newCommunityName, setNewCommunityName] = useState('');
  const [newCommunityDesc, setNewCommunityDesc] = useState('');
  const [newCommunityCategory, setNewCommunityCategory] = useState('');
  const [editingBio, setEditingBio] = useState(false);
  const [newBio, setNewBio] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [selectedChatUser, setSelectedChatUser] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<MessageType[]>([]);
  
  // Dialog states
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isCreateCommunityOpen, setIsCreateCommunityOpen] = useState(false);
  
  // Refs for scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  // Load real data from API
  useEffect(() => {
    if (!studentId) return;
    
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Check if admin mode - must have both admin_token and admin_community_mode flag
        const adminToken = localStorage.getItem('admin_token');
        const studentToken = localStorage.getItem('student_token');
        const adminEmail = localStorage.getItem('admin_email');
        const adminCommunityMode = localStorage.getItem('admin_community_mode') === 'true';
        
        console.log('🔍 Community load check:', {
          adminToken: !!adminToken,
          studentToken: !!studentToken,
          adminEmail,
          adminCommunityMode,
          studentId
        });
        
        // If student is accessing (has student token, no admin token), clear admin mode flag
        if (studentToken && !adminToken) {
          if (adminCommunityMode) {
            localStorage.removeItem('admin_community_mode');
          }
        }
        
        // Only treat as admin if admin token exists AND admin_community_mode is set AND no student token
        const isAdminMode = adminToken && !studentToken && adminCommunityMode && adminEmail;
        
        console.log('🔍 isAdminMode:', isAdminMode);
        
        // Load user profile
        let profile;
        if (isAdminMode && adminEmail) {
          // For admin, create a profile with Admin(username) format
          const username = adminEmail.split('@')[0]; // Extract username from email
          console.log('🔍 Admin username extracted:', username, 'from email:', adminEmail);
          
          // Always create admin profile with Admin(username) format
          const adminName = `Admin(${username})`;
          console.log('🔍 Admin name to use:', adminName);
          
          try {
            // Try to get existing profile first
            profile = await getUserProfile(studentId);
            console.log('🔍 Got existing profile, current name:', profile.anonymized_name);
            
            // Always override the name to show "Admin(username)" regardless of what backend returns
            profile = {
              ...profile,
              anonymized_name: adminName,
              name: adminName
            };
            console.log('🔍 Profile name overridden to:', profile.anonymized_name);
            
            // Update the profile in backend to persist the admin name
            try {
              const updateResult = await updateUserProfile(studentId, {
                bio: profile.bio || 'Administrator',
                major: profile.major || 'Administration',
                anonymized_name: adminName
              });
              console.log('🔍 Updated admin profile in backend, result:', updateResult.anonymized_name);
              // Use the updated profile from backend
              profile = updateResult;
              // Ensure name is still Admin(username) format
              profile.anonymized_name = adminName;
              profile.name = adminName;
            } catch (updateError) {
              console.error('🔍 Failed to update profile in backend:', updateError);
              // Continue with local override even if update fails
            }
          } catch (e) {
            console.log('🔍 No existing profile, creating admin profile');
            // If profile doesn't exist, create a basic one for admin
            profile = {
              student_id: studentId,
              anonymized_name: adminName,
              name: adminName,
              email: adminEmail,
              bio: 'Administrator',
              major: 'Administration',
              year: null,
              interests: [],
              privacy_settings: {
                show_email: false,
                show_major: true,
                show_year: false
              },
              followers_count: 0,
              following_count: 0,
              communities_count: 0,
              posts_count: 0,
              join_date: new Date().toISOString()
            };
            
            // Try to create/update profile in backend
            try {
              await updateUserProfile(studentId, {
                bio: 'Administrator',
                major: 'Administration',
                anonymized_name: adminName
              });
              console.log('🔍 Created admin profile in backend');
            } catch (createError) {
              console.warn('🔍 Failed to create profile in backend (non-critical):', createError);
            }
          }
          
          // Final safety check - ensure name is always Admin(username)
          if (profile.anonymized_name !== adminName) {
            console.warn('🔍 Name mismatch detected, forcing correction:', profile.anonymized_name, '->', adminName);
            profile.anonymized_name = adminName;
            profile.name = adminName;
          }
          
          console.log('🔍 Final admin profile name:', profile.anonymized_name);
        } else {
          // Regular student profile - load normally
          console.log('🔍 Loading regular student profile (not admin mode)');
          profile = await getUserProfile(studentId);
        }
        // Final check: if admin mode, ensure name is always Admin(username)
        if (isAdminMode && adminEmail && profile) {
          const username = adminEmail.split('@')[0];
          const expectedAdminName = `Admin(${username})`;
          if (profile.anonymized_name !== expectedAdminName) {
            console.warn('🔍 Profile name mismatch after load, forcing correction:', profile.anonymized_name, '->', expectedAdminName);
            profile.anonymized_name = expectedAdminName;
            profile.name = expectedAdminName;
          }
        }
        
        setUserProfile(profile);
        
        // Load communities (initially empty) - don't fail if this errors
        try {
          const comms = await listCommunities(studentId);
          setCommunities(comms);
        } catch (e) {
          console.warn('Failed to load communities:', e);
          setCommunities([]);
        }
        
        // Load posts - don't fail if this errors
        try {
          const postsData = await listPosts(studentId);
          console.log('Loaded posts:', postsData?.length || 0, 'posts');
          setPosts(postsData || []);
        } catch (e) {
          console.error('Failed to load posts:', e);
          // Try to load posts without community filter as fallback
          try {
            const allPosts = await listPosts(studentId, undefined, 100, 0);
            console.log('Loaded all posts (fallback):', allPosts?.length || 0, 'posts');
            setPosts(allPosts || []);
          } catch (fallbackError) {
            console.error('Fallback post loading also failed:', fallbackError);
            setPosts([]);
          }
        }
        
        // Load all connections - don't fail if this errors
        try {
          const allConns = await listConnections(studentId);
          setConnections(allConns);
        } catch (e) {
          console.warn('Failed to load connections:', e);
          setConnections([]);
        }
        
      } catch (error: any) {
        console.error('Error loading user profile:', error);
        const errorMessage = error?.message || 'Failed to load data. Please check if the backend is running.';
        setError(errorMessage);
        // Don't show toast for network errors to avoid spam
        if (!errorMessage.includes('Failed to fetch') && !errorMessage.includes('NetworkError')) {
          toast.error(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [studentId]);

  // Ensure admin name persists even if profile is updated elsewhere
  useEffect(() => {
    const adminToken = localStorage.getItem('admin_token');
    const studentToken = localStorage.getItem('student_token');
    const adminEmail = localStorage.getItem('admin_email');
    const adminCommunityMode = localStorage.getItem('admin_community_mode') === 'true';
    const isAdminMode = adminToken && !studentToken && adminCommunityMode && adminEmail;

    if (isAdminMode && adminEmail && userProfile) {
      const username = adminEmail.split('@')[0];
      const expectedAdminName = `Admin(${username})`;
      
      if (userProfile.anonymized_name !== expectedAdminName) {
        console.log('🔍 useEffect: Correcting admin name from', userProfile.anonymized_name, 'to', expectedAdminName);
        setUserProfile({
          ...userProfile,
          anonymized_name: expectedAdminName,
          name: expectedAdminName
        });
      }
    }
  }, [userProfile]);
  
  // Load chat messages when a user is selected
  useEffect(() => {
    if (!studentId || !selectedChatUser) return;
    
    const loadChatMessages = async () => {
      try {
        const msgs = await getMessages(studentId, selectedChatUser);
        setChatMessages(msgs);
      } catch (error: any) {
        console.error('Error loading chat messages:', error);
        // Don't show toast for every failed refresh
        if (chatMessages.length === 0) {
          toast.error('Failed to load messages');
        }
      }
    };
    
    loadChatMessages();
    // Refresh messages every 5 seconds
    const interval = setInterval(loadChatMessages, 5000);
    return () => clearInterval(interval);
  }, [studentId, selectedChatUser]);
  
  // Scroll to bottom of chat
  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const sidebarItems = [
    { key: 'home', title: 'Home', icon: Home },
    { key: 'profile', title: 'My Profile', icon: User },
    { key: 'messages', title: 'Messages', icon: Mail },
    { key: 'matching', title: 'Matching', icon: Users },
    { key: 'communities', title: 'Communities', icon: Briefcase },
    { key: 'settings', title: 'Settings', icon: Settings }
  ];

  const filterButtons = [
    { key: 'all', label: 'All' },
    { key: 'trending', label: 'Trending' },
    { key: 'new', label: 'New' },
    { key: 'following', label: 'Following' },
    { key: 'recommended', label: 'Recommended' }
  ];

  const categories = ['Mental Health', 'Academic', 'Wellness', 'Professional', 'Social', 'Other'];

  // Functions
  const createPost = async () => {
    if (!studentId || !newPostTitle.trim() || !newPostContent.trim() || !selectedCommunity) {
      toast.error('Please fill all fields and select a community');
      return;
    }

    try {
      const newPost = await createPostAPI(studentId, selectedCommunity, newPostTitle, newPostContent);
      setPosts(prev => [newPost, ...prev]);
      setNewPostTitle('');
      setNewPostContent('');
      setSelectedCommunity('');
      setIsCreatePostOpen(false);
      toast.success('Post created successfully!');
    } catch (error) {
      toast.error('Failed to create post');
    }
  };

  const createCommunityHandler = async () => {
    if (!studentId || !newCommunityName.trim() || !newCommunityDesc.trim() || !newCommunityCategory) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      const newCommunity = await createCommunity(studentId, newCommunityName, newCommunityDesc, newCommunityCategory);
      setCommunities(prev => [...prev, newCommunity]);
      setNewCommunityName('');
      setNewCommunityDesc('');
      setNewCommunityCategory('');
      setIsCreateCommunityOpen(false);
      toast.success('Community created successfully!');
    } catch (error) {
      toast.error('Failed to create community');
    }
  };

  const joinCommunity = async (communityId: string) => {
    if (!studentId) return;
    
    try {
      await joinCommunityAPI(studentId, communityId);
      // Refresh communities
      const comms = await listCommunities(studentId);
      setCommunities(comms);
      toast.success('Joined community!');
    } catch (error) {
      toast.error('Failed to join community');
    }
  };

  const leaveCommunity = async (communityId: string) => {
    if (!studentId) return;
    
    try {
      await leaveCommunityAPI(studentId, communityId);
      // Refresh communities
      const comms = await listCommunities(studentId);
      setCommunities(comms);
      toast.success('Left community');
    } catch (error) {
      toast.error('Failed to leave community');
    }
  };

  const updateBio = async () => {
    if (!studentId || !userProfile) return;
    
    try {
      const updated = await updateUserProfile(studentId, { 
        bio: newBio, 
        major: userProfile.major || null 
      });
      setUserProfile(updated);
      setEditingBio(false);
      toast.success('Bio updated!');
    } catch (error) {
      toast.error('Failed to update bio');
    }
  };

  const handleConnectionAction = async (connectionId: string, action: 'accept' | 'reject') => {
    if (!studentId) return;
    
    try {
      if (action === 'accept') {
        await acceptConnection(studentId, connectionId);
      } else {
        await rejectConnection(studentId, connectionId);
      }
      // Refresh all connections
      const conns = await listConnections(studentId);
      setConnections(conns);
      toast.success(action === 'accept' ? 'Connection accepted!' : 'Connection rejected');
    } catch (error) {
      toast.error(`Failed to ${action} connection`);
    }
  };

  const sendChatMessage = async () => {
    if (!studentId || !messageContent.trim() || !selectedChatUser) {
      toast.error('Please enter a message');
      return;
    }

    try {
      const newMessage = await sendMessageAPI(studentId, selectedChatUser, messageContent);
      setChatMessages(prev => [...prev, newMessage]);
      setMessageContent('');
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const likePost = async (postId: string) => {
    if (!studentId) return;
    
    try {
      const result = await likePostAPI(studentId, postId);
      setPosts(prev => 
        prev.map(p => 
          p.post_id === postId 
            ? { ...p, likes_count: result.likes_count, is_liked: result.is_liked }
            : p
        )
      );
    } catch (error) {
      toast.error('Failed to like post');
    }
  };

  const handleUserSearch = async () => {
    if (!studentId || !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    try {
      const results = await searchUsers(studentId, searchQuery);
      setSearchResults(results);
    } catch (error) {
      toast.error('Failed to search users');
    }
  };

  const sendConnectionRequestToUser = async (targetStudentId: string) => {
    if (!studentId) return;
    
    try {
      await sendConnectionRequest(studentId, targetStudentId);
      toast.success('Connection request sent!');
      // Refresh search results
      handleUserSearch();
    } catch (error) {
      toast.error('Failed to send connection request');
    }
  };

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const joinedCommunities = communities.filter(c => c.is_joined);
  const userPosts = posts.filter(p => p.author_id === studentId);
  
  // Get unique chat partners from accepted connections only
  const chatPartners = connections
    .filter(conn => conn.status === 'accepted')
    .map(conn => {
      const otherId = conn.student1_id === studentId ? conn.student2_id : conn.student1_id;
      const otherName = conn.student1_id === studentId ? conn.student2_name : conn.student1_name;
      return { id: otherId, name: otherName };
    });

  // Early return if no studentId (after all hooks)
  if (!studentId) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Please log in to access the community.</p>
          <Button onClick={onToggle} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading && !userProfile) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Loading community...</p>
        </div>
      </div>
    );
  }
  
  // Show error state
  if (error && !userProfile) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-lg text-destructive mb-4">{error}</p>
          <Button onClick={onToggle}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-80 bg-card/50 backdrop-blur-xl border-r border-border flex flex-col p-6 space-y-8">
        {/* User Profile */}
        <div className="flex items-center gap-3">
          <Avatar className="w-12 h-12">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {userProfile?.anonymized_name?.substring(0, 2).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-lg font-bold text-foreground">{userProfile?.anonymized_name || 'User'}</h2>
            <p className="text-sm text-muted-foreground">Anonymous User</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col space-y-2 flex-grow">
          {sidebarItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveView(item.key as any)}
              className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeView === item.key 
                  ? 'bg-primary text-primary-foreground font-bold shadow-lg' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <item.icon className="w-6 h-6" />
              <span>{item.title}</span>
            </button>
          ))}
        </nav>

        {/* Actions */}
        <div className="space-y-4">
          <Dialog open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen}>
            <DialogTrigger asChild>
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg py-3">
                New Post
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Post</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Post title..."
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                />
                <select
                  value={selectedCommunity}
                  onChange={(e) => setSelectedCommunity(e.target.value)}
                  className="w-full p-2 rounded-md border border-input bg-background"
                >
                  <option value="">Select Community</option>
                  {joinedCommunities.map((community) => (
                    <option key={community.community_id} value={community.community_id}>
                      {community.name}
                    </option>
                  ))}
                </select>
                <Textarea
                  placeholder="Share your thoughts..."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  rows={4}
                />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Image className="w-4 h-4 mr-2" />
                    Image
                  </Button>
                  <Button variant="outline" size="sm">
                    <FileVideo className="w-4 h-4 mr-2" />
                    Video
                  </Button>
                </div>
                <div className="flex gap-3">
                  <Button 
                    onClick={createPost} 
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Post
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreatePostOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            onClick={onToggle}
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors duration-200"
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span>Log Out</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex-shrink-0 flex items-center justify-between px-10 py-5 border-b border-border bg-card/30 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Home className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Haven Connect</h1>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative">
              <Input
                className="bg-card border-border rounded-lg py-2 pl-10 pr-4 w-64 focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            </div>
            
            <Button variant="ghost" size="icon" className="p-2 rounded-lg bg-card hover:bg-muted">
              <Bell className="w-6 h-6 text-muted-foreground" />
            </Button>
            
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {userProfile?.anonymized_name?.substring(0, 1) || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-grow overflow-y-auto">
          {/* Home View */}
          {activeView === 'home' && (
            <div className="px-10 py-6 space-y-6">
              {/* Filter Buttons */}
              <div className="flex space-x-3">
                {filterButtons.map((filter) => (
                  <Button
                    key={filter.key}
                    variant={activeFilter === filter.key ? "default" : "secondary"}
                    onClick={() => setActiveFilter(filter.key as any)}
                    className={`px-5 py-2 rounded-lg transition-colors duration-200 ${
                      activeFilter === filter.key
                        ? 'bg-primary text-primary-foreground font-bold'
                        : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>

              {/* Posts */}
              <div className="space-y-6">
                {filteredPosts.map((post) => (
                  <Card key={post.post_id} className="bg-card/60 backdrop-blur-sm border border-border hover:bg-card/80 transition-colors duration-200">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {post.author_name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{post.author_name}</p>
                            <p className="text-sm text-muted-foreground">
                              in {post.community_name} • {new Date(post.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary">{post.community_name}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h3 className="text-xl font-bold text-foreground mb-2">{post.title}</h3>
                        <p className="text-muted-foreground">{post.content}</p>
                      </div>
                      
                      {post.image_url && (
                        <div 
                          className="w-full h-64 rounded-lg bg-cover bg-center border border-border"
                          style={{ backgroundImage: `url(${post.image_url})` }}
                        />
                      )}
                      
                      {post.video_url && (
                        <div className="w-full h-64 rounded-lg bg-muted border border-border flex items-center justify-center">
                          <div className="text-center">
                            <FileVideo className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">{post.video_url}</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-6 pt-4 border-t border-border">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => likePost(post.post_id)}
                          className={`text-muted-foreground ${post.is_liked ? 'text-red-500' : 'hover:text-red-500'}`}
                        >
                          <Heart className={`w-4 h-4 mr-1 ${post.is_liked ? 'fill-current' : ''}`} />
                          {post.likes_count}
                        </Button>
                        <Button variant="ghost" size="sm" className="text-muted-foreground">
                          <MessageCircle className="w-4 h-4 mr-1" />
                          {post.comments_count}
                        </Button>
                        <Button variant="ghost" size="sm" className="text-muted-foreground">
                          <Share className="w-4 h-4 mr-1" />
                          Share
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Profile View */}
          {activeView === 'profile' && userProfile && (
            <div className="px-10 py-6 space-y-6">
              <Card className="bg-card/60 backdrop-blur-sm border border-border">
                <CardContent className="p-6">
                  <div className="flex items-start gap-6">
                    <Avatar className="w-24 h-24">
                      <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                        {userProfile?.anonymized_name?.substring(0, 2).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-4">
                      <div>
                        <h2 className="text-3xl font-bold">{userProfile?.anonymized_name || 'User'}</h2>
                        <div className="flex items-center gap-4 text-muted-foreground mt-2">
                          {userProfile?.major && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {userProfile.major}
                            </span>
                          )}
                          {userProfile?.join_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              Joined {new Date(userProfile.join_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-8">
                        <div className="text-center">
                          <p className="text-2xl font-bold">{userProfile?.followers_count || 0}</p>
                          <p className="text-sm text-muted-foreground">Followers</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">{userProfile?.following_count || 0}</p>
                          <p className="text-sm text-muted-foreground">Following</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">{userProfile?.communities_count || 0}</p>
                          <p className="text-sm text-muted-foreground">Communities</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">{userProfile?.posts_count || 0}</p>
                          <p className="text-sm text-muted-foreground">Posts</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold">Bio</h3>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setEditingBio(true);
                          setNewBio(userProfile?.bio || '');
                        }}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                    
                    {editingBio ? (
                      <div className="space-y-3">
                        <Textarea
                          value={newBio}
                          onChange={(e) => setNewBio(e.target.value)}
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={updateBio}>
                            <Check className="w-4 h-4 mr-1" />
                            Save
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setEditingBio(false)}>
                            <X className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">{userProfile?.bio || 'No bio yet'}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Profile Tabs */}
              <Tabs defaultValue="posts" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="posts">My Posts ({userPosts.length})</TabsTrigger>
                  <TabsTrigger value="communities">Communities ({joinedCommunities.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="posts" className="space-y-4">
                  {userPosts.map((post) => (
                    <Card key={post.post_id} className="bg-card/60 backdrop-blur-sm border border-border">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <Badge variant="secondary">{post.community_name}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(post.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="font-semibold mb-2">{post.title}</h4>
                        <p className="text-muted-foreground text-sm mb-3">{post.content}</p>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <span>{post.likes_count} likes</span>
                          <span>{post.comments_count} comments</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="communities" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {joinedCommunities.map((community) => (
                    <Card key={community.community_id} className="bg-card/60 backdrop-blur-sm border border-border">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold">{community.name}</h4>
                          <Badge variant="outline">{community.category}</Badge>
                        </div>
                        <p className="text-muted-foreground text-sm mb-3">{community.description}</p>
                        <p className="text-xs text-muted-foreground">{community.members_count} members</p>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Messages View - WhatsApp-like */}
          {activeView === 'messages' && (
            <div className="flex h-full">
              {/* Contacts/Connections List */}
              <div className="w-80 border-r border-border flex flex-col">
                <div className="p-4 border-b border-border">
                  <div className="flex items-center gap-2 mb-4">
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        if (e.target.value.trim()) {
                          handleUserSearch();
                        } else {
                          setSearchResults([]);
                        }
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleUserSearch();
                        }
                      }}
                    />
                    <Button size="sm" onClick={handleUserSearch}>
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                  {searchResults.length > 0 && (
                    <div className="space-y-2 mb-4">
                      <p className="text-xs text-muted-foreground font-semibold">Search Results</p>
                      {searchResults.map((user) => (
                        <div key={user.student_id} className="flex items-center justify-between p-2 hover:bg-muted rounded">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                {user.anonymized_name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-semibold">{user.anonymized_name}</p>
                              {user.major && <p className="text-xs text-muted-foreground">{user.major}</p>}
                            </div>
                          </div>
                          {user.connection_status === 'none' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => sendConnectionRequestToUser(user.student_id)}
                            >
                              <UserPlus className="w-3 h-3" />
                            </Button>
                          )}
                          {user.connection_status === 'pending' && (
                            <Badge variant="secondary">Pending</Badge>
                          )}
                          {user.is_connected && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedChatUser(user.student_id)}
                            >
                              <MessageCircle className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground font-semibold">Your Connections</p>
                </div>
                <ScrollArea className="flex-1">
                  <div className="space-y-1 p-2">
                    {chatPartners.map((partner) => (
                      <div
                        key={partner.id}
                        onClick={() => setSelectedChatUser(partner.id)}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-muted ${
                          selectedChatUser === partner.id ? 'bg-muted' : ''
                        }`}
                      >
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {partner.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{partner.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Chat Window */}
              <div className="flex-1 flex flex-col">
                {selectedChatUser ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-4 border-b border-border flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {chatPartners.find(p => p.id === selectedChatUser)?.name.substring(0, 2).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">
                          {chatPartners.find(p => p.id === selectedChatUser)?.name || 'User'}
                        </p>
                      </div>
                    </div>

                    {/* Messages */}
                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-4">
                        {chatMessages.map((msg) => (
                          <div
                            key={msg.message_id}
                            className={`flex ${msg.sender_id === studentId ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                                msg.sender_id === studentId
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              <p className="text-sm">{msg.content}</p>
                              <p className={`text-xs mt-1 ${msg.sender_id === studentId ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        ))}
                        <div ref={chatMessagesEndRef} />
                      </div>
                    </ScrollArea>

                    {/* Message Input */}
                    <div className="p-4 border-t border-border">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Type a message..."
                          value={messageContent}
                          onChange={(e) => setMessageContent(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              sendChatMessage();
                            }
                          }}
                        />
                        <Button onClick={sendChatMessage} disabled={!messageContent.trim()}>
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>Select a connection to start chatting</p>
                      <p className="text-sm mt-2">Or search for users to connect with</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Matching View - Connection Requests */}
          {activeView === 'matching' && (
            <div className="px-10 py-6 space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Connection Requests</h2>
                <p className="text-muted-foreground">Manage your pending connection requests</p>
              </div>

              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Loading...</div>
              ) : (
                <>
                  {(() => {
                    const pendingRequests = connections.filter(c => c.status === 'pending' && c.student2_id === studentId);
                    return pendingRequests.length > 0 ? (
                      <div className="space-y-4">
                        {pendingRequests.map((conn) => (
                          <Card key={conn.connection_id} className="bg-card/60 backdrop-blur-sm border border-border">
                            <CardContent className="p-6">
                              <div className="flex items-start gap-4">
                                <Avatar className="w-16 h-16">
                                  <AvatarFallback className="bg-primary text-primary-foreground">
                                    {conn.student1_name.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <h3 className="font-bold text-lg">{conn.student1_name}</h3>
                                  <p className="text-muted-foreground text-sm mb-4">
                                    Wants to connect with you
                                  </p>
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={() => handleConnectionAction(conn.connection_id, 'accept')}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      <Check className="w-4 h-4 mr-2" />
                                      Accept
                                    </Button>
                                    <Button
                                      onClick={() => handleConnectionAction(conn.connection_id, 'reject')}
                                      variant="destructive"
                                    >
                                      <X className="w-4 h-4 mr-2" />
                                      Reject
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p>No pending connection requests</p>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          )}

          {/* Communities View */}
          {activeView === 'communities' && (
            <div className="px-10 py-6 space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Communities</h2>
                <Dialog open={isCreateCommunityOpen} onOpenChange={setIsCreateCommunityOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Community
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create New Community</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        placeholder="Community name..."
                        value={newCommunityName}
                        onChange={(e) => setNewCommunityName(e.target.value)}
                      />
                      <select
                        value={newCommunityCategory}
                        onChange={(e) => setNewCommunityCategory(e.target.value)}
                        className="w-full p-2 rounded-md border border-input bg-background"
                      >
                        <option value="">Select Category</option>
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                      <Textarea
                        placeholder="Community description..."
                        value={newCommunityDesc}
                        onChange={(e) => setNewCommunityDesc(e.target.value)}
                        rows={3}
                      />
                      <div className="flex gap-3">
                        <Button 
                          onClick={createCommunityHandler} 
                          className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          Create
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setIsCreateCommunityOpen(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <Tabs defaultValue="all" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="all">All Communities</TabsTrigger>
                  <TabsTrigger value="joined">Joined ({joinedCommunities.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {communities.length > 0 ? (
                    communities.map((community) => (
                      <Card key={community.community_id} className="bg-card/60 backdrop-blur-sm border border-border hover:bg-card/80 transition-colors duration-200">
                        <CardContent className="p-6 space-y-4">
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-bold text-lg">{community.name}</h3>
                              <Badge variant="outline">{community.category}</Badge>
                            </div>
                            <p className="text-muted-foreground text-sm">{community.description}</p>
                            <p className="text-xs text-muted-foreground mt-2">Owner: {community.owner_name}</p>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Users className="w-4 h-4" />
                              {community.members_count} members
                            </div>
                            <Button
                              onClick={() => community.is_joined ? leaveCommunity(community.community_id) : joinCommunity(community.community_id)}
                              variant={community.is_joined ? "secondary" : "default"}
                              size="sm"
                            >
                              {community.is_joined ? (
                                <>
                                  <UserMinus className="w-4 h-4 mr-1" />
                                  Leave
                                </>
                              ) : (
                                <>
                                  <UserPlus className="w-4 h-4 mr-1" />
                                  Join
                                </>
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                      <Briefcase className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>No communities yet. Create the first one!</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="joined" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {joinedCommunities.length > 0 ? (
                    joinedCommunities.map((community) => (
                      <Card key={community.community_id} className="bg-card/60 backdrop-blur-sm border border-border">
                        <CardContent className="p-6 space-y-4">
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-bold text-lg">{community.name}</h3>
                              <Badge variant="outline">{community.category}</Badge>
                            </div>
                            <p className="text-muted-foreground text-sm">{community.description}</p>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Users className="w-4 h-4" />
                              {community.members_count} members
                            </div>
                            <Button
                              onClick={() => leaveCommunity(community.community_id)}
                              variant="secondary"
                              size="sm"
                            >
                              <UserMinus className="w-4 h-4 mr-1" />
                              Leave
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                      <p>You haven't joined any communities yet.</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
