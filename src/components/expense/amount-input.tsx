import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  CURRENCY_SYMBOL,
  paiseToInputString,
  parseAmountInputToPaise,
} from '@/services/currency';

interface AmountInputProps {
  amountPaise: number;
  onChangePaise: (paise: number) => void;
  autoFocus?: boolean;
}

const QUICK_AMOUNTS_PAISE = [
  { label: '+₹50', paise: 5000 },
  { label: '+₹100', paise: 10000 },
  { label: '+₹500', paise: 50000 },
  { label: '+₹1,000', paise: 100000 },
  { label: '+₹2,000', paise: 200000 },
];

export function AmountInput({
  amountPaise,
  onChangePaise,
  autoFocus = false,
}: AmountInputProps) {
  const theme = useTheme();

  const handleTextChange = (text: string) => {
    const paise = parseAmountInputToPaise(text);
    onChangePaise(paise);
  };

  const handleQuickAdd = (additionalPaise: number) => {
    onChangePaise(amountPaise + additionalPaise);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>Amount</Text>
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: theme.border,
          },
        ]}>
        <Text style={[styles.currencyPrefix, { color: theme.primary }]}>
          {CURRENCY_SYMBOL}
        </Text>
        <TextInput
          style={[styles.input, { color: theme.text }]}
          value={amountPaise > 0 ? paiseToInputString(amountPaise) : ''}
          onChangeText={handleTextChange}
          placeholder="0.00"
          placeholderTextColor={theme.textMuted}
          keyboardType="decimal-pad"
          autoFocus={autoFocus}
          selectTextOnFocus
        />
      </View>

      <View style={styles.quickChipsContainer}>
        {QUICK_AMOUNTS_PAISE.map((chip) => (
          <Pressable
            key={chip.label}
            style={({ pressed }) => [
              styles.quickChip,
              {
                backgroundColor: pressed
                  ? theme.backgroundSelected
                  : theme.card,
                borderColor: theme.border,
              },
            ]}
            onPress={() => handleQuickAdd(chip.paise)}>
            <Text style={[styles.quickChipText, { color: theme.textSecondary }]}>
              {chip.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderWidth: 1.5,
  },
  currencyPrefix: {
    fontSize: 32,
    fontWeight: '700',
    marginRight: Spacing.two,
  },
  input: {
    flex: 1,
    fontSize: 32,
    fontWeight: '700',
    padding: 0,
  },
  quickChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  quickChip: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
  },
  quickChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

