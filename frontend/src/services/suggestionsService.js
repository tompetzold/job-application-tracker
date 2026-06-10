const LOCALE = "de";

const SUGGESTION_SOURCES = {
    companies: `/suggestions/${LOCALE}/companies.csv`,
    positions: `/suggestions/${LOCALE}/positions.csv`,
    locations: `/suggestions/${LOCALE}/locations.csv`,
};

const suggestionCache = new Map();

const MIN_QUERY_LENGTH_BY_SOURCE = {
    companies: 3,
    positions: 2,
    locations: 2,
};

const MAX_SCAN_BY_SOURCE = {
    companies: 25000,
    positions: 15000,
    locations: 10000,
};

function splitCsvLine(line) {
    const result = [];
    let current = "";
    let insideQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
        const character = line[index];
        const nextCharacter = line[index + 1];

        if (character === '"' && nextCharacter === '"') {
            current += '"';
            index += 1;
            continue;
        }

        if (character === '"') {
            insideQuotes = !insideQuotes;
            continue;
        }

        if (character === "," && !insideQuotes) {
            result.push(current);
            current = "";
            continue;
        }

        current += character;
    }

    result.push(current);

    return result.map((value) => value.trim());
}

function parseCsvRows(csvText) {
    const rows = [];
    let currentRow = "";
    let insideQuotes = false;

    for (let index = 0; index < csvText.length; index += 1) {
        const character = csvText[index];
        const nextCharacter = csvText[index + 1];

        if (character === '"' && nextCharacter === '"') {
            currentRow += character;
            currentRow += nextCharacter;
            index += 1;
            continue;
        }

        if (character === '"') {
            insideQuotes = !insideQuotes;
            currentRow += character;
            continue;
        }

        if ((character === "\n" || character === "\r") && !insideQuotes) {
            if (currentRow.trim()) {
                rows.push(currentRow);
            }

            currentRow = "";

            if (character === "\r" && nextCharacter === "\n") {
                index += 1;
            }

            continue;
        }

        currentRow += character;
    }

    if (currentRow.trim()) {
        rows.push(currentRow);
    }

    return rows;
}

function parseCsv(csvText, sourceName) {
    const lines = parseCsvRows(csvText.replace(/^\uFEFF/, ""));

    if (lines.length === 0) {
        return [];
    }

    const headers = splitCsvLine(lines[0]);

    return lines
        .slice(1)
        .map((line) => {
            const values = splitCsvLine(line);

            return headers.reduce((entry, header, index) => {
                entry[header] = values[index] ?? "";
                return entry;
            }, {});
        })
        .filter((entry) => isUsefulSuggestion(entry, sourceName))
        .map((entry) => {
            const normalizedValue = normalizeSearchValue(entry.value);
            const compactValue = compactSearchValue(entry.value);
            const normalizedCategory = normalizeSearchValue(entry.category ?? "");

            return {
                ...entry,
                normalizedValue,
                compactValue,
                normalizedCategory,
            };
        });
}

function normalizeSearchValue(value) {
    if (typeof value !== "string") {
        return "";
    }

    return value
        .toLowerCase()
        .replaceAll("ä", "ae")
        .replaceAll("ö", "oe")
        .replaceAll("ü", "ue")
        .replaceAll("ß", "ss")
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .replace(/[^a-z0-9]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function compactSearchValue(value) {
    return normalizeSearchValue(value).replace(/\s+/g, "");
}

function hasLatinLetter(value) {
    return /[a-zA-ZäöüÄÖÜß]/.test(value);
}

function startsWithBadCompanyPattern(value) {
    const trimmedValue = value.trim();

    return (
        /^[!"#$%&'()*+,./:;<=>?@[\\\]^_`{|}~-]/.test(trimmedValue) ||
        /^\d/.test(trimmedValue)
    );
}

function isUsefulCompanyName(value) {
    if (!value) {
        return false;
    }

    const trimmedValue = value.trim();
    const normalizedValue = normalizeSearchValue(trimmedValue);

    if (trimmedValue.length < 2) {
        return false;
    }

    if (!hasLatinLetter(trimmedValue)) {
        return false;
    }

    if (startsWithBadCompanyPattern(trimmedValue)) {
        return false;
    }

    if (!normalizedValue) {
        return false;
    }

    if (
        normalizedValue === "none" ||
        normalizedValue === "null" ||
        normalizedValue === "nan" ||
        normalizedValue === "unknown" ||
        normalizedValue === "test"
    ) {
        return false;
    }

    if (normalizedValue.includes("in gruendung")) {
        return false;
    }

    if (normalizedValue.includes("schluesseldienst") || normalizedValue.includes("schlossnotdienst")) {
        return false;
    }

    return true;
}

function isUsefulSuggestion(entry, sourceName) {
    if (!entry.value) {
        return false;
    }

    if (sourceName === "companies") {
        return isUsefulCompanyName(entry.value);
    }

    return true;
}

function scoreSuggestion(query, suggestion) {
    const normalizedQuery = normalizeSearchValue(query);
    const compactQuery = compactSearchValue(query);

    if (!normalizedQuery || !suggestion.normalizedValue) {
        return null;
    }

    if (suggestion.normalizedValue === normalizedQuery) {
        return 0;
    }

    if (suggestion.compactValue === compactQuery) {
        return 1;
    }

    if (suggestion.normalizedValue.startsWith(normalizedQuery)) {
        return 10;
    }

    if (suggestion.compactValue.startsWith(compactQuery)) {
        return 12;
    }

    if (suggestion.normalizedValue.includes(normalizedQuery)) {
        return 30;
    }

    if (suggestion.compactValue.includes(compactQuery)) {
        return 32;
    }

    return null;
}

function sortSuggestions(query, suggestions, limit, sourceName) {
    const prefixMatches = [];
    const containsMatches = [];
    const maxScan = MAX_SCAN_BY_SOURCE[sourceName] ?? 15000;

    let scannedCount = 0;

    for (const suggestion of suggestions) {
        scannedCount += 1;

        if (scannedCount > maxScan && prefixMatches.length >= limit) {
            break;
        }

        const score = scoreSuggestion(query, suggestion);

        if (score === null) {
            continue;
        }

        const scoredSuggestion = {
            ...suggestion,
            score,
        };

        if (score < 30) {
            prefixMatches.push(scoredSuggestion);

            if (prefixMatches.length >= limit) {
                break;
            }

            continue;
        }

        containsMatches.push(scoredSuggestion);
    }

    const result = prefixMatches.length >= limit ? prefixMatches : [...prefixMatches, ...containsMatches];

    return result
        .sort((firstSuggestion, secondSuggestion) => {
            if (firstSuggestion.score !== secondSuggestion.score) {
                return firstSuggestion.score - secondSuggestion.score;
            }

            return firstSuggestion.value.localeCompare(secondSuggestion.value, "de");
        })
        .slice(0, limit);
}

export async function loadSuggestions(sourceName) {
    if (!SUGGESTION_SOURCES[sourceName]) {
        throw new Error(`Unbekannte Vorschlagsquelle: ${sourceName}`);
    }

    if (suggestionCache.has(sourceName)) {
        return suggestionCache.get(sourceName);
    }

    const response = await fetch(SUGGESTION_SOURCES[sourceName]);

    if (!response.ok) {
        throw new Error(`Vorschläge konnten nicht geladen werden: HTTP ${response.status}`);
    }

    const csvText = await response.text();
    const suggestions = parseCsv(csvText, sourceName);

    suggestionCache.set(sourceName, suggestions);

    return suggestions;
}

export async function searchSuggestions(sourceName, query, limit = 8) {
    const normalizedQuery = normalizeSearchValue(query);
    const minQueryLength = MIN_QUERY_LENGTH_BY_SOURCE[sourceName] ?? 2;

    if (normalizedQuery.length < minQueryLength) {
        return [];
    }

    const suggestions = await loadSuggestions(sourceName);
    return sortSuggestions(query, suggestions, limit, sourceName);
}