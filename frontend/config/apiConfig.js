export const API_BASE_URL = 'http://192.168.1.22:3000/api';

export const endpoints = {
    auth: {
        login: '/auth/login',
        register: '/auth/register',
        me: '/auth/me',
    },
    onboarding: {
        driver: '/onboarding/driver',
        ownerVehicle: '/onboarding/owner/vehicle',
        center: '/onboarding/center',
    },
    admin: {
        approvals: '/admin/approvals',
        approve: '/admin/approve',
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
