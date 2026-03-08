import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, ActivityIndicator, StyleSheet, useWindowDimensions, Platform, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  Nunito_300Light,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
} from '@expo-google-fonts/nunito';
import Toast from 'react-native-toast-message';
import FloatingTabBar from './components/FloatingTabBar';

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

// Role-aware home dashboard dispatcher
const HomeDashboard = (props) => {
  const { user } = useAuth();
  if (user?.userType === 'community') return <CommunityDashboard {...props} />;
  if (user?.userType === 'supplier')  return <SupplierDashboard  {...props} />;
  return <HunterDashboard {...props} />;
};

// Main Screens
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
// Main Tab Navigator (Mobile Bottom Tabs)
// ==========================================
const MobileTabNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        // Make tab bar position absolute so content fills behind the floating bar
        tabBarStyle: { position: 'absolute', backgroundColor: 'transparent', borderTopWidth: 0, elevation: 0 },
      }}
    >
      <Tab.Screen name="Home"     component={HomeDashboard} />
      <Tab.Screen name="Listings" component={ListingsScreen} />
      <Tab.Screen name="Orders"   component={OrdersScreen} />
      <Tab.Screen name="Chat"     component={ChatListScreen} />
      <Tab.Screen name="Profile"  component={ProfileScreen} />
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
        <Text style={styles.loadingLogo}>NH</Text>
        <Text style={styles.loadingTitle}>Northern Harvest</Text>
        <ActivityIndicator size="large" color="#2A5C2A" style={{ marginTop: 20 }} />
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
              headerTintColor: '#2A5C2A',
              headerStyle: { backgroundColor: '#FAF0DC' },
            }}
          />
          <Stack.Screen
            name="CreateListing"
            component={CreateListingScreen}
            options={{
              headerShown: true,
              headerTitle: 'New Listing',
              headerTintColor: '#2A5C2A',
              headerStyle: { backgroundColor: '#FAF0DC' },
            }}
          />
          <Stack.Screen
            name="OrderDetail"
            component={OrderDetailScreen}
            options={{
              headerShown: true,
              headerTitle: 'Order',
              headerTintColor: '#2A5C2A',
              headerStyle: { backgroundColor: '#FAF0DC' },
            }}
          />
          <Stack.Screen
            name="ChatRoom"
            component={ChatRoomScreen}
            options={{
              headerShown: true,
              headerTitle: 'Chat',
              headerTintColor: '#2A5C2A',
              headerStyle: { backgroundColor: '#FAF0DC' },
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
  const [fontsLoaded] = useFonts({
    Nunito_300Light,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2A5C2A" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <RootNavigator />
      </NavigationContainer>
      <Toast />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5E6C8',
  },
  loadingLogo: {
    fontSize: 64,
    marginBottom: 12,
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2A5C2A',
    fontFamily: 'Nunito_800ExtraBold',
  },
  loadingText: {
    fontSize: 14,
    color: '#7A7A7A',
    marginTop: 12,
    fontFamily: 'Nunito_400Regular',
  },
  desktopContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F5E6C8',
    ...Platform.select({
      web: {
        overflow: 'hidden',
      },
      default: {},
    }),
  },
  desktopContent: {
    flex: 1,
    backgroundColor: '#F5E6C8',
    ...Platform.select({
      web: {
        overflow: 'hidden',
      },
      default: {},
    }),
  },
});
