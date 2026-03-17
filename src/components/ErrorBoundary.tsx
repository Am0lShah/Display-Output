import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={styles.container}>
          <div style={styles.content}>
            <div style={styles.icon}>⚠️</div>
            <h1 style={styles.title}>Something went wrong</h1>
            <p style={styles.message}>
              The Pi Board Display encountered an error and needs to restart.
            </p>
            <button 
              style={styles.button}
              onClick={() => window.location.reload()}
            >
              🔄 Restart Display
            </button>
            {process.env.NODE_ENV === 'development' && (
              <details style={styles.details}>
                <summary>Error Details (Development)</summary>
                <pre style={styles.errorText}>
                  {this.state.error?.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles = {
  container: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    color: '#ffffff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  content: {
    textAlign: 'center' as const,
    maxWidth: '500px',
    padding: '40px',
  },
  icon: {
    fontSize: '4rem',
    marginBottom: '20px',
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    margin: '0 0 20px 0',
  },
  message: {
    fontSize: '1.2rem',
    margin: '0 0 30px 0',
    opacity: 0.9,
  },
  button: {
    background: 'rgba(255, 255, 255, 0.2)',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    color: '#ffffff',
    fontSize: '1.1rem',
    padding: '12px 24px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  details: {
    marginTop: '30px',
    textAlign: 'left' as const,
    background: 'rgba(0, 0, 0, 0.3)',
    padding: '20px',
    borderRadius: '8px',
  },
  errorText: {
    fontSize: '0.8rem',
    color: '#ffcccc',
    overflow: 'auto',
    maxHeight: '200px',
  },
};