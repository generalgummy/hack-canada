import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';

/**
 * Responsive container that constrains content width on larger screens
 * and adjusts padding based on device size.
 * 
 * Note: This is a layout wrapper only. Screens should use ScrollView
 * directly if they need scrolling (works on both mobile and desktop).
 */
const ResponsiveContainer = ({ children, style, maxWidth = 1200 }) => {
  const { isDesktop, isTablet, spacing } = useResponsive();

  const containerStyle = {
    flex: 1,
    paddingHorizontal: isDesktop ? spacing.xl : isTablet ? spacing.lg : spacing.md,
    alignSelf: 'center',
    width: '100%',
    maxWidth: isDesktop ? maxWidth : '100%',
  };

  return (
    <View style={[containerStyle, style]}>
      {children}
    </View>
  );
};

export default ResponsiveContainer;
