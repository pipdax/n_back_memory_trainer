import React, { useEffect } from 'react';

interface RewardAnimationProps {
  startRef: React.RefObject<HTMLElement>;
  endRef: React.RefObject<HTMLElement>;
  onComplete: () => void;
  particleCount?: number;
  duration?: number;
}

const PARTICLE_COLORS = ['#FFD700', '#FFA500', '#FFFFFF', '#FFC400'];

const RewardAnimation: React.FC<RewardAnimationProps> = ({
  startRef,
  endRef,
  onComplete,
  particleCount = 30,
  duration = 1500,
}) => {
  useEffect(() => {
    const startEl = startRef.current;
    const endEl = endRef.current;

    // If elements aren't mounted, just finish.
    if (!startEl || !endEl) {
      onComplete();
      return;
    }

    const startRect = startEl.getBoundingClientRect();
    const endRect = endEl.getBoundingClientRect();
    
    // Create a temporary container for particles.
    const particleContainer = document.createElement('div');
    document.body.appendChild(particleContainer);

    // Create particles
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'reward-particle';

      const size = Math.random() * 8 + 4; // Particle size between 4px and 12px
      
      // Random starting point within the source element
      const startX = startRect.left + startRect.width / 2 + (Math.random() - 0.5) * startRect.width * 0.8;
      const startY = startRect.top + startRect.height / 2 + (Math.random() - 0.5) * startRect.height * 0.5; // Start from middle-ish vertically
      
      // Destination point in the center of the target element
      const endX = endRect.left + endRect.width / 2;
      const endY = endRect.top + endRect.height / 2;

      // Calculate translation distances
      const translateX = endX - startX;
      const translateY = endY - startY;

      Object.assign(particle.style, {
        width: `${size}px`,
        height: `${size}px`,
        left: `${startX}px`,
        top: `${startY}px`,
        backgroundColor: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
        // Randomize duration slightly for a more natural effect
        animationDuration: `${duration * (0.8 + Math.random() * 0.4)}ms`,
      });

      // Set CSS variables for the keyframe animation
      particle.style.setProperty('--tx', `${translateX}px`);
      particle.style.setProperty('--ty', `${translateY}px`);
      
      particleContainer.appendChild(particle);
    }
    
    // Set a timeout to call onComplete and clean up the DOM elements
    const timeoutId = setTimeout(() => {
        onComplete();
        // The container will be cleaned up by the return function anyway, but good for safety
        if (document.body.contains(particleContainer)) {
            document.body.removeChild(particleContainer);
        }
    }, duration + 200); // Add a small buffer

    // Cleanup function to run on unmount or re-render
    return () => {
      clearTimeout(timeoutId);
      if (document.body.contains(particleContainer)) {
        document.body.removeChild(particleContainer);
      }
    };
    // Dependencies: trigger effect only when these change.
  }, [startRef, endRef, onComplete, particleCount, duration]);

  return null; // This component renders nothing itself
};

export default RewardAnimation;
