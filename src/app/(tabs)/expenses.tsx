import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CategorySelector } from '@/components/category/category-selector';
import { EmptyState } from '@/components/common/empty-state';
import { DateFilter } from '@/components/expense/date-filter';
import { TransactionItem } from '@/components/expense/transaction-item';
import { Button } from '@/components/ui/button';
import { SummaryCard } from '@/components/ui/summary-card';
import { Radius, Spacing } from '@/constants/theme';
import { useConfirmDialog } from '@/context/confirm-dialog-context';
import { useToast } from '@/context/toast-context';
import { useCategories } from '@/hooks/use-categories';
import { useExpenses } from '@/hooks/use-expenses';
import { useTheme } from '@/hooks/use-theme';
import { BalanceService } from '@/services/balance-service';
import { formatINR } from '@/services/currency';
import type {
  DateQuickFilter,
  SortOption,
  TransactionType,
  TransactionWithCategory,
} from '@/types/database';

const SORT_OPTIONS: { id: SortOption; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'newest', label: 'Newest First', icon: 'time-outline' },
  { id: 'oldest', label: 'Oldest First', icon: 'hourglass-outline' },
  { id: 'highest_amount', label: 'Highest Amount', icon: 'trending-up-outline' },
  { id: 'lowest_amount', label: 'Lowest Amount', icon: 'trending-down-outline' },
];

export default function TransactionsScreen() {
  const theme = useTheme();
  const { showSuccess } = useToast();
  const { showConfirm } = useConfirmDialog();

  // Filters state
  const [dateFilter, setDateFilter] = useState<DateQuickFilter>('this_month');
  const [customStart, setCustomStart] = useState<string | undefined>();
  const [customEnd, setCustomEnd] = useState<string | undefined>();
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [isSortModalOpen, setIsSortModalOpen] = useState(false);

  // Selected Transaction for Details View Modal
  const [detailItem, setDetailItem] = useState<TransactionWithCategory | null>(null);

  // Categories from database
  const { categories } = useCategories();

  // Compute date range
  const { startDate, endDate, label: dateRangeLabel } = useMemo(() => {
    return BalanceService.getDateRangeForFilter(dateFilter, customStart, customEnd);
  }, [dateFilter, customStart, customEnd]);

  // Query options for hook
  const filterOptions = useMemo(
    () => ({
      startDate,
      endDate,
      type: typeFilter === 'all' ? undefined : typeFilter,
      categoryId: selectedCategoryId,
      searchQuery: searchQuery.trim(),
      sortBy,
    }),
    [startDate, endDate, typeFilter, selectedCategoryId, searchQuery, sortBy]
  );

  const {
    groupedExpenses,
    summary,
    isLoading,
    refresh,
    deleteTransaction,
  } = useExpenses(filterOptions);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const handleDeleteWithConfirm = (item: TransactionWithCategory) => {
    showConfirm({
      title: 'Delete Transaction',
      message: `Are you sure you want to delete "${item.title}" (${formatINR(item.amount)})?`,
      confirmText: 'Delete',
      isDestructive: true,
      onConfirm: async () => {
        await deleteTransaction(item.id);
        showSuccess('Transaction deleted');
      },
    });
  };

  const handleSelectDateFilter = (
    filter: DateQuickFilter,
    start?: string,
    end?: string
  ) => {
    setDateFilter(filter);
    if (filter === 'custom') {
      setCustomStart(start);
      setCustomEnd(end);
    } else {
      setCustomStart(undefined);
      setCustomEnd(undefined);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
      edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: theme.text }]}>
              Transactions
            </Text>
            <Text style={[styles.dateRangeSubtitle, { color: theme.textSecondary }]}>
              {dateRangeLabel}
            </Text>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              hitSlop={8}
              style={[
                styles.iconBtn,
                {
                  backgroundColor: isSearchActive
                    ? theme.backgroundSelected
                    : theme.surface,
                  borderColor: theme.border,
                },
              ]}
              onPress={() => setIsSearchActive(!isSearchActive)}>
              <Ionicons
                name="search-outline"
                size={18}
                color={isSearchActive ? theme.primary : theme.text}
              />
            </Pressable>

            <Pressable
              hitSlop={8}
              style={[
                styles.iconBtn,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
              onPress={() => setIsSortModalOpen(true)}>
              <Ionicons name="swap-vertical-outline" size={18} color={theme.text} />
            </Pressable>

            <Pressable
              hitSlop={8}
              style={[styles.addBtn, { backgroundColor: theme.primary }]}
              onPress={() => router.push('/add')}>
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.addBtnText}>Add</Text>
            </Pressable>
          </View>
        </View>

        {/* Collapsible Search Input */}
        {isSearchActive && (
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}>
            <Ionicons name="search" size={18} color={theme.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search by title, note, or category..."
              placeholderTextColor={theme.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={theme.textMuted} />
              </Pressable>
            )}
          </View>
        )}

        {/* Summary Cards (Income & Expenses for Selected Filters) */}
        <View style={styles.summaryRow}>
          <SummaryCard
            type="income"
            amountPaise={summary.totalIncomePaise}
            count={summary.transactionCount}
          />
          <SummaryCard
            type="expense"
            amountPaise={summary.totalExpensePaise}
          />
        </View>

        {/* Quick Date Filters */}
        <DateFilter
          activeFilter={dateFilter}
          onSelectFilter={handleSelectDateFilter}
          customStartDate={customStart}
          customEndDate={customEnd}
        />

        {/* Transaction Type Filters */}
        <View style={styles.typeFilterRow}>
          {(['all', 'expense', 'income'] as const).map((t) => {
            const isSelected = typeFilter === t;
            const label =
              t === 'all'
                ? 'All Types'
                : t === 'expense'
                ? 'Expenses'
                : 'Income';

            return (
              <Pressable
                key={t}
                style={[
                  styles.typePill,
                  {
                    backgroundColor: isSelected
                      ? theme.primary
                      : theme.card,
                    borderColor: isSelected ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => setTypeFilter(t)}>
                <Text
                  style={[
                    styles.typePillText,
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

        {/* Dynamic Category Selector */}
        <CategorySelector
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
        />

        {/* Grouped Transactions List */}
        <FlatList
          data={groupedExpenses}
          keyExtractor={(group) => group.date}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refresh}
              tintColor={theme.primary}
            />
          }
          renderItem={({ item: group }) => (
            <View style={styles.groupContainer}>
              {/* Group Date Header */}
              <View style={styles.groupHeaderRow}>
                <Text
                  style={[styles.groupHeaderDate, { color: theme.textSecondary }]}>
                  {group.dateLabel}
                </Text>
                <View style={styles.groupTotalsRow}>
                  {group.totalIncomePaise > 0 && (
                    <Text style={[styles.groupIncomeText, { color: theme.income }]}>
                      +{formatINR(group.totalIncomePaise, { showSign: false })}
                    </Text>
                  )}
                  {group.totalExpensePaise > 0 && (
                    <Text
                      style={[styles.groupExpenseText, { color: theme.expense }]}>
                      -{formatINR(group.totalExpensePaise, { showSign: false })}
                    </Text>
                  )}
                </View>
              </View>

              {/* Transactions in Group */}
              <View style={styles.groupItemsWrapper}>
                {group.items.map((txn) => (
                  <TransactionItem
                    key={txn.id}
                    item={txn}
                    onPress={() => setDetailItem(txn)}
                    onEdit={(item) =>
                      router.push({
                        pathname: '/add',
                        params: { id: item.id.toString() },
                      })
                    }
                    onDelete={() => handleDeleteWithConfirm(txn)}
                  />
                ))}
              </View>
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              title={
                searchQuery
                  ? 'No matching transactions'
                  : 'No transactions found'
              }
              description={
                searchQuery
                  ? 'Try modifying your search or clearing filters'
                  : 'No transactions recorded for the selected filter.'
              }
              actionTitle={searchQuery ? undefined : 'Add Transaction'}
              onAction={() => router.push('/add')}
            />
          }
        />

        {/* Sort Options Modal */}
        <Modal
          visible={isSortModalOpen}
          animationType="fade"
          transparent
          onRequestClose={() => setIsSortModalOpen(false)}>
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalCard,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  Sort Transactions
                </Text>
                <Pressable onPress={() => setIsSortModalOpen(false)}>
                  <Ionicons name="close" size={24} color={theme.textSecondary} />
                </Pressable>
              </View>

              {SORT_OPTIONS.map((opt) => {
                const isSelected = sortBy === opt.id;
                return (
                  <Pressable
                    key={opt.id}
                    style={[
                      styles.sortOptionRow,
                      {
                        backgroundColor: isSelected
                          ? theme.backgroundSelected
                          : 'transparent',
                      },
                    ]}
                    onPress={() => {
                      setSortBy(opt.id);
                      setIsSortModalOpen(false);
                    }}>
                    <Ionicons
                      name={opt.icon}
                      size={20}
                      color={isSelected ? theme.primary : theme.textSecondary}
                    />
                    <Text
                      style={[
                        styles.sortOptionText,
                        {
                          color: isSelected ? theme.primary : theme.text,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}>
                      {opt.label}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color={theme.primary}
                        style={{ marginLeft: 'auto' }}
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Modal>

        {/* Transaction Details Modal */}
        <Modal
          visible={detailItem !== null}
          animationType="slide"
          transparent
          onRequestClose={() => setDetailItem(null)}>
          <View style={styles.modalOverlay}>
            {detailItem && (
              <View
                style={[
                  styles.modalCard,
                  { backgroundColor: theme.card, borderColor: theme.border },
                ]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>
                    Transaction Details
                  </Text>
                  <Pressable onPress={() => setDetailItem(null)}>
                    <Ionicons
                      name="close"
                      size={24}
                      color={theme.textSecondary}
                    />
                  </Pressable>
                </View>

                {/* Amount Header */}
                <View style={styles.detailAmountBlock}>
                  <Text
                    style={[
                      styles.detailAmountText,
                      {
                        color:
                          detailItem.type === 'expense'
                            ? theme.expense
                            : theme.income,
                      },
                    ]}>
                    {detailItem.type === 'expense' ? '- ' : '+ '}
                    {formatINR(detailItem.amount, { showSign: false })}
                  </Text>
                  <Text
                    style={[
                      styles.detailTypeText,
                      { color: theme.textSecondary },
                    ]}>
                    {detailItem.type.toUpperCase()}
                  </Text>
                </View>

                {/* Details Breakdown */}
                <View style={styles.detailRow}>
                  <Text
                    style={[
                      styles.detailLabel,
                      { color: theme.textSecondary },
                    ]}>
                    Title
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>
                    {detailItem.title}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text
                    style={[
                      styles.detailLabel,
                      { color: theme.textSecondary },
                    ]}>
                    Category
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>
                    {detailItem.categoryName || 'Uncategorized'}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text
                    style={[
                      styles.detailLabel,
                      { color: theme.textSecondary },
                    ]}>
                    Date
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>
                    {detailItem.date} {detailItem.time ? `• ${detailItem.time}` : ''}
                  </Text>
                </View>

                {detailItem.description && (
                  <View style={styles.detailRow}>
                    <Text
                      style={[
                        styles.detailLabel,
                        { color: theme.textSecondary },
                      ]}>
                      Description
                    </Text>
                    <Text
                      style={[
                        styles.detailValue,
                        { color: theme.text, flex: 1, textAlign: 'right' },
                      ]}>
                      {detailItem.description}
                    </Text>
                  </View>
                )}

                {/* Action Buttons */}
                <View style={styles.modalActions}>
                  <Button
                    title="Edit"
                    variant="outline"
                    icon={
                      <Ionicons
                        name="pencil"
                        size={16}
                        color={theme.primary}
                      />
                    }
                    onPress={() => {
                      const itemToEdit = detailItem;
                      setDetailItem(null);
                      router.push({
                        pathname: '/add',
                        params: { id: itemToEdit.id.toString() },
                      });
                    }}
                    style={{ flex: 1 }}
                  />
                  <Button
                    title="Delete"
                    variant="danger"
                    icon={
                      <Ionicons
                        name="trash"
                        size={16}
                        color="#FFFFFF"
                      />
                    }
                    onPress={() => {
                      const itemToDelete = detailItem;
                      setDetailItem(null);
                      handleDeleteWithConfirm(itemToDelete);
                    }}
                    style={{ flex: 1 }}
                  />
                </View>
              </View>
            )}
          </View>
        </Modal>
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
    gap: Spacing.two,
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
  dateRangeSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  typeFilterRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginVertical: Spacing.half,
  },
  typePill: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  typePillText: {
    fontSize: 12,
  },
  listContent: {
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  groupContainer: {
    gap: Spacing.two,
  },
  groupHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.one,
  },
  groupHeaderDate: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  groupTotalsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  groupIncomeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  groupExpenseText: {
    fontSize: 12,
    fontWeight: '700',
  },
  groupItemsWrapper: {
    gap: Spacing.two,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    borderWidth: 1,
    gap: Spacing.three,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sortOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.two + 2,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
    gap: Spacing.three,
  },
  sortOptionText: {
    fontSize: 14,
  },
  detailAmountBlock: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
    gap: Spacing.half,
  },
  detailAmountText: {
    fontSize: 28,
    fontWeight: '800',
  },
  detailTypeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.one,
  },
  detailLabel: {
    fontSize: 13,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
});
