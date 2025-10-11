import { supabase, Device } from './supabaseClient';

export class DeviceService {
  // Generate a unique 6-digit device code
  static generateDeviceCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Get device ID from localStorage or create new one
  static getDeviceId(): string {
    try {
      // Clean up old device code cache from localStorage
      window.localStorage.removeItem('device_code');
      window.localStorage.removeItem('device_code_timestamp');
      
      let deviceId = window.localStorage.getItem('device_id');
      if (!deviceId) {
        deviceId = window.crypto.randomUUID();
        window.localStorage.setItem('device_id', deviceId);
        console.log('Generated new device ID:', deviceId);
      } else {
        console.log('Using existing device ID:', deviceId);
      }
      return deviceId;
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      // Fallback to a session-based ID
      const fallbackId = 'fallback-' + Math.random().toString(36).substring(2, 11);
      console.log('Using fallback device ID:', fallbackId);
      return fallbackId;
    }
  }

  // Get device code - generate new one on each page load
  static getDeviceCode(): string {
    try {
      // Check if we already generated a code for this session
      let deviceCode = window.sessionStorage.getItem('device_code');
      
      if (!deviceCode) {
        // Generate new code for this session
        deviceCode = this.generateDeviceCode();
        window.sessionStorage.setItem('device_code', deviceCode);
        console.log('Generated new device code for session:', deviceCode);
      } else {
        console.log('Using existing session device code:', deviceCode);
      }

      return deviceCode;
    } catch (error) {
      console.error('Error accessing sessionStorage for device code:', error);
      // Return a fallback code
      return this.generateDeviceCode();
    }
  }

  // Force refresh device code
  static refreshDeviceCode(): string {
    const deviceCode = this.generateDeviceCode();
    window.sessionStorage.setItem('device_code', deviceCode);
    console.log('Manually refreshed device code:', deviceCode);
    return deviceCode;
  }

  // Update device code in database
  static async updateDeviceCode(): Promise<void> {
    const deviceId = this.getDeviceId();
    const deviceCode = this.getDeviceCode();

    try {
      console.log('Updating device code in database:', { deviceId, deviceCode });
      
      const { data, error } = await supabase.rpc('refresh_device_code', {
        p_device_id: deviceId,
        p_new_code: deviceCode
      });

      if (error) {
        console.error('Error updating device code:', error);
        throw error;
      }

      if (!data?.success) {
        console.error('Device code update failed:', data?.error);
        throw new Error(data?.error || 'Failed to update device code');
      }

      console.log('Device code updated successfully:', data.device);
    } catch (error) {
      console.error('Error updating device code:', error);
      throw error;
    }
  }

  // Register device in database
  static async registerDevice(): Promise<Device> {
    const deviceId = this.getDeviceId();
    const deviceCode = this.getDeviceCode();

    try {
      console.log('Registering device:', { deviceId, deviceCode });

      // Check if device already exists
      const { data: existingDevice, error: checkError } = await supabase
        .from('devices')
        .select('*')
        .eq('id', deviceId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing device:', checkError);
      }

      if (existingDevice) {
        console.log('Device exists, updating:', existingDevice);
        
        // If device is paired, don't change the device name, just update the code
        const updateData: any = {
          device_code: deviceCode,
          is_online: true,
          last_seen: new Date().toISOString(),
          ip_address: await this.getIPAddress(),
          wifi_ssid: 'Connected',
        };
        
        // Only reset device name if device is not paired
        if (!existingDevice.user_id) {
          updateData.device_name = `Pi Display ${deviceCode}`;
        }
        
        const { data, error } = await supabase
          .from('devices')
          .update(updateData)
          .eq('id', deviceId)
          .select()
          .single();

        if (error) {
          console.error('Error updating existing device:', error);
          throw error;
        }
        console.log('Device updated successfully:', data);
        return data;
      } else {
        console.log('Creating new device');
        // Create new device
        const { data, error } = await supabase
          .from('devices')
          .insert([{
            id: deviceId,
            device_code: deviceCode,
            device_name: `Pi Display ${deviceCode}`,
            is_online: true,
            ip_address: await this.getIPAddress(),
            wifi_ssid: 'Connected',
            user_id: null, // Initially unpaired
          }])
          .select()
          .single();

        if (error) {
          console.error('Error creating new device:', error);
          // If it's a duplicate key error, try to update instead
          if (error.code === '23505') {
            console.log('Duplicate key error, trying to update existing device');
            const { data: updateData, error: updateError } = await supabase
              .from('devices')
              .update({
                device_code: deviceCode,
                is_online: true,
                last_seen: new Date().toISOString(),
                ip_address: await this.getIPAddress(),
                wifi_ssid: 'Connected',
              })
              .eq('id', deviceId)
              .select()
              .single();

            if (updateError) throw updateError;
            return updateData;
          }
          throw error;
        }
        console.log('Device created successfully:', data);
        return data;
      }
    } catch (error) {
      console.error('Error registering device:', error);
      throw error;
    }
  }

  // Get device IP address
  static async getIPAddress(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('Error getting IP address:', error);
      return 'Unknown';
    }
  }

  // Update device status
  static async updateDeviceStatus(isOnline: boolean): Promise<void> {
    const deviceId = this.getDeviceId();

    try {
      await supabase
        .from('devices')
        .update({
          is_online: isOnline,
          last_seen: new Date().toISOString(),
        })
        .eq('id', deviceId);
    } catch (error) {
      console.error('Error updating device status:', error);
    }
  }

  // Check if device is paired
  static async isDevicePaired(): Promise<boolean> {
    const deviceId = this.getDeviceId();

    try {
      const { data, error } = await supabase
        .from('devices')
        .select('user_id')
        .eq('id', deviceId)
        .single();

      if (error) return false;
      return !!data?.user_id;
    } catch (error) {
      console.error('Error checking device pairing:', error);
      return false;
    }
  }

  // Get device info
  static async getDeviceInfo(): Promise<Device | null> {
    const deviceId = this.getDeviceId();

    try {
      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .eq('id', deviceId)
        .single();

      if (error) return null;
      return data;
    } catch (error) {
      console.error('Error getting device info:', error);
      return null;
    }
  }

  // Subscribe to device pairing status
  static subscribeToDevicePairing(callback: (isPaired: boolean, device?: Device) => void) {
    const deviceId = this.getDeviceId();

    console.log('Subscribing to device pairing updates for device:', deviceId);

    const subscription = supabase
      .channel(`device-pairing-${deviceId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'devices',
          filter: `id=eq.${deviceId}`,
        },
        (payload) => {
          console.log('Device pairing update received:', payload);
          const device = payload.new as Device;
          const isPaired = !!device.user_id;
          console.log('Device pairing status changed:', { isPaired, deviceName: device.device_name, userId: device.user_id });
          callback(isPaired, device);
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return subscription;
  }

  // Validate device code exists in database
  static async validateDeviceCode(deviceCode: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('validate_device_code', {
        p_device_code: deviceCode
      });

      if (error) {
        console.error('Error validating device code:', error);
        return false;
      }

      return data?.valid === true;
    } catch (error) {
      console.error('Error validating device code:', error);
      return false;
    }
  }

  // Generate QR code data
  static generateQRCodeData(): string {
    const deviceCode = this.getDeviceCode();
    const deviceId = this.getDeviceId();

    return JSON.stringify({
      type: 'pi_board_device',
      device_code: deviceCode,
      device_id: deviceId,
      timestamp: Date.now(),
    });
  }
}