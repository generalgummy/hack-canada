import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, F, spacing, radius } from '../theme';

export default function EmptyState({ icon = 'basket-outline', title, subtitle, actionLabel, onAction }) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={56} color={colors.muted} />
      {title    && <Text style={styles.title}>{title}</Text>}
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {actionLabel && onAction && (
        <TouchableOpacity style={styles.btn} onPress={onAction} activeOpacity={0.8}>
          <Text style={styles.btnText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    padding:        spacing.xl,
    gap:            10,
  },
  title: {
    fontFamily: F.bold,
    fontSize:   18,
    color:      colors.text,
    textAlign:  'center',
    marginTop:  8,
  },
  subtitle: {
    fontFamily: F.regular,
    fontSize:   14,
    color:      colors.muted,
    textAlign:  'center',
  },
  btn: {
    marginTop:        12,
    backgroundColor:  colors.green,
    borderRadius:     radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical:  10,
  },
  btnText: {
    fontFamily: F.bold,
    fontSize:   14,
    color:      '#fff',
  },
});
