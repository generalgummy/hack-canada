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

/**
 * Desktop sidebar navigation for > 1024px screens
 * Shows all tabs vertically with icons and labels
 */
const DesktopSidebar = ({ state, navigation }) => {
  const { spacing } = useResponsive();

  const navigationItems = [
    { name: 'Home', icon: '🏠', label: 'Home' },
    { name: 'Listings', icon: '🛒', label: 'Listings' },
    { name: 'Orders', icon: '📦', label: 'Orders' },
    { name: 'Chat', icon: '💬', label: 'Chat' },
    { name: 'Profile', icon: '👤', label: 'Profile' },
  ];

  return (
    <SafeAreaView style={[styles.sidebar, { width: 250 }]}>
      <View style={styles.header}>
        <Text style={styles.logo}>🌾</Text>
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
              <Text style={[styles.navIcon, isFocused && styles.navIconActive]}>
                {item.icon}
              </Text>
              <Text style={[styles.navLabel, isFocused && styles.navLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>v1.0</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    backgroundColor: '#1B5E20',
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
    paddingVertical: 16,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2E7D32',
    marginBottom: 20,
  },
  logo: {
    fontSize: 40,
    marginBottom: 8,
  },
  appName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  navContainer: {
    flex: 1,
    paddingHorizontal: 12,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  navItemActive: {
    backgroundColor: '#2E7D32',
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
    color: '#ccc',
    fontWeight: '500',
  },
  navLabelActive: {
    color: '#fff',
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#2E7D32',
  },
  footerText: {
    fontSize: 12,
    color: '#888',
  },
});

export default DesktopSidebar;
