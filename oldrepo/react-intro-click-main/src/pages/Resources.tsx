import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Video, 
  Headphones, 
  FileText, 
  Search,
  Clock,
  Star,
  Download,
  ExternalLink,
  Heart,
  Brain,
  Shield
} from 'lucide-react';
import { ShimmerCard } from '@/components/LoadingSpinner';

interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'article' | 'video' | 'audio' | 'pdf';
  category: 'anxiety' | 'depression' | 'stress' | 'wellness' | 'general';
  duration?: string;
  rating: number;
  featured: boolean;
  url?: string;
}

export const Resources: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const resources: Resource[] = [
    {
      id: '1',
      title: 'Understanding Anxiety: A Complete Guide',
      description: 'Learn about anxiety disorders, symptoms, and effective coping strategies.',
      type: 'article',
      category: 'anxiety',
      duration: '8 min read',
      rating: 4.8,
      featured: true,
    },
    {
      id: '2',
      title: 'Mindfulness Meditation for Beginners',
      description: 'A guided meditation video to help you start your mindfulness journey.',
      type: 'video',
      category: 'wellness',
      duration: '12 min',
      rating: 4.9,
      featured: true,
    },
    {
      id: '3',
      title: 'Stress Management Techniques',
      description: 'Practical audio guide on managing stress in daily life.',
      type: 'audio',
      category: 'stress',
      duration: '15 min',
      rating: 4.7,
      featured: false,
    },
    {
      id: '4',
      title: 'Depression Support Workbook',
      description: 'Downloadable PDF with exercises and worksheets for depression support.',
      type: 'pdf',
      category: 'depression',
      duration: '24 pages',
      rating: 4.6,
      featured: true,
    },
    {
      id: '5',
      title: 'Building Resilience in Daily Life',
      description: 'Learn how to develop mental resilience and bounce back from challenges.',
      type: 'article',
      category: 'wellness',
      duration: '6 min read',
      rating: 4.8,
      featured: false,
    },
    {
      id: '6',
      title: 'Sleep and Mental Health',
      description: 'Understanding the connection between sleep quality and mental wellness.',
      type: 'video',
      category: 'general',
      duration: '18 min',
      rating: 4.5,
      featured: false,
    }
  ];

  const categories = [
    { id: 'all', label: 'All Resources', icon: BookOpen },
    { id: 'anxiety', label: 'Anxiety', icon: Brain },
    { id: 'depression', label: 'Depression', icon: Heart },
    { id: 'stress', label: 'Stress', icon: Shield },
    { id: 'wellness', label: 'Wellness', icon: Star },
    { id: 'general', label: 'General', icon: FileText }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return Video;
      case 'audio': return Headphones;
      case 'pdf': return Download;
      default: return FileText;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video': return 'from-red-500 to-pink-500';
      case 'audio': return 'from-purple-500 to-indigo-500';
      case 'pdf': return 'from-green-500 to-teal-500';
      default: return 'from-blue-500 to-cyan-500';
    }
  };

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredResources = resources.filter(resource => resource.featured);

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
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="student">
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="glass-card p-8 text-center tilt-card">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-wellness-calm to-wellness-serene bg-clip-text text-transparent mb-4">
            Mental Health Resources
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            Discover tools, articles, and guides to support your mental wellness journey
          </p>
          
          {/* Search */}
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search resources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 glass-input"
            />
          </div>
        </div>

        {/* Featured Resources */}
        {featuredResources.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <Star className="w-6 h-6 text-wellness-warm" />
              Featured Resources
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {featuredResources.map((resource, index) => {
                const TypeIcon = getTypeIcon(resource.type);
                return (
                  <Card
                    key={resource.id}
                    className="glass-card border-0 hover:shadow-2xl transition-all duration-500 cursor-pointer tilt-card group"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${getTypeColor(resource.type)} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                          <TypeIcon className="w-6 h-6 text-white" />
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {resource.category}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{resource.title}</CardTitle>
                      <CardDescription>{resource.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {resource.duration}
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{resource.rating}</span>
                        </div>
                      </div>
                      <Button className="w-full btn-glass group-hover:bg-white/30">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Access Resource
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Categories and All Resources */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="space-y-6">
          <TabsList className="grid grid-cols-6 w-full glass-card">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="flex items-center gap-2 data-[state=active]:bg-white/30"
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{category.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category.id} value={category.id}>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredResources.map((resource, index) => {
                  const TypeIcon = getTypeIcon(resource.type);
                  return (
                    <Card
                      key={resource.id}
                      className="glass-card border-0 hover:shadow-xl transition-all duration-300 cursor-pointer tilt-card group"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${getTypeColor(resource.type)} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                            <TypeIcon className="w-5 h-5 text-white" />
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {resource.type}
                          </Badge>
                        </div>
                        <CardTitle className="text-base">{resource.title}</CardTitle>
                        <CardDescription className="text-sm">{resource.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {resource.duration}
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs">{resource.rating}</span>
                          </div>
                        </div>
                        <Button size="sm" className="w-full btn-glass">
                          View
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              
              {filteredResources.length === 0 && (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Resources Found</h3>
                  <p className="text-muted-foreground">Try adjusting your search or category filters.</p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </DashboardLayout>
  );
};