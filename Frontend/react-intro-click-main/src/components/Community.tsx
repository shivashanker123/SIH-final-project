import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
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

interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  authorName: string;
  community: string;
  communityName: string;
  timestamp: number;
  likes: number;
  comments: number;
  imageUrl?: string;
  videoUrl?: string;
}

interface Community {
  id: string;
  name: string;
  description: string;
  members: number;
  category: string;
  isJoined: boolean;
}

interface UserProfile {
  id: string;
  name: string;
  bio: string;
  followers: number;
  following: number;
  joinedCommunities: string[];
  isFollowing: boolean;
  avatar: string;
  location?: string;
  joinDate: string;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
  status: 'pending' | 'accepted' | 'rejected';
}

interface MatchUser {
  id: string;
  name: string;
  bio: string;
  avatar: string;
  successStory: string;
  commonIssues: string[];
  recoveryTime: string;
  isMatched: boolean;
}

interface CommunityProps {
  onToggle: () => void;
}

export const Community: React.FC<CommunityProps> = ({ onToggle }) => {
  const [activeView, setActiveView] = useState<'home' | 'profile' | 'messages' | 'matching' | 'communities'>('home');
  const [activeFilter, setActiveFilter] = useState<'all' | 'trending' | 'new' | 'following' | 'recommended'>('all');
  
  // States
  const [posts, setPosts] = useState<Post[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [matchUsers, setMatchUsers] = useState<MatchUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
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
  const [selectedUser, setSelectedUser] = useState<string>('');
  
  // Dialog states
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isCreateCommunityOpen, setIsCreateCommunityOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  
  const [anonymousId] = useState(() => `user_${Math.random().toString(36).substr(2, 6)}`);

  // Mock data initialization
  useEffect(() => {
    // Mock user profile
    setUserProfile({
      id: anonymousId,
      name: 'Sophia Chen',
      bio: 'Mental health advocate and computer science student. Sharing my journey of overcoming anxiety and building resilience. Always here to listen and support others. 🌱✨',
      followers: 247,
      following: 183,
      joinedCommunities: ['anxiety-support', 'student-life', 'mindfulness'],
      isFollowing: false,
      avatar: '/placeholder.svg',
      location: 'San Francisco, CA',
      joinDate: 'March 2023'
    });

    // Mock communities
    setCommunities([
      { id: 'anxiety-support', name: 'Anxiety Support', description: 'A safe space for those dealing with anxiety', members: 1240, category: 'Mental Health', isJoined: true },
      { id: 'depression-help', name: 'Depression Help', description: 'Support and resources for depression recovery', members: 890, category: 'Mental Health', isJoined: false },
      { id: 'student-life', name: 'Student Life', description: 'Navigate the challenges of academic life', members: 2150, category: 'Academic', isJoined: true },
      { id: 'mindfulness', name: 'Mindfulness Practice', description: 'Daily mindfulness and meditation practices', members: 756, category: 'Wellness', isJoined: true },
      { id: 'career-stress', name: 'Career Stress', description: 'Managing stress in professional environments', members: 445, category: 'Professional', isJoined: false }
    ]);

    // Mock posts
    setPosts([
      {
        id: '1',
        title: 'My journey overcoming social anxiety in college',
        content: 'Two years ago, I could barely speak in class. Today I presented my thesis to 50+ people. Here\'s what helped me...',
        author: 'user_123',
        authorName: 'Alex M.',
        community: 'anxiety-support',
        communityName: 'Anxiety Support',
        timestamp: Date.now() - 3600000,
        likes: 24,
        comments: 8,
        imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop'
      },
      {
        id: '2',
        title: 'Study techniques that saved my mental health',
        content: 'Balancing academics and self-care seemed impossible until I discovered these strategies. Hope this helps someone!',
        author: 'user_456',
        authorName: 'Maya K.',
        community: 'student-life',
        communityName: 'Student Life',
        timestamp: Date.now() - 7200000,
        likes: 67,
        comments: 15,
        imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=300&fit=crop'
      },
      {
        id: '3',
        title: 'Meditation changed my life - 6 months progress',
        content: 'Started with just 5 minutes a day. Now I can\'t imagine my life without this practice. Here\'s my transformation...',
        author: 'user_789',
        authorName: 'Jordan L.',
        community: 'mindfulness',
        communityName: 'Mindfulness Practice',
        timestamp: Date.now() - 10800000,
        likes: 43,
        comments: 12,
        videoUrl: 'meditation-progress.mp4'
      }
    ]);

    // Mock messages
    setMessages([
      {
        id: '1',
        senderId: 'user_alex',
        senderName: 'Alex M.',
        content: 'Hey! I saw your post about anxiety. I\'d love to connect and share experiences.',
        timestamp: Date.now() - 3600000,
        status: 'pending'
      },
      {
        id: '2',
        senderId: 'user_sarah',
        senderName: 'Sarah J.',
        content: 'Your mindfulness tips really helped me. Thank you for sharing your journey!',
        timestamp: Date.now() - 7200000,
        status: 'accepted'
      }
    ]);

    // Mock match users (success stories)
    setMatchUsers([
      {
        id: 'match_1',
        name: 'Emma Rodriguez',
        bio: 'Overcame severe depression through therapy and community support',
        avatar: '/placeholder.svg',
        successStory: 'After 3 years of struggling with depression, I found my way back to happiness through consistent therapy, medication, and amazing community support. Now I help others on their journey.',
        commonIssues: ['Depression', 'Academic Stress'],
        recoveryTime: '3 years',
        isMatched: false
      },
      {
        id: 'match_2',
        name: 'Marcus Chen',
        bio: 'Beat social anxiety and now public speaking coach',
        avatar: '/placeholder.svg',
        successStory: 'From barely being able to order food to becoming a public speaking coach. The journey wasn\'t easy, but every small step counted. You can do this too!',
        commonIssues: ['Social Anxiety', 'Self Confidence'],
        recoveryTime: '2 years',
        isMatched: false
      },
      {
        id: 'match_3',
        name: 'Riley Taylor',
        bio: 'Transformed eating disorder recovery into helping others',
        avatar: '/placeholder.svg',
        successStory: 'Recovery taught me self-compassion and resilience. Now I use my experience to guide others through their healing journey. There is always hope.',
        commonIssues: ['Eating Disorders', 'Body Image'],
        recoveryTime: '4 years',
        isMatched: true
      }
    ]);
  }, [anonymousId]);

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
  const createPost = () => {
    if (!newPostTitle.trim() || !newPostContent.trim() || !selectedCommunity) {
      toast.error('Please fill all fields and select a community');
      return;
    }

    const community = communities.find(c => c.id === selectedCommunity);
    const newPost: Post = {
      id: Date.now().toString(),
      title: newPostTitle,
      content: newPostContent,
      author: anonymousId,
      authorName: userProfile?.name || 'Anonymous',
      community: selectedCommunity,
      communityName: community?.name || 'Unknown',
      timestamp: Date.now(),
      likes: 0,
      comments: 0
    };

    setPosts(prev => [newPost, ...prev]);
    setNewPostTitle('');
    setNewPostContent('');
    setSelectedCommunity('');
    setIsCreatePostOpen(false);
    toast.success('Post created successfully!');
  };

  const createCommunity = () => {
    if (!newCommunityName.trim() || !newCommunityDesc.trim() || !newCommunityCategory) {
      toast.error('Please fill all fields');
      return;
    }

    const newCommunity: Community = {
      id: Date.now().toString(),
      name: newCommunityName,
      description: newCommunityDesc,
      members: 1,
      category: newCommunityCategory,
      isJoined: true
    };

    setCommunities(prev => [...prev, newCommunity]);
    setNewCommunityName('');
    setNewCommunityDesc('');
    setNewCommunityCategory('');
    setIsCreateCommunityOpen(false);
    toast.success('Community created successfully!');
  };

  const joinCommunity = (communityId: string) => {
    setCommunities(prev => 
      prev.map(c => 
        c.id === communityId 
          ? { ...c, isJoined: !c.isJoined, members: c.isJoined ? c.members - 1 : c.members + 1 }
          : c
      )
    );
    const community = communities.find(c => c.id === communityId);
    toast.success(community?.isJoined ? 'Left community' : 'Joined community!');
  };

  const updateBio = () => {
    if (userProfile) {
      setUserProfile({ ...userProfile, bio: newBio });
      setEditingBio(false);
      toast.success('Bio updated!');
    }
  };

  const handleMessageAction = (messageId: string, action: 'accept' | 'reject') => {
    setMessages(prev => 
      prev.map(m => 
        m.id === messageId ? { ...m, status: action === 'accept' ? 'accepted' : 'rejected' } : m
      )
    );
    toast.success(action === 'accept' ? 'Message request accepted!' : 'Message request rejected');
  };

  const sendMessage = () => {
    if (!messageContent.trim() || !selectedUser) {
      toast.error('Please select a user and enter a message');
      return;
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: anonymousId,
      senderName: userProfile?.name || 'You',
      content: messageContent,
      timestamp: Date.now(),
      status: 'accepted'
    };

    setMessages(prev => [...prev, newMessage]);
    setMessageContent('');
    toast.success('Message sent!');
  };

  const likePost = (postId: string) => {
    setPosts(prev => 
      prev.map(p => 
        p.id === postId ? { ...p, likes: p.likes + 1 } : p
      )
    );
  };

  const connectWithMatch = (matchId: string) => {
    setMatchUsers(prev => 
      prev.map(m => 
        m.id === matchId ? { ...m, isMatched: !m.isMatched } : m
      )
    );
    const match = matchUsers.find(m => m.id === matchId);
    toast.success(match?.isMatched ? 'Disconnected from match' : 'Connected with match!');
  };

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const joinedCommunities = communities.filter(c => c.isJoined);
  const userPosts = posts.filter(p => p.author === anonymousId);

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-80 bg-card/50 backdrop-blur-xl border-r border-border flex flex-col p-6 space-y-8">
        {/* User Profile */}
        <div className="flex items-center gap-3">
          <Avatar className="w-12 h-12">
            <AvatarImage src={userProfile?.avatar} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {userProfile?.name?.substring(0, 2).toUpperCase() || 'SC'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-lg font-bold text-foreground">{userProfile?.name}</h2>
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
                    <option key={community.id} value={community.id}>
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
              <AvatarImage src={userProfile?.avatar} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {userProfile?.name?.substring(0, 1) || 'S'}
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
                  <Card key={post.id} className="bg-card/60 backdrop-blur-sm border border-border hover:bg-card/80 transition-colors duration-200">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {post.authorName.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{post.authorName}</p>
                            <p className="text-sm text-muted-foreground">
                              in {post.communityName} • {new Date(post.timestamp).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary">{post.communityName}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h3 className="text-xl font-bold text-foreground mb-2">{post.title}</h3>
                        <p className="text-muted-foreground">{post.content}</p>
                      </div>
                      
                      {post.imageUrl && (
                        <div 
                          className="w-full h-64 rounded-lg bg-cover bg-center border border-border"
                          style={{ backgroundImage: `url(${post.imageUrl})` }}
                        />
                      )}
                      
                      {post.videoUrl && (
                        <div className="w-full h-64 rounded-lg bg-muted border border-border flex items-center justify-center">
                          <div className="text-center">
                            <FileVideo className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">{post.videoUrl}</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-6 pt-4 border-t border-border">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => likePost(post.id)}
                          className="text-muted-foreground hover:text-red-500"
                        >
                          <Heart className="w-4 h-4 mr-1" />
                          {post.likes}
                        </Button>
                        <Button variant="ghost" size="sm" className="text-muted-foreground">
                          <MessageCircle className="w-4 h-4 mr-1" />
                          {post.comments}
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
                      <AvatarImage src={userProfile.avatar} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                        {userProfile.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-4">
                      <div>
                        <h2 className="text-3xl font-bold">{userProfile.name}</h2>
                        <div className="flex items-center gap-4 text-muted-foreground mt-2">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {userProfile.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Joined {userProfile.joinDate}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex gap-8">
                        <div className="text-center">
                          <p className="text-2xl font-bold">{userProfile.followers}</p>
                          <p className="text-sm text-muted-foreground">Followers</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">{userProfile.following}</p>
                          <p className="text-sm text-muted-foreground">Following</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">{joinedCommunities.length}</p>
                          <p className="text-sm text-muted-foreground">Communities</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">{userPosts.length}</p>
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
                          setNewBio(userProfile.bio);
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
                      <p className="text-muted-foreground">{userProfile.bio}</p>
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
                    <Card key={post.id} className="bg-card/60 backdrop-blur-sm border border-border">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <Badge variant="secondary">{post.communityName}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(post.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="font-semibold mb-2">{post.title}</h4>
                        <p className="text-muted-foreground text-sm mb-3">{post.content}</p>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <span>{post.likes} likes</span>
                          <span>{post.comments} comments</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="communities" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {joinedCommunities.map((community) => (
                    <Card key={community.id} className="bg-card/60 backdrop-blur-sm border border-border">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold">{community.name}</h4>
                          <Badge variant="outline">{community.category}</Badge>
                        </div>
                        <p className="text-muted-foreground text-sm mb-3">{community.description}</p>
                        <p className="text-xs text-muted-foreground">{community.members} members</p>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Messages View */}
          {activeView === 'messages' && (
            <div className="px-10 py-6 space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Messages</h2>
                <Badge variant="secondary">{messages.filter(m => m.status === 'pending').length} pending</Badge>
              </div>

              <div className="space-y-4">
                {messages.map((message) => (
                  <Card key={message.id} className="bg-card/60 backdrop-blur-sm border border-border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {message.senderName.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">{message.senderName}</h4>
                              <Badge variant={message.status === 'pending' ? 'destructive' : message.status === 'accepted' ? 'default' : 'secondary'}>
                                {message.status}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground text-sm mb-2">{message.content}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(message.timestamp).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        {message.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => handleMessageAction(message.id, 'accept')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleMessageAction(message.id, 'reject')}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                        
                        {message.status === 'accepted' && (
                          <Button size="sm" variant="outline">
                            <MessageCircle className="w-4 h-4 mr-1" />
                            Reply
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Send New Message */}
              <Card className="bg-card/60 backdrop-blur-sm border border-border">
                <CardHeader>
                  <CardTitle>Send New Message</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full p-2 rounded-md border border-input bg-background"
                  >
                    <option value="">Select a user</option>
                    {matchUsers.filter(m => m.isMatched).map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                  <Textarea
                    placeholder="Type your message..."
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    rows={3}
                  />
                  <Button onClick={sendMessage} className="bg-primary hover:bg-primary/90">
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Matching View */}
          {activeView === 'matching' && (
            <div className="px-10 py-6 space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Mental Health Success Stories</h2>
                <p className="text-muted-foreground">Connect with people who have overcome similar challenges</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {matchUsers.map((match) => (
                  <Card key={match.id} className="bg-card/60 backdrop-blur-sm border border-border">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-start gap-4">
                        <Avatar className="w-16 h-16">
                          <AvatarImage src={match.avatar} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {match.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg">{match.name}</h3>
                          <p className="text-muted-foreground text-sm">{match.bio}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span className="text-sm">Recovery: {match.recoveryTime}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <h4 className="font-semibold text-sm mb-2">Common Experiences:</h4>
                          <div className="flex flex-wrap gap-2">
                            {match.commonIssues.map((issue, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {issue}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold text-sm mb-2">Success Story:</h4>
                          <p className="text-muted-foreground text-sm">{match.successStory}</p>
                        </div>
                      </div>

                      <Button
                        onClick={() => connectWithMatch(match.id)}
                        className={`w-full ${match.isMatched ? 'bg-green-600 hover:bg-green-700' : 'bg-primary hover:bg-primary/90'}`}
                      >
                        {match.isMatched ? (
                          <>
                            <UserCheck className="w-4 h-4 mr-2" />
                            Connected
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Connect
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
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
                          onClick={createCommunity} 
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
                  {communities.map((community) => (
                    <Card key={community.id} className="bg-card/60 backdrop-blur-sm border border-border hover:bg-card/80 transition-colors duration-200">
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
                            {community.members} members
                          </div>
                          <Button
                            onClick={() => joinCommunity(community.id)}
                            variant={community.isJoined ? "secondary" : "default"}
                            size="sm"
                          >
                            {community.isJoined ? (
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
                  ))}
                </TabsContent>

                <TabsContent value="joined" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {joinedCommunities.map((community) => (
                    <Card key={community.id} className="bg-card/60 backdrop-blur-sm border border-border">
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
                            {community.members} members
                          </div>
                          <Button
                            onClick={() => joinCommunity(community.id)}
                            variant="secondary"
                            size="sm"
                          >
                            <UserMinus className="w-4 h-4 mr-1" />
                            Leave
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};