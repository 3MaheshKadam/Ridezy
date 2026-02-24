import 'react-native-gesture-handler';
import React, { useMemo } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import "./global.css";
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { UserProvider, useUser } from './context/UserContext';
import { NotificationProvider } from './context/NotificationContext';

// Auth Screens
import SplashScreen from './screens/auth/SplashScreen';
import WelcomeScreen from './screens/auth/WelcomeScreen';
import LoginScreen from './screens/auth/LoginScreen';
import RegisterScreen from './screens/auth/RegisterScreen';
import CarOwnerRegistrationScreen from './screens/auth/CarOwnerRegistrationScreen';
import CarWashCenterRegistrationScreen from './screens/car-wash/CarWashCenterRegistrationScreen';
import PendingApprovalScreen from './screens/auth/PendingApprovalScreen';

// Shared Screens
import HomeScreen from './screens/shared/HomeScreen';
import ProfileScreen from './screens/shared/ProfileScreen';
import NotificationsScreen from './screens/shared/NotificationsScreen';
import SupportScreen from './screens/shared/SupportScreen';
import LocationPickerScreen from './screens/shared/LocationPickerScreen';

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
import OwnerTripsScreen from './screens/driver-hire/OwnerTripsScreen';
import DriverTripTrackingScreen from './screens/driver-hire/DriverTripTrackingScreen';
import DriverProfileScreen from './screens/driver-hire/DriverProfileScreen';
import DriverEarningsScreen from './screens/driver-hire/DriverEarningsScreen';
import EditDriverProfileScreen from './screens/driver-hire/EditDriverProfileScreen';

// Admin Screens
import AdminDashboardScreen from './screens/admin/AdminDashboardScreen';
import CarWashApprovalScreen from './screens/admin/CarWashApprovalScreen';
import CarOwnerApprovalScreen from './screens/admin/CarOwnerApprovalScreen';
import DriverApprovalScreen from './screens/admin/DriverApprovalScreen';
import SubscriptionManagementScreen from './screens/admin/SubscriptionManagementScreen';
import PaymentOverviewScreen from './screens/admin/PaymentOverviewScreen';

const RootStack = createStackNavigator();
const CarOwnerTab = createBottomTabNavigator();
const DriverTab = createBottomTabNavigator();
const CenterTab = createBottomTabNavigator();
const AdminTab = createBottomTabNavigator();

// Stable Navigator Components
const CarOwnerTabNavigator = () => (
  <CarOwnerTab.Navigator screenOptions={{
    tabBarActiveTintColor: '#00C851',
    tabBarInactiveTintColor: '#6C757D',
    lazy: true
  }}>
    <CarOwnerTab.Screen
      name="Home"
      component={HomeScreen}
      options={{ headerShown: false, tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} /> }}
    />
    <CarOwnerTab.Screen
      name="CarWash"
      component={SearchWashScreen}
      options={{ title: 'Car Wash', headerShown: false, tabBarIcon: ({ color, size }) => <Ionicons name="car" size={size} color={color} /> }}
    />
    <CarOwnerTab.Screen
      name="DriverHire"
      component={TripRequestScreen}
      options={{ title: 'Hire Driver', headerShown: false, tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} /> }}
    />
    <CarOwnerTab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{ headerShown: false, tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} /> }}
    />
  </CarOwnerTab.Navigator>
);

const DriverTabNavigator = () => (
  <DriverTab.Navigator screenOptions={{
    tabBarActiveTintColor: '#8B5CF6',
    tabBarInactiveTintColor: '#6C757D',
    lazy: true
  }}>
    <DriverTab.Screen
      name="Dashboard"
      component={DriverDashboardScreen}
      options={{ headerShown: false, tabBarIcon: ({ color, size }) => <Ionicons name="speedometer" size={size} color={color} /> }}
    />
    <DriverTab.Screen
      name="Trips"
      component={DriverTripsScreen}
      options={{ headerShown: false, tabBarIcon: ({ color, size }) => <Ionicons name="map" size={size} color={color} /> }}
    />
    <DriverTab.Screen
      name="Earnings"
      component={DriverEarningsScreen}
      options={{ headerShown: false, tabBarIcon: ({ color, size }) => <Ionicons name="cash" size={size} color={color} /> }}
    />
    <DriverTab.Screen
      name="Profile"
      component={DriverProfileScreen}
      options={{ headerShown: false, tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} /> }}
    />
  </DriverTab.Navigator>
);

const CenterTabNavigator = () => (
  <CenterTab.Navigator screenOptions={{
    tabBarActiveTintColor: '#3B82F6',
    tabBarInactiveTintColor: '#6C757D',
    lazy: true
  }}>
    <CenterTab.Screen
      name="Dashboard"
      component={CenterDashboardScreen}
      options={{ headerShown: false, tabBarIcon: ({ color, size }) => <Ionicons name="business" size={size} color={color} /> }}
    />
    <CenterTab.Screen
      name="Bookings"
      component={BookingManagementScreen}
      options={{ headerShown: false, tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} /> }}
    />
    <CenterTab.Screen
      name="Subscriptions"
      component={SubscriptionScreen}
      options={{ headerShown: false, tabBarIcon: ({ color, size }) => <Ionicons name="cash" size={size} color={color} /> }}
    />
    <CenterTab.Screen
      name="Profile"
      component={CenterProfileScreen}
      options={{ headerShown: false, tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} /> }}
    />
  </CenterTab.Navigator>
);

const AdminTabNavigator = () => (
  <AdminTab.Navigator screenOptions={{
    tabBarActiveTintColor: '#1A1B23',
    tabBarInactiveTintColor: '#9CA3AF',
    lazy: true
  }}>
    <AdminTab.Screen
      name="Dashboard"
      component={AdminDashboardScreen}
      options={{ headerShown: false, tabBarIcon: ({ color, size }) => <Ionicons name="grid" size={size} color={color} /> }}
    />
    <AdminTab.Screen
      name="CarWashApprovals"
      component={CarWashApprovalScreen}
      options={{ title: 'Car Wash', headerShown: false, tabBarIcon: ({ color, size }) => <Ionicons name="water" size={size} color={color} /> }}
    />
    <AdminTab.Screen
      name="CarOwnerApprovals"
      component={CarOwnerApprovalScreen}
      options={{ title: 'Owners', headerShown: false, tabBarIcon: ({ color, size }) => <Ionicons name="car" size={size} color={color} /> }}
    />
    <AdminTab.Screen
      name="DriverApprovals"
      component={DriverApprovalScreen}
      options={{ title: 'Drivers', headerShown: false, tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} /> }}
    />
    <AdminTab.Screen
      name="Plans"
      component={SubscriptionManagementScreen}
      options={{ headerShown: false, tabBarIcon: ({ color, size }) => <Ionicons name="list" size={size} color={color} /> }}
    />
  </AdminTab.Navigator>
);

// Navigation Stack Wrapper
const MainNavigator = () => {
  return (
    <RootStack.Navigator initialRouteName="Splash">
      {/* Auth flow */}
      <RootStack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
      <RootStack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
      <RootStack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <RootStack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
      <RootStack.Screen name="CarOwnerRegistration" component={CarOwnerRegistrationScreen} options={{ headerShown: false }} />
      <RootStack.Screen name="CarWashCenterRegistration" component={CarWashCenterRegistrationScreen} options={{ headerShown: false }} />
      <RootStack.Screen name="PendingApproval" component={PendingApprovalScreen} options={{ headerShown: false }} />

      {/* Role Navigators */}
      <RootStack.Screen name="CarOwnerTabs" component={CarOwnerTabNavigator} options={{ headerShown: false }} />
      <RootStack.Screen name="DriverTabs" component={DriverTabNavigator} options={{ headerShown: false }} />
      <RootStack.Screen name="CenterTabs" component={CenterTabNavigator} options={{ headerShown: false }} />
      <RootStack.Screen name="AdminTabs" component={AdminTabNavigator} options={{ headerShown: false }} />

      {/* Standalone Screens */}
      <RootStack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <RootStack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
      <RootStack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: false }} />
      <RootStack.Screen name="Support" component={SupportScreen} options={{ headerShown: false }} />
      <RootStack.Screen name="LocationPicker" component={LocationPickerScreen} options={{ headerShown: false }} />
      <RootStack.Screen name="CenterDashboard" component={CenterDashboardScreen} options={{ headerShown: false }} />
      <RootStack.Screen name="Subscriptions" component={SubscriptionScreen} options={{ headerShown: false }} />
      <RootStack.Screen name="Bookings" component={BookingManagementScreen} options={{ headerShown: false }} />
      <RootStack.Screen name="SearchWash" component={SearchWashScreen} options={{ headerShown: false }} />
      <RootStack.Screen name="BookWash" component={BookWashScreen} options={{ headerShown: false }} />
      <RootStack.Screen name="ServiceManagement" component={ServiceManagementScreen} options={{ headerShown: false }} />
      <RootStack.Screen name="StaffManagement" component={StaffManagementScreen} options={{ headerShown: false }} />
      <RootStack.Screen name="EditCenterProfile" component={EditCenterProfileScreen} options={{ headerShown: false }} />
      <RootStack.Screen name="BookingStatus" component={BookingStatusScreen} options={{ headerShown: false }} />
      <RootStack.Screen name="DriverDashboard" component={DriverDashboardScreen} options={{ headerShown: false }} />
      <RootStack.Screen name="TripRequest" component={TripRequestScreen} options={{ headerShown: false }} />
      <RootStack.Screen name="DriverTrips" component={DriverTripsScreen} options={{ headerShown: false }} />
      <RootStack.Screen name="TripTracking" component={TripTrackingScreen} options={{ headerShown: false }} />
      <RootStack.Screen name="DriverMatching" component={DriverMatchingScreen} options={{ headerShown: false }} />
      <RootStack.Screen name="DriverRegistration" component={DriverRegistrationScreen} options={{ headerShown: false }} />
      <RootStack.Screen name="DriverRequestFeed" component={DriverRequestFeedScreen} options={{ headerShown: false }} />
      <RootStack.Screen name="DriverSubscription" component={DriverSubscription} options={{ headerShown: false }} />
      <RootStack.Screen name="OwnerTripTracking" component={OwnerTripTrackingScreen} options={{ headerShown: false }} />
      <RootStack.Screen name="OwnerTrips" component={OwnerTripsScreen} options={{ headerShown: false }} />
      <RootStack.Screen name="DriverTripTracking" component={DriverTripTrackingScreen} options={{ headerShown: false }} />
      <RootStack.Screen name="DriverEarnings" component={DriverEarningsScreen} options={{ headerShown: false }} />
      <RootStack.Screen name="EditDriverProfile" component={EditDriverProfileScreen} options={{ headerShown: false }} />
      <RootStack.Screen name="PaymentOverview" component={PaymentOverviewScreen} options={{ headerShown: false }} />
    </RootStack.Navigator>
  );
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <UserProvider>
            <NotificationProvider>
              <MainNavigator />
            </NotificationProvider>
          </UserProvider>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
