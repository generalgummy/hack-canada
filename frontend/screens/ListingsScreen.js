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
            placeholder="🔍 Search by location..."
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>
        <CategoryPicker selected={category} onSelect={setCategory} />
      </View>

      {loading && listings.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2E7D32" />
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
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2E7D32']} />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🍽️</Text>
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
  container: { flex: 1, backgroundColor: '#F5F9F5' },
  header: { paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  title: { fontSize: 24, fontWeight: '800', color: '#1B5E20', paddingHorizontal: 20, marginBottom: 12 },
  searchRow: { paddingHorizontal: 16, marginBottom: 8 },
  searchInput: {
    backgroundColor: '#F5F5F5', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 15, borderWidth: 1, borderColor: '#E0E0E0',
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#666' },
  emptySubtext: { fontSize: 14, color: '#999', marginTop: 4, textAlign: 'center', paddingHorizontal: 40 },
});

export default ListingsScreen;
