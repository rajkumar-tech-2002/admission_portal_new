import { useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook to monitor user inactivity and trigger a callback.
 * 
 * @param {Function} onIdle - Callback function to execute when idle time limit is reached
 * @param {number} timeoutMs - Timeout duration in milliseconds (default 15 minutes)
 */
const useIdleTimer = (onIdle, timeoutMs = 15 * 60 * 1000) => {
    const timerRef = useRef(null);

    const resetTimer = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        timerRef.current = setTimeout(() => {
            onIdle();
        }, timeoutMs);
    }, [onIdle, timeoutMs]);

    useEffect(() => {
        // Events to monitor for activity
        const events = [
            'mousedown',
            'mousemove',
            'keypress',
            'scroll',
            'touchstart',
            'click'
        ];

        // Add event listeners
        events.forEach(event => {
            window.addEventListener(event, resetTimer);
        });

        // Initialize timer
        resetTimer();

        // Cleanup
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            events.forEach(event => {
                window.removeEventListener(event, resetTimer);
            });
        };
    }, [resetTimer]);

    return null;
};

export default useIdleTimer;
