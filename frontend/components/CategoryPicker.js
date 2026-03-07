import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

const CATEGORIES = [
  { key: 'all', label: 'All', icon: '🍽️' },
  { key: 'meat', label: 'Meat', icon: '🥩' },
  { key: 'grains', label: 'Grains', icon: '🌾' },
  { key: 'rice', label: 'Rice', icon: '🍚' },
  { key: 'vegetables', label: 'Vegetables', icon: '🥬' },
  { key: 'dry_rations', label: 'Dry Rations', icon: '📦' },
  { key: 'other', label: 'Other', icon: '🥫' },
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
          <Text style={styles.icon}>{cat.icon}</Text>
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
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  chipSelected: {
    backgroundColor: '#E8F5E9',
    borderColor: '#2E7D32',
  },
  icon: {
    fontSize: 16,
    marginRight: 4,
  },
  label: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  labelSelected: {
    color: '#2E7D32',
    fontWeight: '700',
  },
});

export default CategoryPicker;
