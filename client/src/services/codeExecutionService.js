import { JUDGE0_API_URL, RAPID_API_HOST, RAPID_API_KEY, LANGUAGE_IDS } from '../config/config';

const headers = {
    'content-type': 'application/json',
    'Content-Type': 'application/json',
    'X-RapidAPI-Host': RAPID_API_HOST,
    'X-RapidAPI-Key': RAPID_API_KEY,
};

export const submitCode = async (code, language, input = '') => {
    try {
        const response = await fetch(`${JUDGE0_API_URL}/submissions?base64_encoded=false&wait=false`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                source_code: code,
                language_id: LANGUAGE_IDS[language],
                stdin: input,
            }),
        });

        const data = await response.json();
        return data.token;
    } catch (error) {
        throw new Error('Error submitting code: ' + error.message);
    }
};

export const checkStatus = async (token) => {
    try {
        const response = await fetch(`${JUDGE0_API_URL}/submissions/${token}?base64_encoded=false`, {
            method: 'GET',
            headers: headers,
        });

        return await response.json();
    } catch (error) {
        throw new Error('Error checking submission status: ' + error.message);
    }
};

// Helper function to handle the entire submission process
export const executeCode = async (code, language, input = '') => {
    try {
        // Submit the code
        const token = await submitCode(code, language, input);
        
        // Poll for results
        let result;
        let attempts = 0;
        const maxAttempts = 10;
        
        while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between checks
            result = await checkStatus(token);
            
            if (result.status.id > 2) { // Status > 2 means processing is complete
                break;
            }
            attempts++;
        }

        if (!result || result.status.id <= 2) {
            throw new Error('Execution timed out');
        }

        return {
            success: result.status.id === 3, // 3 is "Accepted" status
            output: result.stdout || '',
            error: result.stderr || result.compile_output || '',
            statusId: result.status.id,
            description: result.status.description
        };
    } catch (error) {
        throw new Error('Error executing code: ' + error.message);
    }
}; 