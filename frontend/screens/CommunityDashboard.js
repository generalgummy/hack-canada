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

const CommunityDashboard = ({ navigation }) => {
  const { user } = useAuth();
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
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome back,</Text>
        <Text style={styles.name}>{user?.name} 🏘️</Text>
        {user?.organizationType && (
          <Text style={styles.orgType}>
            {user.organizationType.charAt(0).toUpperCase() + user.organizationType.slice(1)}
            {user.communitySize ? ` • ${user.communitySize} members` : ''}
          </Text>
        )}
      </View>

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
          <Text style={styles.statNumber}>{stats?.availableListings || 0}</Text>
          <Text style={styles.statLabel}>Available Food</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
          <Text style={styles.statNumber}>{stats?.pendingDeliveries || 0}</Text>
          <Text style={styles.statLabel}>Pending Deliveries</Text>
        </View>
      </View>
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
          <Text style={styles.statNumber}>{stats?.totalOrders || 0}</Text>
          <Text style={styles.statLabel}>Total Orders</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#F3E5F5' }]}>
          <Text style={styles.statNumber}>{stats?.completedOrders || 0}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Listings')}
          >
            <Text style={styles.actionIcon}>🛒</Text>
            <Text style={styles.actionTextWhite}>Browse Available Food</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButtonAlt}
            onPress={() => navigation.navigate('Listings')}
          >
            <Text style={styles.actionIcon}>📍</Text>
            <Text style={styles.actionText}>Find Nearby Suppliers</Text>
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
                  From: {order.seller?.name} • {order.quantityRequested} {order.unit}
                </Text>
              </View>
              <StatusBadge status={order.status} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F9F5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  greeting: { fontSize: 16, color: '#666' },
  name: { fontSize: 26, fontWeight: '800', color: '#1B5E20' },
  orgType: { fontSize: 13, color: '#888', marginTop: 4 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 10 },
  statCard: { flex: 1, borderRadius: 14, padding: 18, alignItems: 'center' },
  statNumber: { fontSize: 28, fontWeight: '800', color: '#333' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 4, fontWeight: '500' },
  section: { paddingHorizontal: 20, marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 12 },
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionButton: {
    flex: 1, backgroundColor: '#2E7D32', borderRadius: 12, paddingVertical: 16, alignItems: 'center',
  },
  actionButtonAlt: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12, paddingVertical: 16, alignItems: 'center',
    borderWidth: 1, borderColor: '#2E7D32',
  },
  actionIcon: { fontSize: 20, marginBottom: 4 },
  actionText: { fontSize: 13, fontWeight: '600', color: '#333' },
  actionTextWhite: { fontSize: 13, fontWeight: '600', color: '#fff' },
  listItem: {
    backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2,
  },
  listItemContent: { flex: 1, marginRight: 10 },
  listItemTitle: { fontSize: 14, fontWeight: '600', color: '#333' },
  listItemSub: { fontSize: 12, color: '#888', marginTop: 2 },
});

export default CommunityDashboard;
