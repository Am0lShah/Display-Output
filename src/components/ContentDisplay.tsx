import React, { useState, useEffect, useRef } from 'react';
import { Content } from '../services/supabaseClient';
import './ContentDisplay.css';

interface ContentDisplayProps {
    content: Content[];
    deviceName: string;
    displayLayout: string;
}

export const ContentDisplay: React.FC<ContentDisplayProps> = ({ content, deviceName, displayLayout }) => {
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
        console.log('Display layout:', displayLayout);
    }, [content, currentIndex, currentContent, displayLayout]);

    // Reset index when content changes
    useEffect(() => {
        if (content.length > 0 && currentIndex >= content.length) {
            setCurrentIndex(0);
        }
    }, [content, currentIndex]);

    const contentIds = content.map(c => c.id).join(',');
    useEffect(() => {
        setCurrentIndex(0);
        setIsTransitioning(false);
    }, [contentIds]);

    // Auto-rotate content
    useEffect(() => {
        if (content.length === 0) return;

        const startTimer = () => {
            if (timerRef.current) clearTimeout(timerRef.current);

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

        startTimer();

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
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

    const handleVideoEnded = () => nextContent();

    if (!currentContent) {
        return (
            <div style={baseStyles.container}>
                <div style={baseStyles.noContent}>
                    <div style={baseStyles.noContentIcon}>🚀</div>
                    <h2 style={baseStyles.noContentTitle}>Welcome to PiBoard Innovators</h2>
                    <p style={baseStyles.noContentText}>Your digital signage solution is ready!</p>
                    <div style={baseStyles.noContentSubtext}>
                        Connect your mobile app to start displaying amazing content
                    </div>
                </div>
            </div>
        );
    }

    // ─── LAYOUT: STANDARD ─────────────────────────────────────────
    const renderStandard = () => (
        <div style={baseStyles.container}>
            {/* Status Bar */}
            <div style={standardStyles.statusBar}>
                <div style={standardStyles.statusLeft}>
                    <span style={standardStyles.deviceName}>📱 {deviceName}</span>
                    <span style={standardStyles.onlineStatus}>🟢 Online</span>
                </div>
                <div style={standardStyles.statusRight}>
                    <span style={standardStyles.contentCounter}>
                        {currentIndex + 1} / {content.length}
                    </span>
                    <span style={standardStyles.timestamp}>
                        {new Date().toLocaleTimeString()}
                    </span>
                </div>
            </div>

            {/* Content Area */}
            <div style={{
                ...standardStyles.contentArea,
                opacity: isTransitioning ? 0 : 1,
                transform: isTransitioning ? 'scale(0.95)' : 'scale(1)',
                transition: 'all 0.3s ease',
            }}>
                {renderContentItem(currentContent, 'standard')}
            </div>

            {/* Progress Bar */}
            <div style={standardStyles.progressBar}>
                <div
                    className="progress-fill"
                    style={{
                        ...standardStyles.progressFill,
                        animationDuration: `${currentContent.duration}s`,
                    }}
                />
            </div>
        </div>
    );

    // ─── LAYOUT: CLEAN ────────────────────────────────────────────
    const renderClean = () => (
        <div style={cleanStyles.container}>
            <div
                className="clean-fade"
                key={currentContent.id}
                style={{
                    ...cleanStyles.contentArea,
                    opacity: isTransitioning ? 0 : 1,
                    transition: 'opacity 0.5s ease',
                }}
            >
                {renderContentItem(currentContent, 'clean')}
            </div>
        </div>
    );

    // ─── LAYOUT: SCROLLING ────────────────────────────────────────
    const renderScrolling = () => (
        <div style={scrollingStyles.container}>
            {/* Subtle top bar */}
            <div style={scrollingStyles.topBar}>
                <span style={scrollingStyles.barText}>📱 {deviceName}</span>
                <span style={scrollingStyles.barText}>
                    {currentIndex + 1}/{content.length}
                </span>
            </div>

            <div style={{
                ...scrollingStyles.contentArea,
                opacity: isTransitioning ? 0 : 1,
                transition: 'opacity 0.3s ease',
            }}>
                {currentContent.content_type === 'text' ? (
                    <div
                        className="scroll-text-container"
                        key={currentContent.id}
                        style={{
                            ...scrollingStyles.scrollingText,
                            animationDuration: `${Math.max((currentContent.text_content?.length || 100) / 5, 10)}s`,
                        }}
                    >
                        <h1 style={scrollingStyles.scrollTitle}>{currentContent.title}</h1>
                        <div style={scrollingStyles.scrollBody}>
                            {currentContent.text_content?.split('\n').map((line, i) => (
                                <p key={i} style={scrollingStyles.scrollLine}>{line}</p>
                            ))}
                        </div>
                    </div>
                ) : (
                    renderContentItem(currentContent, 'scrolling')
                )}
            </div>
        </div>
    );

    // ─── LAYOUT: CINEMATIC ────────────────────────────────────────
    const renderCinematic = () => (
        <div style={cinematicStyles.container}>
            <div
                className="cinematic-image"
                key={currentContent.id}
                style={{
                    ...cinematicStyles.contentArea,
                    opacity: isTransitioning ? 0 : 1,
                    transition: 'opacity 0.5s ease',
                }}
            >
                {renderContentItem(currentContent, 'cinematic')}
            </div>

            {/* Cinematic bottom gradient overlay with title */}
            <div style={cinematicStyles.bottomOverlay}>
                <h1 className="cinematic-text" style={cinematicStyles.title}>
                    {currentContent.title}
                </h1>
                <p style={cinematicStyles.meta}>
                    {content.length > 1 && `${currentIndex + 1} / ${content.length}`}
                </p>
            </div>
        </div>
    );

    // ─── Shared content item renderer ─────────────────────────────
    const renderContentItem = (item: Content, layout: string) => {
        switch (item.content_type) {
            case 'text':
                return layout === 'cinematic' ? (
                    <div style={cinematicStyles.textContent}>
                        <div style={cinematicStyles.textBody}>
                            {item.text_content?.split('\n').map((line, i) => (
                                <p key={i} style={cinematicStyles.textLine}>{line}</p>
                            ))}
                        </div>
                    </div>
                ) : layout === 'clean' ? (
                    <div style={cleanStyles.textContent}>
                        <h1 style={cleanStyles.textTitle}>{item.title}</h1>
                        <div style={cleanStyles.textBody}>
                            {item.text_content?.split('\n').map((line, i) => (
                                <p key={i} style={cleanStyles.textLine}>{line}</p>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div style={standardStyles.textContent}>
                        <h1 style={standardStyles.textTitle}>{item.title}</h1>
                        <div style={standardStyles.textBody}>
                            {item.text_content?.split('\n').map((line, i) => (
                                <p key={i} style={standardStyles.textLine}>{line}</p>
                            ))}
                        </div>
                    </div>
                );

            case 'image':
                return layout === 'cinematic' ? (
                    <img
                        src={item.file_url}
                        alt={item.title}
                        style={cinematicStyles.image}
                        onError={(e) => console.error('Image load error:', e)}
                    />
                ) : layout === 'clean' ? (
                    <div style={cleanStyles.imageContainer}>
                        <img
                            src={item.file_url}
                            alt={item.title}
                            style={cleanStyles.image}
                            onError={(e) => console.error('Image load error:', e)}
                        />
                    </div>
                ) : (
                    <div style={standardStyles.imageContent}>
                        <h2 style={standardStyles.imageTitle}>{item.title}</h2>
                        <div style={standardStyles.imageContainer}>
                            <img
                                src={item.file_url}
                                alt={item.title}
                                style={standardStyles.image}
                                onError={(e) => console.error('Image load error:', e)}
                            />
                        </div>
                    </div>
                );

            case 'video':
                return layout === 'cinematic' ? (
                    <video
                        ref={videoRef}
                        src={item.file_url}
                        style={cinematicStyles.video}
                        autoPlay muted
                        onEnded={handleVideoEnded}
                        onError={() => nextContent()}
                    />
                ) : layout === 'clean' ? (
                    <div style={cleanStyles.videoContainer}>
                        <video
                            ref={videoRef}
                            src={item.file_url}
                            style={cleanStyles.video}
                            autoPlay muted
                            onEnded={handleVideoEnded}
                            onError={() => nextContent()}
                        />
                    </div>
                ) : (
                    <div style={standardStyles.videoContent}>
                        <h2 style={standardStyles.videoTitle}>{item.title}</h2>
                        <div style={standardStyles.videoContainer}>
                            <video
                                ref={videoRef}
                                src={item.file_url}
                                style={standardStyles.video}
                                autoPlay muted
                                onEnded={handleVideoEnded}
                                onError={() => nextContent()}
                            />
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    // ─── Layout switcher ──────────────────────────────────────────
    switch (displayLayout) {
        case 'clean': return renderClean();
        case 'scrolling': return renderScrolling();
        case 'cinematic': return renderCinematic();
        case 'standard':
        default: return renderStandard();
    }
};

// ════════════════════════════════════════════════════════════════
// STYLES
// ════════════════════════════════════════════════════════════════

const baseStyles: Record<string, React.CSSProperties> = {
    container: {
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
    },
    noContent: {
        textAlign: 'center',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
    },
    noContentIcon: { fontSize: '15vmin', marginBottom: '4vh' },
    noContentTitle: {
        fontSize: '6vmin', fontWeight: 'bold', margin: '0 0 2vh 0',
        background: 'linear-gradient(45deg, #60a5fa, #a78bfa, #f472b6)',
        backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    },
    noContentText: { fontSize: '3vmin', opacity: 0.9, marginBottom: '2vh' },
    noContentSubtext: { fontSize: '2vmin', opacity: 0.6, color: '#94a3b8' },
};

// ── Standard Layout Styles ──
const standardStyles: Record<string, React.CSSProperties> = {
    statusBar: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '1vh 2vw', background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(10px)', color: '#fff', fontSize: '1.5vmin', zIndex: 10, height: '6vh',
    },
    statusLeft: { display: 'flex', gap: '2vw', alignItems: 'center' },
    statusRight: { display: 'flex', gap: '2vw', alignItems: 'center' },
    deviceName: { fontWeight: 'bold' },
    onlineStatus: { fontSize: '1.2vmin' },
    contentCounter: {
        fontSize: '1.2vmin', background: 'rgba(255,255,255,0.15)',
        padding: '0.4vh 1vw', borderRadius: '4px',
    },
    timestamp: { fontSize: '1.2vmin', fontFamily: 'monospace' },
    contentArea: {
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '2vmin', width: '100%', position: 'relative',
    },
    textContent: {
        textAlign: 'center', color: '#fff', width: '100%', height: '100%',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
    },
    textTitle: {
        fontSize: '6vmin', fontWeight: 'bold', margin: '0 0 4vh 0',
        textShadow: '0 0.5vh 1vh rgba(0,0,0,0.5)', lineHeight: '1.2', maxWidth: '90%',
    },
    textBody: { fontSize: '3.5vmin', lineHeight: '1.5', maxWidth: '85%', margin: '0 auto' },
    textLine: { margin: '0 0 1.5vh 0', textShadow: '0 0.2vh 0.4vh rgba(0,0,0,0.5)' },
    imageContent: {
        textAlign: 'center', color: '#fff', width: '100%', height: '100%',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
    },
    imageTitle: {
        fontSize: '4vmin', fontWeight: 'bold', margin: '0 0 2vh 0',
        textShadow: '0 0.2vh 0.4vh rgba(0,0,0,0.5)', flexShrink: 0,
    },
    imageContainer: {
        flex: 1, width: '100%', display: 'flex', alignItems: 'center',
        justifyContent: 'center', overflow: 'hidden', minHeight: 0,
    },
    image: {
        maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' as const,
        borderRadius: '1vmin', boxShadow: '0 2vh 5vh rgba(0,0,0,0.4)',
    },
    videoContent: {
        textAlign: 'center', color: '#fff', width: '100%', height: '100%',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
    },
    videoTitle: {
        fontSize: '4vmin', fontWeight: 'bold', margin: '0 0 2vh 0',
        textShadow: '0 0.2vh 0.4vh rgba(0,0,0,0.5)', flexShrink: 0,
    },
    videoContainer: {
        flex: 1, width: '100%', display: 'flex', alignItems: 'center',
        justifyContent: 'center', overflow: 'hidden', minHeight: 0,
    },
    video: {
        maxWidth: '100%', maxHeight: '100%', borderRadius: '1vmin',
        boxShadow: '0 2vh 5vh rgba(0,0,0,0.4)',
    },
    progressBar: {
        height: '0.6vh', background: 'rgba(255,255,255,0.1)',
        position: 'absolute', bottom: 0, left: 0, width: '100%', zIndex: 15,
    },
    progressFill: {
        height: '100%', background: 'linear-gradient(90deg, #6366f1, #a855f7, #6366f1)',
        backgroundSize: '200% 100%', width: '0%',
    },
};

// ── Clean Layout Styles ──
const cleanStyles: Record<string, React.CSSProperties> = {
    container: {
        width: '100vw', height: '100vh', background: '#000',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
    },
    contentArea: {
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '100%', height: '100%',
    },
    textContent: {
        textAlign: 'center', color: '#fff', padding: '5vmin',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    },
    textTitle: {
        fontSize: '7vmin', fontWeight: 'bold', margin: '0 0 4vh 0',
        color: '#ffffff', lineHeight: '1.2',
    },
    textBody: { fontSize: '4vmin', lineHeight: '1.6', color: 'rgba(255,255,255,0.85)' },
    textLine: { margin: '0 0 2vh 0' },
    imageContainer: {
        width: '100%', height: '100%', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
    },
    image: {
        maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' as const,
    },
    videoContainer: {
        width: '100%', height: '100%', display: 'flex',
        alignItems: 'center', justifyContent: 'center', background: '#000',
    },
    video: {
        maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' as const,
    },
};

// ── Scrolling Layout Styles ──
const scrollingStyles: Record<string, React.CSSProperties> = {
    container: {
        width: '100vw', height: '100vh',
        background: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a3e 50%, #0d0d2b 100%)',
        overflow: 'hidden', position: 'relative',
    },
    topBar: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '1vh 2vw', background: 'rgba(0,0,0,0.4)', color: 'rgba(255,255,255,0.5)',
        fontSize: '1.2vmin', zIndex: 10, position: 'absolute', top: 0, left: 0, right: 0,
    },
    barText: { fontSize: '1.2vmin' },
    contentArea: {
        width: '100%', height: '100%', display: 'flex',
        alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    },
    scrollingText: {
        textAlign: 'center', color: '#ffffff', padding: '0 10vw',
        position: 'absolute', width: '80%',
    },
    scrollTitle: {
        fontSize: '8vmin', fontWeight: 'bold', marginBottom: '5vh',
        background: 'linear-gradient(135deg, #60a5fa, #c084fc)',
        backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    },
    scrollBody: { fontSize: '4.5vmin', lineHeight: '1.8' },
    scrollLine: { margin: '0 0 3vh 0', textShadow: '0 0.2vh 0.5vh rgba(0,0,0,0.6)' },
};

// ── Cinematic Layout Styles ──
const cinematicStyles: Record<string, React.CSSProperties> = {
    container: {
        width: '100vw', height: '100vh', background: '#000',
        position: 'relative', overflow: 'hidden',
    },
    contentArea: {
        width: '100%', height: '100%', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
    },
    image: {
        width: '100%', height: '100%', objectFit: 'cover' as const,
    },
    video: {
        width: '100%', height: '100%', objectFit: 'cover' as const,
    },
    textContent: {
        textAlign: 'center', color: '#fff', width: '100%', height: '100%',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
    },
    textBody: { fontSize: '5vmin', lineHeight: '1.8', maxWidth: '70%', margin: '0 auto' },
    textLine: {
        margin: '0 0 3vh 0', fontWeight: '300', letterSpacing: '0.05em',
        textShadow: '0 0.3vh 1vh rgba(0,0,0,0.6)',
    },
    bottomOverlay: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
        padding: '8vh 4vw 4vh 4vw', zIndex: 10,
    },
    title: {
        fontSize: '4vmin', fontWeight: '700', color: '#fff', margin: '0 0 1vh 0',
        letterSpacing: '0.05em',
    },
    meta: {
        fontSize: '1.5vmin', color: 'rgba(255,255,255,0.5)', margin: 0,
        letterSpacing: '0.1em', textTransform: 'uppercase',
    },
};