import { API_BASE_URL } from '../config/apiConfig';
const API_URL = API_BASE_URL;


const adminUser = {
    fullName: 'Main Admin',
    email: 'admin@ridezy.com',
    phone: '9999999999',
    password: 'admin@123',
    role: 'ADMIN' // Ensuring backend accepts this role
};

async function createAdmin() {
    console.log('Attempting to create Admin user...');
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(adminUser),
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ Admin user created successfully:', data);
        } else {
            if (response.status === 400 && data.message === 'User already exists') {
                console.log('⚠️  User already exists. Attempting login to verify credentials...');
                await verifyLogin();
            } else {
                console.error('❌ Failed to create admin:', response.status, data);
            }
        }
    } catch (error) {
        console.error('❌ Network error:', error.message);
    }
}

async function verifyLogin() {
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: adminUser.email,
                password: adminUser.password
            })
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ Login verified! Token received.');
        } else {
            console.error('❌ Login failed with default credentials:', data);
        }
    } catch (error) {
        console.error('❌ Login verification error:', error.message);
    }
}

createAdmin();
