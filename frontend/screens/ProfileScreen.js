import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Ionicons } from '@expo/vector-icons';

const USER_TYPES = [
  { key: 'hunter', label: 'Hunter / Harvestor', desc: 'Sell harvested food to communities' },
  { key: 'community', label: 'Community / School', desc: 'Order food for your community' },
  { key: 'supplier', label: 'Mass Supplier', desc: 'Supply food in bulk quantities' },
];

const ProfileScreen = ({ navigation }) => {
  const { user, logout, updateUser } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUserType, setSelectedUserType] = useState(user?.userType || '');
  const [updateLoading, setUpdateLoading] = useState(false);

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

  const handleChangeUserType = async () => {
    if (!selectedUserType || selectedUserType === user?.userType) {
      setShowEditModal(false);
      return;
    }

    setUpdateLoading(true);
    try {
      const response = await api.put('/users/update-user-type', { userType: selectedUserType });
      
      if (response.data?.user) {
        updateUser(response.data.user);
        Alert.alert('Success', `Your account type has been changed to ${selectedUserType}`);
        setShowEditModal(false);
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || error.message || 'Failed to update account type');
      setSelectedUserType(user?.userType);
    } finally {
      setUpdateLoading(false);
    }
  };

  const getUserTypeLabel = () => {
    switch (user?.userType) {
      case 'hunter':
        return 'Hunter / Harvestor';
      case 'community':
        return 'Community / School';
      case 'supplier':
        return 'Mass Supplier';
      default:
        return user?.userType;
    }
  };

  return (
    <>
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
              <Ionicons name="checkmark-circle" size={13} color="#FFFFFF" />
              <Text style={styles.verifiedText}> Verified Account</Text>
            </View>
          )}
        </View>

        {/* Contact Information */}
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
            <Text style={[styles.infoValue, { color: user?.isActive ? '#2A5C2A' : '#C62828' }]}>
              {user?.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => {
            setSelectedUserType(user?.userType);
            setShowEditModal(true);
          }}
        >
          <Ionicons name="pencil-outline" size={16} color="#4A90D9" />
          <Text style={styles.editButtonText}> Change Account Type</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Account Type</Text>
            <Text style={styles.modalSubtitle}>
              Select your account type. You can change this anytime.
            </Text>

            {USER_TYPES.map((type) => (
              <TouchableOpacity
                key={type.key}
                style={[
                  styles.typeOption,
                  selectedUserType === type.key && styles.typeOptionSelected,
                ]}
                onPress={() => setSelectedUserType(type.key)}
              >
                <View style={styles.typeRadio}>
                  {selectedUserType === type.key && (
                    <View style={styles.typeRadioDot} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.typeLabel}>{type.label}</Text>
                  <Text style={styles.typeDesc}>{type.desc}</Text>
                </View>
              </TouchableOpacity>
            ))}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  updateLoading && styles.confirmButtonDisabled,
                ]}
                onPress={handleChangeUserType}
                disabled={updateLoading}
              >
                {updateLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5E6C8' },
  scrollContent: { paddingBottom: 20 },
  header: {
    alignItems: 'center',
    paddingTop: 70,
    paddingBottom: 24,
    backgroundColor: '#2A5C2A',
    borderBottomWidth: 0,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#D4EDDA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 32, fontWeight: '800', color: '#2A5C2A' },
  name: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', fontFamily: 'Nunito_800ExtraBold' },
  userType: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4, fontFamily: 'Nunito_400Regular' },
  verifiedBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedText: { fontSize: 13, color: '#FFFFFF', fontWeight: '600', fontFamily: 'Nunito_400Regular' },
  card: {
    backgroundColor: '#FAF0DC',
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    elevation: 1,
    shadowColor: '#2A5C2A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(42,92,42,0.08)',
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 12, fontFamily: 'Nunito_800ExtraBold' },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  infoLabel: { fontSize: 14, color: '#7A7A7A', fontFamily: 'Nunito_400Regular' },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    maxWidth: '60%',
    textAlign: 'right',
    fontFamily: 'Nunito_400Regular',
  },
  documentImage: {
    width: '100%',
    height: 200,
    borderRadius: 14,
    resizeMode: 'cover',
  },
  editButton: {
    backgroundColor: '#FAF0DC',
    borderRadius: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 20,
    borderWidth: 1.5,
    borderColor: '#4A90D9',
  },
  editButtonText: { fontSize: 16, fontWeight: '700', color: '#4A90D9', fontFamily: 'Nunito_400Regular' },
  logoutButton: {
    backgroundColor: '#FFEBEE',
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
  },
  logoutText: { fontSize: 16, fontWeight: '700', color: '#C62828', fontFamily: 'Nunito_400Regular' },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#FAF0DC',
    borderRadius: 28,
    padding: 24,
    width: '100%',
    maxWidth: 500,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2A5C2A',
    marginBottom: 8,
    fontFamily: 'Nunito_800ExtraBold',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#7A7A7A',
    marginBottom: 20,
    lineHeight: 18,
    fontFamily: 'Nunito_400Regular',
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(42,92,42,0.10)',
  },
  typeOptionSelected: {
    backgroundColor: '#D4EDDA',
    borderColor: '#2A5C2A',
  },
  typeRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D0C4A8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  typeRadioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2A5C2A',
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2A5C2A',
    fontFamily: 'Nunito_400Regular',
  },
  typeDesc: {
    fontSize: 12,
    color: '#7A7A7A',
    marginTop: 2,
    fontFamily: 'Nunito_400Regular',
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#D0C4A8',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7A7A7A',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#2A5C2A',
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default ProfileScreen;
