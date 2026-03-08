import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { getListingsAPI } from '../services/api';
import ListingCard from '../components/ListingCard';
import { Ionicons } from '@expo/vector-icons';
import CategoryPicker from '../components/CategoryPicker';

const ListingsScreen = ({ navigation }) => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState(null);
  const [locationSearch, setLocationSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchListings = async (reset = false) => {
    try {
      const currentPage = reset ? 1 : page;
      const params = { page: currentPage, limit: 15, status: 'available' };
      if (category) params.category = category;
      if (locationSearch.trim()) params.location = locationSearch.trim();

      const res = await getListingsAPI(params);
      const newListings = res.data.listings;

      if (reset) {
        setListings(newListings);
        setPage(2);
      } else {
        setListings((prev) => [...prev, ...newListings]);
        setPage((p) => p + 1);
      }
      setHasMore(res.data.page < res.data.pages);
    } catch (error) {
      console.log('Listings error:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchListings(true);
  }, [category]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchListings(true);
  }, [category, locationSearch]);

  const onEndReached = () => {
    if (hasMore && !loading) {
      fetchListings(false);
    }
  };

  const handleSearch = () => {
    setLoading(true);
    fetchListings(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Available Food</Text>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            value={locationSearch}
            onChangeText={setLocationSearch}
            placeholder="Search by location..."
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>
        <CategoryPicker selected={category} onSelect={setCategory} />
      </View>

      {loading && listings.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2A5C2A" />
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <ListingCard
              listing={item}
              onPress={() =>
                navigation.navigate('ListingDetail', { listingId: item._id })
              }
            />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2A5C2A']} />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="basket-outline" size={56} color="#2A5C2A" style={{ marginBottom: 12, opacity: 0.5 }} />
              <Text style={styles.emptyText}>No listings available</Text>
              <Text style={styles.emptySubtext}>Check back soon for new harvests and supplies</Text>
            </View>
          }
          contentContainerStyle={listings.length === 0 && { flex: 1 }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5E6C8' },
  header: { paddingTop: 60, backgroundColor: '#2A5C2A', borderBottomWidth: 0 },
  title: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', paddingHorizontal: 20, marginBottom: 12, fontFamily: 'Nunito_800ExtraBold' },
  searchRow: { paddingHorizontal: 16, marginBottom: 8 },
  searchInput: {
    backgroundColor: '#FFFFFF', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 15, borderWidth: 1.5, borderColor: '#D0C4A8', fontFamily: 'Nunito_400Regular',
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#3A3A3A', fontFamily: 'Nunito_800ExtraBold' },
  emptySubtext: { fontSize: 14, color: '#7A7A7A', marginTop: 4, textAlign: 'center', paddingHorizontal: 40, fontFamily: 'Nunito_400Regular' },
});

export default ListingsScreen;
