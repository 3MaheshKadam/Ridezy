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
    vehicles: {
        list: '/vehicles',
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
        plans: '/admin/plans',
    },
    trips: {
        create: '/trips',
        history: '/trips', // GET
        feed: '/trips/feed', // GET
        accept: (id) => `/trips/${id}/accept`,
        status: (id) => `/trips/${id}/status`,
        details: (id) => `/trips/${id}`,
    },
    notifications: {
        list: '/notifications',
        unreadCount: '/notifications/unread-count',
        markRead: (id) => `/notifications/${id}/read`,
    },
    centers: {
        search: '/centers/search',
        dashboard: '/centers/dashboard',
        profile: '/centers/profile',
        bookings: '/centers/bookings',
        subscription: '/centers/subscription',
        services: '/centers/services',
        staff: '/centers/staff',
    },
    bookings: {
        create: '/bookings',
        list: '/bookings', // GET
        status: (id) => `/bookings/${id}`, // PATCH
    },
    drivers: {
        stats: '/drivers/stats',
        location: '/drivers/location', // PATCH
    }
};
