import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CATEGORIES = [
  { key: 'all',         label: 'All',          icon: 'apps-outline' },
  { key: 'meat',        label: 'Meat',         icon: 'restaurant-outline' },
  { key: 'grains',      label: 'Grains',       icon: 'leaf-outline' },
  { key: 'rice',        label: 'Rice',         icon: 'nutrition-outline' },
  { key: 'vegetables',  label: 'Vegetables',   icon: 'flower-outline' },
  { key: 'dry_rations', label: 'Dry Rations',  icon: 'cube-outline' },
  { key: 'other',       label: 'Other',        icon: 'ellipsis-horizontal-outline' },
];

const CategoryPicker = ({ selected, onSelect }) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {CATEGORIES.map((cat) => (
        <TouchableOpacity
          key={cat.key}
          style={[
            styles.chip,
            selected === cat.key && styles.chipSelected,
          ]}
          onPress={() => onSelect(cat.key === 'all' ? null : cat.key)}
        >
          <Ionicons
            name={cat.icon}
            size={16}
            color={selected === cat.key ? '#1A1A1A' : 'rgba(255,255,255,0.85)'}
            style={{ marginRight: 4 }}
          />
          <Text
            style={[
              styles.label,
              selected === cat.key && styles.labelSelected,
            ]}
          >
            {cat.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  chipSelected: {
    backgroundColor: '#F5C200',
    borderColor: '#F5C200',
  },
  label: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    fontFamily: 'Nunito_400Regular',
  },
  labelSelected: {
    color: '#1A1A1A',
    fontWeight: '700',
    fontFamily: 'Nunito_400Regular',
  },
});

export default CategoryPicker;
