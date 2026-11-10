import React from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatINR } from '@/services/currency';
import type { TransactionWithCategory } from '@/types/database';

interface ExpenseCardProps {
  item: TransactionWithCategory;
  onPress?: () => void;
  onDelete?: (id: number) => void;
}

export function ExpenseCard({ item, onPress, onDelete }: ExpenseCardProps) {
  const theme = useTheme();

  const isExpense = item.type === 'expense';
  const amountColor = isExpense ? theme.expense : theme.income;
  const iconBg = item.categoryColor ? `${item.categoryColor}20` : theme.backgroundElement;
  const iconColor = item.categoryColor || theme.textSecondary;

  const rawIcon = item.categoryIcon || (isExpense ? 'cart' : 'cash');
  const iconName = (rawIcon in Ionicons.glyphMap
    ? rawIcon
    : 'pricetag') as keyof typeof Ionicons.glyphMap;

  const handleDeletePrompt = () => {
    if (!onDelete) return;
    Alert.alert(
      'Delete Transaction',
      `Are you sure you want to delete this ${item.type} of ${formatINR(item.amount)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(item.id),
        },
      ]
    );
  };

  // Format date display
  const formatDateLabel = (isoDate: string) => {
    try {
      const dateObj = new Date(isoDate);
      return dateObj.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return isoDate;
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: pressed ? theme.backgroundElement : theme.card,
          borderColor: theme.border,
        },
      ]}
      onPress={onPress}
      onLongPress={handleDeletePrompt}>
      <View style={[styles.iconWrapper, { backgroundColor: iconBg }]}>
        <Ionicons name={iconName} size={22} color={iconColor} />
      </View>

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text
            style={[styles.categoryName, { color: theme.text }]}
            numberOfLines={1}>
            {item.categoryName || (isExpense ? 'General Expense' : 'Income')}
          </Text>
          <Text style={[styles.amount, { color: amountColor }]}>
            {isExpense ? '- ' : '+ '}
            {formatINR(item.amount, { showSign: false })}
          </Text>
        </View>

        <View style={styles.bottomRow}>
          <Text
            style={[styles.note, { color: theme.textSecondary }]}
            numberOfLines={1}>
            {item.note ? item.note : formatDateLabel(item.date)}
          </Text>
          {item.note && (
            <Text style={[styles.date, { color: theme.textMuted }]}>
              {formatDateLabel(item.date)}
            </Text>
          )}
        </View>
      </View>

      {onDelete && (
        <Pressable
          hitSlop={10}
          onPress={handleDeletePrompt}
          style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={18} color={theme.textMuted} />
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.three,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: Spacing.half,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    marginRight: Spacing.two,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  note: {
    fontSize: 13,
    flex: 1,
    marginRight: Spacing.two,
  },
  date: {
    fontSize: 12,
  },
  deleteButton: {
    padding: Spacing.one,
  },
});

