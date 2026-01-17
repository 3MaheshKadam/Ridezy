import 'react-native-gesture-handler';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import "./global.css";
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { UserProvider } from './context/UserContext';
import { NotificationProvider } from './context/NotificationContext';

// Auth Screens
import SplashScreen from './screens/auth/SplashScreen';
import WelcomeScreen from './screens/auth/WelcomeScreen';
import LoginScreen from './screens/auth/LoginScreen';
import RegisterScreen from './screens/auth/RegisterScreen';
import CarOwnerRegistrationScreen from './screens/auth/CarOwnerRegistrationScreen';
import CarWashCenterRegistrationScreen from './screens/car-wash/CarWashCenterRegistrationScreen';

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
import ServiceManagementScreen from './screens/car-wash/ServiceManagementScreen';
import StaffManagementScreen from './screens/car-wash/StaffManagementScreen';
import EditCenterProfileScreen from './screens/car-wash/EditCenterProfileScreen';
import BookingStatusScreen from './screens/car-wash/BookingStatusScreen';
import CenterProfileScreen from './screens/car-wash/CenterProfileScreen';

// Driver Hire Module Screens
import DriverDashboardScreen from './screens/driver-hire/DriverDashboardScreen';
import TripRequestScreen from './screens/driver-hire/TripRequestScreen';
import DriverTripsScreen from './screens/driver-hire/DriverTripsScreen';
import TripTrackingScreen from './screens/driver-hire/TripTrackingScreen';
import DriverRegistrationScreen from './screens/driver-hire/DriverRegistrationScreen';
import DriverMatchingScreen from './screens/driver-hire/DriverMatchingScreen';
import DriverRequestFeedScreen from './screens/driver-hire/DriverRequestFeedScreen';
import DriverSubscription from './screens/driver-hire/DriverSubscription';
import OwnerTripTrackingScreen from './screens/driver-hire/OwnerTripTrackingScreen';
import DriverTripTrackingScreen from './screens/driver-hire/DriverTripTrackingScreen';

// Admin Screens
import AdminDashboardScreen from './screens/admin/AdminDashboardScreen';
import CarWashApprovalScreen from './screens/admin/CarWashApprovalScreen';
import CarOwnerApprovalScreen from './screens/admin/CarOwnerApprovalScreen';
import DriverApprovalScreen from './screens/admin/DriverApprovalScreen';
import SubscriptionManagementScreen from './screens/admin/SubscriptionManagementScreen';
import PaymentOverviewScreen from './screens/admin/PaymentOverviewScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Navigator for Car Owner
const CarOwnerTabs = () => (
  <Tab.Navigator>
    <Tab.Screen
      name="Home"
      component={HomeScreen}
      options={{
        title: 'Home',
        headerShown: false,
        tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />
      }}
    />
    <Tab.Screen
      name="CarWash"
      component={SearchWashScreen}
      options={{
        title: 'Car Wash',
        headerShown: false,
        tabBarIcon: ({ color, size }) => <Ionicons name="car" size={size} color={color} />
      }}
    />
    <Tab.Screen
      name="DriverHire"
      component={TripRequestScreen}
      options={{
        title: 'Hire Driver',
        tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />
      }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{
        title: 'Profile',
        headerShown: false,
        tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />
      }}
    />
  </Tab.Navigator>
);

// Tab Navigator for Driver
const DriverTabs = () => (
  <Tab.Navigator>
    <Tab.Screen
      name="DriverDashboard"
      component={DriverDashboardScreen}
      options={{
        headerShown: false,
        tabBarIcon: ({ color, size }) => <Ionicons name="speedometer" size={size} color={color} />
      }}
    />
    <Tab.Screen
      name="DriverTrips"
      component={DriverTripsScreen}
      options={{
        headerShown: false,
        tabBarIcon: ({ color, size }) => <Ionicons name="map" size={size} color={color} />
      }}
    />
    <Tab.Screen
      name="DriverSubscription"
      component={DriverSubscription}
      options={{
        headerShown: false,
        tabBarIcon: ({ color, size }) => <Ionicons name="cash" size={size} color={color} />
      }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{
        headerShown: false,
        tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />
      }}
    />
  </Tab.Navigator>
);

// Tab Navigator for Car Wash Center
const CenterTabs = () => (
  <Tab.Navigator>
    <Tab.Screen
      name="CenterDashboard"
      component={CenterDashboardScreen}
      options={{
        headerShown: false,
        tabBarIcon: ({ color, size }) => <Ionicons name="business" size={size} color={color} />
      }}
    />
    <Tab.Screen
      name="Subscriptions"
      component={SubscriptionScreen}
      options={{
        headerShown: false,
        tabBarIcon: ({ color, size }) => <Ionicons name="cash" size={size} color={color} />
      }}
    />
    <Tab.Screen
      name="Bookings"
      component={BookingManagementScreen}
      options={{
        headerShown: false,
        tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} />
      }}
    />
    <Tab.Screen
      name="Profile"
      component={CenterProfileScreen}
      options={{
        headerShown: false,
        tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />
      }}
    />
    <Tab.Screen
      name="Support"
      component={SupportScreen}
      options={{
        headerShown: false,
        tabBarIcon: ({ color, size }) => <Ionicons name="help-circle" size={size} color={color} />
      }}
    />
  </Tab.Navigator>
);

// Tab Navigator for Admin
const AdminTabs = () => (
  <Tab.Navigator>
    <Tab.Screen
      name="AdminDashboard"
      component={AdminDashboardScreen}
      options={{
        headerShown: false,
        title: 'Dashboard',
        tabBarIcon: ({ color, size }) => <Ionicons name="grid" size={size} color={color} />
      }}
    />
    <Tab.Screen
      name="CarWashApprovals"
      component={CarWashApprovalScreen}
      options={{
        headerShown: false,
        title: 'Approvals',
        tabBarIcon: ({ color, size }) => <Ionicons name="checkmark-circle" size={size} color={color} />
      }}
    />
    <Tab.Screen
      name="CarOwnerApprovals"
      component={CarOwnerApprovalScreen}
      options={{
        headerShown: false,
        title: 'Owners',
        tabBarIcon: ({ color, size }) => <Ionicons name="car" size={size} color={color} />
      }}
    />
    <Tab.Screen
      name="DriverApprovals"
      component={DriverApprovalScreen}
      options={{
        headerShown: false,
        title: 'Drivers',
        tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />
      }}
    />
    <Tab.Screen
      name="SubscriptionManagement"
      component={SubscriptionManagementScreen}
      options={{
        headerShown: false,
        title: 'Plans',
        tabBarIcon: ({ color, size }) => <Ionicons name="list" size={size} color={color} />
      }}
    />
    <Tab.Screen
      name="PaymentOverview"
      component={PaymentOverviewScreen}
      options={{
        headerShown: false,
        title: 'Payments',
        tabBarIcon: ({ color, size }) => <Ionicons name="card" size={size} color={color} />
      }}
    />
  </Tab.Navigator>
);

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <UserProvider>
          <NotificationProvider>
            <NavigationContainer>
              <Stack.Navigator initialRouteName="Splash">
                {/* Auth Screens */}
                <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
                <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
                <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
                <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
                <Stack.Screen name="CarOwnerRegistration" component={CarOwnerRegistrationScreen} options={{ headerShown: false }} />
                <Stack.Screen name="CarWashCenterRegistration" component={CarWashCenterRegistrationScreen} options={{ headerShown: false }} />

                {/* Shared Screens */}
                <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
                <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
                <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: false }} />
                <Stack.Screen name="Support" component={SupportScreen} options={{ headerShown: false }} />

                {/* Car Wash Module Screens */}
                <Stack.Screen name="CenterDashboard" component={CenterDashboardScreen} options={{ headerShown: false }} />
                <Stack.Screen name="Subscriptions" component={SubscriptionScreen} options={{ headerShown: false }} />
                <Stack.Screen name="Bookings" component={BookingManagementScreen} options={{ headerShown: false }} />
                <Stack.Screen name="SearchWash" component={SearchWashScreen} options={{ headerShown: false }} />
                <Stack.Screen name="BookWash" component={BookWashScreen} options={{ headerShown: false }} />
                <Stack.Screen name="ServiceManagement" component={ServiceManagementScreen} options={{ headerShown: false }} />
                <Stack.Screen name="StaffManagement" component={StaffManagementScreen} options={{ headerShown: false }} />
                <Stack.Screen name="EditCenterProfile" component={EditCenterProfileScreen} options={{ headerShown: false }} />
                <Stack.Screen name="BookingStatus" component={BookingStatusScreen} options={{ headerShown: false }} />

                {/* Driver Hire Module Screens */}
                <Stack.Screen name="DriverDashboard" component={DriverDashboardScreen} options={{ headerShown: false }} />
                <Stack.Screen name="TripRequest" component={TripRequestScreen} options={{ headerShown: false }} />
                <Stack.Screen name="DriverTrips" component={DriverTripsScreen} options={{ headerShown: false }} />
                <Stack.Screen name="TripTracking" component={TripTrackingScreen} options={{ headerShown: false }} />
                <Stack.Screen name="DriverMatching" component={DriverMatchingScreen} options={{ headerShown: false }} />
                <Stack.Screen name="DriverRegistration" component={DriverRegistrationScreen} options={{ headerShown: false }} />
                <Stack.Screen name="DriverRequestFeed" component={DriverRequestFeedScreen} options={{ headerShown: false }} />
                <Stack.Screen name="DriverSubscription" component={DriverSubscription} options={{ headerShown: false }} />
                <Stack.Screen name="OwnerTripTracking" component={OwnerTripTrackingScreen} options={{ headerShown: false }} />
                <Stack.Screen name="DriverTripTracking" component={DriverTripTrackingScreen} options={{ headerShown: false }} />


                {/* Admin Screens are handled in AdminTabs */}
                {/* <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ headerShown: false }} /> */}
                {/* <Stack.Screen name="CarWashApprovals" component={CarWashApprovalScreen} options={{ headerShown: false }} /> */}
                {/* <Stack.Screen name="CarOwnerApprovals" component={CarOwnerApprovalScreen} options={{ headerShown: false }} /> */}
                {/* <Stack.Screen name="DriverApprovals" component={DriverApprovalScreen} options={{ headerShown: false }} /> */}
                {/* <Stack.Screen name="SubscriptionManagement" component={SubscriptionManagementScreen} options={{ headerShown: false }} /> */}
                {/* <Stack.Screen name="PaymentOverview" component={PaymentOverviewScreen} options={{ headerShown: false }} /> */}

                {/* Role-Based Tab Navigators */}
                <Stack.Screen name="CarOwnerTabs" component={CarOwnerTabs} options={{ headerShown: false }} />
                <Stack.Screen name="DriverTabs" component={DriverTabs} options={{ headerShown: false }} />
                <Stack.Screen name="CenterTabs" component={CenterTabs} options={{ headerShown: false }} />
                <Stack.Screen name="AdminTabs" component={AdminTabs} options={{ headerShown: false }} />
              </Stack.Navigator>
            </NavigationContainer>
          </NotificationProvider>
        </UserProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
