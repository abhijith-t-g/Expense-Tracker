import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Category } from '@/types/database';

interface CategoryPickerProps {
  categories: Category[];
  selectedCategoryId: number | null;
  onSelectCategory: (id: number) => void;
}

export function CategoryPicker({
  categories,
  selectedCategoryId,
  onSelectCategory,
}: CategoryPickerProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>Category</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {categories.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;
          const iconName = (cat.icon in Ionicons.glyphMap
            ? cat.icon
            : 'pricetag') as keyof typeof Ionicons.glyphMap;

          return (
            <Pressable
              key={cat.id}
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected
                    ? theme.backgroundSelected
                    : theme.card,
                  borderColor: isSelected ? theme.primary : theme.border,
                },
              ]}
              onPress={() => onSelectCategory(cat.id)}>
              <View
                style={[
                  styles.iconBadge,
                  { backgroundColor: cat.color + '22' },
                ]}>
                <Ionicons name={iconName} size={16} color={cat.color} />
              </View>
              <Text
                style={[
                  styles.name,
                  {
                    color: isSelected ? theme.primary : theme.text,
                    fontWeight: isSelected ? '700' : '500',
                  },
                ]}>
                {cat.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scrollContent: {
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.full,
    borderWidth: 1.5,
  },
  iconBadge: {
    width: 24,
    height: 24,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 13,
  },
});
