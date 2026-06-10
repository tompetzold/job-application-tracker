import { useEffect, useId, useRef, useState } from "react";
import { searchSuggestions } from "../services/suggestionsService";

export default function AutocompleteInput({
                                              label,
                                              value,
                                              onChange,
                                              source,
                                              placeholder,
                                              required = false,
                                              error = "",
                                          }) {
    const inputId = useId();
    const wrapperRef = useRef(null);
    const inputRef = useRef(null);
    const closeTimerRef = useRef(null);
    const searchRequestRef = useRef(0);
    const suppressUntilManualInputRef = useRef(false);

    const [suggestions, setSuggestions] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    function clearCloseTimer() {
        if (closeTimerRef.current) {
            window.clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }
    }

    function closeSuggestions() {
        clearCloseTimer();
        setIsOpen(false);
        setHighlightedIndex(0);
    }

    function suppressSuggestions() {
        suppressUntilManualInputRef.current = true;
        searchRequestRef.current += 1;
        setSuggestions([]);
        setIsOpen(false);
        setHighlightedIndex(0);
        setIsLoading(false);
    }

    function selectSuggestion(suggestion) {
        if (!suggestion?.value) {
            return;
        }

        suppressSuggestions();

        if (typeof onChange === "function") {
            onChange(suggestion.value);
        }

        window.requestAnimationFrame(() => {
            inputRef.current?.focus();
        });
    }

    function handleInputChange(event) {
        suppressUntilManualInputRef.current = false;

        if (typeof onChange === "function") {
            onChange(event.target.value);
        }

        setIsOpen(true);
    }

    function handleFocus() {
        clearCloseTimer();

        if (!suppressUntilManualInputRef.current && suggestions.length > 0) {
            setIsOpen(true);
        }
    }

    function handleBlur() {
        closeTimerRef.current = window.setTimeout(() => {
            closeSuggestions();
        }, 120);
    }

    function handleKeyDown(event) {
        if (!isOpen || suggestions.length === 0) {
            return;
        }

        if (event.key === "ArrowDown") {
            event.preventDefault();
            setHighlightedIndex((currentIndex) => (currentIndex + 1) % suggestions.length);
            return;
        }

        if (event.key === "ArrowUp") {
            event.preventDefault();
            setHighlightedIndex((currentIndex) =>
                currentIndex <= 0 ? suggestions.length - 1 : currentIndex - 1,
            );
            return;
        }

        if (event.key === "Enter") {
            event.preventDefault();
            selectSuggestion(suggestions[highlightedIndex] ?? suggestions[0]);
            return;
        }

        if (event.key === "Tab" || event.key === "Escape") {
            closeSuggestions();
        }
    }

    useEffect(() => {
        const query = value.trim();
        const requestId = searchRequestRef.current + 1;
        searchRequestRef.current = requestId;

        if (query.length === 0 || suppressUntilManualInputRef.current) {
            setSuggestions([]);
            setIsOpen(false);
            setHighlightedIndex(0);
            setIsLoading(false);
            return undefined;
        }

        let cancelled = false;

        async function runSearch() {
            try {
                setIsLoading(true);

                const result = await searchSuggestions(source, query, 8);

                if (
                    cancelled ||
                    searchRequestRef.current !== requestId ||
                    suppressUntilManualInputRef.current
                ) {
                    return;
                }

                setSuggestions(result);
                setHighlightedIndex(0);
                setIsOpen(document.activeElement === inputRef.current && result.length > 0);
            } catch {
                if (!cancelled && searchRequestRef.current === requestId) {
                    setSuggestions([]);
                    setIsOpen(false);
                    setHighlightedIndex(0);
                }
            } finally {
                if (!cancelled && searchRequestRef.current === requestId) {
                    setIsLoading(false);
                }
            }
        }

        const timeoutId = window.setTimeout(runSearch, 80);

        return () => {
            cancelled = true;
            window.clearTimeout(timeoutId);
        };
    }, [source, value]);

    useEffect(() => {
        function handleDocumentMouseDown(event) {
            if (!wrapperRef.current) {
                return;
            }

            if (!wrapperRef.current.contains(event.target)) {
                closeSuggestions();
            }
        }

        document.addEventListener("mousedown", handleDocumentMouseDown);

        return () => {
            document.removeEventListener("mousedown", handleDocumentMouseDown);
            clearCloseTimer();
        };
    }, []);

    return (
        <label className="autocomplete-field" ref={wrapperRef}>
            <span>{required ? `${label} *` : label}</span>

            <div className="autocomplete-wrapper">
                <input
                    ref={inputRef}
                    id={inputId}
                    value={value}
                    onChange={handleInputChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    type="text"
                    placeholder={placeholder}
                    aria-invalid={Boolean(error)}
                    aria-autocomplete="list"
                    aria-expanded={isOpen}
                    aria-controls={`${inputId}-suggestions`}
                    autoComplete="off"
                    spellCheck="false"
                />

                {isLoading ? <div className="autocomplete-loading">Lädt...</div> : null}

                {isOpen && suggestions.length > 0 ? (
                    <div id={`${inputId}-suggestions`} className="autocomplete-menu" role="listbox">
                        {suggestions.map((suggestion, index) => (
                            <button
                                key={`${suggestion.value}-${suggestion.category ?? ""}`}
                                type="button"
                                className={index === highlightedIndex ? "autocomplete-option active" : "autocomplete-option"}
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => selectSuggestion(suggestion)}
                                role="option"
                                aria-selected={index === highlightedIndex}
                            >
                                <strong>{suggestion.value}</strong>
                                {suggestion.category ? <small>{suggestion.category}</small> : null}
                            </button>
                        ))}
                    </div>
                ) : null}
            </div>

            {error ? <small className="field-error">{error}</small> : null}
        </label>
    );
}