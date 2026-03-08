import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getChatMessagesAPI } from '../services/api';
import { getSocket } from '../services/socket';
import ChatBubble from '../components/ChatBubble';

const ChatRoomScreen = ({ route, navigation }) => {
  const { roomId, title } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [typingUser, setTypingUser] = useState(null);
  const flatListRef = useRef();
  const typingTimeout = useRef(null);

  useEffect(() => {
    navigation.setOptions({ headerTitle: title || 'Chat' });
    loadMessages();
    setupSocket();

    return () => {
      const socket = getSocket();
      if (socket) {
        socket.emit('leave_room', { roomId });
        socket.off('receive_message');
        socket.off('user_typing');
        socket.off('messages_read');
      }
    };
  }, []);

  const loadMessages = async () => {
    try {
      const res = await getChatMessagesAPI(roomId);
      setMessages(res.data.messages);
    } catch (error) {
      console.log('Load messages error:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const setupSocket = () => {
    const socket = getSocket();
    if (!socket) return;

    socket.emit('join_room', { roomId });
    socket.emit('mark_read', { roomId });

    socket.on('receive_message', (message) => {
      setMessages((prev) => [...prev, message]);
      // Auto-mark as read
      socket.emit('mark_read', { roomId });
    });

    socket.on('user_typing', ({ userId, name, isTyping }) => {
      if (userId !== user?._id) {
        setTypingUser(isTyping ? name : null);
      }
    });

    socket.on('messages_read', ({ roomId: readRoomId, userId }) => {
      // Could update read receipts here
    });
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const socket = getSocket();
    if (socket) {
      socket.emit('send_message', { roomId, content: input.trim() });
      socket.emit('typing', { roomId, isTyping: false });
    }
    setInput('');
  };

  const handleTyping = (text) => {
    setInput(text);
    const socket = getSocket();
    if (!socket) return;

    socket.emit('typing', { roomId, isTyping: true });

    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit('typing', { roomId, isTyping: false });
    }, 2000);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2A5C2A" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <ChatBubble
            message={item}
            isOwn={
              (item.sender?._id || item.sender) === user?._id
            }
          />
        )}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Text style={styles.emptyChatText}>
              Start the conversation!
            </Text>
          </View>
        }
      />

      {typingUser && (
        <View style={styles.typingIndicator}>
          <Text style={styles.typingText}>{typingUser} is typing...</Text>
        </View>
      )}

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={handleTyping}
          placeholder="Type a message..."
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!input.trim()}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5E6C8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  messagesList: { paddingVertical: 12, paddingBottom: 8 },
  emptyChat: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  emptyChatText: { fontSize: 16, color: '#7A7A7A', fontFamily: 'Nunito_400Regular' },
  typingIndicator: { paddingHorizontal: 16, paddingVertical: 4 },
  typingText: { fontSize: 12, color: '#7A7A7A', fontStyle: 'italic', fontFamily: 'Nunito_400Regular' },
  inputBar: {
    flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: '#FAF0DC', borderTopWidth: 1, borderTopColor: 'rgba(42,92,42,0.10)',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 20, paddingHorizontal: 16,
    paddingVertical: 10, fontSize: 15, maxHeight: 100, marginRight: 8,
    borderWidth: 1, borderColor: '#D0C4A8', fontFamily: 'Nunito_400Regular',
  },
  sendButton: {
    backgroundColor: '#2A5C2A', borderRadius: 20, paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sendButtonDisabled: { opacity: 0.5 },
  sendButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15, fontFamily: 'Nunito_400Regular' },
});

export default ChatRoomScreen;
