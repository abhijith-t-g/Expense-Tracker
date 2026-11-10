import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Category } from '@/types/database';

interface CategorySelectorProps {
  categories: Category[];
  selectedCategoryId?: number;
  onSelectCategory: (categoryId?: number) => void;
}

export function CategorySelector({
  categories,
  selectedCategoryId,
  onSelectCategory,
}: CategorySelectorProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}>
        {/* All Categories Option */}
        <Pressable
          style={[
            styles.chip,
            {
              backgroundColor:
                selectedCategoryId === undefined
                  ? theme.primary
                  : theme.card,
              borderColor:
                selectedCategoryId === undefined
                  ? theme.primary
                  : theme.border,
            },
          ]}
          onPress={() => onSelectCategory(undefined)}>
          <Text
            style={[
              styles.chipText,
              {
                color:
                  selectedCategoryId === undefined
                    ? '#FFFFFF'
                    : theme.textSecondary,
                fontWeight: selectedCategoryId === undefined ? '700' : '500',
              },
            ]}>
            All Categories
          </Text>
        </Pressable>

        {/* Dynamic Categories */}
        {categories.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;
          return (
            <Pressable
              key={cat.id}
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected
                    ? theme.primary
                    : theme.card,
                  borderColor: isSelected ? theme.primary : theme.border,
                },
              ]}
              onPress={() =>
                onSelectCategory(isSelected ? undefined : cat.id)
              }>
              <View
                style={[
                  styles.colorDot,
                  { backgroundColor: cat.color },
                ]}
              />
              <Text
                style={[
                  styles.chipText,
                  {
                    color: isSelected ? '#FFFFFF' : theme.text,
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
    marginVertical: Spacing.half,
  },
  scrollList: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingVertical: Spacing.half,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: Radius.full,
  },
  chipText: {
    fontSize: 13,
  },
});

