import React, { useEffect, useState } from 'react';
import { Scale } from 'lucide-react';

const InteractiveBackground: React.FC = () => {
    const [rotation, setRotation] = useState(0);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        let animationFrameId: number;
        let targetRotation = 0;
        let targetX = 0;
        let targetY = 0;
        let currentRotation = 0;
        let currentX = 0;
        let currentY = 0;

        const handleMouseMove = (e: MouseEvent) => {
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            const mouseX = e.clientX;
            const mouseY = e.clientY;
            const maxRotation = 15; // Max tilt angle

            targetRotation = ((mouseX - centerX) / centerX) * maxRotation;
            targetX = ((mouseX - centerX) / centerX) * 40; // slight parallax movement
            targetY = ((mouseY - centerY) / centerY) * 40; // slight parallax movement
        };

        const smoothAnimate = () => {
            // Linear interpolation (Lerp) for super smooth animation independent of mouse move events
            currentRotation += (targetRotation - currentRotation) * 0.08;
            currentX += (targetX - currentX) * 0.08;
            currentY += (targetY - currentY) * 0.08;

            setRotation(currentRotation);
            setPosition({ x: currentX, y: currentY });
            animationFrameId = requestAnimationFrame(smoothAnimate);
        };

        window.addEventListener('mousemove', handleMouseMove);
        smoothAnimate();

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden flex items-center justify-center bg-transparent">
            <div
                className="opacity-[0.06] text-slate-900"
                style={{
                    transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg)`,
                    willChange: 'transform'
                }}
            >
                <Scale className="w-[120%] h-[120%] min-w-[500px] min-h-[500px]" strokeWidth={0.5} />
            </div>
        </div>
    );
};

export default InteractiveBackground;
