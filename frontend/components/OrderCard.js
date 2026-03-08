import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import StatusBadge from './StatusBadge';

const OrderCard = ({ order, onPress }) => {
  const listing = order.listing || {};
  const otherParty = order.buyer || order.seller || {};

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.topRow}>
        <Text style={styles.title} numberOfLines={1}>
          {listing.title || 'Order'}
        </Text>
        <StatusBadge status={order.status} />
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.label}>Quantity:</Text>
        <Text style={styles.value}>
          {order.quantityRequested} {order.unit}
        </Text>
      </View>

      {order.totalPrice > 0 && (
        <View style={styles.detailRow}>
          <Text style={styles.label}>Total:</Text>
          <Text style={styles.value}>${order.totalPrice.toFixed(2)}</Text>
        </View>
      )}

      <View style={styles.detailRow}>
        <Text style={styles.label}>
          {order.buyer ? 'Buyer:' : 'Seller:'}
        </Text>
        <Text style={styles.value}>{otherParty.name || 'N/A'}</Text>
      </View>

      <Text style={styles.date}>
        {new Date(order.createdAt).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FAF0DC',
    borderRadius: 20,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 5,
    elevation: 2,
    shadowColor: '#2A5C2A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(42,92,42,0.08)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2A5C2A',
    flex: 1,
    marginRight: 8,
    fontFamily: 'Nunito_800ExtraBold',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  label: {
    fontSize: 13,
    color: '#7A7A7A',
    fontFamily: 'Nunito_400Regular',
  },
  value: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Nunito_400Regular',
  },
  date: {
    fontSize: 11,
    color: '#7A7A7A',
    marginTop: 6,
    textAlign: 'right',
    fontFamily: 'Nunito_400Regular',
  },
});

export default OrderCard;
