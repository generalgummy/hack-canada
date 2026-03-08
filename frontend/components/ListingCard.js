import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StatusBadge from './StatusBadge';

const CATEGORY_ICONS = {
  meat:        'restaurant-outline',
  grains:      'leaf-outline',
  rice:        'nutrition-outline',
  vegetables:  'flower-outline',
  dry_rations: 'cube-outline',
  other:       'restaurant-outline',
};

const ListingCard = ({ listing, onPress }) => {
  const quantityAvailable = listing.quantityAvailable ?? listing.quantity - (listing.quantityReserved || 0);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {listing.images && listing.images.length > 0 ? (
        <Image
          source={{ uri: listing.images[0].url || listing.images[0] }}
          style={styles.image}
        />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Ionicons
            name={CATEGORY_ICONS[listing.category] || 'restaurant-outline'}
            size={40}
            color="#2A5C2A"
          />
        </View>
      )}

      <View style={styles.info}>
        <View style={styles.topRow}>
          <Text style={styles.title} numberOfLines={1}>
            {listing.title}
          </Text>
          <StatusBadge status={listing.status} />
        </View>

        <Text style={styles.category}>
          {listing.category?.replace('_', ' ')}
        </Text>

        <View style={styles.detailRow}>
          <Text style={styles.quantity}>
            {quantityAvailable} {listing.unit} available
          </Text>
          <Text style={styles.price}>
            {listing.isFree ? 'Free / Donation' : `$${listing.pricePerUnit}/${listing.unit}`}
          </Text>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={12} color="#7A7A7A" />
            <Text style={styles.location} numberOfLines={1}>{listing.location || 'Unknown'}</Text>
          </View>
          {listing.seller && (
            <View style={styles.sellerRow}>
              <Text style={styles.seller} numberOfLines={1}>{listing.seller.name}</Text>
              {listing.seller.isVerified && <Ionicons name="checkmark-circle" size={12} color="#2A5C2A" style={{ marginLeft: 2 }} />}
            </View>
          )}
        </View>

        {listing.expirationDate && (
          <Text style={styles.expiry}>
            Expires: {new Date(listing.expirationDate).toLocaleDateString()}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FAF0DC',
    borderRadius: 20,
    marginHorizontal: 16,
    marginVertical: 6,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#2A5C2A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(42,92,42,0.08)',
  },
  image: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: 100,
    backgroundColor: '#D4EDDA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 40,
  },
  info: {
    padding: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2A5C2A',
    flex: 1,
    marginRight: 8,
    fontFamily: 'Nunito_800ExtraBold',
  },
  category: {
    fontSize: 13,
    color: '#7A7A7A',
    marginBottom: 6,
    textTransform: 'capitalize',
    fontFamily: 'Nunito_400Regular',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  quantity: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Nunito_400Regular',
  },
  price: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A5C2A',
    fontFamily: 'Nunito_400Regular',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 2,
  },
  location: {
    fontSize: 12,
    color: '#7A7A7A',
    flex: 1,
    fontFamily: 'Nunito_400Regular',
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seller: {
    fontSize: 12,
    color: '#3A3A3A',
    fontWeight: '500',
    fontFamily: 'Nunito_400Regular',
  },
  expiry: {
    fontSize: 11,
    color: '#E8834A',
    marginTop: 4,
    fontFamily: 'Nunito_400Regular',
  },
});

export default ListingCard;
