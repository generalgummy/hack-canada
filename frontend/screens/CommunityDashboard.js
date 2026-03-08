import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, TextInput, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useAuth } from '../context/AuthContext';
import { getDashboardAPI, createOrderAPI } from '../services/api';
import { useLocation } from '../hooks/useLocation';
import LocationPill from '../components/LocationPill';
import OfflineBanner from '../components/OfflineBanner';
import SkeletonCard from '../components/SkeletonCard';
import StatusBadge from '../components/StatusBadge';
import { colors, F, radius, shadows, urgency as U } from '../theme';

const URGENCIES = ['low', 'medium', 'critical'];
const DEFAULT_FORM = { supplyType: '', quantity: '', urgencyLevel: 'medium', notes: '', location: '' };

function StatTile({ value, label, color }) {
  return (
    <View style={[styles.statTile, { backgroundColor: color }]}>
      <Text style={styles.statNum}>{value}</Text>
      <Text style={styles.statLbl}>{label}</Text>
    </View>
  );
}

export default function CommunityDashboard({ navigation }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { locationLabel, loading: locLoading, fetchLocation, loadCached } = useLocation();

  const [stats, setStats]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sheetOpen, setSheetOpen]   = useState(false);
  const [form, setForm]             = useState(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDashboard();
    loadCached();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await getDashboardAPI();
      setStats(res.data.stats);
    } catch (e) {
      console.log('Dashboard error:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => { setRefreshing(true); fetchDashboard(); }, []);

  const openSheet = () => {
    setForm(f => ({ ...f, location: locationLabel || '' }));
    setSheetOpen(true);
  };

  const submitRequest = async () => {
    if (!form.supplyType.trim()) {
      Toast.show({ type: 'error', text1: 'Specify the supply type' });
      return;
    }
    setSubmitting(true);
    try {
      await createOrderAPI({
        type: 'supply_request',
        supplyType: form.supplyType,
        quantity: form.quantity,
        urgency: form.urgencyLevel,
        notes: form.notes,
        location: form.location,
      });
      Toast.show({ type: 'success', text1: 'Request submitted!', text2: 'Suppliers will be notified.' });
      setSheetOpen(false);
      setForm(DEFAULT_FORM);
      fetchDashboard();
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Could not submit request', text2: e.message });
    } finally {
      setSubmitting(false);
    }
  };

  const recentOrders = stats?.recentOrders ?? [];

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.greenDark]} />}
      >
        <OfflineBanner />

        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.name}>{user?.name || 'Community'}</Text>
            </View>
            <LocationPill label={locationLabel} loading={locLoading} onPress={fetchLocation} />
          </View>
          <View style={styles.statsRow}>
            {loading ? (
              <><SkeletonCard /><SkeletonCard /></>
            ) : (
              <>
                <StatTile value={stats?.pendingOrders  ?? 0} label="Pending"  color="#FFF3CD" />
                <StatTile value={stats?.totalOrders    ?? 0} label="Total"    color="#E3F2FD" />
                <StatTile value={stats?.completedOrders ?? 0} label="Done"   color="#D4EDDA" />
              </>
            )}
          </View>
        </View>

        {/* Action Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What do you need?</Text>

          <TouchableOpacity
            style={styles.actionCardDark}
            onPress={() => navigation.navigate('Listings')}
            activeOpacity={0.85}
          >
            <Ionicons name="storefront" size={26} color={colors.yellow} />
            <View style={{ flex: 1 }}>
              <Text style={styles.actionCardTitleWhite}>Browse Hunter Listings</Text>
              <Text style={styles.actionCardSubWhite}>Fresh food available near you</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.45)" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCardLight}
            onPress={openSheet}
            activeOpacity={0.85}
          >
            <Ionicons name="cube" size={26} color={colors.greenDark} />
            <View style={{ flex: 1 }}>
              <Text style={styles.actionCardTitleDark}>Request Bulk Supplies</Text>
              <Text style={styles.actionCardSubDark}>Submit a supply request to suppliers</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.greenDark} />
          </TouchableOpacity>
        </View>

        {/* Recent Orders */}
        {recentOrders.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            {recentOrders.map(order => (
              <TouchableOpacity
                key={order._id}
                style={styles.orderCard}
                onPress={() => navigation.navigate('OrderDetail', { orderId: order._id })}
                activeOpacity={0.82}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.orderTitle}>{order.listing?.title || 'Supply Request'}</Text>
                  <Text style={styles.orderSub}>{new Date(order.createdAt).toLocaleDateString()}</Text>
                </View>
                <StatusBadge status={order.status} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Supply Request Bottom Sheet */}
      <Modal visible={sheetOpen} animationType="slide" transparent onRequestClose={() => setSheetOpen(false)}>
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.overlayTap} onPress={() => setSheetOpen(false)} />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.sheetTitle}>Request Bulk Supplies</Text>

              <Text style={styles.fieldLabel}>Supply Type *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Canned Goods, Flour, Rice"
                placeholderTextColor={colors.textMuted}
                value={form.supplyType}
                onChangeText={v => setForm(f => ({ ...f, supplyType: v }))}
              />

              <Text style={styles.fieldLabel}>Quantity</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 50 boxes"
                placeholderTextColor={colors.textMuted}
                value={form.quantity}
                onChangeText={v => setForm(f => ({ ...f, quantity: v }))}
              />

              <Text style={styles.fieldLabel}>Urgency</Text>
              <View style={styles.chipRow}>
                {URGENCIES.map(lvl => {
                  const sel = form.urgencyLevel === lvl;
                  const urg = U[lvl];
                  return (
                    <TouchableOpacity
                      key={lvl}
                      style={[styles.chip, { backgroundColor: sel ? urg.bg : '#EDEDED', borderWidth: sel ? 1.5 : 0, borderColor: urg.text }]}
                      onPress={() => setForm(f => ({ ...f, urgencyLevel: lvl }))}
                    >
                      <Text style={[styles.chipText, { color: sel ? urg.text : colors.textBody }]}>
                        {urg.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.fieldLabel}>Notes</Text>
              <TextInput
                style={[styles.input, { height: 88, textAlignVertical: 'top' }]}
                placeholder="Additional details..."
                placeholderTextColor={colors.textMuted}
                multiline
                value={form.notes}
                onChangeText={v => setForm(f => ({ ...f, notes: v }))}
              />

              <Text style={styles.fieldLabel}>Location</Text>
              <TextInput
                style={styles.input}
                placeholder="Auto-filled from GPS"
                placeholderTextColor={colors.textMuted}
                value={form.location}
                onChangeText={v => setForm(f => ({ ...f, location: v }))}
              />

              <TouchableOpacity
                style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
                onPress={submitRequest}
                disabled={submitting}
              >
                <Text style={styles.submitText}>{submitting ? 'Submitting...' : 'Submit Request'}</Text>
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
  header:      { backgroundColor: colors.greenDark, paddingHorizontal: 20, paddingBottom: 24, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  greeting:    { fontFamily: F.regular, fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  name:        { fontFamily: F.black, fontSize: 22, color: '#fff', marginTop: 2 },
  statsRow:    { flexDirection: 'row', gap: 10 },
  statTile:    { flex: 1, borderRadius: radius.md, padding: 14, alignItems: 'center' },
  statNum:     { fontFamily: F.black, fontSize: 24, color: colors.greenDark },
  statLbl:     { fontFamily: F.semibold, fontSize: 11, color: colors.textMuted, marginTop: 2 },
  section:     { paddingHorizontal: 18, marginTop: 22 },
  sectionTitle:{ fontFamily: F.bold, fontSize: 16, color: colors.textHeading, marginBottom: 12 },
  actionCardDark:  { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: radius.lg, padding: 18, marginBottom: 12, backgroundColor: colors.greenDark },
  actionCardLight: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: radius.lg, padding: 18, marginBottom: 12, backgroundColor: '#FFF8ED', borderWidth: 1.5, borderColor: colors.yellow },
  actionCardTitleWhite: { fontFamily: F.bold, fontSize: 15, color: '#fff', marginBottom: 3 },
  actionCardSubWhite:   { fontFamily: F.regular, fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  actionCardTitleDark:  { fontFamily: F.bold, fontSize: 15, color: colors.greenDark, marginBottom: 3 },
  actionCardSubDark:    { fontFamily: F.regular, fontSize: 12, color: colors.textMuted },
  orderCard:   { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgCard, borderRadius: radius.md, padding: 14, marginBottom: 10, ...shadows.card },
  orderTitle:  { fontFamily: F.bold, fontSize: 14, color: colors.textHeading },
  orderSub:    { fontFamily: F.regular, fontSize: 12, color: colors.textMuted, marginTop: 2 },
  // Sheet
  overlay:     { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.42)' },
  overlayTap:  { flex: 1 },
  sheet:       { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 12, maxHeight: '90%' },
  sheetHandle: { width: 44, height: 4, borderRadius: 2, backgroundColor: '#DDD', alignSelf: 'center', marginBottom: 16 },
  sheetTitle:  { fontFamily: F.black, fontSize: 22, color: colors.textHeading, marginBottom: 16 },
  fieldLabel:  { fontFamily: F.semibold, fontSize: 13, color: colors.textBody, marginBottom: 6, marginTop: 6 },
  input:       { backgroundColor: '#F7F2E8', borderRadius: radius.sm, paddingHorizontal: 14, paddingVertical: 11, fontFamily: F.regular, fontSize: 14, color: colors.textBody, marginBottom: 4, borderWidth: 1, borderColor: colors.border },
  chipRow:     { flexDirection: 'row', gap: 8, marginBottom: 10 },
  chip:        { paddingHorizontal: 16, paddingVertical: 9, borderRadius: radius.pill },
  chipText:    { fontFamily: F.semibold, fontSize: 13 },
  submitBtn:   { backgroundColor: colors.greenDark, borderRadius: radius.lg, paddingVertical: 16, alignItems: 'center', marginTop: 14 },
  submitText:  { fontFamily: F.black, fontSize: 16, color: '#fff' },
});
