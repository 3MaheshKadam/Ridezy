
import React from 'react';
import "./global.css";
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Auth Screens
import SplashScreen from './screens/auth/SplashScreen';
import WelcomeScreen from './screens/auth/WelcomeScreen';
import LoginScreen from './screens/auth/LoginScreen';
import RegisterScreen from './screens/auth/RegisterScreen';
// import RoleSelectionScreen from './screens/auth/RoleSelectionScreen';

// Shared Screens
import HomeScreen from './screens/shared/HomeScreen';
import ProfileScreen from './screens/shared/ProfileScreen';
import NotificationsScreen from './screens/shared/NotificationsScreen';
import SupportScreen from './screens/shared/SupportScreen';

// Car Wash Module Screens
import CenterDashboardScreen from './screens/car-wash/CenterDashboardScreen';
import SubscriptionScreen from './screens/car-wash/SubscriptionScreen';
import BookingManagementScreen from './screens/car-wash/BookingManagementScreen';
import SearchWashScreen from './screens/car-wash/SearchWashScreen';
import BookWashScreen from './screens/car-wash/BookWashScreen';

// Driver Hire Module Screens
import DriverDashboardScreen from './screens/driver-hire/DriverDashboardScreen';
import TripRequestScreen from './screens/driver-hire/TripRequestScreen';
import DriverTripsScreen from './screens/driver-hire/DriverTripsScreen';
import TripTrackingScreen from './screens/driver-hire/TripTrackingScreen';
import DriverRegistrationScreen from './screens/driver-hire/DriverRegistrationScreen';
import DriverMatchingScreen from './screens/driver-hire/DriverMatchingScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Navigator for Car Owner
const CarOwnerTabs = () => (
  <Tab.Navigator>
    <Tab.Screen name="CarWash" component={SearchWashScreen} options={{ title: 'Car Wash' }} />
    <Tab.Screen name="DriverHire" component={TripRequestScreen} options={{ title: 'Hire Driver' }} />
    <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    <Tab.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
    <Tab.Screen name="Support" component={SupportScreen} options={{ title: 'Support' }} />
  </Tab.Navigator>
);

// Tab Navigator for Driver
const DriverTabs = () => (
  <Tab.Navigator>
    <Tab.Screen name="DriverDashboard" component={DriverDashboardScreen} options={{ headerShown: false }} />
    <Tab.Screen name="DriverTrips" component={DriverTripsScreen} options={{ headerShown: false }} />
    <Tab.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }}/>
    <Tab.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: false }} />
    <Tab.Screen name="Support" component={SupportScreen} options={{ headerShown: false }} />
  </Tab.Navigator>
);

// Tab Navigator for Car Wash Center
const CenterTabs = () => (
  <Tab.Navigator>
    <Tab.Screen name="CenterDashboard" component={CenterDashboardScreen}options={{ headerShown: false }} />
    <Tab.Screen name="Subscriptions" component={SubscriptionScreen} options={{ headerShown: false }}/>
    <Tab.Screen name="Bookings" component={BookingManagementScreen} options={{ headerShown: false }} />
    <Tab.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }}/>
    <Tab.Screen name="Notifications" component={NotificationsScreen}options={{ headerShown: false }} />
    <Tab.Screen name="Support" component={SupportScreen}options={{ headerShown: false }} />
  </Tab.Navigator>
);

// Tab Navigator for Admin
const AdminTabs = () => (
  <Tab.Navigator>
    <Tab.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
    <Tab.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }}/>
    <Tab.Screen name="Notifications" component={NotificationsScreen}options={{ headerShown: false }} />
    <Tab.Screen name="Support" component={SupportScreen} options={{ headerShown: false }} />
  </Tab.Navigator>
);

// Main App Component
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash">
        {/* Auth Screens */}
        <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={LoginScreen}options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
        {/* <Stack.Screen name="RoleSelection" component={RoleSelectionScreen}options={{ headerShown: false }} /> */}

        {/* Shared Screens */}
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: false }}/>
        <Stack.Screen name="Support" component={SupportScreen} options={{ headerShown: false }} />

        {/* Car Wash Module Screens */}
        <Stack.Screen name="CenterDashboard" component={CenterDashboardScreen}options={{ headerShown: false }}/>
        <Stack.Screen name="Subscriptions" component={SubscriptionScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Bookings" component={BookingManagementScreen} options={{ headerShown: false }}/>
        <Stack.Screen name="SearchWash" component={SearchWashScreen} options={{ headerShown: false }} />
        <Stack.Screen name="BookWash" component={BookWashScreen} options={{ headerShown: false }} />

        {/* Driver Hire Module Screens */}
        <Stack.Screen name="DriverDashboard" component={DriverDashboardScreen} options={{ headerShown: false }} />
        <Stack.Screen name="TripRequest" component={TripRequestScreen} options={{ headerShown: false }} />
        <Stack.Screen name="DriverTrips" component={DriverTripsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="TripTracking" component={TripTrackingScreen} options={{ headerShown: false }}/>
        <Stack.Screen name="DriverMatching" component={DriverMatchingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="DriverRegistration" component={DriverRegistrationScreen} options={{ headerShown: false }} />

        {/* Role-Based Tab Navigators */}
        <Stack.Screen name="CarOwnerTabs" component={CarOwnerTabs} options={{ headerShown: false }} />
        <Stack.Screen name="DriverTabs" component={DriverTabs} options={{ headerShown: false }} />
        <Stack.Screen name="CenterTabs" component={CenterTabs} options={{ headerShown: false }} />
        <Stack.Screen name="AdminTabs" component={AdminTabs} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}