import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-white/60 dark:bg-gray-700/60 hover:bg-white/80 dark:hover:bg-gray-600/80 border border-gray-200 dark:border-gray-600 shadow-sm transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 flex items-center justify-center rounded-md bg-gradient-to-tr from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 shadow"> 
          {theme === 'dark' ? <Moon className="w-4 h-4 text-gray-800 dark:text-gray-100" /> : <Sun className="w-4 h-4 text-yellow-500" />}
        </div>
        <div className="text-sm font-medium text-gray-800 dark:text-gray-100">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</div>
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-300">Toggle</div>
    </button>
  );
};

export default ThemeToggle;
