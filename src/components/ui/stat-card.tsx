import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatINR } from '@/services/currency';

interface StatCardProps {
  title: string;
  amountPaise: number;
  type: 'expense' | 'income' | 'balance';
  icon: keyof typeof Ionicons.glyphMap;
}

export function StatCard({ title, amountPaise, type, icon }: StatCardProps) {
  const theme = useTheme();

  const getColor = () => {
    switch (type) {
      case 'expense':
        return theme.expense;
      case 'income':
        return theme.income;
      case 'balance':
        return amountPaise >= 0 ? theme.primary : theme.expense;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'expense':
        return theme.expenseLight;
      case 'income':
        return theme.incomeLight;
      case 'balance':
        return theme.primaryLight;
    }
  };

  const color = getColor();
  const bgColor = getBgColor();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
        },
      ]}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
          <Ionicons name={icon} size={18} color={color} />
        </View>
        <Text style={[styles.title, { color: theme.textSecondary }]}>{title}</Text>
      </View>
      <Text
        style={[styles.amount, { color }]}
        numberOfLines={1}
        adjustsFontSizeToFit>
        {formatINR(amountPaise)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 100,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
  },
});

