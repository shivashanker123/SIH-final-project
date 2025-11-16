import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Heart, 
  Calendar, 
  BookOpen, 
  ClipboardList, 
  BarChart3, 
  Users, 
  AlertTriangle,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  userType: 'student' | 'admin';
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle, userType }) => {
  const navigate = useNavigate();

  const studentItems = [
    { title: 'Personal Care', url: '/student-dashboard', icon: Heart },
    { title: 'Resources & Self-Care', url: '/student-dashboard/resources', icon: BookOpen },
    { title: 'Journal', url: '/student-dashboard/journal', icon: BookOpen },
    { title: 'Book Session', url: '/student-dashboard/booking', icon: Calendar },
  ];

  const adminItems = [
    { title: 'Dashboard', url: '/admin-dashboard', icon: Home },
    { title: 'Results & Alerts', url: '/admin-dashboard/results', icon: BarChart3 },
    { title: 'Student Requests', url: '/admin-dashboard/requests', icon: Users },
  ];

  const items = userType === 'student' ? studentItems : adminItems;

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 h-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-r border-white/20 shadow-2xl z-50 transition-all duration-300 ease-in-out",
        isOpen ? "w-64" : "w-0 lg:w-16",
        "lg:relative lg:translate-x-0",
        !isOpen && "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            {isOpen && (
              <h2 className="text-xl font-bold bg-gradient-to-r from-wellness-calm to-wellness-serene bg-clip-text text-transparent">
                Haven
              </h2>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="glass-card hover:scale-110 transition-all duration-300"
            >
              {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 space-y-2">
            {items.map((item) => (
              <NavLink
                key={item.title}
                to={item.url}
                className={({ isActive }) => cn(
                  "flex items-center px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
                  isActive 
                    ? "bg-gradient-primary text-white shadow-lg" 
                    : "hover:bg-white/20 dark:hover:bg-gray-800/20 text-foreground hover:text-wellness-calm",
                  !isOpen && "lg:justify-center lg:px-2"
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5 transition-all duration-300 group-hover:scale-110",
                  !isOpen && "lg:w-6 lg:h-6"
                )} />
                {isOpen && (
                  <span className="ml-3 font-medium animate-fade-in">
                    {item.title}
                  </span>
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-wellness-calm/20 to-wellness-serene/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
              </NavLink>
            ))}
          </nav>

          {/* User Info & Logout */}
          <div className="mt-auto space-y-4">
            {isOpen && (
              <div className="glass-card p-4 text-center animate-fade-in">
                <div className="w-12 h-12 bg-gradient-primary rounded-full mx-auto mb-2 flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <p className="font-medium text-sm">{userType === 'student' ? 'Student' : 'Admin'} User</p>
                <p className="text-xs text-muted-foreground">Welcome back!</p>
              </div>
            )}
            
            <Button
              onClick={handleLogout}
              variant="ghost"
              className={cn(
                "w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300",
                !isOpen && "lg:justify-center lg:px-2"
              )}
            >
              <LogOut className="w-5 h-5" />
              {isOpen && <span className="ml-3">Logout</span>}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};