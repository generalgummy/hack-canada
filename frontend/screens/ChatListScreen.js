import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { getChatRoomsAPI } from '../services/api';
import StatusBadge from '../components/StatusBadge';

const ChatListScreen = ({ navigation }) => {
  const [chatRooms, setChatRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchChats = async () => {
    try {
      const res = await getChatRoomsAPI();
      setChatRooms(res.data.chatRooms);
    } catch (error) {
      console.log('Chat list error:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  // Refresh when screen is focused
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchChats();
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchChats();
  }, []);

  const renderChatRoom = ({ item }) => (
    <TouchableOpacity
      style={styles.chatRow}
      onPress={() =>
        navigation.navigate('ChatRoom', {
          roomId: item.roomId,
          title: item.listingTitle,
        })
      }
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.otherParty?.name?.charAt(0)?.toUpperCase() || '?'}
        </Text>
      </View>

      <View style={styles.chatInfo}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>
            {item.otherParty?.name || 'Unknown'}
          </Text>
          {item.lastMessage?.timestamp && (
            <Text style={styles.time}>
              {new Date(item.lastMessage.timestamp).toLocaleDateString()}
            </Text>
          )}
        </View>

        <Text style={styles.listingTitle} numberOfLines={1}>
          {item.listingTitle}
        </Text>

        {item.lastMessage ? (
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage.senderName}: {item.lastMessage.content}
          </Text>
        ) : (
          <Text style={styles.lastMessage}>No messages yet</Text>
        )}

        <View style={styles.bottomRow}>
          <StatusBadge status={item.orderStatus} />
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>

      <FlatList
        data={chatRooms}
        keyExtractor={(item) => item.roomId}
        renderItem={renderChatRoom}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2E7D32']} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyText}>No conversations yet</Text>
            <Text style={styles.emptySubtext}>Place or receive an order to start chatting</Text>
          </View>
        }
        contentContainerStyle={chatRooms.length === 0 && { flex: 1 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F9F5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E0E0E0',
  },
  title: { fontSize: 24, fontWeight: '800', color: '#1B5E20' },
  chatRow: {
    flexDirection: 'row', padding: 16, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#E8F5E9',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  avatarText: { fontSize: 20, fontWeight: '700', color: '#2E7D32' },
  chatInfo: { flex: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 15, fontWeight: '700', color: '#333', flex: 1 },
  time: { fontSize: 11, color: '#999' },
  listingTitle: { fontSize: 12, color: '#2E7D32', fontWeight: '500', marginTop: 1 },
  lastMessage: { fontSize: 13, color: '#888', marginTop: 3 },
  bottomRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6,
  },
  unreadBadge: {
    backgroundColor: '#2E7D32', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2,
  },
  unreadText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 8 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#666' },
  emptySubtext: { fontSize: 13, color: '#999', marginTop: 4 },
});

export default ChatListScreen;
