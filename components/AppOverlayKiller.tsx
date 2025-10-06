'use client';

import { useEffect } from 'react';

// Removes any lingering "Open in Fleet App" modal overlays from the DOM.
export default function AppOverlayKiller() {
  useEffect(() => {
    const isOverlayNode = (node: Element): boolean => {
      const text = node.textContent || '';
      if (!text) return false;
      const markers = [
        'Open in Fleet App',
        'Opening in Fleet App',
        'App not installed? Download Fleet',
        'Continue on website',
      ];
      return markers.some((m) => text.includes(m));
    };

    const removeOverlays = () => {
      const allDivs = Array.from(document.querySelectorAll('div'));
      allDivs.forEach((el) => {
        if (isOverlayNode(el)) {
          el.remove();
        }
      });
    };

    // Initial sweep
    removeOverlays();

    // Observe future DOM changes
    const observer = new MutationObserver(() => removeOverlays());
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  return null;
}


