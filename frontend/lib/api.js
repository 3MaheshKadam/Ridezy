import { API_BASE_URL } from '../config/apiConfig';

import * as SecureStore from 'expo-secure-store';

/**
 * Generic API client wrapper
 * @param {string} endpoint - The endpoint to call (e.g., '/auth/login')
 * @param {object} options - Fetch options (method, body, headers)
 */
export const apiCall = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = await SecureStore.getItemAsync('userToken');

    const headers = {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
    };

    // Only set JSON content type if it's not already set and not FormData
    const isFormData = options.body instanceof FormData;
    if (!headers['Content-Type'] && !isFormData) {
        headers['Content-Type'] = 'application/json';
    }

    const config = {
        ...options,
        headers,
    };

    // Serialize body if it's an object and NOT FormData
    if (options.body && typeof options.body === 'object' && !isFormData) {
        config.body = JSON.stringify(options.body);
    }

    try {
        const response = await fetch(url, config);

        if (response.status === 401) {
            // Handle global logout if needed
        }

        const data = await response.json();

        if (!response.ok) {
            console.error(`API Error on ${url}: Status ${response.status}`, data);
            throw new Error(data.message || `API Error: ${response.status} ${JSON.stringify(data)}`);
        }

        return data;
    } catch (error) {
        console.error(`Request Failed: ${url}`, error);
        throw error;
    }
};

export const uploadImage = async (fileUri) => {
    const formData = new FormData();
    const filename = fileUri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image/jpeg`;

    formData.append('file', { uri: fileUri, name: filename, type });

    return apiCall('/upload', {
        method: 'POST',
        // Do NOT set Content-Type header for FormData, let fetch handle it (boundary)
        body: formData,
    });
};

export const post = (endpoint, body) => apiCall(endpoint, { method: 'POST', body });
export const get = (endpoint) => apiCall(endpoint, { method: 'GET' });
export const put = (endpoint, body) => apiCall(endpoint, { method: 'PUT', body });
export const del = (endpoint) => apiCall(endpoint, { method: 'DELETE' });
