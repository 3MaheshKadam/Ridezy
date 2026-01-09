export const API_BASE_URL = 'http://192.168.29.236:3000/api';

export const endpoints = {
    auth: {
        login: '/auth/login',
        register: '/auth/register',
        me: '/auth/me',
    },
    common: {
        upload: '/upload',
    },
    onboarding: {
        driver: '/onboarding/driver',
        ownerVehicle: '/onboarding/owner/vehicle',
        center: '/onboarding/center',
    },
    admin: {
        approvals: '/admin/approvals',
        approve: '/admin/approve',
        stats: '/admin/stats',
    },
    trips: {
        create: '/trips',
        history: '/trips', // GET
        feed: '/trips/feed', // GET
        accept: (id) => `/trips/${id}/accept`,
        status: (id) => `/trips/${id}/status`,
        details: (id) => `/trips/${id}`,
    },
    centers: {
        search: '/centers/search',
    },
    bookings: {
        create: '/bookings',
        list: '/bookings', // GET
        status: (id) => `/bookings/${id}`, // PATCH
    }
};
