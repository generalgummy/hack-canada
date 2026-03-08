import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

const PostCard = ({ post, onPress }) => {
  const formatTime = (date) => {
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getTypeColor = (userType) => {
    switch (userType) {
      case 'hunter':
        return '#E8834A';
      case 'community':
        return '#2A5C2A';
      case 'supplier':
        return '#4A90D9';
      default:
        return '#7A7A7A';
    }
  };

  const getTypeLabel = (userType) => {
    switch (userType) {
      case 'hunter':
        return 'Hunter';
      case 'community':
        return 'Community';
      case 'supplier':
        return 'Supplier';
      default:
        return userType;
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header with avatar and info */}
      <View style={styles.header}>
        <Text style={styles.avatar}>{post.avatar}</Text>
        <View style={styles.headerInfo}>
          <Text style={styles.author}>{post.author}</Text>
          <View style={styles.metaRow}>
            <Text
              style={[
                styles.userType,
                { color: getTypeColor(post.userType) },
              ]}
            >
              {getTypeLabel(post.userType)}
            </Text>
            <Text style={styles.dot}>{'\u2022'}</Text>
            <Text style={styles.timestamp}>{formatTime(post.timestamp)}</Text>
          </View>
          {post.location && (
            <Text style={styles.location}>{post.location}</Text>
          )}
        </View>
      </View>

      {/* Content */}
      <Text style={styles.content} numberOfLines={3}>
        {post.content}
      </Text>

      {/* Image */}
      {post.imageUrl && (
        <Image
          source={{ uri: post.imageUrl }}
          style={styles.image}
        />
      )}

      {/* Stats */}
      <View style={styles.stats}>
        <Text style={styles.statText}>{'\u2764'} {post.likes}</Text>
        <Text style={styles.statText}>{post.comments} comments</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FAF0DC',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#2A5C2A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  avatar: {
    fontSize: 40,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  author: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2A5C2A',
    fontFamily: 'Nunito_400Regular',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  userType: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Nunito_400Regular',
  },
  dot: {
    marginHorizontal: 6,
    color: '#D0C4A8',
  },
  timestamp: {
    fontSize: 12,
    color: '#7A7A7A',
    fontFamily: 'Nunito_400Regular',
  },
  location: {
    fontSize: 11,
    color: '#7A7A7A',
    marginTop: 4,
    fontFamily: 'Nunito_400Regular',
  },
  content: {
    fontSize: 13,
    color: '#3A3A3A',
    lineHeight: 18,
    marginBottom: 12,
    fontFamily: 'Nunito_400Regular',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 14,
    marginBottom: 12,
  },
  stats: {
    flexDirection: 'row',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#D0C4A8',
  },
  statText: {
    fontSize: 12,
    color: '#7A7A7A',
    marginRight: 16,
    fontFamily: 'Nunito_400Regular',
  },
});

export default PostCard;
