import React, { useState, useEffect, useRef } from 'react';
import apiService from '../../services/api.service';

const AutoSuggestInput = ({
    name,
    value,
    onChange,
    placeholder,
    className,
    suggestionField,
    required,
    style,
    maxLength
}) => {
    const [suggestions, setSuggestions] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef(null);
    const debounceTimeout = useRef(null);

    // Handle outside click to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch suggestions on type with debounce
    useEffect(() => {
        if (!isOpen) return;

        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

        if (value && value.trim().length > 1) {
            debounceTimeout.current = setTimeout(async () => {
                setLoading(true);
                try {
                    const res = await apiService.get(`/admissions/suggestions?field=${suggestionField}&q=${encodeURIComponent(value.trim())}`);
                    if (res.data.success) {
                        setSuggestions(res.data.data);
                    }
                } catch (err) {
                    console.error("Failed to fetch suggestions:", err);
                } finally {
                    setLoading(false);
                }
            }, 300);
        } else {
            setSuggestions([]);
        }
    }, [value, isOpen, suggestionField]);

    const handleInputChange = (e) => {
        onChange(e); // Propagate up to form handler
        setIsOpen(true);
        setHighlightedIndex(-1);
    };

    const handleSelectSuggestion = (suggestion) => {
        // Mocking event object to match standard onChange handler signature
        const mockEvent = {
            target: {
                name,
                value: suggestion
            }
        };
        onChange(mockEvent);
        setIsOpen(false);
    };

    const handleKeyDown = (e) => {
        if (!isOpen || suggestions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1));
        } else if (e.key === 'Enter' && highlightedIndex >= 0) {
            e.preventDefault();
            handleSelectSuggestion(suggestions[highlightedIndex]);
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    return (
        <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
            <input
                type="text"
                name={name}
                value={value}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                    if (value && value.trim().length > 1) setIsOpen(true);
                }}
                placeholder={placeholder}
                className={className}
                required={required}
                style={style}
                maxLength={maxLength}
                autoComplete="off" // Prevent native browser autocomplete
            />
            
            {isOpen && (suggestions.length > 0 || loading) && (
                <ul style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 50,
                    margin: '4px 0 0 0',
                    padding: 0,
                    listStyle: 'none',
                    backgroundColor: '#fff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    maxHeight: '200px',
                    overflowY: 'auto'
                }}>
                    {loading ? (
                        <li style={{ padding: '0.5rem 1rem', color: '#64748b', fontSize: '0.875rem' }}>Loading...</li>
                    ) : (
                        suggestions.map((suggestion, index) => (
                            <li
                                key={index}
                                onClick={() => handleSelectSuggestion(suggestion)}
                                onMouseEnter={() => setHighlightedIndex(index)}
                                style={{
                                    padding: '0.5rem 1rem',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    color: '#1e293b',
                                    backgroundColor: highlightedIndex === index ? '#f1f5f9' : 'transparent',
                                    borderBottom: index < suggestions.length - 1 ? '1px solid #f1f5f9' : 'none',
                                    transition: 'background-color 0.15s ease'
                                }}
                            >
                                {suggestion}
                            </li>
                        ))
                    )}
                </ul>
            )}
        </div>
    );
};

export default AutoSuggestInput;
