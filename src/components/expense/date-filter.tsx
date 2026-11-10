import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/button';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { DateQuickFilter } from '@/types/database';

interface DateFilterProps {
  activeFilter: DateQuickFilter;
  onSelectFilter: (
    filter: DateQuickFilter,
    customStart?: string,
    customEnd?: string
  ) => void;
  customStartDate?: string;
  customEndDate?: string;
}

const FILTER_OPTIONS: { id: DateQuickFilter; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'this_week', label: 'This Week' },
  { id: 'this_month', label: 'This Month' },
  { id: 'last_month', label: 'Last Month' },
  { id: 'custom', label: 'Custom' },
  { id: 'all', label: 'All' },
];

export function DateFilter({
  activeFilter,
  onSelectFilter,
  customStartDate,
  customEndDate,
}: DateFilterProps) {
  const theme = useTheme();
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [startInput, setStartInput] = useState(customStartDate ?? '');
  const [endInput, setEndInput] = useState(customEndDate ?? '');

  const handlePressOption = (id: DateQuickFilter) => {
    if (id === 'custom') {
      setIsCustomModalOpen(true);
    } else {
      onSelectFilter(id);
    }
  };

  const handleApplyCustom = () => {
    if (startInput.trim() && endInput.trim()) {
      onSelectFilter('custom', startInput.trim(), endInput.trim());
      setIsCustomModalOpen(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}>
        {FILTER_OPTIONS.map((opt) => {
          const isSelected = activeFilter === opt.id;
          return (
            <Pressable
              key={opt.id}
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected
                    ? theme.primary
                    : theme.card,
                  borderColor: isSelected ? theme.primary : theme.border,
                },
              ]}
              onPress={() => handlePressOption(opt.id)}>
              <Text
                style={[
                  styles.chipText,
                  {
                    color: isSelected ? '#FFFFFF' : theme.textSecondary,
                    fontWeight: isSelected ? '700' : '500',
                  },
                ]}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Custom Date Range Modal */}
      <Modal
        visible={isCustomModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsCustomModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Custom Date Range
              </Text>
              <Pressable onPress={() => setIsCustomModalOpen(false)}>
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </Pressable>
            </View>

            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
              Start Date (YYYY-MM-DD)
            </Text>
            <TextInput
              style={[
                styles.dateInput,
                {
                  backgroundColor: theme.backgroundElement,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              placeholder="e.g. 2026-11-01"
              placeholderTextColor={theme.textMuted}
              value={startInput}
              onChangeText={setStartInput}
            />

            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
              End Date (YYYY-MM-DD)
            </Text>
            <TextInput
              style={[
                styles.dateInput,
                {
                  backgroundColor: theme.backgroundElement,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              placeholder="e.g. 2026-11-30"
              placeholderTextColor={theme.textMuted}
              value={endInput}
              onChangeText={setEndInput}
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setIsCustomModalOpen(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Apply Range"
                variant="primary"
                onPress={handleApplyCustom}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.half,
  },
  scrollList: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingVertical: Spacing.half,
  },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
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
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  dateInput: {
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    fontSize: 15,
    borderWidth: 1,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
});

