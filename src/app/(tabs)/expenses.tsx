import React, { useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState } from '@/components/common/empty-state';
import { ExpenseCard } from '@/components/expense/expense-card';
import { Radius, Spacing } from '@/constants/theme';
import { useExpenses } from '@/hooks/use-expenses';
import { useTheme } from '@/hooks/use-theme';
import type { TransactionType } from '@/types/database';

export default function ExpensesScreen() {
  const theme = useTheme();
  const [selectedType, setSelectedType] = useState<TransactionType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filterOptions = selectedType === 'all' ? undefined : { type: selectedType };
  const { expenses, isLoading, refresh, deleteTransaction } = useExpenses(filterOptions);

  const filteredExpenses = expenses.filter((item) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const matchesNote = item.note?.toLowerCase().includes(query);
    const matchesCategory = item.categoryName?.toLowerCase().includes(query);
    return matchesNote || matchesCategory;
  });

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
      edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Transactions</Text>
          <Pressable
            style={[styles.addBtn, { backgroundColor: theme.primary }]}
            onPress={() => router.push('/add')}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addBtnText}>Add</Text>
          </Pressable>
        </View>

        {/* Search Bar */}
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}>
          <Ionicons name="search-outline" size={18} color={theme.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search note or category..."
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={theme.textMuted} />
            </Pressable>
          )}
        </View>

        {/* Type Filter Pills */}
        <View style={styles.filterPills}>
          {(['all', 'expense', 'income'] as const).map((filter) => {
            const isSelected = selectedType === filter;
            const label =
              filter === 'all'
                ? 'All'
                : filter === 'expense'
                ? 'Expenses'
                : 'Income';

            return (
              <Pressable
                key={filter}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isSelected
                      ? theme.primary
                      : theme.card,
                    borderColor: isSelected ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => setSelectedType(filter)}>
                <Text
                  style={[
                    styles.filterPillText,
                    {
                      color: isSelected ? '#FFFFFF' : theme.textSecondary,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Transaction List */}
        <FlatList
          data={filteredExpenses}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <ExpenseCard item={item} onDelete={deleteTransaction} />
          )}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.two }} />}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refresh}
              tintColor={theme.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title={
                searchQuery
                  ? 'No matching transactions'
                  : 'No transactions found'
              }
              description={
                searchQuery
                  ? 'Try searching with a different term'
                  : 'Start recording expenses or income'
              }
              actionTitle={searchQuery ? undefined : 'Add Transaction'}
              onAction={() => router.push('/add')}
            />
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.two,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: Radius.full,
    gap: Spacing.half,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderWidth: 1,
    gap: Spacing.two,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  filterPills: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  filterPill: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 13,
  },
  listContent: {
    paddingBottom: Spacing.six,
  },
});
