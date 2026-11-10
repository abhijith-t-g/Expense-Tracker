import React from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { ExpenseForm } from '@/components/expense/expense-form';
import { useExpenses } from '@/hooks/use-expenses';
import { useTheme } from '@/hooks/use-theme';
import type { NewTransaction } from '@/types/database';

export default function AddTransactionScreen() {
  const theme = useTheme();
  const { addTransaction } = useExpenses();

  const handleSave = async (data: NewTransaction) => {
    await addTransaction(data);
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ExpenseForm
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
});
