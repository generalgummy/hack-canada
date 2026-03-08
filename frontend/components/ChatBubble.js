import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ChatBubble = ({ message, isOwn }) => {
  return (
    <View style={[styles.container, isOwn ? styles.ownContainer : styles.otherContainer]}>
      {!isOwn && message.sender && (
        <Text style={styles.senderName}>{message.sender.name}</Text>
      )}
      <View style={[styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
        <Text style={[styles.text, isOwn ? styles.ownText : styles.otherText]}>
          {message.content}
        </Text>
        <Text style={[styles.time, isOwn ? styles.ownTime : styles.otherTime]}>
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 3,
    marginHorizontal: 12,
    maxWidth: '80%',
  },
  ownContainer: {
    alignSelf: 'flex-end',
  },
  otherContainer: {
    alignSelf: 'flex-start',
  },
  senderName: {
    fontSize: 11,
    color: '#7A7A7A',
    marginBottom: 2,
    marginLeft: 8,
    fontWeight: '600',
    fontFamily: 'Nunito_400Regular',
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
  },
  ownBubble: {
    backgroundColor: '#2A5C2A',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#FAF0DC',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(42,92,42,0.10)',
  },
  text: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'Nunito_400Regular',
  },
  ownText: {
    color: '#fff',
  },
  otherText: {
    color: '#1A1A1A',
  },
  time: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
    fontFamily: 'Nunito_400Regular',
  },
  ownTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  otherTime: {
    color: 'rgba(0,0,0,0.4)',
  },
});

export default ChatBubble;
