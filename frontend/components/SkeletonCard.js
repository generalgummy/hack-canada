import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { radius } from '../theme';

function SkeletonBox({ width, height, style }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: 950 }), -1, true);
  }, []);

  const anim = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ['#E8DCC8', '#F5EDD8']
    ),
  }));

  return (
    <Animated.View
      style={[{ width, height, borderRadius: radius.md }, anim, style]}
    />
  );
}

export default function SkeletonCard() {
  return (
    <View style={styles.card}>
      <SkeletonBox width="100%" height={140} style={{ borderRadius: 12, marginBottom: 10 }} />
      <SkeletonBox width="70%"  height={16}  style={{ marginBottom: 8 }} />
      <SkeletonBox width="45%"  height={12}  />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FDF6EC',
    borderRadius:    14,
    padding:         12,
    marginBottom:    14,
  },
});
