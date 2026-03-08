import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, F } from '../theme';

// Map React Navigation route names to Ionicons icon names [active, inactive]
const ICONS = {
  Home:     ['home',        'home-outline'],
  Listings: ['storefront',  'storefront-outline'],
  Browse:   ['search',      'search-outline'],
  Orders:   ['cube',        'cube-outline'],
  Requests: ['clipboard',   'clipboard-outline'],
  Chat:     ['chatbubbles', 'chatbubbles-outline'],
  Profile:  ['person',      'person-outline'],
};

function TabBtn({ route, isFocused, onPress }) {
  const scale = useSharedValue(1);
  const [active, inactive] = ICONS[route.name] || ['ellipse', 'ellipse-outline'];

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.82, { stiffness: 500, damping: 14 }, (finished) => {
      'worklet';
      if (finished) scale.value = withSpring(1, { stiffness: 280, damping: 18 });
    });
    onPress();
  };

  const iconColor  = isFocused ? colors.yellow : 'rgba(255,255,255,0.48)';
  const labelColor = isFocused ? colors.yellow : 'rgba(255,255,255,0.48)';

  return (
    <TouchableOpacity
      style={styles.item}
      onPress={handlePress}
      activeOpacity={1}
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
    >
      <Animated.View style={[styles.iconWrap, animStyle]}>
        <Ionicons name={isFocused ? active : inactive} size={23} color={iconColor} />
        {isFocused && <View style={styles.dot} />}
      </Animated.View>
      <Text style={[styles.label, { color: labelColor }]}>{route.name}</Text>
    </TouchableOpacity>
  );
}

export default function FloatingTabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 12);

  const rows = state.routes.map((route, index) => {
    const isFocused = state.index === index;
    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };
    return <TabBtn key={route.key} route={route} isFocused={isFocused} onPress={onPress} />;
  });

  const Inner = <View style={styles.row}>{rows}</View>;

  if (Platform.OS === 'ios') {
    return (
      <View style={[styles.wrapper, { bottom }]}>
        <BlurView intensity={78} tint="dark" style={styles.glass}>
          {Inner}
        </BlurView>
      </View>
    );
  }

  return (
    <View style={[styles.wrapper, { bottom }]}>
      <View style={[styles.glass, { backgroundColor: 'rgba(26, 56, 26, 0.96)' }]}>
        {Inner}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left:     18,
    right:    18,
    // Raise above screen content
    zIndex:   999,
  },
  glass: {
    borderRadius: 30,
    overflow:     'hidden',
    borderWidth:  1,
    borderColor:  'rgba(255,255,255,0.10)',
    shadowColor:  '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius:  22,
    elevation:     16,
  },
  row: {
    flexDirection:     'row',
    paddingVertical:   10,
    paddingHorizontal: 8,
  },
  item: {
    flex:            1,
    alignItems:      'center',
    justifyContent:  'center',
    paddingVertical: 2,
  },
  iconWrap: {
    position:       'relative',
    alignItems:     'center',
    justifyContent: 'center',
    width:          38,
    height:         30,
  },
  dot: {
    position:        'absolute',
    top:             -2,
    right:           2,
    width:           7,
    height:          7,
    borderRadius:    4,
    backgroundColor: colors.yellow,
  },
  label: {
    fontFamily: F.semibold,
    fontSize:   10,
    marginTop:  3,
  },
});
