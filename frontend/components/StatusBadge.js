import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const STATUS_COLORS = {
  available: { bg: '#D4EDDA', text: '#2A5C2A' },
  reserved: { bg: '#FFF3E0', text: '#E8834A' },
  fulfilled: { bg: '#E3F2FD', text: '#4A90D9' },
  expired: { bg: '#EFEBE9', text: '#795548' },
  cancelled: { bg: '#FFEBEE', text: '#E05252' },
  pending: { bg: '#FFF8E1', text: '#F5C200' },
  confirmed: { bg: '#D4EDDA', text: '#2A5C2A' },
  in_transit: { bg: '#E3F2FD', text: '#4A90D9' },
  delivered: { bg: '#D4EDDA', text: '#2A5C2A' },
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
    borderRadius: 999,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    fontFamily: 'Nunito_400Regular',
  },
});

export default StatusBadge;
