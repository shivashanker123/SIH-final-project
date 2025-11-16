import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InteractiveBackground } from '@/components/InteractiveBackground';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { loginStudent, signupStudent } from '@/services/api';
import { useStudent } from '@/contexts/StudentContext';
import { useToast } from '@/hooks/use-toast';

export const StudentLogin: React.FC = () => {
  const navigate = useNavigate();
  const { setStudentId } = useStudent();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: '',
    major: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      let response: { student_id: string; email: string; name: string; token: string };
      
      if (isLogin) {
        // Login
        response = await loginStudent({
          email: formData.email,
          password: formData.password
        });
      } else {
        // Signup
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setIsLoading(false);
          return;
        }
        
        response = await signupStudent({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          confirm_password: formData.confirmPassword,
          major: formData.major || undefined
        });
      }
      
      // Store authentication data FIRST, before navigation
      localStorage.setItem('student_token', response.token);
      localStorage.setItem('student_email', response.email);
      localStorage.setItem('studentId', response.student_id);
      
      // Update context state
      setStudentId(response.student_id);
      
      // Show success message
      toast({
        title: isLogin ? "Welcome back!" : "Account created!",
        description: isLogin 
          ? `Logged in as ${response.email}`
          : `Welcome to MindCare, ${response.name}!`,
      });
      
      // Small delay to ensure state is set, then navigate
      setTimeout(() => {
        setIsLoading(false);
        navigate('/student-dashboard');
      }, 100);
      
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
    <div className="min-h-screen bg-gradient-to-br from-background via-wellness-calm/5 to-wellness-serene/10 relative">
      <InteractiveBackground />
      
      <div className="relative z-10 container mx-auto px-6 py-12 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-8 btn-glass group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
            Back to Home
          </Button>

          {/* Login/Register Card */}
          <Card className="glass-card border-0 shadow-glass animate-scale-in">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-wellness-calm to-wellness-serene bg-clip-text text-transparent">
                {isLogin ? 'Welcome Back' : 'Join MindCare'}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {isLogin ? 'Sign in to your student account' : 'Create your student account'}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                    {error}
                  </div>
                )}
                {!isLogin && (
                  <div className="space-y-2 animate-fade-in">
                    <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="pl-10 glass-card border-0 focus:ring-2 focus:ring-wellness-calm transition-all duration-300"
                        required={!isLogin}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="pl-10 glass-card border-0 focus:ring-2 focus:ring-wellness-calm transition-all duration-300"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="pl-10 glass-card border-0 focus:ring-2 focus:ring-wellness-calm transition-all duration-300"
                      required
                    />
                  </div>
                </div>

                {!isLogin && (
                  <>
                    <div className="space-y-2 animate-fade-in">
                      <Label htmlFor="major" className="text-sm font-medium">Major (Optional)</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          id="major"
                          name="major"
                          type="text"
                          placeholder="e.g., Computer Science, Psychology"
                          value={formData.major}
                          onChange={handleInputChange}
                          className="pl-10 glass-card border-0 focus:ring-2 focus:ring-wellness-calm transition-all duration-300"
                        />
                      </div>
                    </div>
                    <div className="space-y-2 animate-fade-in">
                      <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password"
                          placeholder="Confirm your password"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          className="pl-10 glass-card border-0 focus:ring-2 focus:ring-wellness-calm transition-all duration-300"
                          required={!isLogin}
                        />
                      </div>
                    </div>
                  </>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-primary group relative overflow-hidden"
                >
                  {isLoading ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : null}
                  <span className="relative z-10">
                    {isLoading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-wellness-serene to-wellness-peaceful opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Button>
              </form>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-wellness-calm hover:text-wellness-serene transition-colors duration-300 text-sm font-medium"
                >
                  {isLogin 
                    ? "Don't have an account? Sign up" 
                    : "Already have an account? Sign in"
                  }
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};