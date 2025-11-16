import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const HavenLandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div 
      className="relative min-h-screen w-full flex flex-col"
      style={{
        backgroundImage: "url('https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExeTlzdGkyN3oxbXJmaGFzMnBpczY2czN6dmdiemk1aHQ1b2RuaHZhYiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/Rpig1UYYs6sNYLBWM8/giphy.gif')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="absolute inset-0 bg-black/50" />
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/30 backdrop-blur-sm">
        <nav className="container mx-auto px-6 lg:px-10 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Heart 
              className="h-8 w-8 text-haven-softGlowAqua" 
              style={{ 
                filter: 'drop-shadow(0 0 8px rgba(102, 252, 241, 0.5))',
                textShadow: '0 0 8px rgba(102, 252, 241, 0.5)' 
              }}
              fill="none" 
              stroke="currentColor" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="1.5"
            />
            <h1 
              className="text-xl font-bold text-white"
              style={{ textShadow: '0 0 8px rgba(102, 252, 241, 0.5)' }}
            >
              Haven
            </h1>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a 
              className="text-haven-offWhite hover:text-haven-softGlowAqua transition-colors duration-300 text-sm font-medium" 
              href="#"
            >
              About
            </a>
            <a 
              className="text-haven-offWhite hover:text-haven-softGlowAqua transition-colors duration-300 text-sm font-medium" 
              href="#"
            >
              Services
            </a>
            <a 
              className="text-haven-offWhite hover:text-haven-softGlowAqua transition-colors duration-300 text-sm font-medium" 
              href="#"
            >
              Contact
            </a>
          </div>
          <button className="md:hidden text-haven-offWhite">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M4 6h16M4 12h16m-7 6h7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center relative z-10">
        <section className="container mx-auto px-6 lg:px-10 py-20 lg:py-32 text-center">
          <div className="max-w-3xl mx-auto">
            <h1 
              className="text-4xl md:text-6xl font-extrabold text-haven-offWhite leading-tight mb-6"
              style={{ 
                letterSpacing: '-0.02em',
                textShadow: '0 0 8px rgba(102, 252, 241, 0.5)' 
              }}
            >
              Your Mental Health Journey Starts Here
            </h1>
            <p className="mt-6 text-lg md:text-xl text-haven-mutedGrayAqua leading-relaxed mb-8">
              A safe, supportive platform designed for students to take control of their mental wellbeing. 
              Connect with professional counselors, track your mood, and access a wealth of resources, all in one place.
            </p>
            <div className="mt-8 flex justify-center">
              <Button
                onClick={() => navigate('/mindcare')}
                className="px-8 py-3 bg-gradient-haven text-haven-deepAqua font-bold rounded-lg hover:scale-105 transform transition-transform duration-300"
                style={{
                  boxShadow: '0 0 15px 5px rgba(102, 252, 241, 0.3)'
                }}
              >
                Get Started
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-black/30 backdrop-blur-sm py-8 relative z-10">
        <div className="container mx-auto px-6 lg:px-10 text-center text-haven-mutedGrayAqua">
          <div className="flex justify-center items-center gap-3 mb-4">
            <Heart 
              className="h-8 w-8 text-haven-softGlowAqua" 
              style={{ 
                filter: 'drop-shadow(0 0 8px rgba(102, 252, 241, 0.5))',
                textShadow: '0 0 8px rgba(102, 252, 241, 0.5)' 
              }}
              fill="none" 
              stroke="currentColor" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="1.5"
            />
            <h2 
              className="text-xl font-bold text-haven-offWhite"
              style={{ textShadow: '0 0 8px rgba(102, 252, 241, 0.5)' }}
            >
              Haven
            </h2>
          </div>
          <p className="mb-4 max-w-lg mx-auto text-sm">
            Supporting student mental health with compassionate, professional care.
          </p>
          <p className="text-xs text-haven-subtleGray">© 2024 Haven. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};