import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface AddTransactionButtonProps {
  variant?: 'floating' | 'banner';
}

export function AddTransactionButton({
  variant = 'floating',
}: AddTransactionButtonProps) {
  const theme = useTheme();

  if (variant === 'banner') {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.bannerBtn,
          {
            backgroundColor: pressed ? theme.primaryDark : theme.primary,
          },
        ]}
        onPress={() => router.push('/add')}>
        <Ionicons name="add-circle" size={22} color="#FFFFFF" />
        <Text style={styles.bannerText}>Add Transaction</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.floatingWrapper} pointerEvents="box-none">
      <Pressable
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: pressed ? theme.primaryDark : theme.primary,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 6,
            elevation: 6,
          },
        ]}
        onPress={() => router.push('/add')}>
        <Ionicons name="add" size={26} color="#FFFFFF" />
        <Text style={styles.fabText}>Add</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingWrapper: {
    position: 'absolute',
    bottom: Spacing.four,
    right: Spacing.four,
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.full,
    gap: Spacing.one,
  },
  fabText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  bannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.lg,
    gap: Spacing.two,
  },
  bannerText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});

