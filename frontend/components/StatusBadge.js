import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const STATUS_COLORS = {
  available: { bg: '#E8F5E9', text: '#2E7D32' },
  reserved: { bg: '#FFF3E0', text: '#E65100' },
  fulfilled: { bg: '#E3F2FD', text: '#1565C0' },
  expired: { bg: '#EFEBE9', text: '#795548' },
  cancelled: { bg: '#FFEBEE', text: '#C62828' },
  pending: { bg: '#FFF8E1', text: '#F57F17' },
  confirmed: { bg: '#E8F5E9', text: '#2E7D32' },
  in_transit: { bg: '#E3F2FD', text: '#1565C0' },
  delivered: { bg: '#E8F5E9', text: '#1B5E20' },
};

const StatusBadge = ({ status }) => {
  const colors = STATUS_COLORS[status] || { bg: '#F5F5F5', text: '#757575' };

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.text }]}>
        {status?.replace('_', ' ').toUpperCase()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});

export default StatusBadge;
