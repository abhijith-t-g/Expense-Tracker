import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ExpenseForm } from '@/components/expense/expense-form';
import { useToast } from '@/context/toast-context';
import { useExpenses } from '@/hooks/use-expenses';
import { useTheme } from '@/hooks/use-theme';
import { TransactionRepository } from '@/repositories/transaction-repository';
import { formatINR } from '@/services/currency';
import type { NewTransaction, TransactionWithCategory } from '@/types/database';

export default function AddOrEditTransactionScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { addTransaction, updateTransaction } = useExpenses();
  const { showSuccess } = useToast();

  const [existingTransaction, setExistingTransaction] =
    useState<TransactionWithCategory | null>(null);
  const [isLoadingItem, setIsLoadingItem] = useState<boolean>(Boolean(id));

  const isEditMode = Boolean(id && existingTransaction);

  useEffect(() => {
    if (!id) return;
    const txnId = parseInt(id, 10);
    if (isNaN(txnId)) return;

    let ignore = false;
    TransactionRepository.getById(txnId)
      .then((item) => {
        if (!ignore && item) {
          setExistingTransaction(item);
          setIsLoadingItem(false);
        }
      })
      .catch(() => {
        if (!ignore) setIsLoadingItem(false);
      });

    return () => {
      ignore = true;
    };
  }, [id]);

  const handleSave = async (data: NewTransaction) => {
    if (isEditMode && existingTransaction) {
      await updateTransaction(existingTransaction.id, data);
      showSuccess(`Transaction "${data.title}" updated`);
    } else {
      await addTransaction(data);
      showSuccess(
        `${data.type === 'expense' ? 'Expense' : 'Income'} of ${formatINR(data.amount)} added`
      );
    }
    router.back();
  };

  if (isLoadingItem) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.background },
        ]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Loading transaction details...
        </Text>
      </View>
    );
  }

  const initialValues: Partial<NewTransaction> | undefined = existingTransaction
    ? {
        type: existingTransaction.type,
        amount: existingTransaction.amount,
        categoryId: existingTransaction.categoryId ?? undefined,
        title: existingTransaction.title,
        description: existingTransaction.description,
        date: existingTransaction.date,
        time: existingTransaction.time,
      }
    : undefined;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ExpenseForm
        initialValues={initialValues}
        isEditMode={isEditMode}
        onSubmit={handleSave}
        onCancel={() => router.back()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
