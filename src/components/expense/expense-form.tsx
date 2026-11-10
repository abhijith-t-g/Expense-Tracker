import React, { useState } from 'react';
import {
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
import { useToast } from '@/context/toast-context';
import { useCategories } from '@/hooks/use-categories';
import { useTheme } from '@/hooks/use-theme';
import type { NewTransaction, TransactionType } from '@/types/database';
import { validateTransactionInput } from '@/validation/transaction-schema';

interface ExpenseFormProps {
  initialValues?: Partial<NewTransaction>;
  onSubmit: (transaction: NewTransaction) => Promise<void>;
  onCancel?: () => void;
  isEditMode?: boolean;
}

export function ExpenseForm({
  initialValues,
  onSubmit,
  onCancel,
  isEditMode = false,
}: ExpenseFormProps) {
  const theme = useTheme();
  const { showError } = useToast();

  // Form states
  const [type, setType] = useState<TransactionType>(
    initialValues?.type ?? 'expense'
  );
  const [amountPaise, setAmountPaise] = useState<number>(
    initialValues?.amount ?? 0
  );
  const [categoryId, setCategoryId] = useState<number | null>(
    initialValues?.categoryId ?? null
  );
  const [title, setTitle] = useState<string>(initialValues?.title ?? '');
  const [description, setDescription] = useState<string>(
    initialValues?.description ?? ''
  );

  const getTodayYMD = () => new Date().toISOString().split('T')[0];
  const getCurrentHM = () => {
    const now = new Date();
    const h = now.getHours().toString().padStart(2, '0');
    const m = now.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const [date, setDate] = useState<string>(
    initialValues?.date ?? getTodayYMD()
  );
  const [time, setTime] = useState<string>(
    initialValues?.time ?? getCurrentHM()
  );

  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load categories filtered by current type
  const { categories } = useCategories(type);

  // Derive selected category (defaults to first available if unselected)
  const effectiveCategoryId =
    categoryId && categories.some((c) => c.id === categoryId)
      ? categoryId
      : categories[0]?.id ?? null;

  const selectedCategory = categories.find((c) => c.id === effectiveCategoryId);

  const handleSubmit = async () => {
    setValidationErrors({});

    // If title is empty, automatically use category name as title
    const resolvedTitle =
      title.trim() ||
      selectedCategory?.name ||
      (type === 'expense' ? 'Expense' : 'Income');

    const payload = {
      type,
      amount: amountPaise,
      categoryId: effectiveCategoryId ?? 0,
      title: resolvedTitle,
      description: description.trim() ? description.trim() : null,
      date,
      time: time.trim() ? time.trim() : null,
    };

    // Zod validation
    const validationResult = validateTransactionInput(payload);
    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of validationResult.error.issues) {
        const fieldName = issue.path[0]?.toString() ?? 'form';
        fieldErrors[fieldName] = issue.message;
      }
      setValidationErrors(fieldErrors);

      const firstError = validationResult.error.issues[0]?.message;
      if (firstError) {
        showError(firstError);
      }
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        amount: payload.amount,
        type: payload.type,
        categoryId: payload.categoryId,
        title: payload.title,
        description: payload.description,
        date: payload.date,
        time: payload.time,
      });
    } catch (err) {
      showError(
        err instanceof Error ? err.message : 'Failed to save transaction'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getYesterdayYMD = () => {
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

        {/* Amount Input (Paise storage) */}
        <View>
          <AmountInput
            amountPaise={amountPaise}
            onChangePaise={(newPaise) => {
              setAmountPaise(newPaise);
              if (validationErrors.amount) {
                setValidationErrors((prev) => ({ ...prev, amount: '' }));
              }
            }}
            autoFocus={!initialValues?.amount}
          />
          {validationErrors.amount ? (
            <Text style={[styles.errorText, { color: theme.danger }]}>
              {validationErrors.amount}
            </Text>
          ) : null}
        </View>

        {/* Title Input */}
        <View style={styles.section}>
          <View style={styles.labelWithHintRow}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              Title
            </Text>
            <Text style={[styles.optionalHint, { color: theme.textMuted }]}>
              Optional — defaults to &quot;{selectedCategory?.name ?? 'Category'}&quot;
            </Text>
          </View>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: theme.backgroundElement,
                color: theme.text,
                borderColor: validationErrors.title
                  ? theme.danger
                  : theme.border,
              },
            ]}
            value={title}
            onChangeText={(txt) => {
              setTitle(txt);
              if (validationErrors.title) {
                setValidationErrors((prev) => ({ ...prev, title: '' }));
              }
            }}
            placeholder={
              selectedCategory
                ? `e.g. ${selectedCategory.name} (or leave empty)`
                : 'e.g. Swiggy Lunch (or leave empty)'
            }
            placeholderTextColor={theme.textMuted}
            maxLength={100}
          />
          {validationErrors.title ? (
            <Text style={[styles.errorText, { color: theme.danger }]}>
              {validationErrors.title}
            </Text>
          ) : null}
        </View>

        {/* Category Picker */}
        <View>
          <CategoryPicker
            categories={categories}
            selectedCategoryId={effectiveCategoryId}
            onSelectCategory={(id) => {
              setCategoryId(id);
              if (validationErrors.categoryId) {
                setValidationErrors((prev) => ({ ...prev, categoryId: '' }));
              }
            }}
          />
          {validationErrors.categoryId ? (
            <Text style={[styles.errorText, { color: theme.danger }]}>
              {validationErrors.categoryId}
            </Text>
          ) : null}
        </View>

        {/* Date & Time Row */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
            Date & Time
          </Text>
          <View style={styles.dateChipsRow}>
            <Pressable
              style={[
                styles.dateChip,
                {
                  backgroundColor:
                    date === getTodayYMD()
                      ? theme.backgroundSelected
                      : theme.card,
                  borderColor:
                    date === getTodayYMD() ? theme.primary : theme.border,
                },
              ]}
              onPress={() => setDate(getTodayYMD())}>
              <Text
                style={[
                  styles.dateChipText,
                  {
                    color:
                      date === getTodayYMD()
                        ? theme.primary
                        : theme.textSecondary,
                    fontWeight: date === getTodayYMD() ? '700' : '500',
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
                    date === getYesterdayYMD()
                      ? theme.backgroundSelected
                      : theme.card,
                  borderColor:
                    date === getYesterdayYMD() ? theme.primary : theme.border,
                },
              ]}
              onPress={() => setDate(getYesterdayYMD())}>
              <Text
                style={[
                  styles.dateChipText,
                  {
                    color:
                      date === getYesterdayYMD()
                        ? theme.primary
                        : theme.textSecondary,
                    fontWeight: date === getYesterdayYMD() ? '700' : '500',
                  },
                ]}>
                Yesterday
              </Text>
            </Pressable>

            <TextInput
              style={[
                styles.dateInputCustom,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: validationErrors.date
                    ? theme.danger
                    : theme.border,
                  color: theme.text,
                },
              ]}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.textMuted}
            />

            <TextInput
              style={[
                styles.timeInputCustom,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: validationErrors.time
                    ? theme.danger
                    : theme.border,
                  color: theme.text,
                },
              ]}
              value={time}
              onChangeText={setTime}
              placeholder="HH:MM"
              placeholderTextColor={theme.textMuted}
              maxLength={5}
            />
          </View>
          {validationErrors.date ? (
            <Text style={[styles.errorText, { color: theme.danger }]}>
              {validationErrors.date}
            </Text>
          ) : null}
          {validationErrors.time ? (
            <Text style={[styles.errorText, { color: theme.danger }]}>
              {validationErrors.time}
            </Text>
          ) : null}
        </View>

        {/* Optional Description Input */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
            Description (Optional)
          </Text>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: theme.backgroundElement,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            value={description}
            onChangeText={setDescription}
            placeholder="Add additional context or notes"
            placeholderTextColor={theme.textMuted}
            maxLength={250}
          />
        </View>

        {/* Submit Actions */}
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
            title={
              isEditMode
                ? 'Update Transaction'
                : `Save ${type === 'expense' ? 'Expense' : 'Income'}`
            }
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
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  labelWithHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionalHint: {
    fontSize: 11,
    fontWeight: '500',
  },
  textInput: {
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 4,
    fontSize: 15,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: Spacing.half,
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
  dateInputCustom: {
    flex: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.two,
    fontSize: 13,
    borderWidth: 1,
    textAlign: 'center',
  },
  timeInputCustom: {
    width: 70,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    fontSize: 13,
    borderWidth: 1,
    textAlign: 'center',
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
