import React from 'react';
import {
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

interface TransactionItemProps {
  item: TransactionWithCategory;
  onPress?: () => void;
  onEdit?: (item: TransactionWithCategory) => void;
  onDelete?: (id: number) => void;
  showDate?: boolean;
}

export function TransactionItem({
  item,
  onPress,
  onEdit,
  onDelete,
  showDate = false,
}: TransactionItemProps) {
  const theme = useTheme();

  const isExpense = item.type === 'expense';
  const amountColor = isExpense ? theme.expense : theme.income;
  const iconBg = item.categoryColor
    ? `${item.categoryColor}22`
    : theme.backgroundElement;
  const iconColor = item.categoryColor || theme.textSecondary;

  const rawIcon = item.categoryIcon || (isExpense ? 'cart' : 'cash');
  const iconName = (rawIcon in Ionicons.glyphMap
    ? rawIcon
    : 'pricetag') as keyof typeof Ionicons.glyphMap;

  const handleDelete = () => {
    if (onDelete) {
      onDelete(item.id);
    }
  };

  const timeOrDateLabel = item.time
    ? item.time
    : showDate
    ? item.date
    : item.categoryName || '';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: pressed ? theme.backgroundElement : theme.card,
          borderColor: theme.border,
        },
      ]}
      onPress={onPress}
      onLongPress={handleDelete}>
      {/* Category Icon */}
      <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
        <Ionicons name={iconName} size={22} color={iconColor} />
      </View>

      {/* Main Info */}
      <View style={styles.infoCol}>
        <View style={styles.topRow}>
          <Text
            style={[styles.title, { color: theme.text }]}
            numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[styles.amount, { color: amountColor }]}>
            {isExpense ? '- ' : '+ '}
            {formatINR(item.amount, { showSign: false })}
          </Text>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.metaRow}>
            {item.categoryName && (
              <View
                style={[
                  styles.categoryBadge,
                  { backgroundColor: theme.backgroundElement },
                ]}>
                <Text
                  style={[styles.categoryBadgeText, { color: theme.textSecondary }]}
                  numberOfLines={1}>
                  {item.categoryName}
                </Text>
              </View>
            )}
            {item.description ? (
              <Text
                style={[styles.description, { color: theme.textMuted }]}
                numberOfLines={1}>
                {item.description}
              </Text>
            ) : null}
          </View>

          <Text style={[styles.timeLabel, { color: theme.textMuted }]}>
            {timeOrDateLabel}
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionsRow}>
        {onEdit && (
          <Pressable
            hitSlop={8}
            onPress={() => onEdit(item)}
            style={styles.actionBtn}>
            <Ionicons name="pencil-outline" size={17} color={theme.textMuted} />
          </Pressable>
        )}
        {onDelete && (
          <Pressable
            hitSlop={8}
            onPress={handleDelete}
            style={styles.actionBtn}>
            <Ionicons name="trash-outline" size={17} color={theme.textMuted} />
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.two + 4,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.three,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCol: {
    flex: 1,
    gap: Spacing.half,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    flex: 1,
    marginRight: Spacing.two,
  },
  categoryBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 1,
    borderRadius: Radius.xs,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  description: {
    fontSize: 12,
    flex: 1,
  },
  timeLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  actionBtn: {
    padding: Spacing.one,
  },
});

