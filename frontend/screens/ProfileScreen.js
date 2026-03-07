import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: logout,
      },
    ]);
  };

  const getUserTypeLabel = () => {
    switch (user?.userType) {
      case 'hunter':
        return '🏹 Hunter / Harvestor';
      case 'community':
        return '🏘️ Community / School';
      case 'supplier':
        return '🏭 Mass Supplier';
      default:
        return user?.userType;
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.userType}>{getUserTypeLabel()}</Text>
        {user?.isVerified && (
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>✅ Verified Account</Text>
          </View>
        )}
      </View>

      {/* Info Cards */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Contact Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{user?.email}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Phone</Text>
          <Text style={styles.infoValue}>{user?.phone || 'Not set'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Location</Text>
          <Text style={styles.infoValue}>{user?.location || 'Not set'}</Text>
        </View>
      </View>

      {/* Type-specific info */}
      {user?.userType === 'hunter' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Hunter Details</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>License #</Text>
            <Text style={styles.infoValue}>{user?.hunterLicenseNumber || 'Not set'}</Text>
          </View>
        </View>
      )}

      {user?.userType === 'community' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Community Details</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Type</Text>
            <Text style={styles.infoValue}>
              {user?.organizationType
                ? user.organizationType.charAt(0).toUpperCase() +
                  user.organizationType.slice(1)
                : 'Not set'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Size</Text>
            <Text style={styles.infoValue}>
              {user?.communitySize ? `${user.communitySize} people` : 'Not set'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Address</Text>
            <Text style={styles.infoValue}>{user?.address || 'Not set'}</Text>
          </View>
        </View>
      )}

      {user?.userType === 'supplier' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Business Details</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Business Name</Text>
            <Text style={styles.infoValue}>{user?.businessName || 'Not set'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Reg. Number</Text>
            <Text style={styles.infoValue}>
              {user?.businessRegistrationNumber || 'Not set'}
            </Text>
          </View>
          {user?.supplyCategories?.length > 0 && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Categories</Text>
              <Text style={styles.infoValue}>
                {user.supplyCategories.join(', ')}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Document Image */}
      {user?.documentImageUrl && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Uploaded Document</Text>
          <Image
            source={{ uri: user.documentImageUrl }}
            style={styles.documentImage}
          />
        </View>
      )}

      {/* Account Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Member Since</Text>
          <Text style={styles.infoValue}>
            {user?.createdAt
              ? new Date(user.createdAt).toLocaleDateString()
              : 'N/A'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Status</Text>
          <Text style={[styles.infoValue, { color: user?.isActive ? '#2E7D32' : '#C62828' }]}>
            {user?.isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F9F5' },
  scrollContent: { paddingBottom: 20 },
  header: {
    alignItems: 'center', paddingTop: 70, paddingBottom: 24,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E0E0E0',
  },
  avatarContainer: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#E8F5E9',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 32, fontWeight: '800', color: '#2E7D32' },
  name: { fontSize: 22, fontWeight: '800', color: '#1B5E20' },
  userType: { fontSize: 14, color: '#666', marginTop: 4 },
  verifiedBadge: {
    backgroundColor: '#E8F5E9', paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 16, marginTop: 8,
  },
  verifiedText: { fontSize: 13, color: '#2E7D32', fontWeight: '600' },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginHorizontal: 16,
    marginTop: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 12 },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6,
  },
  infoLabel: { fontSize: 14, color: '#888' },
  infoValue: { fontSize: 14, fontWeight: '500', color: '#333', maxWidth: '60%', textAlign: 'right' },
  documentImage: {
    width: '100%', height: 200, borderRadius: 8, resizeMode: 'cover',
  },
  logoutButton: {
    backgroundColor: '#FFEBEE', borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', marginHorizontal: 16, marginTop: 20,
  },
  logoutText: { fontSize: 16, fontWeight: '700', color: '#C62828' },
});

export default ProfileScreen;
