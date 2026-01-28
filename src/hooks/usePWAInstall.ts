import { useState, useEffect, useCallback } from 'react';

const INSTALL_PROMPT_KEY = 'nxvoy_pwa_install_dismissed';
const FIRST_TRIP_KEY = 'nxvoy_first_trip_created';

export const usePWAInstall = () => {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [hasCreatedFirstTrip, setHasCreatedFirstTrip] = useState(false);

  useEffect(() => {
    // Check if user has dismissed the prompt before
    const dismissed = localStorage.getItem(INSTALL_PROMPT_KEY);
    const firstTripCreated = localStorage.getItem(FIRST_TRIP_KEY);
    
    if (firstTripCreated) {
      setHasCreatedFirstTrip(true);
    }

    // Only show if not dismissed and first trip created
    if (!dismissed && firstTripCreated) {
      // Delay showing the prompt a bit for better UX
      const timer = setTimeout(() => {
        setShowInstallPrompt(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const markFirstTripCreated = useCallback(() => {
    localStorage.setItem(FIRST_TRIP_KEY, 'true');
    setHasCreatedFirstTrip(true);
    
    // Check if not already dismissed
    const dismissed = localStorage.getItem(INSTALL_PROMPT_KEY);
    if (!dismissed) {
      // Show prompt after a short delay
      setTimeout(() => {
        setShowInstallPrompt(true);
      }, 1500);
    }
  }, []);

  const dismissInstallPrompt = useCallback(() => {
    localStorage.setItem(INSTALL_PROMPT_KEY, 'true');
    setShowInstallPrompt(false);
  }, []);

  const resetInstallPrompt = useCallback(() => {
    localStorage.removeItem(INSTALL_PROMPT_KEY);
  }, []);

  return {
    showInstallPrompt,
    hasCreatedFirstTrip,
    markFirstTripCreated,
    dismissInstallPrompt,
    resetInstallPrompt,
  };
};
