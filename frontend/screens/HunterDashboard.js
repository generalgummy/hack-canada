import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Switch,
  Image,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';
import { useAuth } from '../context/AuthContext';
import { getDashboardAPI, createListingAPI } from '../services/api';
import { useLocation } from '../hooks/useLocation';
import LocationPill from '../components/LocationPill';
import SkeletonCard from '../components/SkeletonCard';
import OfflineBanner from '../components/OfflineBanner';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import { colors, F, spacing, radius, shadows } from '../theme';

const CATEGORIES = [
  { key: 'meat', label: 'Meat' },
  { key: 'grains', label: 'Grains' },
  { key: 'rice', label: 'Rice' },
  { key: 'vegetables', label: 'Vegetables' },
  { key: 'dry_rations', label: 'Dry Rations' },
  { key: 'other', label: 'Other' },
];
const UNITS = ['kg', 'lbs', 'units', 'cases'];

function StatTile({ value, label, color }) {
  return (
    <View style={[styles.statTile, { backgroundColor: color }]}>
      <Text style={styles.statNum}>{value}</Text>
      <Text style={styles.statLbl}>{label}</Text>
    </View>
  );
}

const DEFAULT_FORM = {
  title: '', category: 'meat', quantity: '', unit: 'kg',
  isDonation: true, price: '', expiryDate: new Date(),
  showDatePicker: false, photo: null, location: '',
};

export default function HunterDashboard({ navigation }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { locationLabel, loading: locLoading, fetchLocation, loadCached } = useLocation();

  const [stats, setStats]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm]           = useState(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);

  // FAB spring animation
  const fabScale = useSharedValue(1);
  const fabStyle = useAnimatedStyle(() => ({ transform: [{ scale: fabScale.value }] }));

  useEffect(() => {
    fetchDashboard();
    loadCached(); // Show cached location immediately
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

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboard();
  }, []);

  const openSheet = async () => {
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch (_) {}
    setForm(f => ({ ...f, location: locationLabel || '' }));
    setSheetOpen(true);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Toast.show({ type: 'error', text1: 'Photo permission denied' });
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.75, allowsEditing: true, aspect: [4, 3],
    });
    if (!res.canceled) setForm(f => ({ ...f, photo: res.assets[0] }));
  };

  const submitListing = async () => {
    if (!form.title.trim()) {
      Toast.show({ type: 'error', text1: 'Add a title for your harvest' });
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title.trim());
      fd.append('category', form.category);
      fd.append('quantity', form.quantity || '1');
      fd.append('unit', form.unit);
      fd.append('isFree', String(form.isDonation));
      if (!form.isDonation && form.price) fd.append('pricePerUnit', form.price);
      fd.append('expirationDate', form.expiryDate.toISOString());
      if (form.location) fd.append('location', form.location);
      if (form.photo) {
        const uri = form.photo.uri;
        const filename = uri.split('/').pop() || 'listing.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const ext = match ? match[1] : 'jpg';
        fd.append('images', {
          uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
          type: `image/${ext}`,
          name: `listing_0.${ext}`,
        });
      }
      await createListingAPI(fd);
      Toast.show({ type: 'success', text1: 'Harvest posted!', text2: 'Your listing is now live.' });
      setSheetOpen(false);
      setForm(DEFAULT_FORM);
      fetchDashboard();
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Could not post listing', text2: e.message });
    } finally {
      setSubmitting(false);
    }
  };

  const recentListings = stats?.recentListings ?? [];
  const recentOrders   = stats?.recentOrders   ?? [];

  const ListHeader = (
    <View>
      <OfflineBanner />
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Good harvest,</Text>
            <Text style={styles.name}>{user?.name || 'Hunter'}</Text>
          </View>
          <LocationPill label={locationLabel} loading={locLoading} onPress={fetchLocation} />
        </View>
        <View style={styles.statsRow}>
          {loading ? (
            <><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
          ) : (
            <>
              <StatTile value={stats?.activeListings ?? 0}  label="Active"   color="#D4EDDA" />
              <StatTile value={stats?.pendingOrders  ?? 0}  label="Pending"  color="#FFF3CD" />
              <StatTile value={stats?.totalOrders    ?? 0}  label="Orders"   color="#E3F2FD" />
            </>
          )}
        </View>
      </View>

      {/* Recent orders section */}
      {recentOrders.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          {recentOrders.map(order => (
            <TouchableOpacity
              key={order._id}
              style={styles.listCard}
              onPress={() => navigation.navigate('OrderDetail', { orderId: order._id })}
              activeOpacity={0.82}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.listTitle}>{order.listing?.title || 'Order'}</Text>
                <Text style={styles.listSub}>Buyer: {order.buyer?.name}</Text>
              </View>
              <StatusBadge status={order.status} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {recentListings.length > 0 && (
        <Text style={[styles.sectionTitle, { paddingHorizontal: 18, marginTop: 20 }]}>My Listings</Text>
      )}
    </View>
  );

  return (
    <View style={styles.root}>
      <FlatList
        data={recentListings}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.listCard}
            onPress={() => navigation.navigate('ListingDetail', { listingId: item._id })}
            activeOpacity={0.82}
          >
            <View style={styles.listCardRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.listTitle}>{item.title}</Text>
                <Text style={styles.listSub}>
                  {(item.quantity - (item.quantityReserved || 0))} {item.unit} remaining
                  {item.expirationDate
                    ? ` · Exp ${new Date(item.expirationDate).toLocaleDateString()}`
                    : ''}
                </Text>
              </View>
              <StatusBadge status={item.status} />
            </View>
          </TouchableOpacity>
        )}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          !loading
            ? <EmptyState icon="leaf-outline" title="No listings yet" subtitle="Tap + to post your first harvest" />
            : null
        }
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.greenDark]} />
        }
      />

      {/* Floating Action Button */}
      <Animated.View style={[styles.fabWrap, fabStyle, { bottom: insets.bottom + 86 }]}>
        <TouchableOpacity
          style={styles.fab}
          onPress={openSheet}
          onPressIn={()  => { fabScale.value = withSpring(0.88, { stiffness: 500 }); }}
          onPressOut={() => { fabScale.value = withSpring(1.0,  { stiffness: 300 }); }}
          activeOpacity={1}
        >
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Post Harvest Bottom Sheet */}
      <Modal visible={sheetOpen} animationType="slide" transparent onRequestClose={() => setSheetOpen(false)}>
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.overlayTap} onPress={() => setSheetOpen(false)} />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.sheet}
          >
            <View style={styles.sheetHandle} />
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.sheetTitle}>Post Harvest</Text>

              <Text style={styles.fieldLabel}>Food Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Fresh Tomatoes"
                placeholderTextColor={colors.textMuted}
                value={form.title}
                onChangeText={v => setForm(f => ({ ...f, title: v }))}
              />

              <Text style={styles.fieldLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                {CATEGORIES.map(c => (
                  <TouchableOpacity
                    key={c.key}
                    style={[styles.chip, form.category === c.key && styles.chipActive]}
                    onPress={() => setForm(f => ({ ...f, category: c.key }))}
                  >
                    <Text style={[styles.chipText, form.category === c.key && styles.chipTextActive]}>{c.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.fieldLabel}>Quantity</Text>
              <View style={styles.qtyRow}>
                <TextInput
                  style={[styles.input, { flex: 1, marginRight: 8, marginBottom: 0 }]}
                  placeholder="Amount"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  inputMode="numeric"
                  value={form.quantity}
                  onChangeText={v => {
                    const cleaned = v.replace(/[^0-9.]/g, '');
                    setForm(f => ({ ...f, quantity: cleaned }));
                  }}
                />
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {UNITS.map(u => (
                    <TouchableOpacity
                      key={u}
                      style={[styles.chip, form.unit === u && styles.chipActive]}
                      onPress={() => setForm(f => ({ ...f, unit: u }))}
                    >
                      <Text style={[styles.chipText, form.unit === u && styles.chipTextActive]}>{u}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.toggleRow}>
                <Text style={styles.fieldLabel}>Free Donation</Text>
                <Switch
                  value={form.isDonation}
                  onValueChange={v => setForm(f => ({ ...f, isDonation: v }))}
                  trackColor={{ true: colors.greenDark, false: '#ccc' }}
                  thumbColor="#fff"
                />
              </View>

              {!form.isDonation && (
                <>
                  <Text style={styles.fieldLabel}>Price (CAD $)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                    inputMode="decimal"
                    value={form.price}
                    onChangeText={v => {
                      const cleaned = v.replace(/[^0-9.]/g, '');
                      setForm(f => ({ ...f, price: cleaned }));
                    }}
                  />
                </>
              )}

              <TouchableOpacity onPress={() => setForm(f => ({ ...f, showDatePicker: true }))}>
                <Text style={styles.fieldLabel}>Expiry Date</Text>
                <View style={[styles.input, { justifyContent: 'center' }]}>
                  <Text style={{ fontFamily: F.regular, color: colors.textBody }}>
                    {form.expiryDate.toLocaleDateString()}
                  </Text>
                </View>
              </TouchableOpacity>
              {form.showDatePicker && (
                <DateTimePicker
                  value={form.expiryDate}
                  mode="date"
                  minimumDate={new Date()}
                  onChange={(_, d) =>
                    setForm(f => ({ ...f, showDatePicker: false, expiryDate: d || f.expiryDate }))
                  }
                />
              )}

              <Text style={styles.fieldLabel}>Location</Text>
              <TextInput
                style={styles.input}
                placeholder="Auto-filled from GPS"
                placeholderTextColor={colors.textMuted}
                value={form.location}
                onChangeText={v => setForm(f => ({ ...f, location: v }))}
              />

              <Text style={styles.fieldLabel}>Photo</Text>
              <TouchableOpacity style={styles.photoPicker} onPress={pickImage} activeOpacity={0.8}>
                {form.photo ? (
                  <Image source={{ uri: form.photo.uri }} style={styles.photoPreview} />
                ) : (
                  <Text style={{ fontFamily: F.semibold, color: colors.greenDark }}>Choose Photo</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
                onPress={submitListing}
                disabled={submitting}
              >
                <Text style={styles.submitText}>{submitting ? 'Posting...' : 'Post Harvest'}</Text>
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
  root:       { flex: 1, backgroundColor: colors.bg },
  header:     { backgroundColor: colors.greenDark, paddingHorizontal: 20, paddingBottom: 24, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  greeting:   { fontFamily: F.regular, fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  name:       { fontFamily: F.black, fontSize: 22, color: '#fff', marginTop: 2 },
  statsRow:   { flexDirection: 'row', gap: 10 },
  statTile:   { flex: 1, borderRadius: radius.md, padding: 14, alignItems: 'center' },
  statNum:    { fontFamily: F.black, fontSize: 24, color: colors.greenDark },
  statLbl:    { fontFamily: F.semibold, fontSize: 11, color: colors.textMuted, marginTop: 2 },
  section:    { paddingHorizontal: 18, marginTop: 18 },
  sectionTitle: { fontFamily: F.bold, fontSize: 16, color: colors.textHeading, marginBottom: 10 },
  listCard:   { marginHorizontal: 18, marginTop: 10, backgroundColor: colors.bgCard, borderRadius: radius.md, padding: 14, ...shadows.card },
  listCardRow:{ flexDirection: 'row', alignItems: 'center', gap: 10 },
  listTitle:  { fontFamily: F.bold,    fontSize: 15, color: colors.textHeading },
  listSub:    { fontFamily: F.regular, fontSize: 12, color: colors.textMuted, marginTop: 3 },
  // FAB
  fabWrap:  { position: 'absolute', right: 22 },
  fab:      { width: 58, height: 58, borderRadius: 29, backgroundColor: colors.yellow, alignItems: 'center', justifyContent: 'center', ...shadows.button },
  fabIcon:  { fontSize: 30, color: colors.greenDark, fontFamily: F.black, lineHeight: 34 },
  // Sheet
  overlay:     { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.42)' },
  overlayTap:  { flex: 1 },
  sheet:       { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 12, maxHeight: '92%' },
  sheetHandle: { width: 44, height: 4, borderRadius: 2, backgroundColor: '#DDD', alignSelf: 'center', marginBottom: 16 },
  sheetTitle:  { fontFamily: F.black, fontSize: 22, color: colors.textHeading, marginBottom: 16 },
  fieldLabel:  { fontFamily: F.semibold, fontSize: 13, color: colors.textBody, marginBottom: 6, marginTop: 6 },
  input:       { backgroundColor: '#F7F2E8', borderRadius: radius.sm, paddingHorizontal: 14, paddingVertical: 11, fontFamily: F.regular, fontSize: 14, color: colors.textBody, marginBottom: 4, borderWidth: 1, borderColor: colors.border },
  chip:        { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.pill, backgroundColor: '#EDEDED', marginRight: 8 },
  chipActive:  { backgroundColor: colors.greenDark },
  chipText:    { fontFamily: F.semibold, fontSize: 12, color: colors.textBody },
  chipTextActive: { color: '#fff' },
  qtyRow:      { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  toggleRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 8 },
  photoPicker: { backgroundColor: '#F7F2E8', borderRadius: radius.md, height: 100, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, marginBottom: 8, overflow: 'hidden' },
  photoPreview:{ width: '100%', height: '100%' },
  submitBtn:   { backgroundColor: colors.greenDark, borderRadius: radius.lg, paddingVertical: 16, alignItems: 'center', marginTop: 14 },
  submitText:  { fontFamily: F.black, fontSize: 16, color: '#fff' },
});
