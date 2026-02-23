import React from 'react';
import { Scale } from 'lucide-react';

interface LogoProps {
    className?: string;
    size?: 'large' | 'small';
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 'small' }) => {
    const isLarge = size === 'large';

    return (
        <div className={`flex items-center justify-center gap-1 sm:gap-2 ${className}`}>
            {/* Text Container */}
            <div className={`flex flex-col items-start leading-none drop-shadow-md select-none rotate-[-5deg] ${isLarge ? 'gap-1' : ''}`}>
                <span
                    className={`font-black tracking-tighter text-yellow-500 ${isLarge ? 'text-5xl sm:text-7xl md:text-8xl' : 'text-xl sm:text-2xl'}`}
                    style={{
                        fontFamily: "'Permanent Marker', cursive",
                        WebkitTextStroke: isLarge ? '2.5px #111' : '1px #111',
                        paintOrder: 'stroke fill',
                        textShadow: '2px 2px 0px rgba(0,0,0,0.2)'
                    }}
                >
                    BETTER CALL
                </span>
                <span
                    className={`text-red-500 ${isLarge ? 'text-7xl sm:text-8xl md:text-9xl mt-[-10px]' : 'text-3xl sm:text-4xl mt-[-5px]'}`}
                    style={{
                        fontFamily: "'Yellowtail', cursive",
                        WebkitTextStroke: isLarge ? '2.5px #111' : '1px #111',
                        paintOrder: 'stroke fill',
                        textShadow: '2px 2px 0px rgba(0,0,0,0.2)'
                    }}
                >
                    Mbarek
                </span>
            </div>

            {/* Icon */}
            <div className={`relative ${isLarge ? 'ml-2' : 'ml-1'}`}>
                <Scale
                    className={`text-yellow-500 ${isLarge ? 'w-32 h-32 sm:w-48 sm:h-48 md:w-56 md:h-56' : 'w-10 h-10 sm:w-12 sm:h-12'}`}
                    strokeWidth={isLarge ? 1.5 : 2}
                    style={{
                        filter: 'drop-shadow(2px 2px 0px #111) drop-shadow(-1px -1px 0px #111) drop-shadow(1px -1px 0px #111) drop-shadow(-1px 1px 0px #111)'
                    }}
                />
            </div>
        </div>
    );
};

export default Logo;
