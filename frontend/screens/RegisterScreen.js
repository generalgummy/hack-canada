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
  Image,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';

const USER_TYPES = [
  { key: 'hunter', label: '🏹 Hunter / Harvestor', desc: 'Sell harvested food to communities' },
  { key: 'community', label: '🏘️ Community / School', desc: 'Order food for your community' },
  { key: 'supplier', label: '🏭 Mass Supplier', desc: 'Supply food in bulk quantities' },
];

const ORG_TYPES = [
  { key: 'community', label: 'Community' },
  { key: 'school', label: 'School' },
  { key: 'shelter', label: 'Shelter' },
  { key: 'other', label: 'Other' },
];

const RegisterScreen = ({ navigation }) => {
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: type, 2: form

  // Shared fields
  const [userType, setUserType] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [documentImage, setDocumentImage] = useState(null);

  // Hunter fields
  const [hunterLicenseNumber, setHunterLicenseNumber] = useState('');

  // Community fields
  const [organizationType, setOrganizationType] = useState('community');
  const [communitySize, setCommunitySize] = useState('');
  const [address, setAddress] = useState('');

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

  const handleRegister = async () => {
    if (!name || !email || !phone || !password) {
      Alert.alert('Error', 'Please fill in all required fields (name, email, phone, password)');
      return;
    }

    setLoading(true);
    try {
      // Send registration as JSON first (much more reliable than multipart)
      const registrationData = {
        name,
        email: email.toLowerCase().trim(),
        password,
        userType,
        phone,
        location,
      };
      
      if (userType === 'hunter') {
        registrationData.hunterLicenseNumber = hunterLicenseNumber;
      } else if (userType === 'community') {
        registrationData.organizationType = organizationType;
        registrationData.communitySize = communitySize;
        registrationData.address = address;
      } else if (userType === 'supplier') {
        registrationData.businessName = businessName;
        registrationData.businessRegistrationNumber = businessRegistrationNumber;
      }

      // Register first without image
      await register(registrationData, documentImage);
    } catch (error) {
      Alert.alert(
        'Registration Failed',
        error.response?.data?.message || error.message || 'Please try again'
      );
    } finally {
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.logo}>🌾</Text>
          <Text style={styles.title}>Join Northern Harvest</Text>
          <Text style={styles.subtitle}>Choose your account type</Text>
        </View>

        {USER_TYPES.map((type) => (
          <TouchableOpacity
            key={type.key}
            style={[
              styles.typeCard,
              userType === type.key && styles.typeCardSelected,
            ]}
            onPress={() => setUserType(type.key)}
          >
            <Text style={styles.typeLabel}>{type.label}</Text>
            <Text style={styles.typeDesc}>{type.desc}</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[styles.button, !userType && styles.buttonDisabled]}
          onPress={() => userType && setStep(2)}
          disabled={!userType}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.linkText}>
            Already have an account? <Text style={styles.linkBold}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <TouchableOpacity onPress={() => setStep(1)} style={styles.backButton}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.formTitle}>
        {USER_TYPES.find((t) => t.key === userType)?.label} Registration
      </Text>

      {/* Shared Fields */}
      <Text style={styles.label}>Full Name *</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Your full name" />

      <Text style={styles.label}>Email *</Text>
      <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="your@email.com" keyboardType="email-address" autoCapitalize="none" />

      <Text style={styles.label}>Password *</Text>
      <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Min 6 characters" secureTextEntry />

      <Text style={styles.label}>Phone *</Text>
      <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Phone number" keyboardType="phone-pad" />

      <Text style={styles.label}>Location (City / Territory)</Text>
      <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="e.g. Iqaluit, Nunavut" />

      {/* Hunter Fields */}
      {userType === 'hunter' && (
        <>
          <Text style={styles.label}>Hunter/Farmer License Number</Text>
          <TextInput style={styles.input} value={hunterLicenseNumber} onChangeText={setHunterLicenseNumber} placeholder="License number" />
        </>
      )}

      {/* Community Fields */}
      {userType === 'community' && (
        <>
          <Text style={styles.label}>Organization Type</Text>
          <View style={styles.orgTypeRow}>
            {ORG_TYPES.map((org) => (
              <TouchableOpacity
                key={org.key}
                style={[
                  styles.orgChip,
                  organizationType === org.key && styles.orgChipSelected,
                ]}
                onPress={() => setOrganizationType(org.key)}
              >
                <Text
                  style={[
                    styles.orgChipText,
                    organizationType === org.key && styles.orgChipTextSelected,
                  ]}
                >
                  {org.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Community Size (# of people)</Text>
          <TextInput style={styles.input} value={communitySize} onChangeText={setCommunitySize} placeholder="Number of people" keyboardType="numeric" />

          <Text style={styles.label}>Physical Address</Text>
          <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Full address" multiline />
        </>
      )}

      {/* Supplier Fields */}
      {userType === 'supplier' && (
        <>
          <Text style={styles.label}>Business Name</Text>
          <TextInput style={styles.input} value={businessName} onChangeText={setBusinessName} placeholder="Your business name" />

          <Text style={styles.label}>Business Registration Number</Text>
          <TextInput style={styles.input} value={businessRegistrationNumber} onChangeText={setBusinessRegistrationNumber} placeholder="Registration number" />
        </>
      )}

      {/* Document Upload */}
      <Text style={styles.label}>{getDocumentLabel()}</Text>
      <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
        {documentImage ? (
          <Image source={{ uri: documentImage.uri }} style={styles.previewImage} />
        ) : (
          <View style={styles.uploadPlaceholder}>
            <Text style={styles.uploadIcon}>📷</Text>
            <Text style={styles.uploadText}>Tap to upload document</Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Create Account</Text>
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
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1B5E20',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  typeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  typeCardSelected: {
    borderColor: '#2E7D32',
    backgroundColor: '#E8F5E9',
  },
  typeLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  typeDesc: {
    fontSize: 13,
    color: '#666',
  },
  button: {
    backgroundColor: '#2E7D32',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  linkButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    color: '#666',
  },
  linkBold: {
    color: '#2E7D32',
    fontWeight: '700',
  },
  backButton: {
    marginBottom: 12,
  },
  backText: {
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: '600',
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1B5E20',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  orgTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  orgChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  orgChipSelected: {
    backgroundColor: '#E8F5E9',
    borderColor: '#2E7D32',
  },
  orgChipText: {
    fontSize: 13,
    color: '#666',
  },
  orgChipTextSelected: {
    color: '#2E7D32',
    fontWeight: '700',
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 4,
  },
  uploadPlaceholder: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  uploadIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  uploadText: {
    fontSize: 14,
    color: '#888',
  },
  previewImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
});

export default RegisterScreen;
