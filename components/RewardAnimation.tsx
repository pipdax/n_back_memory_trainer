import React, { useEffect } from 'react';

interface RewardAnimationProps {
  startRef: React.RefObject<HTMLElement>;
  endRef: React.RefObject<HTMLElement>;
  onComplete: () => void;
  particleCount?: number;
  duration?: number;
}

const PARTICLE_COLORS = ['#FFD700', '#FFA500', '#FFFFFF', '#FFC400'];

export const RewardAnimation: React.FC<RewardAnimationProps> = ({
  startRef,
  endRef,
  onComplete,
  particleCount = 30,
  duration = 1500,
}) => {
  useEffect(() => {
    const startEl = startRef.current;
    const endEl = endRef.current;

    if (!startEl || !endEl) {
      onComplete();
      return;
    }

    const startRect = startEl.getBoundingClientRect();
    const endRect = endEl.getBoundingClientRect();
    
    const particleContainer = document.createElement('div');
    document.body.appendChild(particleContainer);

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'reward-particle';

      const size = Math.random() * 8 + 4; // Particle size between 4px and 12px
      const startX = startRect.left + startRect.width / 2 + (Math.random() - 0.5) * startRect.width * 0.8;
      const startY = startRect.top + startRect.height / 2 + (Math.random() - 0.5) * startRect.height * 0.8;
      
      const endX = endRect.left + endRect.width / 2;
      const endY = endRect.top + endRect.height / 2;

      const translateX = endX - startX;
      const translateY = endY - startY;

      Object.assign(particle.style, {
        width: `${size}px`,
        height: `${size}px`,
        left: `${startX}px`,
        top: `${startY}px`,
        backgroundColor: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
        animationDuration: `${duration * (0.8 + Math.random() * 0.4)}ms`,
      });

      // Use CSS variables for a more robust animation
      particle.style.setProperty('--tx', `${translateX}px`);
      particle.style.setProperty('--ty', `${translateY}px`);
      
      particleContainer.appendChild(particle);
    }
    
    const timeoutId = setTimeout(() => {
        onComplete();
    }, duration);


    return () => {
      clearTimeout(timeoutId);
      if (document.body.contains(particleContainer)) {
        document.body.removeChild(particleContainer);
      }
    };
  }, [startRef, endRef, onComplete, particleCount, duration]);

  return null;
};
