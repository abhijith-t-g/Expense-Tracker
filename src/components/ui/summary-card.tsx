import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatINR } from '@/services/currency';

interface SummaryCardProps {
  type: 'income' | 'expense';
  amountPaise: number;
  label?: string;
  count?: number;
}

export function SummaryCard({
  type,
  amountPaise,
  label,
  count,
}: SummaryCardProps) {
  const theme = useTheme();

  const isIncome = type === 'income';
  const color = isIncome ? theme.income : theme.expense;
  const bgColor = isIncome ? theme.incomeLight : theme.expenseLight;
  const iconName = isIncome ? 'arrow-down-outline' : 'arrow-up-outline';
  const title = label ?? (isIncome ? 'Total Income' : 'Total Expenses');

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
        },
      ]}>
      <View style={styles.topRow}>
        <View style={[styles.indicator, { backgroundColor: bgColor }]}>
          <Ionicons name={iconName} size={16} color={color} />
        </View>
        <Text style={[styles.label, { color: theme.textSecondary }]}>
          {title}
        </Text>
      </View>
      <Text
        style={[styles.amount, { color }]}
        numberOfLines={1}
        adjustsFontSizeToFit>
        {isIncome ? '+ ' : '- '}
        {formatINR(amountPaise, { showSign: false })}
      </Text>
      {count !== undefined && (
        <Text style={[styles.countText, { color: theme.textMuted }]}>
          {count} {count === 1 ? 'transaction' : 'transactions'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    borderWidth: 1,
    gap: Spacing.half,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  indicator: {
    width: 26,
    height: 26,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  amount: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: Spacing.one,
  },
  countText: {
    fontSize: 11,
    fontWeight: '500',
  },
});

