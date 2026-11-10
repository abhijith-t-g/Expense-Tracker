import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CategoryPicker } from '@/components/category/category-picker';
import { AmountInput } from '@/components/expense/amount-input';
import { Button } from '@/components/ui/button';
import { Radius, Spacing } from '@/constants/theme';
import { useCategories } from '@/hooks/use-categories';
import { useTheme } from '@/hooks/use-theme';
import type { NewTransaction, TransactionType } from '@/types/database';

interface ExpenseFormProps {
  initialValues?: Partial<NewTransaction>;
  onSubmit: (transaction: NewTransaction) => Promise<void>;
  onCancel?: () => void;
}

export function ExpenseForm({
  initialValues,
  onSubmit,
  onCancel,
}: ExpenseFormProps) {
  const theme = useTheme();

  const [type, setType] = useState<TransactionType>(
    initialValues?.type ?? 'expense'
  );
  const [amountPaise, setAmountPaise] = useState<number>(
    initialValues?.amount ?? 0
  );
  const [categoryId, setCategoryId] = useState<number | null>(
    initialValues?.categoryId ?? null
  );
  const [note, setNote] = useState<string>(initialValues?.note ?? '');
  const [date, setDate] = useState<string>(
    initialValues?.date ?? new Date().toISOString().split('T')[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load categories filtered by current type
  const { categories } = useCategories(type);

  // Derive selected category (defaults to first category if unselected or not in type)
  const effectiveCategoryId =
    categoryId && categories.some((c) => c.id === categoryId)
      ? categoryId
      : categories[0]?.id ?? null;

  const handleSubmit = async () => {
    if (amountPaise <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than ₹0.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        amount: amountPaise,
        type,
        categoryId: effectiveCategoryId,
        note: note.trim() || null,
        date,
      });
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTodayISO = () => new Date().toISOString().split('T')[0];
  const getYesterdayISO = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardContainer}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        {/* Type Toggle: Expense vs Income */}
        <View
          style={[
            styles.toggleContainer,
            { backgroundColor: theme.backgroundElement },
          ]}>
          <Pressable
            style={[
              styles.toggleTab,
              type === 'expense' && {
                backgroundColor: theme.card,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
              },
            ]}
            onPress={() => setType('expense')}>
            <Ionicons
              name="arrow-down-circle"
              size={18}
              color={type === 'expense' ? theme.expense : theme.textSecondary}
            />
            <Text
              style={[
                styles.toggleText,
                {
                  color:
                    type === 'expense' ? theme.expense : theme.textSecondary,
                  fontWeight: type === 'expense' ? '700' : '500',
                },
              ]}>
              Expense
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.toggleTab,
              type === 'income' && {
                backgroundColor: theme.card,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
              },
            ]}
            onPress={() => setType('income')}>
            <Ionicons
              name="arrow-up-circle"
              size={18}
              color={type === 'income' ? theme.income : theme.textSecondary}
            />
            <Text
              style={[
                styles.toggleText,
                {
                  color:
                    type === 'income' ? theme.income : theme.textSecondary,
                  fontWeight: type === 'income' ? '700' : '500',
                },
              ]}>
              Income
            </Text>
          </Pressable>
        </View>

        {/* Amount Input */}
        <AmountInput
          amountPaise={amountPaise}
          onChangePaise={setAmountPaise}
          autoFocus={!initialValues?.amount}
        />

        {/* Category Picker */}
        <CategoryPicker
          categories={categories}
          selectedCategoryId={effectiveCategoryId}
          onSelectCategory={setCategoryId}
        />

        {/* Date Selector */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
            Date
          </Text>
          <View style={styles.dateChipsRow}>
            <Pressable
              style={[
                styles.dateChip,
                {
                  backgroundColor:
                    date === getTodayISO()
                      ? theme.backgroundSelected
                      : theme.card,
                  borderColor:
                    date === getTodayISO() ? theme.primary : theme.border,
                },
              ]}
              onPress={() => setDate(getTodayISO())}>
              <Text
                style={[
                  styles.dateChipText,
                  {
                    color:
                      date === getTodayISO()
                        ? theme.primary
                        : theme.textSecondary,
                    fontWeight: date === getTodayISO() ? '700' : '500',
                  },
                ]}>
                Today
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.dateChip,
                {
                  backgroundColor:
                    date === getYesterdayISO()
                      ? theme.backgroundSelected
                      : theme.card,
                  borderColor:
                    date === getYesterdayISO() ? theme.primary : theme.border,
                },
              ]}
              onPress={() => setDate(getYesterdayISO())}>
              <Text
                style={[
                  styles.dateChipText,
                  {
                    color:
                      date === getYesterdayISO()
                        ? theme.primary
                        : theme.textSecondary,
                    fontWeight: date === getYesterdayISO() ? '700' : '500',
                  },
                ]}>
                Yesterday
              </Text>
            </Pressable>

            <View
              style={[
                styles.customDateDisplay,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
              ]}>
              <Ionicons
                name="calendar-outline"
                size={16}
                color={theme.textSecondary}
              />
              <Text style={[styles.customDateText, { color: theme.text }]}>
                {date}
              </Text>
            </View>
          </View>
        </View>

        {/* Note / Description */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
            Note (Optional)
          </Text>
          <TextInput
            style={[
              styles.noteInput,
              {
                backgroundColor: theme.backgroundElement,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            value={note}
            onChangeText={setNote}
            placeholder="e.g. Swiggy lunch, Chai & snacks, Metro recharge"
            placeholderTextColor={theme.textMuted}
            maxLength={100}
          />
        </View>

        {/* Submit & Cancel Actions */}
        <View style={styles.actionButtonsRow}>
          {onCancel && (
            <Button
              title="Cancel"
              variant="outline"
              onPress={onCancel}
              style={styles.actionBtn}
            />
          )}
          <Button
            title={`Save ${type === 'expense' ? 'Expense' : 'Income'}`}
            variant="primary"
            loading={isSubmitting}
            onPress={handleSubmit}
            style={styles.actionBtn}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.four,
    gap: Spacing.four,
  },
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: Radius.lg,
    padding: Spacing.half,
  },
  toggleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.two + 2,
    borderRadius: Radius.md,
    gap: Spacing.two,
  },
  toggleText: {
    fontSize: 15,
  },
  section: {
    gap: Spacing.two,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  dateChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.full,
    borderWidth: 1.5,
  },
  dateChipText: {
    fontSize: 13,
  },
  customDateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.full,
    borderWidth: 1,
    marginLeft: 'auto',
  },
  customDateText: {
    fontSize: 13,
    fontWeight: '500',
  },
  noteInput: {
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 15,
    borderWidth: 1,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  actionBtn: {
    flex: 1,
  },
});
