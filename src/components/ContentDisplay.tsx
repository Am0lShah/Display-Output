import React, { useState, useEffect, useRef } from 'react';
import { Content } from '../services/supabaseClient';
import './ContentDisplay.css';

interface ContentDisplayProps {
    content: Content[];
    deviceName: string;
}

export const ContentDisplay: React.FC<ContentDisplayProps> = ({ content, deviceName }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const timerRef = useRef<number | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const currentContent = content[currentIndex];

    // Debug logging
    useEffect(() => {
        console.log('ContentDisplay received content:', content);
        console.log('Current content index:', currentIndex);
        console.log('Current content item:', currentContent);
    }, [content, currentIndex, currentContent]);



    useEffect(() => {
        if (content.length === 0) return;

        const startTimer = () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }

            const duration = (currentContent?.duration || 10) * 1000;

            timerRef.current = setTimeout(() => {
                if (content.length <= 1) return;

                setIsTransitioning(true);

                setTimeout(() => {
                    setCurrentIndex((prev) => (prev + 1) % content.length);
                    setIsTransitioning(false);
                }, 300);
            }, duration) as unknown as number;
        };

        // Start timer for current content
        startTimer();

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [currentIndex, content, currentContent]);

    const nextContent = () => {
        if (content.length <= 1) return;

        setIsTransitioning(true);

        setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % content.length);
            setIsTransitioning(false);
        }, 300);
    };

    const previousContent = () => {
        if (content.length <= 1) return;

        setIsTransitioning(true);

        setTimeout(() => {
            setCurrentIndex((prev) => (prev - 1 + content.length) % content.length);
            setIsTransitioning(false);
        }, 300);
    };

    // Handle video ended event
    const handleVideoEnded = () => {
        nextContent();
    };

    if (!currentContent) {
        return (
            <div style={styles.container}>
                <div style={styles.noContent}>
                    <div style={styles.noContentIcon}>🚀</div>
                    <h2 style={styles.noContentTitle}>Welcome to PiBoard Innovators</h2>
                    <p style={styles.noContentText}>
                        Your digital signage solution is ready!
                    </p>
                    <div style={styles.noContentSubtext}>
                        Connect your mobile app to start displaying amazing content
                    </div>
                </div>
            </div>
        );
    }

    const renderContent = () => {
        switch (currentContent.content_type) {
            case 'text':
                return (
                    <div style={styles.textContent}>
                        <h1 style={styles.textTitle}>{currentContent.title}</h1>
                        <div style={styles.textBody}>
                            {currentContent.text_content?.split('\n').map((line, index) => (
                                <p key={index} style={styles.textLine}>
                                    {line}
                                </p>
                            ))}
                        </div>
                    </div>
                );

            case 'image':
                return (
                    <div style={styles.imageContent}>
                        <h2 style={styles.imageTitle}>{currentContent.title}</h2>
                        <div style={styles.imageContainer}>
                            <img
                                src={currentContent.file_url}
                                alt={currentContent.title}
                                style={styles.image}
                                onError={(e) => {
                                    console.error('Image load error:', e);
                                    // You could show a fallback image here
                                }}
                            />
                        </div>
                    </div>
                );

            case 'video':
                return (
                    <div style={styles.videoContent}>
                        <h2 style={styles.videoTitle}>{currentContent.title}</h2>
                        <div style={styles.videoContainer}>
                            <video
                                ref={videoRef}
                                src={currentContent.file_url}
                                style={styles.video}
                                autoPlay
                                muted
                                onEnded={handleVideoEnded}
                                onError={(e) => {
                                    console.error('Video load error:', e);
                                    nextContent();
                                }}
                            />
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div style={styles.container}>
            {/* Status Bar */}
            <div style={styles.statusBar}>
                <div style={styles.statusLeft}>
                    <span style={styles.deviceName}>📱 {deviceName}</span>
                    <span style={styles.onlineStatus}>🟢 Online</span>
                </div>
                <div style={styles.statusRight}>
                    <span style={styles.contentCounter}>
                        {currentIndex + 1} / {content.length}
                    </span>
                    <span style={styles.timestamp}>
                        {new Date().toLocaleTimeString()}
                    </span>
                </div>
            </div>

            {/* Main Content Area */}
            <div
                style={{
                    ...styles.contentArea,
                    opacity: isTransitioning ? 0 : 1,
                    transform: isTransitioning ? 'scale(0.95)' : 'scale(1)',
                }}
            >
                {renderContent()}
            </div>

            {/* Navigation Controls (hidden in kiosk mode, visible for testing) */}
            {content.length > 1 && (
                <div className="navigation" style={styles.navigation}>
                    <button
                        className="navButton"
                        style={styles.navButton}
                        onClick={previousContent}
                        disabled={isTransitioning}
                    >
                        ←
                    </button>

                    <div style={styles.progressIndicator}>
                        {content.map((_, index) => (
                            <div
                                key={index}
                                style={{
                                    ...styles.progressDot,
                                    backgroundColor: index === currentIndex ? '#4f46e5' : '#d1d5db',
                                }}
                            />
                        ))}
                    </div>

                    <button
                        className="navButton"
                        style={styles.navButton}
                        onClick={nextContent}
                        disabled={isTransitioning}
                    >
                        →
                    </button>
                </div>
            )}

            {/* Progress Bar */}
            <div style={styles.progressBar}>
                <div
                    className="progress-fill"
                    style={{
                        ...styles.progressFill,
                        animationDuration: `${currentContent.duration}s`,
                    }}
                />
            </div>
        </div>
    );
};

const styles = {
    container: {
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        display: 'flex',
        flexDirection: 'column' as const,
        position: 'relative' as const,
        overflow: 'hidden',
    },
    statusBar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 20px',
        background: 'rgba(0, 0, 0, 0.8)',
        color: '#ffffff',
        fontSize: '14px',
        zIndex: 10,
    },
    statusLeft: {
        display: 'flex',
        gap: '20px',
        alignItems: 'center',
    },
    statusRight: {
        display: 'flex',
        gap: '20px',
        alignItems: 'center',
    },
    deviceName: {
        fontWeight: 'bold',
    },
    onlineStatus: {
        fontSize: '12px',
    },
    contentCounter: {
        fontSize: '12px',
        background: 'rgba(255, 255, 255, 0.2)',
        padding: '4px 8px',
        borderRadius: '4px',
    },
    timestamp: {
        fontSize: '12px',
        fontFamily: 'monospace',
    },
    contentArea: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        transition: 'all 0.3s ease-in-out',
    },
    textContent: {
        textAlign: 'center' as const,
        color: '#ffffff',
        maxWidth: '90%',
    },
    textTitle: {
        fontSize: '4rem',
        fontWeight: 'bold',
        margin: '0 0 40px 0',
        textShadow: '0 2px 4px rgba(0,0,0,0.5)',
        lineHeight: '1.2',
    },
    textBody: {
        fontSize: '2rem',
        lineHeight: '1.6',
        maxWidth: '800px',
        margin: '0 auto',
    },
    textLine: {
        margin: '0 0 20px 0',
        textShadow: '0 1px 2px rgba(0,0,0,0.5)',
    },
    imageContent: {
        textAlign: 'center' as const,
        color: '#ffffff',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column' as const,
    },
    imageTitle: {
        fontSize: '2.5rem',
        fontWeight: 'bold',
        margin: '0 0 30px 0',
        textShadow: '0 2px 4px rgba(0,0,0,0.5)',
    },
    imageContainer: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    image: {
        maxWidth: '100%',
        maxHeight: '100%',
        objectFit: 'contain' as const,
        borderRadius: '10px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
    },
    videoContent: {
        textAlign: 'center' as const,
        color: '#ffffff',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column' as const,
    },
    videoTitle: {
        fontSize: '2.5rem',
        fontWeight: 'bold',
        margin: '0 0 30px 0',
        textShadow: '0 2px 4px rgba(0,0,0,0.5)',
    },
    videoContainer: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    video: {
        maxWidth: '100%',
        maxHeight: '100%',
        borderRadius: '10px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
    },
    navigation: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px',
        padding: '20px',
        background: 'rgba(0, 0, 0, 0.5)',
        opacity: 0.7,
        transition: 'opacity 0.3s ease',
    },
    navButton: {
        background: 'rgba(255, 255, 255, 0.2)',
        border: 'none',
        color: '#ffffff',
        fontSize: '24px',
        width: '50px',
        height: '50px',
        borderRadius: '50%',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
    },
    progressIndicator: {
        display: 'flex',
        gap: '8px',
    },
    progressDot: {
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        transition: 'background-color 0.3s ease',
    },
    progressBar: {
        height: '4px',
        background: 'rgba(255, 255, 255, 0.2)',
        position: 'relative' as const,
    },
    progressFill: {
        height: '100%',
        background: 'linear-gradient(90deg, #4f46e5, #7c3aed)',
        width: '0%',
        animation: 'progress linear forwards',
    },
    noContent: {
        textAlign: 'center' as const,
        color: '#ffffff',
        animation: 'fadeInUp 1s ease-out',
    },
    noContentIcon: {
        fontSize: '6rem',
        marginBottom: '30px',
        animation: 'pulse 2s infinite',
        display: 'block',
    },
    noContentTitle: {
        fontSize: '4rem',
        fontWeight: 'bold',
        margin: '0 0 30px 0',
        background: 'linear-gradient(45deg, #60a5fa, #a78bfa, #f472b6)',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        textShadow: 'none',
    },
    noContentText: {
        fontSize: '1.8rem',
        opacity: 0.9,
        marginBottom: '20px',
        fontWeight: '300',
    },
    noContentSubtext: {
        fontSize: '1.2rem',
        opacity: 0.7,
        fontStyle: 'italic',
        color: '#94a3b8',
    },
};