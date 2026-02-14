import { useState, useEffect } from 'react';
import { DeviceService } from '../services/deviceService';
import { Device } from '../services/supabaseClient';

export const useDeviceStatus = () => {
  const [device, setDevice] = useState<Device | null>(null);
  const [isPaired, setIsPaired] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeDevice = async () => {
      try {
        setLoading(true);

        // Register device
        await DeviceService.registerDevice();

        // Check pairing status
        const paired = await DeviceService.isDevicePaired();
        setIsPaired(paired);

        if (paired) {
          const deviceInfo = await DeviceService.getDeviceInfo();
          setDevice(deviceInfo);
        }

        setIsOnline(navigator.onLine);
      } catch (error) {
        console.error('Error initializing device:', error);
      } finally {
        setLoading(false);
      }
    };



    initializeDevice();

    // Subscribe to pairing changes (Realtime Push)
    const pairingSubscription = DeviceService.subscribeToDevicePairing((paired, deviceInfo) => {
      setIsPaired(paired);
      if (paired && deviceInfo) {
        setDevice(deviceInfo);
      } else {
        setDevice(null);
      }
    });

    // Update device status (Heartbeat) periodically
    // We ONLY send the heartbeat here, we do NOT check for pairing status (GET request)
    const statusInterval = setInterval(() => {
      // Use the optimized updateStatus defined outside
      updateStatus();
    }, 60000); // Increased to 60 seconds to save API calls

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Handle online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      updateStatus();
    };

    const handleOffline = () => {
      setIsOnline(false);
      DeviceService.updateDeviceStatus(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(statusInterval);
      pairingSubscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isPaired]);

  // Optimized: Only sends Heartbeat (PATCH), does not fetch data (GET)
  const updateStatus = async () => {
    try {
      if (navigator.onLine) {
        await DeviceService.updateDeviceStatus(true);
        // Pairing check removed - handled by Realtime subscription
      }
    } catch (error) {
      console.error('Error updating device status:', error);
    }
  };

  const handlePaired = (deviceInfo: Device) => {
    setDevice(deviceInfo);
    setIsPaired(true);
  };

  return {
    device,
    isPaired,
    isOnline,
    loading,
    handlePaired,
    updateStatus,
  };
};