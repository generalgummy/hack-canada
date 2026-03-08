import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getListingAPI, expressInterestAPI, createOrderAPI } from '../services/api';
import StatusBadge from '../components/StatusBadge';

const ListingDetailScreen = ({ route, navigation }) => {
  const { listingId } = route.params;
  const { user } = useAuth();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orderModal, setOrderModal] = useState(false);
  const [orderQuantity, setOrderQuantity] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchListing();
  }, []);

  const fetchListing = async () => {
    try {
      const res = await getListingAPI(listingId);
      setListing(res.data.listing);
    } catch (error) {
      Alert.alert('Error', 'Failed to load listing');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleExpressInterest = async () => {
    try {
      await expressInterestAPI(listingId);
      Alert.alert('Success', 'Interest expressed! The seller will be notified.');
      fetchListing();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to express interest');
    }
  };

  const handlePlaceOrder = async () => {
    if (!orderQuantity || parseFloat(orderQuantity) <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }
    setSubmitting(true);
    try {
      await createOrderAPI({
        listingId,
        quantityRequested: parseFloat(orderQuantity),
        deliveryAddress,
        notes: orderNotes,
      });
      setOrderModal(false);
      Alert.alert('Order Placed!', 'Your order has been submitted. Check Orders tab for updates.', [
        { text: 'View Orders', onPress: () => navigation.navigate('Orders') },
        { text: 'OK' },
      ]);
      fetchListing();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  if (!listing) return null;

  const quantityAvailable = listing.quantity - (listing.quantityReserved || 0);
  const isOwner = listing.seller?._id === user?._id;
  const isCommunity = user?.userType === 'community';
  const alreadyInterested = listing.interestedParties?.some(
    (p) => (p._id || p) === user?._id
  );

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Images */}
        {listing.images && listing.images.length > 0 ? (
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
            {listing.images.map((img, i) => (
              <Image
                key={i}
                source={{ uri: img.url || img }}
                style={styles.heroImage}
              />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderEmoji}></Text>
          </View>
        )}

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{listing.title}</Text>
            <StatusBadge status={listing.status} />
          </View>

          <Text style={styles.category}>
            {listing.category?.replace('_', ' ')}
          </Text>

          {/* Price */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>
              {listing.isFree ? 'Free / Donation' : `$${listing.pricePerUnit} / ${listing.unit}`}
            </Text>
          </View>

          {/* Quantity */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Available</Text>
              <Text style={styles.infoValue}>
                {quantityAvailable} {listing.unit}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Total</Text>
              <Text style={styles.infoValue}>
                {listing.quantity} {listing.unit}
              </Text>
            </View>
            {listing.expirationDate && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Expires</Text>
                <Text style={styles.infoValue}>
                  {new Date(listing.expirationDate).toLocaleDateString()}
                </Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue}>{listing.location || 'N/A'}</Text>
            </View>
          </View>

          {/* Description */}
          {listing.description && (
            <View style={styles.descSection}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{listing.description}</Text>
            </View>
          )}

          {/* Tags */}
          {listing.tags?.length > 0 && (
            <View style={styles.tagsRow}>
              {listing.tags.map((tag, i) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Seller Info */}
          {listing.seller && (
            <View style={styles.sellerCard}>
              <Text style={styles.sectionTitle}>Seller</Text>
              <Text style={styles.sellerName}>
              {listing.seller.name}{listing.seller.isVerified ? ' \u2713' : ''}
              </Text>
              <Text style={styles.sellerInfo}>
              {listing.seller.location || 'Unknown'} · {listing.seller.userType}
              </Text>
            </View>
          )}

          {/* Interested Parties */}
          {isOwner && listing.interestedParties?.length > 0 && (
            <View style={styles.interestedSection}>
              <Text style={styles.sectionTitle}>
                Interested Parties ({listing.interestedParties.length})
              </Text>
              {listing.interestedParties.map((party) => (
                <Text key={party._id || party} style={styles.partyName}>
                  {party.name || 'Community'} - {party.location || ''}
                </Text>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      {!isOwner && isCommunity && listing.status === 'available' && (
        <View style={styles.actionBar}>
          {!alreadyInterested && (
            <TouchableOpacity style={styles.interestButton} onPress={handleExpressInterest}>
              <Text style={styles.interestButtonText}>Express Interest</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.orderButton}
            onPress={() => {
              setDeliveryAddress(user?.address || '');
              setOrderModal(true);
            }}
          >
            <Text style={styles.orderButtonText}>Place Order</Text>
          </TouchableOpacity>
        </View>
      )}

      {isOwner && (
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('CreateListing', { listing })}
          >
            <Text style={styles.editButtonText}>Edit Listing</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Order Modal */}
      <Modal visible={orderModal} animationType="slide" transparent>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Place Order</Text>
            <Text style={styles.modalSubtitle}>{listing.title}</Text>

            <Text style={styles.modalLabel}>
              Quantity ({listing.unit}) â€” Max: {quantityAvailable}
            </Text>
            <TextInput
              style={styles.modalInput}
              value={orderQuantity}
              onChangeText={setOrderQuantity}
              placeholder={`Amount in ${listing.unit}`}
              keyboardType="numeric"
            />

            <Text style={styles.modalLabel}>Delivery Address</Text>
            <TextInput
              style={styles.modalInput}
              value={deliveryAddress}
              onChangeText={setDeliveryAddress}
              placeholder="Enter delivery address"
              multiline
            />

            <Text style={styles.modalLabel}>Notes (optional)</Text>
            <TextInput
              style={[styles.modalInput, { height: 60 }]}
              value={orderNotes}
              onChangeText={setOrderNotes}
              placeholder="Any special instructions"
              multiline
            />

            {orderQuantity && !listing.isFree && (
              <Text style={styles.totalPrice}>
                Total: ${(parseFloat(orderQuantity || 0) * listing.pricePerUnit).toFixed(2)}
              </Text>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setOrderModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, submitting && { opacity: 0.6 }]}
                onPress={handlePlaceOrder}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Confirm Order</Text>
                )}
              </TouchableOpacity>
            </View>
            </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5E6C8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heroImage: { width: Dimensions.get('window').width, height: 250, resizeMode: 'cover' },
  imagePlaceholder: {
    height: 200, backgroundColor: '#D4EDDA', justifyContent: 'center', alignItems: 'center',
  },
  placeholderEmoji: { fontSize: 64 },
  content: { padding: 20 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: 22, fontWeight: '800', color: '#2A5C2A', flex: 1, marginRight: 10, fontFamily: 'Nunito_800ExtraBold' },
  category: { fontSize: 14, color: '#7A7A7A', textTransform: 'capitalize', marginBottom: 12, fontFamily: 'Nunito_400Regular' },
  priceRow: { marginBottom: 16 },
  price: { fontSize: 20, fontWeight: '700', color: '#2A5C2A', fontFamily: 'Nunito_800ExtraBold' },
  infoCard: {
    backgroundColor: '#FAF0DC', borderRadius: 20, padding: 16, marginBottom: 16,
    elevation: 1, shadowColor: '#2A5C2A', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4,
    borderWidth: 1, borderColor: 'rgba(42,92,42,0.08)',
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  infoLabel: { fontSize: 14, color: '#7A7A7A', fontFamily: 'Nunito_400Regular' },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', fontFamily: 'Nunito_400Regular' },
  descSection: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 8, fontFamily: 'Nunito_800ExtraBold' },
  description: { fontSize: 14, color: '#3A3A3A', lineHeight: 22, fontFamily: 'Nunito_400Regular' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  tag: { backgroundColor: '#D4EDDA', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  tagText: { fontSize: 12, color: '#2A5C2A', fontWeight: '600', fontFamily: 'Nunito_400Regular' },
  sellerCard: {
    backgroundColor: '#FAF0DC', borderRadius: 20, padding: 16, marginBottom: 16,
    elevation: 1, shadowColor: '#2A5C2A', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4,
    borderWidth: 1, borderColor: 'rgba(42,92,42,0.08)',
  },
  sellerName: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', fontFamily: 'Nunito_400Regular' },
  sellerInfo: { fontSize: 13, color: '#7A7A7A', marginTop: 4, textTransform: 'capitalize', fontFamily: 'Nunito_400Regular' },
  interestedSection: { marginBottom: 16 },
  partyName: { fontSize: 14, color: '#3A3A3A', marginBottom: 4 },
  actionBar: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 10,
    backgroundColor: '#FAF0DC', borderTopWidth: 1, borderTopColor: 'rgba(42,92,42,0.10)',
  },
  interestButton: {
    flex: 1, backgroundColor: '#FAF0DC', borderRadius: 20, paddingVertical: 14,
    alignItems: 'center', borderWidth: 1.5, borderColor: '#2A5C2A',
  },
  interestButtonText: { fontSize: 15, fontWeight: '700', color: '#2A5C2A' },
  orderButton: {
    flex: 1, backgroundColor: '#F5C200', borderRadius: 999, paddingVertical: 14, alignItems: 'center',
    borderWidth: 2, borderColor: '#1A1A1A',
  },
  orderButtonText: { fontSize: 15, fontWeight: '800', color: '#1A1A1A', fontFamily: 'Nunito_800ExtraBold' },
  editButton: {
    flex: 1, backgroundColor: '#4A90D9', borderRadius: 20, paddingVertical: 14, alignItems: 'center',
  },
  editButtonText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FAF0DC', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 40, maxHeight: '85%',
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#2A5C2A', marginBottom: 4, fontFamily: 'Nunito_800ExtraBold' },
  modalSubtitle: { fontSize: 14, color: '#7A7A7A', marginBottom: 16, fontFamily: 'Nunito_400Regular' },
  modalLabel: { fontSize: 13, fontWeight: '600', color: '#3A3A3A', marginBottom: 4, marginTop: 10, fontFamily: 'Nunito_400Regular' },
  modalInput: {
    borderWidth: 1.5, borderColor: '#D0C4A8', borderRadius: 14, padding: 12, fontSize: 15, backgroundColor: '#FFFFFF', fontFamily: 'Nunito_400Regular',
  },
  totalPrice: { fontSize: 18, fontWeight: '700', color: '#2A5C2A', marginTop: 12, textAlign: 'right' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 20, marginBottom: 10 },
  cancelButton: {
    flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 20,
    borderWidth: 1.5, borderColor: '#D0C4A8', backgroundColor: '#FFFFFF',
  },
  cancelButtonText: { fontSize: 15, fontWeight: '600', color: '#7A7A7A' },
  confirmButton: {
    flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 20, backgroundColor: '#2A5C2A',
  },
  confirmButtonText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});

export default ListingDetailScreen;
