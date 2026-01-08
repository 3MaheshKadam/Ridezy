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
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const config = {
        ...options,
        headers,
    };

    if (options.body && typeof options.body === 'object') {
        config.body = JSON.stringify(options.body);
    }

    try {
        const response = await fetch(url, config);

        // Handle 401 Unauthorized globally if needed (e.g., logout)
        if (response.status === 401) {
            // Handle logout logic or token refresh here
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

export const post = (endpoint, body) => apiCall(endpoint, { method: 'POST', body });
export const get = (endpoint) => apiCall(endpoint, { method: 'GET' });
export const put = (endpoint, body) => apiCall(endpoint, { method: 'PUT', body });
export const del = (endpoint) => apiCall(endpoint, { method: 'DELETE' });
