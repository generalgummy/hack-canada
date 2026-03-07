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
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
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
    color: '#1B5E20',
    flex: 1,
    marginRight: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  label: {
    fontSize: 13,
    color: '#888',
  },
  value: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  date: {
    fontSize: 11,
    color: '#aaa',
    marginTop: 6,
    textAlign: 'right',
  },
});

export default OrderCard;
