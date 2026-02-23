import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface AudioPlayerProps {
    src: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ src }) => {
    const [isMuted, setIsMuted] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        let playAttempted = false;

        const attemptPlay = async () => {
            if (audioRef.current && !playAttempted) {
                audioRef.current.volume = 0.3;
                audioRef.current.loop = true;
                try {
                    await audioRef.current.play();
                    playAttempted = true;
                    setIsMuted(false);
                    // Remove listeners if successful
                    ['click', 'keydown', 'scroll', 'touchstart'].forEach(event => {
                        document.removeEventListener(event, attemptPlay);
                    });
                } catch (error) {
                    console.warn("Autoplay blocked. User interaction required.");
                    setIsMuted(true);
                }
            }
        };

        // Attempt immediately on mount
        attemptPlay();

        // If blocked, these interactions will trigger it
        ['click', 'keydown', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, attemptPlay, { once: true });
        });

        return () => {
            ['click', 'keydown', 'scroll', 'touchstart'].forEach(event => {
                document.removeEventListener(event, attemptPlay);
            });
        };
    }, [src]);

    const toggleMute = () => {
        if (audioRef.current) {
            const newMutedState = !isMuted;
            audioRef.current.muted = newMutedState;
            if (!newMutedState && audioRef.current.paused) {
                audioRef.current.play(); // Play if it was blocked initially
            }
            setIsMuted(newMutedState);
        }
    };

    return (
        <div className="flex items-center">
            <audio ref={audioRef} src={src} preload="auto" />
            <button
                onClick={toggleMute}
                className="flex items-center justify-center p-2 rounded-lg text-gray-500 hover:text-slate-600 hover:bg-slate-50 transition-colors"
                title={isMuted ? "Unmute Theme" : "Mute Theme"}
            >
                {isMuted ? (
                    <VolumeX className="w-5 h-5" />
                ) : (
                    <Volume2 className="w-5 h-5" />
                )}
            </button>
        </div>
    );
};

export default AudioPlayer;
