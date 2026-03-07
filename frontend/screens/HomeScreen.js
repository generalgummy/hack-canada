import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import {
  DUMMY_HUNTER_POSTS,
  DUMMY_COMMUNITY_POSTS,
  DUMMY_SUPPLIER_POSTS,
} from '../data/dummyData';

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  // Get posts based on user type
  const getPosts = () => {
    if (user?.userType === 'hunter') {
      // Hunters see community requests and other hunters
      return [...DUMMY_COMMUNITY_POSTS, ...DUMMY_HUNTER_POSTS].sort(
        (a, b) => b.timestamp - a.timestamp
      );
    } else if (user?.userType === 'community') {
      // Communities see hunters and suppliers
      return [...DUMMY_HUNTER_POSTS, ...DUMMY_SUPPLIER_POSTS].sort(
        (a, b) => b.timestamp - a.timestamp
      );
    } else if (user?.userType === 'supplier') {
      // Suppliers see communities and hunters
      return [...DUMMY_COMMUNITY_POSTS, ...DUMMY_HUNTER_POSTS].sort(
        (a, b) => b.timestamp - a.timestamp
      );
    }
    return [];
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const posts = getPosts();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hi {user?.name?.split(' ')[0]}! 👋</Text>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.postWrapper}
            activeOpacity={0.7}
            onPress={() => console.log('Post tapped:', item.id)}
          >
            <PostCard post={item} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No posts yet</Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2E7D32']} />
        }
        contentContainerStyle={styles.listContent}
        scrollEnabled={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F9F5',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  greeting: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B5E20',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  postWrapper: {
    marginBottom: 8,
    marginHorizontal: 4,
  },
  empty: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
});

export default HomeScreen;
