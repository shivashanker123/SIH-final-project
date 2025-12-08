import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InteractiveBackground } from '@/components/InteractiveBackground';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { loginStudent } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      const response = await loginStudent({
        email: formData.email,
        password: formData.password
      });
      
      // Store authentication data
      localStorage.setItem('admin_token', response.token);
      localStorage.setItem('admin_email', response.email);
      localStorage.setItem('admin_id', response.student_id);
      
      toast({
        title: "Welcome back!",
        description: `Logged in as ${response.email}`,
      });
      
      setIsLoading(false);
      
      // Navigate to admin dashboard
      navigate('/admin-dashboard');
    } catch (err: any) {
      const errorMessage = err.message || 'Authentication failed. Please try again.';
      setError(errorMessage);
      setIsLoading(false);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen relative" style={{ background: 'var(--gradient-background)' }}>
      <InteractiveBackground />
      
      <div className="relative z-10 container mx-auto px-6 py-12 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-8 hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>

          {/* Admin Login Card */}
          <Card className="bg-gray-800/90 backdrop-blur-md border border-gray-700/50 shadow-xl">
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                <Shield className="w-8 h-8 text-cyan-400" />
              </div>
              <CardTitle className="text-3xl font-bold text-cyan-400">
                Admin Portal
              </CardTitle>
              <CardDescription className="text-gray-300 mt-2">
                Secure access for counselors and administrators
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-white">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your admin email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="pl-10 bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-cyan-400"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-white">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Enter your secure password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="pl-10 bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-cyan-400"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 text-sm text-red-200 bg-red-900/50 rounded-md border border-red-600">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-cyan-500 hover:bg-cyan-600 text-gray-900"
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Authenticating...
                    </>
                  ) : (
                    'Access Dashboard'
                  )}
                </Button>
              </form>

              <div className="mt-6 p-4 bg-gray-700/30 rounded-lg">
                <p className="text-xs text-gray-400 text-center">
                  This portal is restricted to authorized personnel only. 
                  All activities are monitored and logged for security purposes.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};