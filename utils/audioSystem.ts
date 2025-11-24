// Simple Web Audio API sound effects

let audioContext: AudioContext | null = null;

const getAudioContext = () => {
    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContext;
};

export const playSound = (type: 'dig' | 'water' | 'hit' | 'pickup' | 'step' | 'plant') => {
    try {
        const ctx = getAudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        // Configure sound based on type
        switch (type) {
            case 'dig':
                oscillator.frequency.value = 150;
                gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
                oscillator.start();
                oscillator.stop(ctx.currentTime + 0.1);
                break;

            case 'water':
                oscillator.frequency.value = 400;
                oscillator.type = 'sine';
                gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
                oscillator.start();
                oscillator.stop(ctx.currentTime + 0.15);
                break;

            case 'hit':
                oscillator.frequency.value = 100;
                oscillator.type = 'sawtooth';
                gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
                oscillator.start();
                oscillator.stop(ctx.currentTime + 0.08);
                break;

            case 'pickup':
                oscillator.frequency.value = 800;
                oscillator.type = 'sine';
                gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
                oscillator.start();
                oscillator.stop(ctx.currentTime + 0.12);
                break;

            case 'step':
                oscillator.frequency.value = 80;
                oscillator.type = 'square';
                gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
                oscillator.start();
                oscillator.stop(ctx.currentTime + 0.05);
                break;

            case 'plant':
                oscillator.frequency.value = 600;
                oscillator.type = 'triangle';
                gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
                oscillator.start();
                oscillator.stop(ctx.currentTime + 0.1);
                break;
        }
    } catch (error) {
        // Silently fail if audio context isn't available
        console.warn('Audio playback failed:', error);
    }
};
