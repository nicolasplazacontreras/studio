"use client"

import { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Palette } from 'lucide-react';
import { Label } from './ui/label';

// Define light theme HSL values
const lightTheme = {
  background: { h: 0, s: 0, l: 98 },
  foreground: { h: 240, s: 10, l: 3.9 },
  card: { h: 0, s: 0, l: 100 },
  cardForeground: { h: 240, s: 10, l: 3.9 },
  popover: { h: 0, s: 0, l: 100 },
  popoverForeground: { h: 240, s: 10, l: 3.9 },
  primary: { h: 330, s: 60, l: 55 },
  primaryForeground: { h: 0, s: 0, l: 98 },
  secondary: { h: 240, s: 4.8, l: 95.9 },
  secondaryForeground: { h: 240, s: 5.9, l: 10 },
  muted: { h: 240, s: 4.8, l: 95.9 },
  mutedForeground: { h: 240, s: 3.8, l: 46.1 },
  accent: { h: 240, s: 4.8, l: 95.9 },
  accentForeground: { h: 240, s: 5.9, l: 10 },
  destructive: { h: 0, s: 84.2, l: 60.2 },
  destructiveForeground: { h: 0, s: 0, l: 98 },
  border: { h: 240, s: 5.9, l: 90 },
  input: { h: 240, s: 5.9, l: 90 },
  ring: { h: 330, s: 60, l: 55 },
  sidebarBackground: { h: 240, s: 4.8, l: 95.9 },
  sidebarForeground: { h: 240, s: 5.9, l: 10 },
  sidebarPrimary: { h: 330, s: 60, l: 55 },
  sidebarPrimaryForeground: { h: 0, s: 0, l: 98 },
  sidebarAccent: { h: 0, s: 0, l: 100 },
  sidebarAccentForeground: { h: 240, s: 5.9, l: 10 },
  sidebarBorder: { h: 240, s: 5.9, l: 90 },
  sidebarRing: { h: 330, s: 60, l: 55 },
};

// Define dark theme (space gray) HSL values
const darkTheme = {
  background: { h: 222, s: 15, l: 20 },
  foreground: { h: 210, s: 20, l: 98 },
  card: { h: 224, s: 20, l: 13 },
  cardForeground: { h: 210, s: 20, l: 98 },
  popover: { h: 224, s: 20, l: 13 },
  popoverForeground: { h: 210, s: 20, l: 98 },
  primary: { h: 271, s: 56, l: 52 },
  primaryForeground: { h: 210, s: 20, l: 98 },
  secondary: { h: 223, s: 20, l: 16 },
  secondaryForeground: { h: 210, s: 20, l: 98 },
  muted: { h: 223, s: 20, l: 16 },
  mutedForeground: { h: 231, s: 10, l: 65 },
  accent: { h: 223, s: 20, l: 18 },
  accentForeground: { h: 210, s: 20, l: 98 },
  destructive: { h: 0, s: 72, l: 51 },
  destructiveForeground: { h: 210, s: 20, l: 98 },
  border: { h: 223, s: 20, l: 17 },
  input: { h: 223, s: 20, l: 17 },
  ring: { h: 271, s: 56, l: 52 },
  sidebarBackground: { h: 224, s: 20, l: 13 },
  sidebarForeground: { h: 210, s: 20, l: 98 },
  sidebarPrimary: { h: 271, s: 56, l: 52 },
  sidebarPrimaryForeground: { h: 210, s: 20, l: 98 },
  sidebarAccent: { h: 223, s: 20, l: 18 },
  sidebarAccentForeground: { h: 210, s: 20, l: 98 },
  sidebarBorder: { h: 223, s: 20, l: 17 },
  sidebarRing: { h: 271, s: 56, l: 52 },
};

const lerp = (start: number, end: number, t: number) => start * (1 - t) + end * t;

const applyTheme = (percentage: number) => {
  const t = percentage / 100;
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  for (const key of Object.keys(lightTheme)) {
    const typedKey = key as keyof typeof lightTheme;
    const light = lightTheme[typedKey];
    const dark = darkTheme[typedKey];

    if (key.toLowerCase().includes('foreground')) {
       if (t >= 0.2) {
         root.style.setProperty(`--${key}`, `${dark.h} ${dark.s}% ${dark.l}%`);
       } else {
         root.style.setProperty(`--${key}`, `${light.h} ${light.s}% ${light.l}%`);
       }
    } else {
      const h = lerp(light.h, dark.h, t);
      const s = lerp(light.s, dark.s, t);
      const l = lerp(light.l, dark.l, t);
      root.style.setProperty(`--${key}`, `${h} ${s}% ${l}%`);
    }
  }
};

export function ThemeSlider() {
  const [sliderValue, setSliderValue] = useState(0);

  useEffect(() => {
    const savedValue = localStorage.getItem('wrdrobe_theme_slider');
    const initialValue = savedValue ? parseInt(savedValue, 10) : 0;
    setSliderValue(initialValue);
    applyTheme(initialValue);
  }, []);

  const handleSliderChange = (value: number[]) => {
    const newPercentage = value[0];
    setSliderValue(newPercentage);
    applyTheme(newPercentage);
    localStorage.setItem('wrdrobe_theme_slider', newPercentage.toString());
  };

  return (
    <Popover>
        <PopoverTrigger asChild>
            <Button variant="ghost" size="icon">
                <Palette className="h-[1.2rem] w-[1.2rem]" />
                <span className="sr-only">Change Theme</span>
            </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56" align="end">
            <div className="grid gap-4">
                <div className="space-y-2">
                    <h4 className="font-medium leading-none">Appearance</h4>
                    <p className="text-xs text-muted-foreground">
                        Adjust the background color.
                    </p>
                </div>
                <div className='space-y-2'>
                    <Label htmlFor="theme-slider" className="text-xs">Light to Dark</Label>
                    <Slider
                        id="theme-slider"
                        value={[sliderValue]}
                        max={100}
                        step={1}
                        onValueChange={handleSliderChange}
                    />
                </div>
            </div>
        </PopoverContent>
    </Popover>
  );
}
