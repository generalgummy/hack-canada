import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, ActivityIndicator, StyleSheet, useWindowDimensions, Platform, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider, useAuth } from './context/AuthContext';
import { useResponsive } from './hooks/useResponsive';
import DesktopSidebar from './components/DesktopSidebar';

// Auth Screens
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import OTPScreen from './screens/OTPScreen';
import CompleteProfileScreen from './screens/CompleteProfileScreen';

// Admin Screen
import AdminDashboard from './screens/AdminDashboard';

// Dashboard Screens
import HunterDashboard from './screens/HunterDashboard';
import CommunityDashboard from './screens/CommunityDashboard';
import SupplierDashboard from './screens/SupplierDashboard';

// Main Screens
import HomeScreen from './screens/HomeScreen';
import ListingsScreen from './screens/ListingsScreen';
import ListingDetailScreen from './screens/ListingDetailScreen';
import CreateListingScreen from './screens/CreateListingScreen';
import OrdersScreen from './screens/OrdersScreen';
import OrderDetailScreen from './screens/OrderDetailScreen';
import ChatListScreen from './screens/ChatListScreen';
import ChatRoomScreen from './screens/ChatRoomScreen';
import ProfileScreen from './screens/ProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// ==========================================
// Tab Icons (emoji-based for simplicity)
// ==========================================
const TabIcon = ({ label, focused }) => {
  const icons = {
    Home: focused ? '🏠' : '🏡',
    Listings: focused ? '🛒' : '🛍️',
    Orders: focused ? '📦' : '📋',
    Chat: focused ? '💬' : '🗨️',
    Profile: focused ? '👤' : '👥',
  };
  return <Text style={{ fontSize: 22 }}>{icons[label] || '📌'}</Text>;
};

// ==========================================
// Main Tab Navigator (Mobile Bottom Tabs)
// ==========================================
const MobileTabNavigator = () => {
  const { user } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
        tabBarActiveTintColor: '#2E7D32',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
          paddingBottom: 6,
          paddingTop: 6,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Listings" component={ListingsScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Chat" component={ChatListScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

// ==========================================
// Desktop + Mobile Layout Wrapper
// ==========================================
const MainTabs = ({ navigation }) => {
  const { isDesktop } = useResponsive();

  if (isDesktop) {
    return (
      <View style={styles.desktopContainer}>
        <DesktopSidebar state={{ index: 0 }} navigation={navigation} />
        <View style={styles.desktopContent}>
          <MobileTabNavigator />
        </View>
      </View>
    );
  }

  return <MobileTabNavigator />;
};

// ==========================================
// Root Navigation
// ==========================================
const RootNavigator = () => {
  const { user, loading, pendingOtp, needsProfileCompletion } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingLogo}>🌾</Text>
        <Text style={styles.loadingTitle}>Northern Harvest</Text>
        <ActivityIndicator size="large" color="#2E7D32" style={{ marginTop: 20 }} />
        <Text style={styles.loadingText}>Restoring your session...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user && !needsProfileCompletion ? (
        user.isAdmin ? (
          // Admin Dashboard
          <>
            <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
          </>
        ) : (
        // App Screens
        <>
          <Stack.Screen
            name="MainTabs"
            component={MainTabs}
            options={({ navigation }) => ({
              // Navigation passed to support desktop sidebar
            })}
          />
          <Stack.Screen
            name="ListingDetail"
            component={ListingDetailScreen}
            options={{
              headerShown: true,
              headerTitle: 'Listing',
              headerTintColor: '#2E7D32',
              headerStyle: { backgroundColor: '#fff' },
            }}
          />
          <Stack.Screen
            name="CreateListing"
            component={CreateListingScreen}
            options={{
              headerShown: true,
              headerTitle: 'New Listing',
              headerTintColor: '#2E7D32',
              headerStyle: { backgroundColor: '#fff' },
            }}
          />
          <Stack.Screen
            name="OrderDetail"
            component={OrderDetailScreen}
            options={{
              headerShown: true,
              headerTitle: 'Order',
              headerTintColor: '#2E7D32',
              headerStyle: { backgroundColor: '#fff' },
            }}
          />
          <Stack.Screen
            name="ChatRoom"
            component={ChatRoomScreen}
            options={{
              headerShown: true,
              headerTitle: 'Chat',
              headerTintColor: '#2E7D32',
              headerStyle: { backgroundColor: '#fff' },
            }}
          />
        </>
        )
      ) : needsProfileCompletion ? (
        // Complete Profile Screen
        <>
          <Stack.Screen name="CompleteProfile" component={CompleteProfileScreen} />
        </>
      ) : pendingOtp ? (
        // OTP Verification Screen
        <>
          <Stack.Screen name="OTPVerification" component={OTPScreen} />
        </>
      ) : (
        // Auth Screens
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

// ==========================================
// App Entry
// ==========================================
export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F9F5',
  },
  loadingLogo: {
    fontSize: 64,
    marginBottom: 12,
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1B5E20',
  },
  loadingText: {
    fontSize: 14,
    color: '#888',
    marginTop: 12,
  },
  desktopContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#fff',
    // Web-specific styles for proper overflow handling
    ...Platform.select({
      web: {
        overflow: 'hidden',
      },
      default: {},
    }),
  },
  desktopContent: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    // Web-specific styles for proper scrolling
    ...Platform.select({
      web: {
        overflow: 'hidden',
      },
      default: {},
    }),
  },
});
