import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { colors, F } from '../theme';

export default function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const unsub = NetInfo.addEventListener(state => {
      setOffline(!state.isConnected);
    });
    return unsub;
  }, []);

  if (!offline) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>No internet connection</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.yellow,
    paddingVertical:  6,
    alignItems:      'center',
  },
  text: {
    fontFamily: F.bold,
    fontSize:   13,
    color:      '#5A3E00',
  },
});
