import React from 'react';
import { Button } from '@/components/ui/button';
import { Brain, Sparkles } from 'lucide-react';

interface AIButtonProps {
  onClick: () => void;
}

export const AIButton: React.FC<AIButtonProps> = ({ onClick }) => {
  return (
    <Button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 h-16 w-16 rounded-full bg-gradient-primary shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300 border-2 border-white/20 backdrop-blur-sm group"
    >
      <div className="relative">
        <Brain className="w-6 h-6 text-white transition-transform group-hover:scale-110" />
        <Sparkles className="w-3 h-3 text-white/80 absolute -top-1 -right-1 animate-pulse" />
        
        {/* Pulsing ring effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-primary opacity-30 animate-ping" />
        <div className="absolute inset-0 rounded-full bg-gradient-primary opacity-20 animate-pulse" />
      </div>
    </Button>
  );
};