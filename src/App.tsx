import React, { useEffect } from 'react';
import { DevicePairing } from './components/DevicePairing';
import { ContentDisplay } from './components/ContentDisplay';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useDeviceStatus } from './hooks/useDeviceStatus';
import { useContentSubscription } from './hooks/useContentSubscription';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const { device, isPaired, isOnline, loading, handlePaired } = useDeviceStatus();
  const { content, loading: contentLoading, error } = useContentSubscription(isPaired);

  // Disable context menu and other kiosk mode features
  useEffect(() => {
    const disableContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    const disableKeyboardShortcuts = (e: KeyboardEvent) => {
      // Disable F12, Ctrl+Shift+I, Ctrl+U, etc.
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.key === 'u') ||
        (e.ctrlKey && e.shiftKey && e.key === 'C')
      ) {
        e.preventDefault();
        return false;
      }
    };

    const disableTextSelection = (e: Event) => {
      e.preventDefault();
      return false;
    };

    // Add event listeners
    document.addEventListener('contextmenu', disableContextMenu);
    document.addEventListener('keydown', disableKeyboardShortcuts);
    document.addEventListener('selectstart', disableTextSelection);
    document.addEventListener('dragstart', disableTextSelection);

    // Cleanup on unmount
    return () => {
      document.removeEventListener('contextmenu', disableContextMenu);
      document.removeEventListener('keydown', disableKeyboardShortcuts);
      document.removeEventListener('selectstart', disableTextSelection);
      document.removeEventListener('dragstart', disableTextSelection);
    };
  }, []);

  // Show loading screen while initializing
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <h2>Initializing Pi Board Display...</h2>
        <p>Setting up your digital signage device</p>
      </div>
    );
  }

  // Show pairing screen if device is not paired
  if (!isPaired) {
    return <DevicePairing onPaired={handlePaired} />;
  }

  // Show content display when paired
  return (
    <div className="app">
      <ContentDisplay 
        content={content} 
        deviceName={device?.device_name || 'Pi Display'} 
      />
      
      {/* Subtle Offline Indicator */}
      {!isOnline && (
        <div className="offline-indicator">
          <span>🔴 Offline Mode</span>
        </div>
      )}
      
      {/* Content Loading Indicator */}
      {contentLoading && (
        <div className="content-loading">
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;