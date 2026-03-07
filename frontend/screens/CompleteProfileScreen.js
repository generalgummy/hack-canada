import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';

const USER_TYPES = [
  { key: 'hunter', label: '🏹 Hunter / Harvestor', desc: 'Sell harvested food to communities' },
  { key: 'community', label: '🏘️ Community / School', desc: 'Order food for your community' },
  { key: 'supplier', label: '🏭 Mass Supplier', desc: 'Supply food in bulk quantities' },
];

const ORGANIZATION_TYPES = [
  { key: 'community', label: 'Community' },
  { key: 'school', label: 'School' },
  { key: 'shelter', label: 'Shelter' },
  { key: 'hospital', label: 'Hospital' },
  { key: 'workplace', label: 'Workplace' },
  { key: 'other', label: 'Other' },
];

const CompleteProfileScreen = ({ navigation }) => {
  const { completeAuth0Profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [documentImage, setDocumentImage] = useState(null);

  // Community fields
  const [organizationType, setOrganizationType] = useState('community');
  const [communitySize, setCommunitySize] = useState('');
  const [address, setAddress] = useState('');

  // Hunter fields
  const [hunterLicenseNumber, setHunterLicenseNumber] = useState('');

  // Supplier fields
  const [businessName, setBusinessName] = useState('');
  const [businessRegistrationNumber, setBusinessRegistrationNumber] = useState('');

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setDocumentImage(result.assets[0]);
    }
  };

  const getDocumentLabel = () => {
    switch (userType) {
      case 'hunter':
        return 'Upload your hunter/farmer license or government ID';
      case 'community':
        return 'Upload address proof or organization document';
      case 'supplier':
        return 'Upload business registration document';
      default:
        return 'Upload document';
    }
  };

  const handleComplete = async () => {
    if (!userType) {
      Alert.alert('Error', 'Please select your user type');
      return;
    }

    if (!phone || phone.trim().length === 0) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    if (userType === 'hunter' && !hunterLicenseNumber) {
      Alert.alert('Error', 'Please enter your hunter license number');
      return;
    }

    if (userType === 'community' && !organizationType) {
      Alert.alert('Error', 'Please select your organization type');
      return;
    }

    if (userType === 'supplier' && (!businessName || !businessRegistrationNumber)) {
      Alert.alert('Error', 'Please enter business name and registration number');
      return;
    }

    setLoading(true);
    try {
      const profileData = {
        userType,
        phone,
        location: location || 'Not specified',
      };

      if (userType === 'hunter') {
        profileData.hunterLicenseNumber = hunterLicenseNumber;
      } else if (userType === 'community') {
        profileData.organizationType = organizationType;
        profileData.communitySize = communitySize || '0';
        profileData.address = address;
      } else if (userType === 'supplier') {
        profileData.businessName = businessName;
        profileData.businessRegistrationNumber = businessRegistrationNumber;
        profileData.address = address;
      }

      await completeAuth0Profile(profileData, documentImage);
      Alert.alert('Success', 'Profile completed! Welcome to Northern Harvest');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to complete profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.title}>Complete Your Profile</Text>
        <Text style={styles.subtitle}>Tell us about yourself so we can connect you with the right people</Text>
      </View>

      {/* User Type Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What describes you best?</Text>
        {USER_TYPES.map((type) => (
          <TouchableOpacity
            key={type.key}
            style={[
              styles.userTypeOption,
              userType === type.key && styles.userTypeOptionSelected,
            ]}
            onPress={() => setUserType(type.key)}
          >
            <View style={styles.userTypeRadio}>
              {userType === type.key && <View style={styles.userTypeRadioDot} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userTypeLabel}>{type.label}</Text>
              <Text style={styles.userTypeDesc}>{type.desc}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Phone Number */}
      <View style={styles.section}>
        <Text style={styles.label}>Phone Number *</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="e.g., +1 (867) 123-4567"
          placeholderTextColor="#999"
          keyboardType="phone-pad"
        />
      </View>

      {/* Location */}
      <View style={styles.section}>
        <Text style={styles.label}>Location / Community Name</Text>
        <TextInput
          style={styles.input}
          value={location}
          onChangeText={setLocation}
          placeholder="e.g., Yellowknife, NT"
          placeholderTextColor="#999"
        />
      </View>

      {/* Hunter-specific fields */}
      {userType === 'hunter' && (
        <View style={styles.section}>
          <Text style={styles.label}>Hunter/Farmer License Number</Text>
          <TextInput
            style={styles.input}
            value={hunterLicenseNumber}
            onChangeText={setHunterLicenseNumber}
            placeholder="Enter your license number"
            placeholderTextColor="#999"
          />
        </View>
      )}

      {/* Community-specific fields */}
      {userType === 'community' && (
        <View style={styles.section}>
          <Text style={styles.label}>Organization Type</Text>
          {ORGANIZATION_TYPES.map((org) => (
            <TouchableOpacity
              key={org.key}
              style={[
                styles.radioOption,
                organizationType === org.key && styles.radioOptionSelected,
              ]}
              onPress={() => setOrganizationType(org.key)}
            >
              <View style={styles.radio}>
                {organizationType === org.key && <View style={styles.radioDot} />}
              </View>
              <Text style={styles.radioLabel}>{org.label}</Text>
            </TouchableOpacity>
          ))}

          <Text style={styles.label}>Community Size (approx. number of people)</Text>
          <TextInput
            style={styles.input}
            value={communitySize}
            onChangeText={setCommunitySize}
            placeholder="e.g., 500"
            keyboardType="number-pad"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>Address</Text>
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder="Street address"
            placeholderTextColor="#999"
          />
        </View>
      )}

      {/* Supplier-specific fields */}
      {userType === 'supplier' && (
        <View style={styles.section}>
          <Text style={styles.label}>Business Name</Text>
          <TextInput
            style={styles.input}
            value={businessName}
            onChangeText={setBusinessName}
            placeholder="Your business name"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>Business Registration Number</Text>
          <TextInput
            style={styles.input}
            value={businessRegistrationNumber}
            onChangeText={setBusinessRegistrationNumber}
            placeholder="Registration number"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>Address</Text>
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder="Business address"
            placeholderTextColor="#999"
          />
        </View>
      )}

      {/* Document Upload */}
      {userType && (
        <View style={styles.section}>
          <Text style={styles.label}>{getDocumentLabel()}</Text>
          <TouchableOpacity
            style={[
              styles.uploadButton,
              documentImage && styles.uploadButtonSelected,
            ]}
            onPress={pickImage}
          >
            <Text style={styles.uploadButtonText}>
              {documentImage ? '✓ Document Selected' : '📷 Choose Photo'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleComplete}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Complete Profile</Text>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F9F5',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1B5E20',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    backgroundColor: '#fff',
    color: '#333',
  },
  userTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  userTypeOptionSelected: {
    borderColor: '#2E7D32',
    backgroundColor: '#F1F8F1',
  },
  userTypeRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userTypeRadioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2E7D32',
  },
  userTypeLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  userTypeDesc: {
    fontSize: 12,
    color: '#999',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 10,
  },
  radioOptionSelected: {
    backgroundColor: '#F1F8F1',
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2E7D32',
  },
  radioLabel: {
    fontSize: 14,
    color: '#333',
  },
  uploadButton: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#ddd',
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  uploadButtonSelected: {
    borderColor: '#2E7D32',
    backgroundColor: '#F1F8F1',
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
  },
  submitButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default CompleteProfileScreen;
