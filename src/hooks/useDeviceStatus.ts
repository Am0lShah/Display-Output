import { useState, useEffect } from 'react';
import { DeviceService } from '../services/deviceService';
import { Device, supabase } from '../services/supabaseClient';

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

    // Subscribe to layout-changed Broadcast
    const deviceId = DeviceService.getDeviceId();
    const layoutChannelName = `device-notify-${deviceId}`;
    const layoutChannel = supabase.channel(layoutChannelName);

    layoutChannel.on(
      'broadcast',
      { event: 'layout-updated' },
      async (payload) => {
        console.log('🎨 Layout changed via broadcast:', payload);
        // Refetch device info to get the latest display_layout
        try {
          const deviceInfo = await DeviceService.getDeviceInfo();
          if (deviceInfo) {
            setDevice(deviceInfo);
            console.log('🎨 Updated device layout to:', deviceInfo.display_layout);
          }
        } catch (err) {
          console.error('Error refetching device info after layout change:', err);
        }
      }
    );

    layoutChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('🎨 Layout broadcast listener active');
      }
    });

    // Update device status (Heartbeat) periodically
    const statusInterval = setInterval(() => {
      updateStatus();
    }, 60000);

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
      layoutChannel.unsubscribe();
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
        setIsOnline(true);
      } else {
        setIsOnline(false);
      }
    } catch (error) {
      console.error('Error updating device status (likely offline):', error);
      setIsOnline(false);
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