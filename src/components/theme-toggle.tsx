'use client';

import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from './ui/skeleton';

export function ThemeToggle() {
  const [theme, setTheme] = useState<string | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    setTheme(savedTheme || systemTheme);
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };
  
  if (theme === null) {
    return <Skeleton className="h-10 w-10 rounded-full" />;
  }

  return (
    <div className="flex items-center justify-between space-x-2">
        <Label htmlFor="theme-switcher" className="flex items-center gap-2 cursor-pointer">
            {theme === 'light' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span>{theme === 'light' ? 'Light Mode' : 'Dark Mode'}</span>
        </Label>
        <Switch
            id="theme-switcher"
            checked={theme === 'dark'}
            onCheckedChange={toggleTheme}
            aria-label="Toggle theme"
        />
    </div>
  );
}
