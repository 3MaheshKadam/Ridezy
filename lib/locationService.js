// OpenStreetMap Nominatim API for geocoding (Free, no key required)
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search';

/**
 * Search for locations using OpenStreetMap Nominatim API
 * @param {string} query - The address to search for
 * @param {object} biasCoords - Optional {lat, lng} to bias search results
 * @returns {Promise<Array>} - Array of location objects
 */
export const searchLocations = async (query, biasCoords = null) => {
    if (!query || query.length < 3) return [];

    try {
        const params = {
            q: query,
            format: 'json',
            addressdetails: 1,
            limit: 5,
            countrycodes: 'in',
        };

        // If bias coordinates provided, add viewbox
        if (biasCoords && biasCoords.lat && biasCoords.lng) {
            const spread = 0.5; // Approx 50-60km box
            const left = biasCoords.lng - spread;
            const top = biasCoords.lat - spread;
            const right = biasCoords.lng + spread;
            const bottom = biasCoords.lat + spread;

            params.viewbox = `${left},${top},${right},${bottom}`;
            params.bounded = 1; // Prefer results in this box
        }

        const queryString = new URLSearchParams(params).toString();

        const response = await fetch(`${NOMINATIM_BASE_URL}?${queryString}`, {
            headers: {
                'User-Agent': 'RidezyApp/1.0',
            },
        });

        if (!response.ok) {
            throw new Error('Location search failed');
        }

        const data = await response.json();

        return data.map(item => ({
            id: item.place_id,
            name: item.display_name.split(',')[0], // First part as main name
            address: item.display_name,
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
            type: item.type,
            raw: item
        }));

    } catch (error) {
        console.error('Error searching locations:', error);
        return [];
    }
};

/**
 * Get address from coordinates using OpenStreetMap Nominatim API
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<object>} - Location object with address
 */
export const reverseGeocode = async (lat, lng) => {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'RidezyApp/1.0',
            },
        });

        if (!response.ok) {
            throw new Error('Reverse geocoding failed');
        }

        const data = await response.json();

        return {
            id: data.place_id,
            name: data.display_name.split(',')[0],
            address: data.display_name,
            latitude: parseFloat(data.lat),
            longitude: parseFloat(data.lon),
            raw: data
        };

    } catch (error) {
        console.error('Error reverse geocoding:', error);
        return null;
    }
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km

    // Return distance rounded to 1 decimal place
    return Math.round(d * 10) / 10;
};

const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
};
