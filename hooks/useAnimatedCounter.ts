import { useState, useEffect, useRef } from 'react';

const easeOutCubic = (t: number): number => --t * t * t + 1;

export const useAnimatedCounter = (target: number, duration = 1500): number => {
  // Initialize state with target to prevent animating from 0 on initial render
  // for persistent components like the main reward podium.
  const [count, setCount] = useState(target);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    // The animation should always go from the currently displayed value (`count`) 
    // to the new `target`. This works for both initial animations (where `count`
    // might be different from `target` due to `useState` initialization) and updates.
    const start = count;
    const startTime = performance.now();
    
    // Animate only if there's a difference.
    if (start === target) {
      return;
    }
    
    const animate = (currentTime: number) => {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      const easedProgress = easeOutCubic(progress);
      
      const newCount = Math.round(start + (target - start) * easedProgress);
      setCount(newCount);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setCount(target); // Ensure it ends exactly on the target
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [target, duration]);

  return count;
};