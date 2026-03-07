import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getDashboardAPI } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import ResponsiveContainer from '../components/ResponsiveContainer';
import { useResponsive } from '../hooks/useResponsive';

const HunterDashboard = ({ navigation }) => {
  const { user } = useAuth();
  const { isDesktop, spacing, fontSize } = useResponsive();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await getDashboardAPI();
      setStats(res.data.stats);
    } catch (error) {
      console.log('Dashboard error:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2E7D32']} />}
      showsVerticalScrollIndicator={true}
    >
      <ResponsiveContainer>
        <View style={[styles.header, { marginTop: spacing.lg, paddingHorizontal: isDesktop ? 0 : spacing.md }]}>
          <Text style={[styles.greeting, { fontSize: fontSize.lg }]}>Welcome back,</Text>
          <Text style={[styles.name, { fontSize: fontSize.xxl, marginTop: spacing.sm }]}>{user?.name} 🏹</Text>
        </View>

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
          <Text style={styles.statNumber}>{stats?.activeListings || 0}</Text>
          <Text style={styles.statLabel}>Active Listings</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
          <Text style={styles.statNumber}>{stats?.pendingOrders || 0}</Text>
          <Text style={styles.statLabel}>Pending Orders</Text>
        </View>
      </View>
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
          <Text style={styles.statNumber}>{stats?.totalOrders || 0}</Text>
          <Text style={styles.statLabel}>Total Orders</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#F3E5F5' }]}>
          <Text style={styles.statNumber}>{stats?.deliveredOrders || 0}</Text>
          <Text style={styles.statLabel}>Delivered</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('CreateListing')}
          >
            <Text style={styles.actionIcon}>➕</Text>
            <Text style={styles.actionText}>Post New Harvest</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButtonAlt}
            onPress={() => navigation.navigate('Orders')}
          >
            <Text style={styles.actionIcon}>📦</Text>
            <Text style={styles.actionText}>View All Orders</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Orders */}
      {stats?.recentOrders?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          {stats.recentOrders.map((order) => (
            <TouchableOpacity
              key={order._id}
              style={styles.listItem}
              onPress={() => navigation.navigate('OrderDetail', { orderId: order._id })}
            >
              <View style={styles.listItemContent}>
                <Text style={styles.listItemTitle}>{order.listing?.title || 'Order'}</Text>
                <Text style={styles.listItemSub}>
                  Buyer: {order.buyer?.name} • {order.buyer?.location}
                </Text>
              </View>
              <StatusBadge status={order.status} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Recent Listings */}
      {stats?.recentListings?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Listings</Text>
          {stats.recentListings.map((listing) => (
            <TouchableOpacity
              key={listing._id}
              style={styles.listItem}
              onPress={() => navigation.navigate('ListingDetail', { listingId: listing._id })}
            >
              <View style={styles.listItemContent}>
                <Text style={styles.listItemTitle}>{listing.title}</Text>
                <Text style={styles.listItemSub}>
                  {listing.quantity - (listing.quantityReserved || 0)} {listing.unit} remaining
                  {listing.expirationDate &&
                    ` • Exp: ${new Date(listing.expirationDate).toLocaleDateString()}`}
                </Text>
              </View>
              <StatusBadge status={listing.status} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={{ height: 30 }} />
      </ResponsiveContainer>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F9F5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  greeting: { fontSize: 16, color: '#666' },
  name: { fontSize: 26, fontWeight: '800', color: '#1B5E20' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 10 },
  statCard: {
    flex: 1,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
  },
  statNumber: { fontSize: 28, fontWeight: '800', color: '#333' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 4, fontWeight: '500' },
  section: { paddingHorizontal: 20, marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 12 },
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionButton: {
    flex: 1,
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  actionButtonAlt: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2E7D32',
  },
  actionIcon: { fontSize: 20, marginBottom: 4 },
  actionText: { fontSize: 13, fontWeight: '600', color: '#333' },
  listItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  listItemContent: { flex: 1, marginRight: 10 },
  listItemTitle: { fontSize: 14, fontWeight: '600', color: '#333' },
  listItemSub: { fontSize: 12, color: '#888', marginTop: 2 },
});

export default HunterDashboard;
