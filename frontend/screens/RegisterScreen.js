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
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

/* â”€â”€ Asset imports â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const IMG = {
  wheat:     require('./assets/icon.png'),
  hunter:    require('./assets/hunter.png'),
  community: require('./assets/community.png'),
  supplier:  require('./assets/suppliers.png'),
  id:        require('./assets/ID.png'),
  email:     require('./assets/email.png'),
  lock:      require('./assets/lock-and-key.png'),
  phone:     require('./assets/phone.png'),
  location:  require('./assets/location.png'),
  license:   require('./assets/license.png'),
};

/* â”€â”€ Font families â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const HEADING = 'Nunito_800ExtraBold';
const BODY = 'Nunito_400Regular';

const USER_TYPES = [
  { key: 'hunter', label: 'Hunter / Harvestor', desc: 'Sell harvested food to communities', img: IMG.hunter, gradient: ['#E05252', '#4A90D9'], split: 55 },
  { key: 'community', label: 'Community / School', desc: 'Order food for your community', img: IMG.community, gradient: ['#2A5C2A', '#F5C200'], split: 45 },
  { key: 'supplier', label: 'Mass Supplier', desc: 'Supply food in bulk quantities', img: IMG.supplier, gradient: ['#4A90D9', '#E8834A'], split: 50 },
];

const ORG_TYPES = [
  { key: 'community', label: 'Community' },
  { key: 'school', label: 'School' },
  { key: 'shelter', label: 'Shelter' },
  { key: 'other', label: 'Other' },
];

/* â”€â”€ Focused-input wrapper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const FocusInput = ({ icon, label, style, ...props }) => {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginTop: 4 }}>
      <View
        style={[
          s.inputWrap,
          focused && s.inputWrapFocused,
          style,
        ]}
      >
        <TextInput
          {...props}
          placeholderTextColor="#B0A48A"
          style={[s.inputInner, { fontFamily: BODY }]}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
        />
        <Ionicons name="pencil-outline" size={14} color="#B0A48A" style={{ marginLeft: 6 }} />
      </View>
    </View>
  );
};

/* â”€â”€ Main component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const RegisterScreen = ({ navigation }) => {
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const [userType, setUserType] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [documentImage, setDocumentImage] = useState(null);

  const [hunterLicenseNumber, setHunterLicenseNumber] = useState('');
  const [organizationType, setOrganizationType] = useState('community');
  const [communitySize, setCommunitySize] = useState('');
  const [address, setAddress] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessRegistrationNumber, setBusinessRegistrationNumber] = useState('');

  // Field-level errors
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateEmail = (val) => {
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
    setEmailError(val.length > 0 && !ok ? 'Enter a valid email address.' : '');
    return ok;
  };

  const validatePhone = (val) => {
    const digits = val.replace(/\D/g, '');
    const ok = digits.length >= 10;
    setPhoneError(val.length > 0 && !ok ? 'Phone number must be at least 10 digits.' : '');
    return ok;
  };

  const validatePassword = (val) => {
    const ok = val.length >= 8;
    setPasswordError(val.length > 0 && !ok ? 'Password must be at least 8 characters.' : '');
    return ok;
  };

  const fetchLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Please allow location access to use this feature.');
        return;
      }
      const coords = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [place] = await Location.reverseGeocodeAsync(coords.coords);
      if (place) {
        const parts = [place.city, place.region, place.country].filter(Boolean);
        setLocation(parts.join(', '));
      }
    } catch {
      Alert.alert('Error', 'Could not fetch location. Please enter it manually.');
    } finally {
      setLocationLoading(false);
    }
  };

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
    if (!result.canceled) setDocumentImage(result.assets[0]);
  };

  const handleRegister = async () => {
    const emailOk = validateEmail(email);
    const phoneOk = validatePhone(phone);
    const passwordOk = validatePassword(password);
    if (!name || !email || !phone || !password) {
      Alert.alert('Error', 'Please fill in all required fields (name, email, phone, password)');
      return;
    }
    if (!emailOk || !phoneOk || !passwordOk) return;
    setLoading(true);
    try {
      const data = {
        name,
        email: email.toLowerCase().trim(),
        password,
        userType,
        phone,
        location,
      };
      if (userType === 'hunter') data.hunterLicenseNumber = hunterLicenseNumber;
      else if (userType === 'community') {
        data.organizationType = organizationType;
        data.communitySize = communitySize;
        data.address = address;
      } else if (userType === 'supplier') {
        data.businessName = businessName;
        data.businessRegistrationNumber = businessRegistrationNumber;
      }
      await register(data, documentImage);
    } catch (error) {
      Alert.alert('Registration Failed', error.response?.data?.message || error.message || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  /* â”€â”€ Step 1: Account type picker â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  if (step === 1) {
    return (
      <ScrollView style={s.page} contentContainerStyle={s.scroll}>
        <View style={s.s1Header}>
          <Image source={IMG.wheat} style={s.wheatImg} />
          <Text style={[s.s1Title, { fontFamily: HEADING }]}>Join Northern Harvest</Text>
          <Text style={[s.s1Sub, { fontFamily: BODY }]}>Choose your account type</Text>
        </View>

        {USER_TYPES.map((t) => {
          const on = userType === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              activeOpacity={0.75}
              style={[s.typeCard, on && s.typeCardOn]}
              onPress={() => setUserType(t.key)}
            >
              {/* Top accent bar */}
              <View style={s.accentBar}>
                <View style={{ flex: t.split, backgroundColor: t.gradient[0] }} />
                <View style={{ flex: 100 - t.split, backgroundColor: t.gradient[1] }} />
              </View>

              <View style={s.typeCardInner}>
                <Image source={t.img} style={s.typeCardImg} />
                <View style={{ flex: 1 }}>
                  <Text style={[s.typeLabel, { fontFamily: BODY }]}>{t.label}</Text>
                  <Text style={[s.typeDesc, { fontFamily: BODY }]}>{t.desc}</Text>
                </View>
                {on && (
                  <View style={s.checkCircle}>
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          style={[s.yellowBtn, !userType && { opacity: 0.5 }]}
          onPress={() => userType && setStep(2)}
          disabled={!userType}
          activeOpacity={0.8}
        >
          <Text style={[s.yellowBtnText, { fontFamily: HEADING }]}>Continue</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.footerLink} onPress={() => navigation.navigate('Login')}>
          <Text style={[s.footerText, { fontFamily: BODY }]}>
            Already have an account?{' '}
            <Text style={s.footerBold}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  /* â”€â”€ Step 2: Registration form â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  return (
    <ScrollView style={s.page} contentContainerStyle={s.scroll}>
      {/* Back */}
      <TouchableOpacity onPress={() => setStep(1)} style={{ marginBottom: 8 }} activeOpacity={0.7}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="arrow-back-outline" size={16} color="#2A5C2A" />
          <Text style={[s.backText, { fontFamily: BODY }]}>Back</Text>
        </View>
      </TouchableOpacity>

      {/* Page title */}
      <Text style={[s.pageTitle, { fontFamily: HEADING }]}>
        Registration
      </Text>

      {/* â”€â”€â”€â”€â”€â”€ Card 1 â€” Personal Details â”€â”€â”€â”€â”€â”€ */}
      <View style={s.card}>
        <View style={s.cardTitleRow}>
          <View style={[s.accent, { backgroundColor: '#4A90D9' }]} />
          <Text style={[s.cardTitle, { fontFamily: HEADING }]}>Personal Details</Text>
        </View>

        <View style={s.fieldRow}>
          <Image source={IMG.id} style={s.fieldIcon} />
          <View style={{ flex: 1 }}>
            <Text style={[s.fieldLabel, { fontFamily: BODY }]}>Full Name</Text>
            <FocusInput value={name} onChangeText={setName} placeholder="your full name" />
          </View>
        </View>

        <View style={s.fieldRow}>
          <Image source={IMG.email} style={s.fieldIcon} />
          <View style={{ flex: 1 }}>
            <Text style={[s.fieldLabel, { fontFamily: BODY }]}>Email</Text>
            <FocusInput
              value={email}
              onChangeText={(v) => { setEmail(v); validateEmail(v); }}
              placeholder="your@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {!!emailError && <Text style={s.fieldError}>{emailError}</Text>}
          </View>
        </View>
      </View>

      {/* â”€â”€â”€â”€â”€â”€ Card 2 â€” Security & Contact â”€â”€â”€â”€â”€â”€ */}
      <View style={s.card}>
        <View style={s.cardTitleRow}>
          <View style={[s.accent, { backgroundColor: '#E05252' }]} />
          <Text style={[s.cardTitle, { fontFamily: HEADING }]}>Security & Contact</Text>
        </View>

        <View style={s.fieldRow}>
          <Image source={IMG.lock} style={s.fieldIcon} />
          <View style={{ flex: 1 }}>
            <Text style={[s.fieldLabel, { fontFamily: BODY }]}>Password</Text>
            <FocusInput
              value={password}
              onChangeText={(v) => { setPassword(v); validatePassword(v); }}
              placeholder="Password"
              secureTextEntry
            />
            {!!passwordError && <Text style={s.fieldError}>{passwordError}</Text>}
          </View>
        </View>

        <View style={s.fieldRow}>
          <Image source={IMG.phone} style={s.fieldIcon} />
          <View style={{ flex: 1 }}>
            <Text style={[s.fieldLabel, { fontFamily: BODY }]}>Phone</Text>
            <FocusInput
              value={phone}
              onChangeText={(v) => { setPhone(v); validatePhone(v); }}
              placeholder="+1 (555) ..."
              keyboardType="phone-pad"
            />
            {!!phoneError && <Text style={s.fieldError}>{phoneError}</Text>}
          </View>
        </View>
      </View>

      {/* â”€â”€â”€â”€â”€â”€ Card 3 â€” Location & type-specific â”€â”€â”€â”€â”€â”€ */}
      <View style={s.card}>
        <View style={s.cardTitleRow}>
          <View style={[s.accent, { backgroundColor: '#2A5C2A' }]} />
          <Text style={[s.cardTitle, { fontFamily: HEADING }]}>
            {userType === 'community' ? 'Location & Organization' : userType === 'supplier' ? 'Location & Business' : 'Location & License'}
          </Text>
        </View>

        <View style={s.fieldRow}>
          <Image source={IMG.location} style={s.fieldIcon} />
          <View style={{ flex: 1 }}>
            <Text style={[s.fieldLabel, { fontFamily: BODY }]}>Location (City / Territory)</Text>
            <FocusInput value={location} onChangeText={setLocation} placeholder="e.g. Iqaluit, Nunavut" />
          </View>
        </View>
        <TouchableOpacity
          style={s.gpsBtn}
          onPress={fetchLocation}
          disabled={locationLoading}
          activeOpacity={0.7}
        >
          {locationLoading
            ? <ActivityIndicator size="small" color="#2A5C2A" />
            : <Ionicons name="locate-outline" size={18} color="#2A5C2A" />}
          <Text style={[s.gpsBtnText, { fontFamily: BODY }]}>
            {locationLoading ? 'Fetching location...' : 'Use Current Location'}
          </Text>
        </TouchableOpacity>

        {userType === 'hunter' && (
          <View style={s.fieldRow}>
            <Image source={IMG.license} style={s.fieldIcon} />
            <View style={{ flex: 1 }}>
              <Text style={[s.fieldLabel, { fontFamily: BODY }]}>Hunter/Farmer License Number</Text>
              <FocusInput value={hunterLicenseNumber} onChangeText={setHunterLicenseNumber} placeholder="HN-12345" />
            </View>
          </View>
        )}

        {/* Community */}
        {userType === 'community' && (
          <>
            <View style={s.fieldRow}>
              <Image source={IMG.community} style={s.fieldIcon} />
              <View style={{ flex: 1 }}>
                <Text style={[s.fieldLabel, { fontFamily: BODY }]}>Organization Type</Text>
                <View style={s.chipRow}>
                  {ORG_TYPES.map((o) => (
                    <TouchableOpacity
                      key={o.key}
                      style={[s.chip, organizationType === o.key && s.chipOn]}
                      onPress={() => setOrganizationType(o.key)}
                    >
                      <Text style={[s.chipText, { fontFamily: BODY }, organizationType === o.key && s.chipTextOn]}>{o.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
            <View style={s.fieldRow}>
              <Image source={IMG.groupofpeople} style={s.fieldIcon} />
              <View style={{ flex: 1 }}>
                <Text style={[s.fieldLabel, { fontFamily: BODY }]}>Community Size</Text>
                <FocusInput value={communitySize} onChangeText={setCommunitySize} placeholder="# of people" keyboardType="numeric" />
              </View>
            </View>
            <View style={s.fieldRow}>
              <Image source={IMG.location} style={s.fieldIcon} />
              <View style={{ flex: 1 }}>
                <Text style={[s.fieldLabel, { fontFamily: BODY }]}>Physical Address</Text>
                <FocusInput value={address} onChangeText={setAddress} placeholder="Full address" multiline />
              </View>
            </View>
          </>
        )}

        {/* Supplier */}
        {userType === 'supplier' && (
          <>
            <View style={s.fieldRow}>
              <Image source={IMG.supplier} style={s.fieldIcon} />
              <View style={{ flex: 1 }}>
                <Text style={[s.fieldLabel, { fontFamily: BODY }]}>Business Name</Text>
                <FocusInput value={businessName} onChangeText={setBusinessName} placeholder="Your business name" />
              </View>
            </View>
            <View style={s.fieldRow}>
              <Image source={IMG.license} style={s.fieldIcon} />
              <View style={{ flex: 1 }}>
                <Text style={[s.fieldLabel, { fontFamily: BODY }]}>Business Registration Number</Text>
                <FocusInput value={businessRegistrationNumber} onChangeText={setBusinessRegistrationNumber} placeholder="Registration number" />
              </View>
            </View>
          </>
        )}
      </View>

      {/* â”€â”€â”€â”€â”€â”€ Document Upload â”€â”€â”€â”€â”€â”€ */}
      <Text style={[s.uploadTitle, { fontFamily: HEADING }]}>Document Upload</Text>
      <TouchableOpacity style={s.uploadZone} onPress={pickImage} activeOpacity={0.7}>
        {documentImage ? (
          <Image source={{ uri: documentImage.uri }} style={s.previewImg} />
        ) : (
          <>
            <Ionicons name="document-attach-outline" size={40} color="#C4A96E" style={{ marginBottom: 8 }} />
            <Text style={[s.uploadMainText, { fontFamily: BODY }]}>
              Tap to upload your license or government ID
            </Text>
            <Text style={[s.uploadSubText, { fontFamily: BODY }]}>
              Supported: JPG, PNG, PDF
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* â”€â”€â”€â”€â”€â”€ Submit â”€â”€â”€â”€â”€â”€ */}
      <TouchableOpacity
        style={[s.submitBtn, loading && { opacity: 0.55 }]}
        onPress={handleRegister}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={[s.submitBtnText, { fontFamily: HEADING }]}>Create Account</Text>
        )}
      </TouchableOpacity>

      {/* â”€â”€â”€â”€â”€â”€ Footer â”€â”€â”€â”€â”€â”€ */}
      <TouchableOpacity style={s.footerLink} onPress={() => navigation.navigate('Login')}>
        <Text style={[s.footerText, { fontFamily: BODY }]}>
          Already have an account?{' '}
          <Text style={s.footerBold}>Sign In</Text>
        </Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

/* ================================================================
   STYLES
   ================================================================ */
const DOT_BG = Platform.OS === 'web'
  ? { backgroundImage: 'radial-gradient(circle, #C8A458 1px, transparent 1px)', backgroundSize: '22px 22px' }
  : {};

const SHADOW_CARD = Platform.OS === 'web'
  ? { boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }
  : { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 };

const s = StyleSheet.create({
  /* â”€â”€ Page chrome â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  page: {
    flex: 1,
    backgroundColor: '#F5E6C8',
    ...DOT_BG,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 40,
    maxWidth: 460,
    alignSelf: 'center',
    width: '100%',
  },

  /* â”€â”€ Step-1 header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  s1Header: { alignItems: 'center', marginBottom: 28 },
  wheatImg: { width: 64, height: 64, resizeMode: 'contain', marginBottom: 8 },
  s1Title: { fontSize: 26, fontWeight: '800', color: '#1A1A1A' },
  s1Sub: { fontSize: 14, color: '#7A7A7A', marginTop: 4 },

  /* â”€â”€ Step-1 type cards â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  typeCard: {
    backgroundColor: '#FAF0DC',
    borderRadius: 18,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: '#D0C4A8',
    overflow: 'hidden',
    ...SHADOW_CARD,
  },
  typeCardOn: {
    borderColor: '#2A5C2A',
    backgroundColor: '#D4EDDA',
  },
  accentBar: { height: 5, flexDirection: 'row', borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  typeCardInner: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  typeCardImg: { width: 56, height: 56, resizeMode: 'contain' },
  checkCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#2A5C2A', alignItems: 'center', justifyContent: 'center', marginLeft: 'auto' },
  checkMark: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  typeLabel: { fontSize: 17, fontWeight: '700', color: '#1A1A1A', marginBottom: 3 },
  typeDesc: { fontSize: 13, color: '#7A7A7A' },

  /* â”€â”€ Yellow pill button (step-1) â”€â”€â”€â”€â”€â”€â”€ */
  yellowBtn: {
    backgroundColor: '#F5C200',
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 2,
    borderColor: '#1A1A1A',
  },
  yellowBtnText: { color: '#1A1A1A', fontSize: 18, fontWeight: '800' },

  /* â”€â”€ Shared footer / link â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  footerLink: { marginTop: 18, alignItems: 'center' },
  footerText: { fontSize: 13, color: '#7A7A7A' },
  footerBold: { color: '#2A5C2A', fontWeight: '700', textDecorationLine: 'underline' },

  /* â”€â”€ Step-2 back & title â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  backText: { fontSize: 15, color: '#2A5C2A', fontWeight: '700' },
  pageTitle: { fontSize: 28, fontWeight: '800', color: '#1A1A1A', textAlign: 'center', marginBottom: 22 },

  /* â”€â”€ Section card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  card: {
    backgroundColor: '#FAF0DC',
    borderWidth: 2,
    borderColor: '#1A1A1A',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    ...SHADOW_CARD,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  accent: { width: 4, height: 24, borderRadius: 2, marginRight: 10 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A1A' },

  /* â”€â”€ Field rows â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  fieldRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  fieldIcon: { width: 30, height: 30, resizeMode: 'contain', marginRight: 10, marginTop: 4 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: '#3A3A3A', marginBottom: 2 },
  fieldError: { fontSize: 12, color: '#E05252', marginTop: 4, fontWeight: '600' },

  /* â”€â”€ Input â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D0C4A8',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'web' ? 10 : 8,
  },
  inputWrapFocused: {
    borderColor: '#2A5C2A',
    ...(Platform.OS === 'web' ? { boxShadow: '0 0 0 3px rgba(42,92,42,0.12)' } : {}),
  },
  inputInner: { flex: 1, fontSize: 15, color: '#1A1A1A', outlineStyle: 'none' },

  /* â”€â”€ Chips (community org type) â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D0C4A8',
  },
  chipOn: { backgroundColor: '#D4EDDA', borderColor: '#2A5C2A' },
  chipText: { fontSize: 13, color: '#7A7A7A' },
  chipTextOn: { color: '#2A5C2A', fontWeight: '700' },

  /* â”€â”€ Document upload â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  uploadTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A1A', marginTop: 6, marginBottom: 10 },
  uploadZone: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#C4A96E',
    borderRadius: 14,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5E6C8',
  },
  uploadMainText: { fontSize: 15, fontWeight: '700', color: '#3A3A3A', textAlign: 'center', marginBottom: 6 },
  uploadSubText: { fontSize: 12, color: '#7A7A7A', textAlign: 'center' },
  previewImg: { width: '100%', height: 200, borderRadius: 10, resizeMode: 'cover' },

  /* â”€â”€ Submit button â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  gpsBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    backgroundColor: "#EDF7ED",
    borderWidth: 1.5,
    borderColor: "#2A5C2A",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 8,
    marginBottom: 4,
  },
  gpsBtnText: { color: "#2A5C2A", fontSize: 14, fontWeight: "600" },

  submitBtn: {
    backgroundColor: '#2A5C2A',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  submitBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
});

export default RegisterScreen;
