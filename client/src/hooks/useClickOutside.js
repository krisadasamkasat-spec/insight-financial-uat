import { useEffect } from 'react';

/**
 * Custom hook to detect clicks outside of a given element
 * Useful for dropdowns, modals, and other overlay components
 * 
 * @param {React.RefObject} ref - React ref object attached to the element
 * @param {Function} callback - Function to call when clicking outside
 * @param {boolean} enabled - Whether the hook is active (default: true)
 * 
 * @example
 * const dropdownRef = useRef(null);
 * useClickOutside(dropdownRef, () => setIsOpen(false), isOpen);
 */
export const useClickOutside = (ref, callback, enabled = true) => {
    useEffect(() => {
        if (!enabled) return;

        const handleClickOutside = (event) => {
            if (ref.current && !ref.current.contains(event.target)) {
                callback();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [ref, callback, enabled]);
};

export default useClickOutside;
