export const JUDGE0_API_URL = 'https://judge0-ce.p.rapidapi.com';
export const RAPID_API_HOST = 'judge0-ce.p.rapidapi.com';
export const RAPID_API_KEY = '187350c721mshf723c36c213e29ap18fee7jsnd6404b9e0a2a';

export const LANGUAGE_IDS = {
    'python': 71,  // Python (3.8.1)
    'cpp': 54,     // C++ (GCC 9.2.0)
    'java': 62     // Java (OpenJDK 13.0.1)
};

// Submission statuses
export const STATUS = {
    PENDING: 'In Queue',
    PROCESSING: 'Processing',
    ACCEPTED: 'Accepted',
    WRONG_ANSWER: 'Wrong Answer',
    TIME_LIMIT: 'Time Limit Exceeded',
    COMPILATION_ERROR: 'Compilation Error',
    RUNTIME_ERROR: 'Runtime Error',
    INTERNAL_ERROR: 'Internal Error',
    EXEC_FORMAT_ERROR: 'Exec Format Error'
}; 