import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getOrderAPI, updateOrderStatusAPI, cancelOrderAPI } from '../services/api';
import StatusBadge from '../components/StatusBadge';

const STATUS_STEPS = ['pending', 'confirmed', 'in_transit', 'delivered'];

const OrderDetailScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, []);

  const fetchOrder = async () => {
    try {
      const res = await getOrderAPI(orderId);
      setOrder(res.data.order);
    } catch (error) {
      Alert.alert('Error', 'Failed to load order');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    Alert.alert(
      'Update Status',
      `Change order status to "${newStatus.replace('_', ' ')}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setUpdating(true);
            try {
              await updateOrderStatusAPI(orderId, { status: newStatus });
              fetchOrder();
            } catch (error) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to update');
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  const handleCancel = async () => {
    Alert.alert('Cancel Order', 'Are you sure you want to cancel this order?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          setUpdating(true);
          try {
            await cancelOrderAPI(orderId);
            fetchOrder();
          } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to cancel');
          } finally {
            setUpdating(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  if (!order) return null;

  const isBuyer = order.buyer?._id === user?._id;
  const isSeller = order.seller?._id === user?._id;
  const currentStepIndex = STATUS_STEPS.indexOf(order.status);

  const getNextStatus = () => {
    const transitions = {
      pending: 'confirmed',
      confirmed: 'in_transit',
      in_transit: 'delivered',
    };
    return transitions[order.status];
  };

  const getStatusLabel = (status) => {
    const labels = {
      confirmed: 'Confirm Order',
      in_transit: 'Mark as In Transit',
      delivered: 'Mark Delivered',
    };
    return labels[status] || status;
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.heading}>Order Details</Text>

        {/* Status Progress */}
        <View style={styles.progressContainer}>
          {STATUS_STEPS.map((step, index) => (
            <View key={step} style={styles.stepContainer}>
              <View
                style={[
                  styles.stepCircle,
                  index <= currentStepIndex && order.status !== 'cancelled'
                    ? styles.stepActive
                    : styles.stepInactive,
                ]}
              >
                <Text style={styles.stepNumber}>{index + 1}</Text>
              </View>
              <Text style={styles.stepLabel}>{step.replace('_', ' ')}</Text>
              {index < STATUS_STEPS.length - 1 && (
                <View
                  style={[
                    styles.stepLine,
                    index < currentStepIndex && order.status !== 'cancelled'
                      ? styles.lineActive
                      : styles.lineInactive,
                  ]}
                />
              )}
            </View>
          ))}
        </View>

        {order.status === 'cancelled' && (
          <View style={styles.cancelledBanner}>
            <Text style={styles.cancelledText}>❌ This order has been cancelled</Text>
          </View>
        )}

        {/* Order Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Product</Text>
            <Text style={styles.infoValue}>{order.listing?.title || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Category</Text>
            <Text style={styles.infoValue}>{order.listing?.category?.replace('_', ' ')}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Quantity</Text>
            <Text style={styles.infoValue}>
              {order.quantityRequested} {order.unit}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Total Price</Text>
            <Text style={styles.infoValue}>
              {order.totalPrice > 0 ? `$${order.totalPrice.toFixed(2)}` : 'Free'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <StatusBadge status={order.status} />
          </View>
          {order.estimatedDelivery && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Est. Delivery</Text>
              <Text style={styles.infoValue}>
                {new Date(order.estimatedDelivery).toLocaleDateString()}
              </Text>
            </View>
          )}
          {order.deliveredAt && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Delivered At</Text>
              <Text style={styles.infoValue}>
                {new Date(order.deliveredAt).toLocaleString()}
              </Text>
            </View>
          )}
        </View>

        {/* Contact Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{isBuyer ? 'Seller' : 'Buyer'}</Text>
          <Text style={styles.contactName}>
            {isBuyer ? order.seller?.name : order.buyer?.name}
          </Text>
          <Text style={styles.contactInfo}>
            📍 {isBuyer ? order.seller?.location : order.buyer?.location}
          </Text>
          {(isBuyer ? order.seller?.phone : order.buyer?.phone) && (
            <Text style={styles.contactInfo}>
              📞 {isBuyer ? order.seller?.phone : order.buyer?.phone}
            </Text>
          )}
        </View>

        {/* Delivery Address */}
        {order.deliveryAddress && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Delivery Address</Text>
            <Text style={styles.addressText}>{order.deliveryAddress}</Text>
          </View>
        )}

        {/* Notes */}
        {order.notes && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Notes</Text>
            <Text style={styles.notesText}>{order.notes}</Text>
          </View>
        )}

        {/* Status History */}
        {order.statusHistory?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Status History</Text>
            {order.statusHistory.map((entry, i) => (
              <View key={i} style={styles.historyRow}>
                <View style={styles.historyDot} />
                <View>
                  <Text style={styles.historyStatus}>
                    {entry.status?.replace('_', ' ').toUpperCase()}
                  </Text>
                  <Text style={styles.historyTime}>
                    {new Date(entry.timestamp).toLocaleString()}
                  </Text>
                  {entry.note && <Text style={styles.historyNote}>{entry.note}</Text>}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.chatButton}
          onPress={() =>
            navigation.navigate('ChatRoom', {
              roomId: order.chatRoomId,
              title: order.listing?.title || 'Order Chat',
            })
          }
        >
          <Text style={styles.chatButtonText}>💬 Open Chat</Text>
        </TouchableOpacity>

        {isSeller && getNextStatus() && !updating && (
          <TouchableOpacity
            style={styles.statusButton}
            onPress={() => handleStatusUpdate(getNextStatus())}
          >
            <Text style={styles.statusButtonText}>
              {getStatusLabel(getNextStatus())}
            </Text>
          </TouchableOpacity>
        )}

        {isBuyer && order.status === 'pending' && !updating && (
          <TouchableOpacity style={styles.cancelOrderButton} onPress={handleCancel}>
            <Text style={styles.cancelOrderText}>Cancel Order</Text>
          </TouchableOpacity>
        )}

        {updating && <ActivityIndicator color="#2E7D32" style={{ marginLeft: 12 }} />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F9F5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20, paddingTop: 60, paddingBottom: 20 },
  heading: { fontSize: 24, fontWeight: '800', color: '#1B5E20', marginBottom: 20 },
  progressContainer: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24,
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
  },
  stepContainer: { alignItems: 'center', flex: 1, position: 'relative' },
  stepCircle: {
    width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center',
  },
  stepActive: { backgroundColor: '#2E7D32' },
  stepInactive: { backgroundColor: '#E0E0E0' },
  stepNumber: { color: '#fff', fontWeight: '700', fontSize: 14 },
  stepLabel: { fontSize: 10, color: '#666', marginTop: 4, textTransform: 'capitalize', textAlign: 'center' },
  stepLine: { position: 'absolute', top: 16, right: -20, width: 40, height: 2 },
  lineActive: { backgroundColor: '#2E7D32' },
  lineInactive: { backgroundColor: '#E0E0E0' },
  cancelledBanner: {
    backgroundColor: '#FFEBEE', borderRadius: 10, padding: 12, marginBottom: 16, alignItems: 'center',
  },
  cancelledText: { fontSize: 14, color: '#C62828', fontWeight: '600' },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 12 },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 6,
  },
  infoLabel: { fontSize: 14, color: '#888' },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#333', textTransform: 'capitalize' },
  contactName: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 },
  contactInfo: { fontSize: 13, color: '#666', marginBottom: 2 },
  addressText: { fontSize: 14, color: '#555', lineHeight: 20 },
  notesText: { fontSize: 14, color: '#555', lineHeight: 20 },
  historyRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  historyDot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: '#2E7D32',
    marginRight: 10, marginTop: 4,
  },
  historyStatus: { fontSize: 13, fontWeight: '600', color: '#333' },
  historyTime: { fontSize: 11, color: '#888' },
  historyNote: { fontSize: 12, color: '#666', marginTop: 2 },
  actionBar: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 10,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E0E0E0',
  },
  chatButton: {
    flex: 1, backgroundColor: '#fff', borderRadius: 10, paddingVertical: 14,
    alignItems: 'center', borderWidth: 1, borderColor: '#2E7D32',
  },
  chatButtonText: { fontSize: 15, fontWeight: '700', color: '#2E7D32' },
  statusButton: {
    flex: 1, backgroundColor: '#2E7D32', borderRadius: 10, paddingVertical: 14, alignItems: 'center',
  },
  statusButtonText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  cancelOrderButton: {
    flex: 1, backgroundColor: '#FFEBEE', borderRadius: 10, paddingVertical: 14, alignItems: 'center',
  },
  cancelOrderText: { fontSize: 15, fontWeight: '700', color: '#C62828' },
});

export default OrderDetailScreen;
