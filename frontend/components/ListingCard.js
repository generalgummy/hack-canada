import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import StatusBadge from './StatusBadge';

const CATEGORY_ICONS = {
  meat: '🥩',
  grains: '🌾',
  rice: '🍚',
  vegetables: '🥬',
  dry_rations: '📦',
  other: '🍽️',
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
          <Text style={styles.categoryIcon}>
            {CATEGORY_ICONS[listing.category] || '🍽️'}
          </Text>
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
          {CATEGORY_ICONS[listing.category]} {listing.category?.replace('_', ' ')}
        </Text>

        <View style={styles.detailRow}>
          <Text style={styles.quantity}>
            {quantityAvailable} {listing.unit} available
          </Text>
          <Text style={styles.price}>
            {listing.isFree ? '🆓 Free / Donation' : `$${listing.pricePerUnit}/${listing.unit}`}
          </Text>
        </View>

        <View style={styles.bottomRow}>
          <Text style={styles.location} numberOfLines={1}>
            📍 {listing.location || 'Unknown'}
          </Text>
          {listing.seller && (
            <Text style={styles.seller} numberOfLines={1}>
              {listing.seller.name} {listing.seller.isVerified ? '✓' : ''}
            </Text>
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
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: 100,
    backgroundColor: '#E8F5E9',
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
    color: '#1B5E20',
    flex: 1,
    marginRight: 8,
  },
  category: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
    textTransform: 'capitalize',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  quantity: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  price: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  location: {
    fontSize: 12,
    color: '#888',
    flex: 1,
  },
  seller: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
  },
  expiry: {
    fontSize: 11,
    color: '#F57C00',
    marginTop: 4,
  },
});

export default ListingCard;
