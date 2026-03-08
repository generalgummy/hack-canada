import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getMyOrdersAPI } from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import OrderCard from '../components/OrderCard';

const OrdersScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const fetchOrders = async () => {
    try {
      const params = {};
      if (activeTab !== 'all') params.status = activeTab;
      const res = await getMyOrdersAPI(params);
      setOrders(res.data.orders);
    } catch (error) {
      console.log('Orders error:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchOrders();
  }, [activeTab]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders();
  }, [activeTab]);

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'in_transit', label: 'In Transit' },
    { key: 'delivered', label: 'Delivered' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Orders</Text>
        <View style={styles.tabRow}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2A5C2A" />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              onPress={() => navigation.navigate('OrderDetail', { orderId: item._id })}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2A5C2A']} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="cube-outline" size={56} color="#2A5C2A" style={{ marginBottom: 8, opacity: 0.5 }} />
              <Text style={styles.emptyText}>No orders yet</Text>
            </View>
          }
          contentContainerStyle={orders.length === 0 && { flex: 1 }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5E6C8' },
  header: {
    paddingTop: 60, paddingHorizontal: 20, paddingBottom: 10,
    backgroundColor: '#2A5C2A', borderBottomWidth: 0,
  },
  title: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', marginBottom: 12, fontFamily: 'Nunito_800ExtraBold' },
  tabRow: { flexDirection: 'row', gap: 6 },
  tab: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  tabActive: { backgroundColor: '#F5C200' },
  tabText: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '500', fontFamily: 'Nunito_400Regular' },
  tabTextActive: { color: '#1A1A1A', fontWeight: '700', fontFamily: 'Nunito_400Regular' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#7A7A7A', fontFamily: 'Nunito_400Regular' },
});

export default OrdersScreen;
