export const BASE_URL = 'http://192.168.1.13:3000';
export const API_BASE_URL = `${BASE_URL}/api`;

export const endpoints = {
    auth: {
        login: '/auth/login',
        register: '/auth/register',
        me: '/auth/me',
        profile: '/auth/profile',
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
        interest: (id) => `/trips/${id}/interest`,
        selectDriver: (id) => `/trips/${id}/select-driver`,
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
        status: '/drivers/status', // PATCH
        subscription: '/drivers/subscription',
        earnings: '/drivers/earnings',
        withdraw: '/drivers/withdraw',
    }
};
