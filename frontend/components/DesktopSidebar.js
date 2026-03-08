import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useResponsive } from '../hooks/useResponsive';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

/**
 * Desktop sidebar navigation for > 1024px screens
 * Shows all tabs vertically with icons and labels
 */
const DesktopSidebar = ({ state, navigation }) => {
  const { spacing } = useResponsive();
  const { logout } = useAuth();

  const navigationItems = [
    { name: 'Home', icon: 'home-outline', label: 'Home' },
    { name: 'Listings', icon: 'storefront-outline', label: 'Listings' },
    { name: 'Orders', icon: 'cube-outline', label: 'Orders' },
    { name: 'Chat', icon: 'chatbubbles-outline', label: 'Chat' },
    { name: 'Profile', icon: 'person-outline', label: 'Profile' },
  ];

  return (
    <SafeAreaView style={[styles.sidebar, { width: 250 }]}>
      <View style={styles.header}>
        <Text style={styles.logo}>NH</Text>
        <Text style={styles.appName}>Northern Harvest</Text>
      </View>

      <ScrollView style={styles.navContainer} showsVerticalScrollIndicator={false}>
        {navigationItems.map((item, index) => {
          const isFocused = state.index === index;

          return (
            <TouchableOpacity
              key={item.name}
              style={[
                styles.navItem,
                isFocused && styles.navItemActive,
                { paddingVertical: spacing.md },
              ]}
              onPress={() => navigation.navigate(item.name)}
            >
              <Ionicons
                name={item.icon}
                size={22}
                color={isFocused ? '#2A5C2A' : '#7A7A7A'}
                style={styles.navIcon}
              />
              <Text style={[styles.navLabel, isFocused && styles.navLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="exit-outline" size={20} color="#7A7A7A" style={styles.logoutIcon} />
          <Text style={styles.logoutLabel}>Logout</Text>
        </TouchableOpacity>
        <Text style={styles.footerText}>v1.0</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    backgroundColor: '#2A5C2A',
    borderRightWidth: 0,
    paddingVertical: 16,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.15)',
    marginBottom: 20,
  },
  logo: {
    fontSize: 40,
    marginBottom: 8,
  },
  appName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: 'Nunito_800ExtraBold',
  },
  navContainer: {
    flex: 1,
    paddingHorizontal: 12,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 4,
  },
  navItemActive: {
    backgroundColor: '#F5C200',
  },
  navIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  navIconActive: {
    fontSize: 22,
  },
  navLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
    fontFamily: 'Nunito_400Regular',
  },
  navLabelActive: {
    color: '#1A1A1A',
    fontWeight: '700',
    fontFamily: 'Nunito_400Regular',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginBottom: 10,
    width: '80%',
    justifyContent: 'center',
  },
  logoutIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  logoutLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Nunito_400Regular',
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    fontFamily: 'Nunito_400Regular',
  },
});

export default DesktopSidebar;
