import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

const LiveStreamPlayer = () => {
    const videoRef = useRef();
    const [isLive, setIsLive] = useState(true); // Indicates whether the user is watching live
    const [isPlaying, setIsPlaying] = useState(false); // Tracks playback state

    useEffect(() => {
        let hls;

        const startStream = async () => {
            try {
                const video = videoRef.current;

                if (Hls.isSupported()) {
                    hls = new Hls({
                        startLevel: 0,
                        capLevelToPlayerSize: true,
                        maxMaxBufferLength: 10,
                        maxBufferLength: 6,
                        maxBufferSize: 60 * 1000 * 1000,
                    });
                    hls.loadSource('http://localhost:4001/stream/index.m3u8');
                    hls.attachMedia(video);

                    hls.on(Hls.Events.MANIFEST_PARSED, () => {
                        video.play();
                        setIsPlaying(true);
                    });

                    hls.on(Hls.Events.ERROR, (event, data) => {
                        if (data.fatal) {
                            console.error('Fatal HLS error:', data);
                            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                                console.log('Retrying stream...');
                                hls.startLoad();
                            } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                                console.log('Recovering from media error...');
                                hls.recoverMediaError();
                            }
                        }
                    });
                } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    // Native HLS support for Safari
                    video.src = 'http://localhost:4001/stream/index.m3u8';
                    video.addEventListener('loadedmetadata', () => {
                        video.play();
                        setIsPlaying(true);
                    });
                }
            } catch (error) {
                console.error('Error starting the stream:', error);
            }
        };

        startStream();

        // Cleanup on component unmount
        return () => {
            if (hls) {
                hls.destroy();
            }
        };
    }, []);

    const handlePlayPause = () => {
        const video = videoRef.current;
        if (video.paused) {
            video.play();
            setIsPlaying(true);
        } else {
            video.pause();
            setIsPlaying(false);
        }
    };

    const goToLive = () => {
        const video = videoRef.current;
        video.currentTime = video.duration; // Jump to the end of the buffer
        setIsLive(true);
        video.play();
        setIsPlaying(true);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h1>Live Stream</h1>
            <div style={{ position: 'relative', width: '100%', maxWidth: '800px' }}>
                {/* Video Player */}
                <video
                    ref={videoRef}
                    controls={false}
                    style={{ width: '100%', border: '1px solid #ccc', borderRadius: '8px' }}
                    muted
                    onPause={() => setIsPlaying(false)}
                    onPlay={() => setIsPlaying(true)}
                    onSeeking={() => setIsLive(false)} // User seeks, no longer live
                />

                {/* Live Badge */}
                {isLive && (
                    <div
                        style={{
                            position: 'absolute',
                            top: '10px',
                            left: '10px',
                            backgroundColor: 'red',
                            color: 'white',
                            padding: '5px 10px',
                            borderRadius: '5px',
                            fontWeight: 'bold',
                            fontSize: '14px',
                        }}
                    >
                        LIVE
                    </div>
                )}
            </div>

        </div>
    );
};

export default LiveStreamPlayer;
