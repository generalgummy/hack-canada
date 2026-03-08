import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  Switch,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { createListingAPI, updateListingAPI } from '../services/api';

const CATEGORIES = [
  { key: 'meat', label: 'Meat' },
  { key: 'grains', label: 'Grains' },
  { key: 'rice', label: 'Rice' },
  { key: 'vegetables', label: 'Vegetables' },
  { key: 'dry_rations', label: 'Dry Rations' },
  { key: 'other', label: 'Other' },
];

const UNITS = ['kg', 'lbs', 'units', 'cases'];

const CreateListingScreen = ({ route, navigation }) => {
  const { user } = useAuth();
  const editListing = route.params?.listing;
  const isEdit = !!editListing;

  const [title, setTitle] = useState(editListing?.title || '');
  const [category, setCategory] = useState(editListing?.category || 'meat');
  const [description, setDescription] = useState(editListing?.description || '');
  const [quantity, setQuantity] = useState(editListing?.quantity?.toString() || '');
  const [unit, setUnit] = useState(editListing?.unit || 'kg');
  const [pricePerUnit, setPricePerUnit] = useState(editListing?.pricePerUnit?.toString() || '');
  const [isFree, setIsFree] = useState(editListing?.isFree || false);
  const [location, setLocation] = useState(editListing?.location || user?.location || '');
  const [tags, setTags] = useState(editListing?.tags?.join(', ') || '');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 4,
      quality: 0.8,
    });
    if (!result.canceled) {
      setImages(result.assets.slice(0, 4));
    }
  };

  const handleSubmit = async () => {
    if (!title || !quantity) {
      Alert.alert('Error', 'Please fill in title and quantity');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('category', category);
      formData.append('description', description);
      formData.append('quantity', quantity);
      formData.append('unit', unit);
      formData.append('pricePerUnit', isFree ? '0' : pricePerUnit || '0');
      formData.append('isFree', isFree.toString());
      formData.append('location', location);

      if (tags.trim()) {
        formData.append(
          'tags',
          JSON.stringify(tags.split(',').map((t) => t.trim()).filter(Boolean))
        );
      }

      images.forEach((img, index) => {
        const uri = img.uri;
        const filename = uri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const ext = match ? match[1] : 'jpg';
        formData.append('images', {
          uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
          type: `image/${ext}`,
          name: `listing_${index}.${ext}`,
        });
      });

      if (isEdit) {
        await updateListingAPI(editListing._id, formData);
        Alert.alert('Updated!', 'Listing has been updated');
      } else {
        await createListingAPI(formData);
        Alert.alert('Posted!', 'Your listing is now live');
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.heading}>{isEdit ? 'Edit Listing' : 'Post New Listing'}</Text>

      <Text style={styles.label}>Title *</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="e.g. Fresh Caribou Meat" />

      <Text style={styles.label}>Category *</Text>
      <View style={styles.chipRow}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[styles.chip, category === cat.key && styles.chipSelected]}
            onPress={() => setCategory(cat.key)}
          >
            <Text style={[styles.chipText, category === cat.key && styles.chipTextSelected]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, { height: 80 }]}
        value={description}
        onChangeText={setDescription}
        placeholder="Describe your product..."
        multiline
      />

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Quantity *</Text>
          <TextInput style={styles.input} value={quantity} onChangeText={setQuantity} placeholder="0" keyboardType="numeric" />
        </View>
        <View style={{ width: 12 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Unit</Text>
          <View style={styles.unitRow}>
            {UNITS.map((u) => (
              <TouchableOpacity
                key={u}
                style={[styles.unitChip, unit === u && styles.unitChipSelected]}
                onPress={() => setUnit(u)}
              >
                <Text style={[styles.unitText, unit === u && styles.unitTextSelected]}>{u}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.freeRow}>
        <Text style={styles.label}>Free / Donation</Text>
        <Switch
          value={isFree}
          onValueChange={setIsFree}
          trackColor={{ true: '#2A5C2A', false: '#D0C4A8' }}
          thumbColor={isFree ? '#D4EDDA' : '#f4f3f4'}
        />
      </View>

      {!isFree && (
        <>
          <Text style={styles.label}>Price per {unit}</Text>
          <TextInput style={styles.input} value={pricePerUnit} onChangeText={setPricePerUnit} placeholder="0.00" keyboardType="numeric" />
        </>
      )}

      <Text style={styles.label}>Location</Text>
      <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="e.g. Iqaluit, Nunavut" />

      <Text style={styles.label}>Tags (comma-separated)</Text>
      <TextInput style={styles.input} value={tags} onChangeText={setTags} placeholder="e.g. organic, frozen, halal" />

      <Text style={styles.label}>Product Images (up to 4)</Text>
      <TouchableOpacity style={styles.uploadButton} onPress={pickImages}>
        {images.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {images.map((img, i) => (
              <Image key={i} source={{ uri: img.uri }} style={styles.previewThumb} />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.uploadPlaceholder}>
            <Text style={styles.uploadIcon}></Text>
            <Text style={styles.uploadText}>Tap to add photos</Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.submitButton, loading && { opacity: 0.6 }]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>
            {isEdit ? 'Update Listing' : 'Post Listing'}
          </Text>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5E6C8' },
  scrollContent: { padding: 20, paddingTop: 60 },
  heading: { fontSize: 24, fontWeight: '800', color: '#2A5C2A', marginBottom: 20, fontFamily: 'Nunito_800ExtraBold' },
  label: { fontSize: 14, fontWeight: '600', color: '#3A3A3A', marginBottom: 6, marginTop: 14, fontFamily: 'Nunito_400Regular' },
  input: {
    borderWidth: 1.5, borderColor: '#D0C4A8', borderRadius: 14, padding: 14, fontSize: 16, backgroundColor: '#FFFFFF', fontFamily: 'Nunito_400Regular',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999,
    backgroundColor: '#FAF0DC', borderWidth: 1.5, borderColor: '#D0C4A8',
  },
  chipSelected: { backgroundColor: '#D4EDDA', borderColor: '#2A5C2A' },
  chipText: { fontSize: 13, color: '#7A7A7A', fontFamily: 'Nunito_400Regular' },
  chipTextSelected: { color: '#2A5C2A', fontWeight: '700', fontFamily: 'Nunito_400Regular' },
  row: { flexDirection: 'row' },
  unitRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  unitChip: {
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14,
    backgroundColor: '#FAF0DC', borderWidth: 1.5, borderColor: '#D0C4A8',
  },
  unitChipSelected: { backgroundColor: '#D4EDDA', borderColor: '#2A5C2A' },
  unitText: { fontSize: 13, color: '#7A7A7A' },
  unitTextSelected: { color: '#2A5C2A', fontWeight: '700' },
  freeRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14,
  },
  uploadButton: {
    borderWidth: 2, borderColor: '#D0C4A8', borderStyle: 'dashed',
    borderRadius: 14, overflow: 'hidden', marginTop: 4,
  },
  uploadPlaceholder: {
    height: 100, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAF0DC',
  },
  uploadIcon: { fontSize: 28, marginBottom: 4 },
  uploadText: { fontSize: 13, color: '#7A7A7A' },
  previewThumb: { width: 100, height: 100, marginRight: 8, borderRadius: 14 },
  submitButton: {
    backgroundColor: '#F5C200', borderRadius: 999, paddingVertical: 16,
    alignItems: 'center', marginTop: 24, borderWidth: 2, borderColor: '#1A1A1A',
  },
  submitButtonText: { color: '#1A1A1A', fontSize: 17, fontWeight: '800', fontFamily: 'Nunito_800ExtraBold' },
});

export default CreateListingScreen;
