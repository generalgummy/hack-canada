import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, F } from '../theme';

export default function LocationPill({ label, onPress, loading }) {
  return (
    <TouchableOpacity style={styles.pill} onPress={onPress} activeOpacity={0.75}>
      <Ionicons name="location-sharp" size={13} color={colors.yellow} />
      {loading ? (
        <ActivityIndicator size="small" color={colors.yellow} style={{ marginLeft: 4 }} />
      ) : (
        <Text style={styles.label} numberOfLines={1}>
          {label || 'Tap to set location'}
        </Text>
      )}
      <Ionicons name="chevron-down" size={11} color="rgba(255,255,255,0.6)" style={{ marginLeft: 2 }} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection:    'row',
    alignItems:       'center',
    backgroundColor:  'rgba(255,255,255,0.14)',
    borderRadius:     999,
    paddingHorizontal: 12,
    paddingVertical:  5,
    gap:              5,
    maxWidth:         220,
    borderWidth:      1,
    borderColor:      'rgba(255,255,255,0.18)',
  },
  label: {
    color:      '#FFFFFF',
    fontSize:   12,
    fontFamily: F.semibold,
    flex:       1,
  },
});
