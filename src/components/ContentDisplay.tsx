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
        padding: '1vh 2vw',
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(10px)',
        color: '#ffffff',
        fontSize: '1.5vmin', // Responsive font size
        zIndex: 10,
        height: '6vh', // Fixed small height
    },
    statusLeft: {
        display: 'flex',
        gap: '2vw',
        alignItems: 'center',
    },
    statusRight: {
        display: 'flex',
        gap: '2vw',
        alignItems: 'center',
    },
    deviceName: {
        fontWeight: 'bold',
    },
    onlineStatus: {
        fontSize: '1.2vmin',
    },
    contentCounter: {
        fontSize: '1.2vmin',
        background: 'rgba(255, 255, 255, 0.15)',
        padding: '0.4vh 1vw',
        borderRadius: '4px',
    },
    timestamp: {
        fontSize: '1.2vmin',
        fontFamily: 'monospace',
    },
    contentArea: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2vmin', // Minimal padding
        width: '100%',
        height: '94vh', // Remaining height
        position: 'relative' as const,
    },
    textContent: {
        textAlign: 'center' as const,
        color: '#ffffff',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column' as const,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textTitle: {
        fontSize: '6vmin', // Responsive title
        fontWeight: 'bold',
        margin: '0 0 4vh 0',
        textShadow: '0 0.5vh 1vh rgba(0,0,0,0.5)',
        lineHeight: '1.2',
        maxWidth: '90%',
    },
    textBody: {
        fontSize: '3.5vmin', // Responsive body
        lineHeight: '1.5',
        maxWidth: '85%',
        margin: '0 auto',
        whiteSpace: 'pre-wrap' as const, // Preserve newlines
    },
    textLine: {
        margin: '0 0 1.5vh 0',
        textShadow: '0 0.2vh 0.4vh rgba(0,0,0,0.5)',
    },
    imageContent: {
        textAlign: 'center' as const,
        color: '#ffffff',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column' as const,
        justifyContent: 'center', // Center vertically
        alignItems: 'center', // Center horizontally
    },
    imageTitle: {
        fontSize: '4vmin', // Smaller title for media to give more space to image
        fontWeight: 'bold',
        margin: '0 0 2vh 0', // Less margin
        textShadow: '0 0.2vh 0.4vh rgba(0,0,0,0.5)',
        flexShrink: 0, // Don't shrink title
    },
    imageContainer: {
        flex: 1,
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        minHeight: 0, // Critical for flexbox scrolling issues
    },
    image: {
        maxWidth: '100%',
        maxHeight: '100%',
        objectFit: 'contain' as const,
        borderRadius: '1vmin',
        boxShadow: '0 2vh 5vh rgba(0,0,0,0.4)',
    },
    videoContent: {
        textAlign: 'center' as const,
        color: '#ffffff',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column' as const,
        justifyContent: 'center',
        alignItems: 'center',
    },
    videoTitle: {
        fontSize: '4vmin',
        fontWeight: 'bold',
        margin: '0 0 2vh 0',
        textShadow: '0 0.2vh 0.4vh rgba(0,0,0,0.5)',
        flexShrink: 0,
    },
    videoContainer: {
        flex: 1,
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        minHeight: 0,
    },
    video: {
        maxWidth: '100%',
        maxHeight: '100%',
        borderRadius: '1vmin',
        boxShadow: '0 2vh 5vh rgba(0,0,0,0.4)',
    },
    navigation: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2vw',
        padding: '2vh',
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '2vh',
        position: 'absolute' as const, // Float above content
        bottom: '8vh',
        left: '50%',
        transform: 'translateX(-50%)',
        opacity: 0, // Hidden by default, shown on hover (handled by CSS)
        transition: 'opacity 0.3s ease',
        zIndex: 20,
    },
    navButton: {
        background: 'rgba(255, 255, 255, 0.15)',
        border: 'none',
        color: '#ffffff',
        fontSize: '3vmin',
        width: '6vmin',
        height: '6vmin',
        borderRadius: '50%',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressIndicator: {
        display: 'flex',
        gap: '1vmin',
    },
    progressDot: {
        width: '1.2vmin',
        height: '1.2vmin',
        borderRadius: '50%',
        transition: 'background-color 0.3s ease',
    },
    progressBar: {
        height: '0.6vh', // Slightly thicker
        background: 'rgba(255, 255, 255, 0.1)',
        position: 'absolute' as const,
        bottom: 0,
        left: 0,
        width: '100%',
        zIndex: 15,
    },
    progressFill: {
        height: '100%',
        background: 'linear-gradient(90deg, #6366f1, #a855f7, #6366f1)', // Animated gradient
        backgroundSize: '200% 100%',
        width: '0%',
        animation: 'progress linear forwards, gradientShift 3s ease infinite',
    },
    noContent: {
        textAlign: 'center' as const,
        color: '#ffffff',
        animation: 'fadeInUp 1s ease-out',
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
    },
    noContentIcon: {
        fontSize: '15vmin',
        marginBottom: '4vh',
        animation: 'pulse 3s infinite ease-in-out',
        display: 'block',
    },
    noContentTitle: {
        fontSize: '6vmin',
        fontWeight: 'bold',
        margin: '0 0 2vh 0',
        background: 'linear-gradient(45deg, #60a5fa, #a78bfa, #f472b6)',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
    },
    noContentText: {
        fontSize: '3vmin',
        opacity: 0.9,
        marginBottom: '2vh',
        fontWeight: '300',
    },
    noContentSubtext: {
        fontSize: '2vmin',
        opacity: 0.6,
        fontStyle: 'italic',
        color: '#94a3b8',
    },
};