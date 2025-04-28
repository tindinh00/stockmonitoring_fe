import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function ThemeSwitch() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[#1a2e3f] hover:bg-[#2a3e51] transition-colors"
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className="sr-only">Toggle theme</span>
      <Sun className={`w-5 h-5 transition-all ${
        theme === 'dark' 
          ? 'opacity-0 rotate-90 scale-0' 
          : 'opacity-100 rotate-0 scale-100'
      } absolute text-yellow-500`} />
      <Moon className={`w-5 h-5 transition-all ${
        theme === 'dark'
          ? 'opacity-100 rotate-0 scale-100'
          : 'opacity-0 -rotate-90 scale-0'
      } absolute text-blue-200`} />
    </button>
  );
} 