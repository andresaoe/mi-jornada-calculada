import { useEffect, useState } from 'react';
import androidStudioLogo from '@/assets/android-studio-logo.png';
import githubLogo from '@/assets/github-logo.png';

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen = ({ onFinish }: SplashScreenProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onFinish, 300); // Wait for fade out animation
    }, 2500);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-primary via-primary/90 to-primary/80 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="flex flex-col items-center gap-8 px-4 animate-fade-in">
        {/* Logos */}
        <div className="flex items-center gap-6">
          <img
            src={androidStudioLogo}
            alt="Android Studio"
            className="w-16 h-16 sm:w-20 sm:h-20 animate-scale-in"
            style={{ animationDelay: '0.2s' }}
          />
          <div className="w-px h-16 sm:h-20 bg-primary-foreground/30" />
          <img
            src={githubLogo}
            alt="GitHub"
            className="w-16 h-16 sm:w-20 sm:h-20 animate-scale-in"
            style={{ animationDelay: '0.4s' }}
          />
        </div>

        {/* Developer info */}
        <div className="text-center animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <p className="text-primary-foreground/90 text-sm sm:text-base font-medium">
            Desarrollado por
          </p>
          <p className="text-primary-foreground text-lg sm:text-xl font-bold mt-1">
            Andres Osorio
          </p>
          <p className="text-primary-foreground/80 text-sm sm:text-base mt-1">
            @andresaoe
          </p>
        </div>

        {/* Loading indicator */}
        <div className="flex gap-1.5 mt-4 animate-fade-in" style={{ animationDelay: '0.8s' }}>
          <div className="w-2 h-2 rounded-full bg-primary-foreground/60 animate-pulse" />
          <div className="w-2 h-2 rounded-full bg-primary-foreground/60 animate-pulse" style={{ animationDelay: '0.2s' }} />
          <div className="w-2 h-2 rounded-full bg-primary-foreground/60 animate-pulse" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
