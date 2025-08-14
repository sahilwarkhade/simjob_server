export function extractJson(inputString) {
    if (!inputString || typeof inputString !== 'string') {
        console.error("safeParseJson: Input must be a non-empty string.");
        throw new Error("Invalid input type for JSON parsing.");
    }

    // --- Attempt 1: Try parsing as pure JSON ---
    try {
        const parsedData = JSON.parse(inputString);
        return parsedData;
    } catch (e) {
        console.log("Input is not valid raw JSON directly. Attempting to extract from markdown...");
    }

    // --- Attempt 2: Try extracting from ```json ... ``` markdown block ---
    const regex = /^\s*```json\n([\s\S]*?)\n\s*```\s*$/;

    const match = inputString.match(regex);

    if (match && match[1]) {
        const pureJsonContent = match[1];

        try {
            const parsedData = JSON.parse(pureJsonContent);
            return parsedData;
        } catch (e) {
            console.error("Error: Content extracted from markdown is not valid JSON.", e);
            console.error("Content that failed to parse (extracted):", pureJsonContent);
            throw new Error("Invalid JSON content found inside markdown block.");
        }
    } else {
        console.error("Error: Input is neither valid raw JSON nor valid JSON wrapped in ```json ... ``` markdown.");
        console.error("Original input:", inputString);
        throw new Error("Unrecognized input format for JSON parsing.");
    }
}
