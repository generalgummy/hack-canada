import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, FlatList, RefreshControl,
  TouchableOpacity, TextInput, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';
import { useAuth } from '../context/AuthContext';
import { getDashboardAPI, getMyOrdersAPI, updateOrderStatusAPI } from '../services/api';
import { useLocation } from '../hooks/useLocation';
import LocationPill from '../components/LocationPill';
import OfflineBanner from '../components/OfflineBanner';
import SkeletonCard from '../components/SkeletonCard';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import { colors, F, radius, shadows, urgency as U } from '../theme';

const URGENCY_ORDER = { critical: 0, medium: 1, low: 2 };

function UrgencyBadge({ level }) {
  const u = U[level] || U.low;
  return (
    <View style={[styles.urgBadge, { backgroundColor: u.bg }]}>
      <Text style={[styles.urgText, { color: u.text }]}>{u.label}</Text>
    </View>
  );
}

function StatTile({ value, label, color }) {
  return (
    <View style={[styles.statTile, { backgroundColor: color }]}>
      <Text style={styles.statNum}>{value}</Text>
      <Text style={styles.statLbl}>{label}</Text>
    </View>
  );
}

export default function SupplierDashboard({ navigation }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { locationLabel, loading: locLoading, fetchLocation, loadCached } = useLocation();

  const [stats, setStats]             = useState(null);
  const [requests, setRequests]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [selectedOrder, setSelected]  = useState(null);
  const [deliveryForm, setDeliveryForm] = useState({ deliveryDate: new Date(), showPicker: false, notes: '' });
  const [submitting, setSubmitting]   = useState(false);

  useEffect(() => {
    fetchAll();
    loadCached();
  }, []);

  const fetchAll = async () => {
    try {
      const [dashRes, ordersRes] = await Promise.all([
        getDashboardAPI(),
        getMyOrdersAPI({ role: 'supplier', status: 'pending,confirmed' }),
      ]);
      setStats(dashRes.data.stats);
      // Sort by urgency then date
      const sorted = (ordersRes.data.orders ?? []).sort((a, b) => {
        const urgDiff = (URGENCY_ORDER[a.urgency] ?? 2) - (URGENCY_ORDER[b.urgency] ?? 2);
        if (urgDiff !== 0) return urgDiff;
        return new Date(a.createdAt) - new Date(b.createdAt);
      });
      setRequests(sorted);
    } catch (e) {
      console.log('Dashboard error:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => { setRefreshing(true); fetchAll(); }, []);

  const openDelivery = (order) => {
    setSelected(order);
    setDeliveryForm({ deliveryDate: new Date(), showPicker: false, notes: '' });
  };

  const confirmDelivery = async () => {
    if (!selectedOrder) return;
    setSubmitting(true);
    try {
      await updateOrderStatusAPI(selectedOrder._id, {
        status: 'in_delivery',
        deliveryDate: deliveryForm.deliveryDate.toISOString(),
        notes: deliveryForm.notes,
      });
      Toast.show({ type: 'success', text1: 'Delivery scheduled!', text2: 'Community will be notified.' });
      setSelected(null);
      fetchAll();
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Could not schedule delivery', text2: e.message });
    } finally {
      setSubmitting(false);
    }
  };

  const ListHeader = (
    <View>
      <OfflineBanner />
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Ready to supply,</Text>
            <Text style={styles.name}>{user?.businessName || user?.name || 'Supplier'}</Text>
          </View>
          <LocationPill label={locationLabel} loading={locLoading} onPress={fetchLocation} />
        </View>
        <View style={styles.statsRow}>
          {loading ? (
            <><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
          ) : (
            <>
              <StatTile value={stats?.pendingOrders   ?? 0} label="Pending"   color="#FFF3CD" />
              <StatTile value={stats?.totalOrders     ?? 0} label="In Transit" color="#E3F2FD" />
              <StatTile value={stats?.deliveredOrders ?? 0} label="Fulfilled"  color="#D4EDDA" />
            </>
          )}
        </View>
      </View>
      <Text style={[styles.sectionTitle, { paddingHorizontal: 18, marginTop: 22, marginBottom: 4 }]}>
        Community Requests
      </Text>
    </View>
  );

  return (
    <View style={styles.root}>
      <FlatList
        data={requests}
        keyExtractor={item => item._id}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.greenDark]} />}
        ListEmptyComponent={
          !loading
            ? <EmptyState icon="clipboard-outline" title="No pending requests" subtitle="Community requests will appear here" />
            : null
        }
        renderItem={({ item }) => (
          <View style={styles.requestCard}>
            <View style={styles.requestHeader}>
              <Text style={styles.requestTitle} numberOfLines={1}>
                {item.supplyType || item.listing?.title || 'Supply Request'}
              </Text>
              <UrgencyBadge level={item.urgency || 'low'} />
            </View>
            {item.quantity ? (
              <Text style={styles.requestSub}>Qty: {item.quantity}</Text>
            ) : null}
            <Text style={styles.requestSub}>
              From: {item.buyer?.name || 'Community'} · {new Date(item.createdAt).toLocaleDateString()}
            </Text>
            {item.notes ? <Text style={styles.requestNotes}>{item.notes}</Text> : null}
            <View style={styles.requestFooter}>
              <StatusBadge status={item.status} />
              <TouchableOpacity
                style={styles.deliveryBtn}
                onPress={() => openDelivery(item)}
                activeOpacity={0.85}
              >
                <Text style={styles.deliveryBtnText}>Arrange Delivery</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Delivery Scheduling Sheet */}
      <Modal
        visible={!!selectedOrder}
        animationType="slide"
        transparent
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.overlayTap} onPress={() => setSelected(null)} />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.sheetTitle}>Schedule Delivery</Text>

              {selectedOrder && (
                <View style={styles.confirmBox}>
                  <Text style={styles.confirmLabel}>Order</Text>
                  <Text style={styles.confirmValue}>
                    {selectedOrder.supplyType || selectedOrder.listing?.title || 'Supply Request'}
                  </Text>
                  {selectedOrder.quantity ? (
                    <Text style={styles.confirmSub}>Quantity: {selectedOrder.quantity}</Text>
                  ) : null}
                </View>
              )}

              <TouchableOpacity onPress={() => setDeliveryForm(f => ({ ...f, showPicker: true }))}>
                <Text style={styles.fieldLabel}>Delivery Date</Text>
                <View style={[styles.input, { justifyContent: 'center' }]}>
                  <Text style={{ fontFamily: F.regular, color: colors.textBody }}>
                    {deliveryForm.deliveryDate.toLocaleDateString()}
                  </Text>
                </View>
              </TouchableOpacity>
              {deliveryForm.showPicker && (
                <DateTimePicker
                  value={deliveryForm.deliveryDate}
                  mode="date"
                  minimumDate={new Date()}
                  onChange={(_, d) =>
                    setDeliveryForm(f => ({ ...f, showPicker: false, deliveryDate: d || f.deliveryDate }))
                  }
                />
              )}

              <Text style={styles.fieldLabel}>Driver Notes</Text>
              <TextInput
                style={[styles.input, { height: 88, textAlignVertical: 'top' }]}
                placeholder="Instructions for the driver..."
                placeholderTextColor={colors.textMuted}
                multiline
                value={deliveryForm.notes}
                onChangeText={v => setDeliveryForm(f => ({ ...f, notes: v }))}
              />

              <TouchableOpacity
                style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
                onPress={confirmDelivery}
                disabled={submitting}
              >
                <Text style={styles.submitText}>{submitting ? 'Scheduling...' : 'Confirm Delivery'}</Text>
              </TouchableOpacity>
              <View style={{ height: 36 }} />
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: colors.bg },
  header:      { backgroundColor: colors.blue, paddingHorizontal: 20, paddingBottom: 24, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  greeting:    { fontFamily: F.regular, fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  name:        { fontFamily: F.black, fontSize: 22, color: '#fff', marginTop: 2 },
  statsRow:    { flexDirection: 'row', gap: 10 },
  statTile:    { flex: 1, borderRadius: radius.md, padding: 14, alignItems: 'center' },
  statNum:     { fontFamily: F.black, fontSize: 24, color: '#1A355C' },
  statLbl:     { fontFamily: F.semibold, fontSize: 11, color: colors.textMuted, marginTop: 2 },
  sectionTitle:{ fontFamily: F.bold, fontSize: 16, color: colors.textHeading },
  // Request card
  requestCard:   { marginHorizontal: 18, marginTop: 10, backgroundColor: colors.bgCard, borderRadius: radius.md, padding: 14, ...shadows.card },
  requestHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  requestTitle:  { fontFamily: F.bold, fontSize: 15, color: colors.textHeading, flex: 1, marginRight: 8 },
  requestSub:    { fontFamily: F.regular, fontSize: 12, color: colors.textMuted, marginTop: 2 },
  requestNotes:  { fontFamily: F.regular, fontSize: 12, color: colors.textBody, marginTop: 6, fontStyle: 'italic' },
  requestFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  deliveryBtn:   { backgroundColor: colors.greenDark, borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 8 },
  deliveryBtnText: { fontFamily: F.bold, fontSize: 13, color: '#fff' },
  // Urgency badge
  urgBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  urgText:  { fontFamily: F.bold, fontSize: 11 },
  // Sheet
  overlay:     { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.42)' },
  overlayTap:  { flex: 1 },
  sheet:       { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 12, maxHeight: '80%' },
  sheetHandle: { width: 44, height: 4, borderRadius: 2, backgroundColor: '#DDD', alignSelf: 'center', marginBottom: 16 },
  sheetTitle:  { fontFamily: F.black, fontSize: 22, color: colors.textHeading, marginBottom: 16 },
  confirmBox:  { backgroundColor: '#F7F2E8', borderRadius: radius.md, padding: 14, marginBottom: 16 },
  confirmLabel:{ fontFamily: F.semibold, fontSize: 11, color: colors.textMuted, marginBottom: 4 },
  confirmValue:{ fontFamily: F.bold, fontSize: 15, color: colors.textHeading },
  confirmSub:  { fontFamily: F.regular, fontSize: 13, color: colors.textMuted, marginTop: 2 },
  fieldLabel:  { fontFamily: F.semibold, fontSize: 13, color: colors.textBody, marginBottom: 6, marginTop: 6 },
  input:       { backgroundColor: '#F7F2E8', borderRadius: radius.sm, paddingHorizontal: 14, paddingVertical: 11, fontFamily: F.regular, fontSize: 14, color: colors.textBody, marginBottom: 4, borderWidth: 1, borderColor: colors.border },
  submitBtn:   { backgroundColor: colors.greenDark, borderRadius: radius.lg, paddingVertical: 16, alignItems: 'center', marginTop: 14 },
  submitText:  { fontFamily: F.black, fontSize: 16, color: '#fff' },
});
