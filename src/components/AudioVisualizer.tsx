// components/AudioVisualizer.tsx
import { cn } from '@/lib/utils';
import { useRef, useEffect } from 'react';

interface AudioVisualizerProps {
    analyser: AnalyserNode | null;
    className?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ analyser, className }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>();

    useEffect(() => {
        const drawVisualizer = () => {
            const canvas = canvasRef.current;
            if (!canvas || !analyser) return;

            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const width = canvas.width;
            const height = canvas.height;
            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            const draw = () => {
                analyser.getByteTimeDomainData(dataArray);
                ctx.clearRect(0, 0, width, height);
                ctx.lineWidth = 2;
                ctx.strokeStyle = 'rgb(0, 255, 0)';
                ctx.beginPath();

                const sliceWidth = width / dataArray.length;
                let x = 0;

                for (let i = 0; i < dataArray.length; i++) {
                    const v = dataArray[i] / 128.0;
                    const y = v * height / 2;

                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }

                    x += sliceWidth;
                }

                ctx.lineTo(canvas.width, canvas.height / 2);
                ctx.stroke();
                animationRef.current = requestAnimationFrame(draw);
            };

            draw();
        };

        drawVisualizer();

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [analyser]);

    return <canvas ref={canvasRef} width="600" height="50" className={cn("mb-6 border rounded", className)} />;
};
