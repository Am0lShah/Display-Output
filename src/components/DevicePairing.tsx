import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { DeviceService } from '../services/deviceService';
import { Device } from '../services/supabaseClient';

interface DevicePairingProps {
  onPaired: (device: Device) => void;
}

export const DevicePairing: React.FC<DevicePairingProps> = ({ onPaired }) => {
  const [deviceCode, setDeviceCode] = useState('');
  const [qrData, setQrData] = useState('');
  const [isPaired, setIsPaired] = useState(false);
  const [device, setDevice] = useState<Device | null>(null);
  const [countdown, setCountdown] = useState(600);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeDevice = async () => {
      try {
        console.log('Initializing device...');

        // Test database connection first
        console.log('Testing database connection...');

        // Import supabase for testing
        const { supabase } = await import('../services/supabaseClient');

        // Test basic connection
        const { data: testData, error: testError } = await supabase
          .from('devices')
          .select('count')
          .limit(1);

        if (testError) {
          console.error('Database connection test failed:', testError);
          throw new Error(`Database error: ${testError.message}`);
        }

        console.log('Database connection successful');

        // Register device in database
        await DeviceService.registerDevice();
        console.log('Device registered successfully');

        // Get device code and generate QR
        const code = DeviceService.getDeviceCode();
        const qr = DeviceService.generateQRCodeData();

        console.log('Generated device code:', code);
        console.log('Generated QR data:', qr);

        // Validate that the code is properly stored in database
        const isValidCode = await DeviceService.validateDeviceCode(code);
        console.log('Device code validation result:', isValidCode);

        if (!isValidCode) {
          console.warn('Device code not found in database, updating...');
          await DeviceService.updateDeviceCode();
        }

        setDeviceCode(code);
        setQrData(qr);

        // Check if already paired
        const paired = await DeviceService.isDevicePaired();
        console.log('Device paired status:', paired);

        if (paired) {
          const deviceInfo = await DeviceService.getDeviceInfo();
          if (deviceInfo) {
            setIsPaired(true);
            setDevice(deviceInfo);
            onPaired(deviceInfo);
          }
        }
      } catch (error) {
        console.error('Error initializing device:', error);
        setError(`Initialization error: ${error instanceof Error ? error.message : String(error)}`);
        // Set fallback values if there's an error
        const fallbackCode = '123456';
        const fallbackQr = JSON.stringify({
          type: 'pi_board_device',
          device_code: fallbackCode,
          device_id: 'fallback-id',
          timestamp: Date.now(),
        });
        setDeviceCode(fallbackCode);
        setQrData(fallbackQr);
      } finally {
        setLoading(false);
      }
    };

    const checkPairingStatus = async () => {
      try {
        const paired = await DeviceService.isDevicePaired();
        console.log('Checking pairing status:', { paired, currentIsPaired: isPaired });
        
        if (paired !== isPaired) {
          if (paired) {
            const deviceInfo = await DeviceService.getDeviceInfo();
            if (deviceInfo) {
              console.log('Device paired successfully:', deviceInfo);
              setIsPaired(true);
              setDevice(deviceInfo);
              onPaired(deviceInfo);
            }
          } else {
            console.log('Device unpaired');
            setIsPaired(false);
            setDevice(null);
          }
        }
      } catch (error) {
        console.error('Error checking pairing status:', error);
      }
    };

    const refreshDeviceCode = async () => {
      try {
        // Only refresh if not paired
        if (!isPaired) {
          const code = DeviceService.getDeviceCode();
          const qr = DeviceService.generateQRCodeData();

          setDeviceCode(code);
          setQrData(qr);
          setCountdown(600); // Reset countdown

          // Update database with new code
          await DeviceService.updateDeviceCode();

          console.log('Device code refreshed:', code);
        }
      } catch (error) {
        console.error('Error refreshing device code:', error);
      }
    };

    initializeDevice();

    // Check pairing status every 5 seconds
    const pairingInterval = setInterval(checkPairingStatus, 5000);

    // Refresh device code every 10 minutes
    const codeRefreshInterval = setInterval(refreshDeviceCode, 600000);

    // Update countdown every second
    const countdownInterval = setInterval(() => {
      if (!isPaired) {
        setCountdown(prev => {
          if (prev <= 1) {
            return 600; // Reset to 600 when it reaches 0
          }
          return prev - 1;
        });
      }
    }, 1000);

    // Subscribe to real-time pairing updates
    const subscription = DeviceService.subscribeToDevicePairing((paired, deviceInfo) => {
      console.log('Real-time pairing update:', { paired, deviceInfo });
      
      if (paired !== isPaired) {
        setIsPaired(paired);
        if (paired && deviceInfo) {
          setDevice(deviceInfo);
          onPaired(deviceInfo);
          console.log('Device paired via real-time update:', deviceInfo);
        } else {
          setDevice(null);
          console.log('Device unpaired via real-time update');
        }
      }
    });

    return () => {
      clearInterval(pairingInterval);
      clearInterval(codeRefreshInterval);
      clearInterval(countdownInterval);
      subscription.unsubscribe();
    };
  }, [onPaired, isPaired]);



  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <h2>Initializing Device...</h2>
        <p>Setting up your Pi Board display</p>
      </div>
    );
  }

  if (isPaired && device) {
    return (
      <div style={styles.pairedContainer}>
        <div style={styles.pairedIcon}>✅</div>
        <h1 style={styles.pairedTitle}>Device Paired Successfully!</h1>
        <p style={styles.pairedText}>
          Connected to: <strong>{device.device_name}</strong>
        </p>
        <p style={styles.pairedSubtext}>
          Ready to receive content from your mobile app
        </p>
        
        {/* Debug buttons for testing */}
        <div style={styles.debugSection}>
          <button
            onClick={async () => {
              console.log('Testing content fetch...');
              try {
                const { ContentService } = await import('../services/contentService');
                const content = await ContentService.getDeviceContent();
                console.log('Current device content:', content);
                alert(`Found ${content.length} content items. Check console for details.`);
              } catch (error) {
                console.error('Error fetching content:', error);
                alert('Error fetching content. Check console for details.');
              }
            }}
            style={styles.debugButton}
          >
            🔍 Check Content
          </button>
          <button
            onClick={() => {
              console.log('Refreshing page to load content...');
              window.location.reload();
            }}
            style={styles.debugButton}
          >
            🔄 Reload App
          </button>
        </div>
        
        <div style={styles.loadingDots}>
          <span>●</span>
          <span>●</span>
          <span>●</span>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>📱 Pi Board Display</h1>
        <p style={styles.subtitle}>Digital Notice Board System</p>
      </div>

      <div style={styles.content}>
        <div style={styles.pairingSection}>
          <h2 style={styles.sectionTitle}>Device Pairing Required</h2>
          <p style={styles.instructions}>
            To start displaying content, pair this device with your mobile app:
          </p>

          {error && (
            <div style={styles.errorMessage}>
              <strong>⚠️ Error:</strong> {error}
            </div>
          )}

          {!deviceCode && !error && (
            <div style={styles.warningMessage}>
              <strong>⏳ Loading:</strong> Generating device code...
            </div>
          )}

          <div style={styles.debugSection}>
            <button
              onClick={() => window.location.reload()}
              style={styles.debugButton}
            >
              🔄 Refresh Page
            </button>
            <button
              onClick={async () => {
                console.log('Manual refresh triggered');
                try {
                  const code = DeviceService.refreshDeviceCode();
                  await DeviceService.updateDeviceCode();
                  const qr = DeviceService.generateQRCodeData();
                  setDeviceCode(code);
                  setQrData(qr);
                  console.log('Code refreshed successfully:', code);
                } catch (error) {
                  console.error('Error refreshing code:', error);
                }
              }}
              style={styles.debugButton}
            >
              🔄 Refresh Code
            </button>
            <button
              onClick={async () => {
                console.log('Testing pairing status...');
                const paired = await DeviceService.isDevicePaired();
                const deviceInfo = await DeviceService.getDeviceInfo();
                console.log('Current pairing status:', { paired, deviceInfo });
                alert(`Paired: ${paired}\nDevice: ${deviceInfo?.device_name || 'None'}`);
              }}
              style={styles.debugButton}
            >
              🔍 Check Status
            </button>
          </div>

          <div style={styles.pairingMethods}>
            {/* QR Code Method */}
            <div style={styles.method}>
              <h3 style={styles.methodTitle}>📷 Scan QR Code</h3>
              <div style={styles.qrContainer}>
                {qrData ? (
                  <QRCode
                    value={qrData}
                    size={150}
                    style={styles.qrCode}
                    fgColor="#000000"
                    bgColor="#ffffff"
                  />
                ) : (
                  <div style={styles.placeholderBox}>
                    <div style={styles.loadingSpinner}></div>
                    <p>Generating QR...</p>
                  </div>
                )}
              </div>
              <p style={styles.methodText}>
                Scan with mobile app
              </p>
            </div>

            {/* Manual Code Method */}
            <div style={styles.method}>
              <h3 style={styles.methodTitle}>🔢 Device Code</h3>
              <div style={styles.codeContainer}>
                <div style={styles.codeDisplay}>
                  {deviceCode ? (
                    deviceCode.split('').map((digit, index) => (
                      <span key={index} style={styles.codeDigit}>
                        {digit}
                      </span>
                    ))
                  ) : (
                    Array.from({ length: 6 }).map((_, index) => (
                      <span key={index} style={styles.codeDigitLoading}>
                        ?
                      </span>
                    ))
                  )}
                </div>
              </div>
              <p style={styles.methodText}>
                Enter in mobile app
              </p>
            </div>

            {/* Steps Method */}
            <div style={styles.method}>
              <h3 style={styles.methodTitle}>📋 Quick Steps</h3>
              <div style={styles.quickSteps}>
                <div style={styles.stepItem}>1. Download Pi Board app</div>
                <div style={styles.stepItem}>2. Sign in to account</div>
                <div style={styles.stepItem}>3. Go to "Manage Devices"</div>
                <div style={styles.stepItem}>4. Tap "Pair New Device"</div>
                <div style={styles.stepItem}>5. Scan QR or enter code</div>
              </div>
            </div>
          </div>

          <div style={styles.statusSection}>
            <div style={styles.statusIndicator}>
              <div style={styles.pulsingDot}></div>
              <span style={styles.statusText}>Waiting for pairing...</span>
            </div>
            <div style={styles.countdownContainer}>
              <span style={styles.countdownText}>
                New code in: {Math.floor(countdown / 60)}m {countdown % 60}s
              </span>
            </div>
          </div>
        </div>


      </div>

      <div style={styles.footer}>
        <p style={styles.footerText}>
          Pi Board Innovators © 2024 | Digital Signage Solution
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    height: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    overflow: 'hidden',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '15px',
  },
  title: {
    fontSize: '2.2rem',
    color: '#ffffff',
    margin: '0 0 5px 0',
    fontWeight: 'bold',
    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
  },
  subtitle: {
    fontSize: '1rem',
    color: '#e0e7ff',
    margin: 0,
  },
  content: {
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '15px',
    padding: '20px',
    maxWidth: '1000px',
    width: '100%',
    height: 'calc(100vh - 120px)',
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
  },
  pairingSection: {
    textAlign: 'center' as const,
    marginBottom: '20px',
    flex: '1',
  },
  sectionTitle: {
    fontSize: '1.5rem',
    color: '#1f2937',
    margin: '0 0 10px 0',
  },
  instructions: {
    fontSize: '0.95rem',
    color: '#6b7280',
    margin: '0 0 20px 0',
  },
  pairingMethods: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '20px',
    marginBottom: '20px',
    alignItems: 'start',
  },
  method: {
    textAlign: 'center' as const,
  },
  methodTitle: {
    fontSize: '1.1rem',
    color: '#374151',
    margin: '0 0 15px 0',
  },
  qrContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '15px',
  },
  qrCode: {
    border: '8px solid #ffffff',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
  },
  codeContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '15px',
  },
  codeDisplay: {
    display: 'flex',
    gap: '6px',
  },
  codeDigit: {
    display: 'inline-block',
    width: '35px',
    height: '45px',
    lineHeight: '45px',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#1f2937',
    background: '#f3f4f6',
    border: '2px solid #d1d5db',
    borderRadius: '6px',
    textAlign: 'center' as const,
  },
  methodText: {
    fontSize: '0.8rem',
    color: '#6b7280',
    margin: 0,
  },
  quickSteps: {
    textAlign: 'left' as const,
    fontSize: '0.75rem',
    color: '#4b5563',
    lineHeight: '1.3',
  },
  stepItem: {
    padding: '2px 0',
    borderBottom: '1px solid #e5e7eb',
    marginBottom: '2px',
  },
  statusSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '10px',
  },
  statusIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  pulsingDot: {
    width: '12px',
    height: '12px',
    background: '#10b981',
    borderRadius: '50%',
    animation: 'pulse 2s infinite',
  },
  statusText: {
    fontSize: '0.9rem',
    color: '#6b7280',
  },
  countdownContainer: {
    textAlign: 'center' as const,
  },
  countdownText: {
    fontSize: '0.8rem',
    color: '#9ca3af',
    background: '#f3f4f6',
    padding: '6px 12px',
    borderRadius: '15px',
    border: '1px solid #e5e7eb',
  },

  footer: {
    marginTop: '10px',
    textAlign: 'center' as const,
  },
  footerText: {
    fontSize: '0.8rem',
    color: '#e0e7ff',
    margin: 0,
  },
  pairedContainer: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    textAlign: 'center' as const,
  },
  pairedIcon: {
    fontSize: '5rem',
    marginBottom: '20px',
  },
  pairedTitle: {
    fontSize: '3rem',
    color: '#ffffff',
    margin: '0 0 20px 0',
    fontWeight: 'bold',
  },
  pairedText: {
    fontSize: '1.5rem',
    color: '#d1fae5',
    margin: '0 0 10px 0',
  },
  pairedSubtext: {
    fontSize: '1.2rem',
    color: '#a7f3d0',
    margin: '0 0 40px 0',
  },
  loadingDots: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
  },
  loadingContainer: {
    height: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    textAlign: 'center' as const,
  },
  loadingSpinner: {
    width: '60px',
    height: '60px',
    border: '4px solid rgba(255, 255, 255, 0.3)',
    borderTop: '4px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '30px',
  },
  errorMessage: {
    background: '#fee2e2',
    color: '#dc2626',
    padding: '10px 15px',
    borderRadius: '8px',
    marginBottom: '15px',
    border: '1px solid #fecaca',
    fontSize: '0.9rem',
  },
  warningMessage: {
    background: '#fef3c7',
    color: '#d97706',
    padding: '10px 15px',
    borderRadius: '8px',
    marginBottom: '15px',
    border: '1px solid #fde68a',
    fontSize: '0.9rem',
  },
  placeholderBox: {
    width: '150px',
    height: '150px',
    background: '#f3f4f6',
    border: '2px dashed #d1d5db',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    color: '#6b7280',
    fontSize: '0.8rem',
  },
  codeDigitLoading: {
    display: 'inline-block',
    width: '35px',
    height: '45px',
    lineHeight: '45px',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#9ca3af',
    background: '#f9fafb',
    border: '2px dashed #d1d5db',
    borderRadius: '6px',
    textAlign: 'center' as const,
    animation: 'pulse 1.5s infinite',
  },
  debugSection: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
    marginTop: '15px',
    marginBottom: '15px',
  },
  debugButton: {
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '0.8rem',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
};

// CSS animation is handled in App.css