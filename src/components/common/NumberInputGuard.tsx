'use client';

import { useEffect } from 'react';

/**
 * Global guard for number and money inputs:
 * 1. Scrolling the mouse wheel while a number input is selected/hovered does NOT change the number.
 * 2. Typing numbers from keyboard works as expected.
 * 3. ArrowUp / ArrowDown keys do not spin the number.
 */
export function NumberInputGuard() {
  useEffect(() => {
    // Intercept wheel events on or near number inputs
    const handleWheel = (e: WheelEvent) => {
      const activeEl = document.activeElement;
      if (activeEl instanceof HTMLInputElement && activeEl.type === 'number') {
        activeEl.blur();
      }
      const target = e.target;
      if (target instanceof HTMLInputElement && target.type === 'number') {
        e.preventDefault();
        target.blur();
      }
    };

    // Prevent ArrowUp and ArrowDown from spinning the number input value
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === 'ArrowUp' || e.key === 'ArrowDown') &&
        e.target instanceof HTMLInputElement &&
        e.target.type === 'number'
      ) {
        e.preventDefault();
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return null;
}
