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

    const updateStatus = async () => {
      try {
        if (navigator.onLine) {
          await DeviceService.updateDeviceStatus(true);
          
          // Check if pairing status changed
          const paired = await DeviceService.isDevicePaired();
          if (paired !== isPaired) {
            setIsPaired(paired);
            
            if (paired) {
              const deviceInfo = await DeviceService.getDeviceInfo();
              setDevice(deviceInfo);
            } else {
              setDevice(null);
            }
          }
        }
      } catch (error) {
        console.error('Error updating device status:', error);
      }
    };

    initializeDevice();
    
    // Update device status periodically
    const statusInterval = setInterval(updateStatus, 30000); // Every 30 seconds
    
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
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isPaired]);

  const updateStatus = async () => {
    try {
      if (navigator.onLine) {
        await DeviceService.updateDeviceStatus(true);
        
        // Check if pairing status changed
        const paired = await DeviceService.isDevicePaired();
        if (paired !== isPaired) {
          setIsPaired(paired);
          
          if (paired) {
            const deviceInfo = await DeviceService.getDeviceInfo();
            setDevice(deviceInfo);
          } else {
            setDevice(null);
          }
        }
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