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
import { Ionicons } from '@expo/vector-icons';
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
        <ActivityIndicator size="large" color="#2A5C2A" />
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2A5C2A']} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbubbles-outline" size={56} color="#2A5C2A" style={{ marginBottom: 8, opacity: 0.5 }} />
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
  container: { flex: 1, backgroundColor: '#F5E6C8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16,
    backgroundColor: '#2A5C2A', borderBottomWidth: 0,
  },
  title: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', fontFamily: 'Nunito_800ExtraBold' },
  chatRow: {
    flexDirection: 'row', padding: 16, backgroundColor: '#FAF0DC',
    borderBottomWidth: 1, borderBottomColor: 'rgba(42,92,42,0.06)',
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#D4EDDA',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  avatarText: { fontSize: 20, fontWeight: '700', color: '#2A5C2A' },
  chatInfo: { flex: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 15, fontWeight: '700', color: '#1A1A1A', flex: 1, fontFamily: 'Nunito_400Regular' },
  time: { fontSize: 11, color: '#7A7A7A', fontFamily: 'Nunito_400Regular' },
  listingTitle: { fontSize: 12, color: '#2A5C2A', fontWeight: '500', marginTop: 1, fontFamily: 'Nunito_400Regular' },
  lastMessage: { fontSize: 13, color: '#7A7A7A', marginTop: 3, fontFamily: 'Nunito_400Regular' },
  bottomRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6,
  },
  unreadBadge: {
    backgroundColor: '#F5C200', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2,
  },
  unreadText: { color: '#1A1A1A', fontSize: 11, fontWeight: '700' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#3A3A3A', fontFamily: 'Nunito_800ExtraBold' },
  emptySubtext: { fontSize: 13, color: '#7A7A7A', marginTop: 4, fontFamily: 'Nunito_400Regular' },
});

export default ChatListScreen;
