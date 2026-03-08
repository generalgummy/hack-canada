import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Ionicons } from '@expo/vector-icons';

// ==========================================
// Tab Constants
// ==========================================
const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'users', label: 'Users' },
  { key: 'listings', label: 'Listings' },
  { key: 'orders', label: 'Orders' },
  { key: 'message', label: 'Message' },
];

// ==========================================
// Main Admin Dashboard
// ==========================================
const AdminDashboard = () => {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabBar}
        contentContainerStyle={styles.tabBarContent}
      >
        {TABS.map((tab) => (
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
      </ScrollView>

      {/* Tab Content */}
      <View style={styles.content}>
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'listings' && <ListingsTab />}
        {activeTab === 'orders' && <OrdersTab />}
        {activeTab === 'message' && <MessageTab />}
      </View>
    </View>
  );
};

// ==========================================
// Overview Tab
// ==========================================
const OverviewTab = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to load stats');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (loading) return <Loader />;

  const s = stats;

  return (
    <ScrollView
      contentContainerStyle={styles.scrollPad}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchStats(); }} colors={['#2A5C2A']} tintColor="#2A5C2A" />}
    >
      {/* Stat Cards */}
      <Text style={styles.sectionTitle}>Platform Overview</Text>
      <View style={styles.statGrid}>
        <StatCard label="Total Users" value={s?.users?.total} color="#2A5C2A" />
        <StatCard label="Active Users" value={s?.users?.active} color="#3D7A3D" />
        <StatCard label="Hunters" value={s?.users?.hunters} color="#E8834A" />
        <StatCard label="Communities" value={s?.users?.communities} color="#4A90D9" />
        <StatCard label="Suppliers" value={s?.users?.suppliers} color="#9B59B6" />
        <StatCard label="Total Listings" value={s?.listings?.total} color="#2A5C2A" />
        <StatCard label="Active Listings" value={s?.listings?.active} color="#3D7A3D" />
        <StatCard label="Total Orders" value={s?.orders?.total} color="#E05252" />
        <StatCard label="Pending Orders" value={s?.orders?.pending} color="#F5C200" />
        <StatCard label="Messages" value={s?.messages?.total} color="#4A90D9" />
      </View>

      {/* Recent Users */}
      <Text style={styles.sectionTitle}>Recent Users</Text>
      {s?.recent?.users?.map((u) => (
        <View key={u._id} style={styles.recentRow}>
          <Text style={styles.recentName}>{u.name}</Text>
          <Text style={styles.recentMeta}>{u.userType} · {u.isActive ? 'Active' : 'Inactive'}</Text>
        </View>
      ))}

      {/* Recent Listings */}
      <Text style={styles.sectionTitle}>Recent Listings</Text>
      {s?.recent?.listings?.map((l) => (
        <View key={l._id} style={styles.recentRow}>
          <Text style={styles.recentName}>{l.title}</Text>
          <Text style={styles.recentMeta}>{l.category} · {l.status}</Text>
        </View>
      ))}

      {/* Recent Orders */}
      <Text style={styles.sectionTitle}>Recent Orders</Text>
      {s?.recent?.orders?.map((o) => (
        <View key={o._id} style={styles.recentRow}>
          <Text style={styles.recentName}>{o.buyer?.name || 'N/A'} {'\u2192'} {o.seller?.name || 'N/A'}</Text>
          <Text style={styles.recentMeta}>{o.status} · ${o.totalPrice ?? 0}</Text>
        </View>
      ))}
    </ScrollView>
  );
};

// ==========================================
// Users Tab
// ==========================================
const UsersTab = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [editUser, setEditUser] = useState(null);
  const [resetPwUser, setResetPwUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      if (filterType) params.userType = filterType;
      const res = await api.get('/admin/users', { params });
      setUsers(res.data.users);
      setTotalPages(res.data.pages);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [search, filterType, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleDeleteUser = (user) => {
    Alert.alert(
      'Delete User',
      `Delete "${user.name}" and all their data? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/admin/users/${user._id}`);
              Alert.alert('Done', 'User deleted');
              fetchUsers();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Delete failed');
            }
          },
        },
      ]
    );
  };

  const handleSaveUser = async () => {
    try {
      const res = await api.put(`/admin/users/${editUser._id}`, editUser);
      Alert.alert('Done', 'User updated');
      setEditUser(null);
      fetchUsers();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Update failed');
    }
  };

  const handleResetPassword = async () => {
    try {
      await api.put(`/admin/users/${resetPwUser._id}/reset-password`, { newPassword });
      Alert.alert('Done', 'Password has been reset');
      setResetPwUser(null);
      setNewPassword('');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Reset failed');
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Search + Filter */}
      <View style={styles.searchRow}>
        <TextInput
          style={[styles.searchInput, { flex: 1 }]}
          placeholder="Search name, email, phone..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={(t) => { setSearch(t); setPage(1); }}
        />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 44, marginBottom: 8 }}>
        {['', 'hunter', 'community', 'supplier'].map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.filterChip, filterType === t && styles.filterChipActive]}
            onPress={() => { setFilterType(t); setPage(1); }}
          >
            <Text style={[styles.filterChipText, filterType === t && styles.filterChipTextActive]}>
              {t || 'All'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <Loader />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollPad}>
          {users.map((u) => (
            <View key={u._id} style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardName}>{u.name}{u.isAdmin ? ' [Admin]' : ''}</Text>
                <Text style={styles.cardMeta}>{u.email}</Text>
                <Text style={styles.cardMeta}>{u.phone} · {u.userType || 'N/A'} · {u.isActive ? 'Active' : 'Inactive'}</Text>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => setEditUser({ ...u })}>
                  <Ionicons name="pencil-outline" size={16} color="#4A90D9" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => setResetPwUser(u)}>
                  <Ionicons name="lock-closed-outline" size={16} color="#2A5C2A" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FFEBEE' }]} onPress={() => handleDeleteUser(u)}>
                  <Ionicons name="trash-outline" size={16} color="#E05252" />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <View style={styles.pagination}>
              <TouchableOpacity disabled={page <= 1} onPress={() => setPage(page - 1)} style={[styles.pageBtn, page <= 1 && { opacity: 0.4 }]}>
                <Text style={styles.pageBtnText}>{'\u2190'} Prev</Text>
              </TouchableOpacity>
              <Text style={styles.pageInfo}>{page} / {totalPages}</Text>
              <TouchableOpacity disabled={page >= totalPages} onPress={() => setPage(page + 1)} style={[styles.pageBtn, page >= totalPages && { opacity: 0.4 }]}>
                <Text style={styles.pageBtnText}>Next {'\u2192'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}

      {/* Edit User Modal */}
      <Modal visible={!!editUser} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit User</Text>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput style={styles.modalInput} value={editUser?.name || ''} onChangeText={(t) => setEditUser({ ...editUser, name: t })} />
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput style={styles.modalInput} value={editUser?.email || ''} onChangeText={(t) => setEditUser({ ...editUser, email: t })} keyboardType="email-address" autoCapitalize="none" />
            <Text style={styles.inputLabel}>Phone</Text>
            <TextInput style={styles.modalInput} value={editUser?.phone || ''} onChangeText={(t) => setEditUser({ ...editUser, phone: t })} keyboardType="phone-pad" />
            <Text style={styles.inputLabel}>Location</Text>
            <TextInput style={styles.modalInput} value={editUser?.location || ''} onChangeText={(t) => setEditUser({ ...editUser, location: t })} />
            <Text style={styles.inputLabel}>User Type</Text>
            <View style={styles.chipRow}>
              {['hunter', 'community', 'supplier'].map((t) => (
                <TouchableOpacity key={t} style={[styles.filterChip, editUser?.userType === t && styles.filterChipActive]} onPress={() => setEditUser({ ...editUser, userType: t })}>
                  <Text style={[styles.filterChipText, editUser?.userType === t && styles.filterChipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.inputLabel}>Status</Text>
            <View style={styles.chipRow}>
              <TouchableOpacity style={[styles.filterChip, editUser?.isActive && styles.filterChipActive]} onPress={() => setEditUser({ ...editUser, isActive: true })}>
                <Text style={[styles.filterChipText, editUser?.isActive && styles.filterChipTextActive]}>Active</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.filterChip, !editUser?.isActive && { backgroundColor: '#FFEBEE', borderColor: '#E53935' }]} onPress={() => setEditUser({ ...editUser, isActive: false })}>
                <Text style={[styles.filterChipText, !editUser?.isActive && { color: '#E53935' }]}>Inactive</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#eee' }]} onPress={() => setEditUser(null)}>
                <Text style={{ fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#2A5C2A' }]} onPress={handleSaveUser}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reset Password Modal */}
      <Modal visible={!!resetPwUser} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Reset Password</Text>
            <Text style={styles.cardMeta}>For: {resetPwUser?.name} ({resetPwUser?.email})</Text>
            <TextInput
              style={[styles.modalInput, { marginTop: 16 }]}
              placeholder="New password (min 6 chars)"
              placeholderTextColor="#999"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#eee' }]} onPress={() => { setResetPwUser(null); setNewPassword(''); }}>
                <Text style={{ fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#E05252' }]} onPress={handleResetPassword}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>Reset Password</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ==========================================
// Listings Tab
// ==========================================
const ListingsTab = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      const res = await api.get('/admin/listings', { params });
      setListings(res.data.listings);
      setTotalPages(res.data.pages);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to load listings');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const handleDelete = (listing) => {
    Alert.alert(
      'Delete Listing',
      `Delete "${listing.title}"? Pending orders will be cancelled.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/admin/listings/${listing._id}`);
              Alert.alert('Done', 'Listing deleted');
              fetchListings();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Delete failed');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.searchRow}>
        <TextInput
          style={[styles.searchInput, { flex: 1 }]}
          placeholder="Search listings..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={(t) => { setSearch(t); setPage(1); }}
        />
      </View>

      {loading ? (
        <Loader />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollPad}>
          {listings.map((l) => (
            <View key={l._id} style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardName}>{l.title}</Text>
                <Text style={styles.cardMeta}>
                  {l.category} · {l.status} · by {l.seller?.name || 'Unknown'}
                </Text>
                <Text style={styles.cardMeta}>
                  {l.quantity} {l.unit} · {l.isFree ? 'Free' : `$${l.pricePerUnit}/${l.unit}`}
                </Text>
              </View>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FFEBEE' }]} onPress={() => handleDelete(l)}>
                <Ionicons name="trash-outline" size={16} color="#E05252" />
              </TouchableOpacity>
            </View>
          ))}

          {totalPages > 1 && (
            <View style={styles.pagination}>
              <TouchableOpacity disabled={page <= 1} onPress={() => setPage(page - 1)} style={[styles.pageBtn, page <= 1 && { opacity: 0.4 }]}>
                <Text style={styles.pageBtnText}>{'\u2190'} Prev</Text>
              </TouchableOpacity>
              <Text style={styles.pageInfo}>{page} / {totalPages}</Text>
              <TouchableOpacity disabled={page >= totalPages} onPress={() => setPage(page + 1)} style={[styles.pageBtn, page >= totalPages && { opacity: 0.4 }]}>
                <Text style={styles.pageBtnText}>Next {'\u2192'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

// ==========================================
// Orders Tab
// ==========================================
const OrdersTab = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/admin/orders', { params });
      setOrders(res.data.orders);
      setTotalPages(res.data.pages);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const ORDER_STATUSES = ['', 'pending', 'confirmed', 'in_transit', 'delivered', 'cancelled'];

  return (
    <View style={{ flex: 1 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 44, marginBottom: 8 }}>
        {ORDER_STATUSES.map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.filterChip, statusFilter === s && styles.filterChipActive]}
            onPress={() => { setStatusFilter(s); setPage(1); }}
          >
            <Text style={[styles.filterChipText, statusFilter === s && styles.filterChipTextActive]}>
              {s || 'All'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <Loader />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollPad}>
          {orders.map((o) => (
            <View key={o._id} style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardName}>{o.listing?.title || 'Deleted Listing'}</Text>
                <Text style={styles.cardMeta}>
                  Buyer: {o.buyer?.name || 'N/A'} {'\u2192'} Seller: {o.seller?.name || 'N/A'}
                </Text>
                <Text style={styles.cardMeta}>
                  {o.quantityRequested} {o.unit} · ${o.totalPrice ?? 0} · {o.status}
                </Text>
              </View>
            </View>
          ))}

          {totalPages > 1 && (
            <View style={styles.pagination}>
              <TouchableOpacity disabled={page <= 1} onPress={() => setPage(page - 1)} style={[styles.pageBtn, page <= 1 && { opacity: 0.4 }]}>
                <Text style={styles.pageBtnText}>{'\u2190'} Prev</Text>
              </TouchableOpacity>
              <Text style={styles.pageInfo}>{page} / {totalPages}</Text>
              <TouchableOpacity disabled={page >= totalPages} onPress={() => setPage(page + 1)} style={[styles.pageBtn, page >= totalPages && { opacity: 0.4 }]}>
                <Text style={styles.pageBtnText}>Next {'\u2192'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

// ==========================================
// Message Tab (contact any user)
// ==========================================
const MessageTab = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);

  const searchUsers = useCallback(async () => {
    if (!search.trim()) { setUsers([]); return; }
    setLoading(true);
    try {
      const res = await api.get('/admin/users', { params: { search, limit: 10 } });
      setUsers(res.data.users);
    } catch (err) {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(searchUsers, 400);
    return () => clearTimeout(timer);
  }, [searchUsers]);

  const handleSend = async () => {
    if (!selectedUser || !messageText.trim()) {
      Alert.alert('Error', 'Please select a user and type a message');
      return;
    }
    setSending(true);
    try {
      await api.post('/admin/message', {
        recipientId: selectedUser._id,
        content: messageText.trim(),
      });
      Alert.alert('Sent', `Message sent to ${selectedUser.name}`);
      setMessageText('');
      setSelectedUser(null);
      setSearch('');
      setUsers([]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollPad}>
      <Text style={styles.sectionTitle}>Contact a User</Text>

      {/* Recipient search */}
      <TextInput
        style={styles.searchInput}
        placeholder="Search for a user by name, email, or phone..."
        placeholderTextColor="#999"
        value={search}
        onChangeText={(t) => { setSearch(t); setSelectedUser(null); }}
      />

      {loading && <ActivityIndicator style={{ marginVertical: 8 }} color="#2A5C2A" />}

      {!selectedUser && users.map((u) => (
        <TouchableOpacity key={u._id} style={styles.userPickRow} onPress={() => { setSelectedUser(u); setSearch(u.name); setUsers([]); }}>
          <Text style={styles.cardName}>{u.name}</Text>
          <Text style={styles.cardMeta}>{u.email} · {u.userType}</Text>
        </TouchableOpacity>
      ))}

      {selectedUser && (
        <View style={[styles.card, { backgroundColor: '#D4EDDA', marginTop: 8 }]}>
          <Text style={styles.cardName}>To: {selectedUser.name}</Text>
          <Text style={styles.cardMeta}>{selectedUser.email}</Text>
        </View>
      )}

      {/* Message input */}
      <TextInput
        style={[styles.searchInput, { height: 120, textAlignVertical: 'top', marginTop: 16 }]}
        placeholder="Type your message..."
        placeholderTextColor="#999"
        value={messageText}
        onChangeText={setMessageText}
        multiline
      />

      <TouchableOpacity
        style={[styles.sendBtn, (!selectedUser || !messageText.trim() || sending) && { opacity: 0.5 }]}
        onPress={handleSend}
        disabled={!selectedUser || !messageText.trim() || sending}
      >
        {sending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.sendBtnText}>Send Message</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

// ==========================================
// Shared Components
// ==========================================
const Loader = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 }}>
    <ActivityIndicator size="large" color="#2A5C2A" />
  </View>
);

const StatCard = ({ label, value, color }) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <Text style={[styles.statValue, { color }]}>{value ?? '-'}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// ==========================================
// Styles
// ==========================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5E6C8',
  },
  header: {
    backgroundColor: '#2A5C2A',
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    fontFamily: 'Nunito_800ExtraBold',
  },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  logoutText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
  },
  tabBar: {
    backgroundColor: '#FAF0DC',
    borderBottomWidth: 1,
    borderBottomColor: '#D0C4A8',
    maxHeight: 48,
  },
  tabBarContent: {
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 4,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#2A5C2A',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7A7A7A',
    fontFamily: 'Nunito_400Regular',
  },
  tabTextActive: {
    color: '#2A5C2A',
  },
  content: {
    flex: 1,
  },
  scrollPad: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
    marginTop: 8,
    fontFamily: 'Nunito_800ExtraBold',
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#FAF0DC',
    borderRadius: 20,
    padding: 16,
    minWidth: 140,
    flex: 1,
    borderLeftWidth: 4,
    shadowColor: '#2A5C2A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    fontFamily: 'Nunito_800ExtraBold',
  },
  statLabel: {
    fontSize: 12,
    color: '#7A7A7A',
    marginTop: 4,
    fontWeight: '500',
    fontFamily: 'Nunito_400Regular',
  },
  recentRow: {
    backgroundColor: '#FAF0DC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Nunito_400Regular',
  },
  recentMeta: {
    fontSize: 12,
    color: '#7A7A7A',
    fontFamily: 'Nunito_400Regular',
  },
  searchRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
    flexDirection: 'row',
    gap: 8,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#D0C4A8',
    color: '#3A3A3A',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FAF0DC',
    borderWidth: 1,
    borderColor: '#D0C4A8',
    marginLeft: 8,
    marginTop: 8,
  },
  filterChipActive: {
    backgroundColor: '#2A5C2A',
    borderColor: '#2A5C2A',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7A7A7A',
    textTransform: 'capitalize',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: '#FAF0DC',
    borderRadius: 20,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#2A5C2A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: 'Nunito_400Regular',
  },
  cardMeta: {
    fontSize: 12,
    color: '#7A7A7A',
    marginTop: 2,
    fontFamily: 'Nunito_400Regular',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: '#F5E6C8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 16,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 16,
  },
  pageBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#2A5C2A',
  },
  pageBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  pageInfo: {
    fontSize: 14,
    color: '#7A7A7A',
    fontWeight: '600',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FAF0DC',
    borderRadius: 28,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2A5C2A',
    marginBottom: 16,
    fontFamily: 'Nunito_800ExtraBold',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7A7A7A',
    marginBottom: 4,
    marginTop: 8,
    fontFamily: 'Nunito_400Regular',
  },
  modalInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#D0C4A8',
    marginBottom: 4,
    color: '#3A3A3A',
    fontFamily: 'Nunito_400Regular',
  },
  modalBtns: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
  modalBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
  },
  userPickRow: {
    backgroundColor: '#FAF0DC',
    padding: 12,
    borderRadius: 14,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#D4EDDA',
  },
  sendBtn: {
    backgroundColor: '#2A5C2A',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  sendBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default AdminDashboard;
