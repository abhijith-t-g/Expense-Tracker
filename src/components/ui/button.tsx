import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  disabled,
  style,
  textStyle,
  ...props
}: ButtonProps) {
  const theme = useTheme();

  const getBackgroundColor = (pressed: boolean) => {
    if (disabled || loading) return theme.backgroundElement;
    switch (variant) {
      case 'primary':
        return pressed ? theme.primaryDark : theme.primary;
      case 'secondary':
        return pressed ? theme.backgroundSelected : theme.backgroundElement;
      case 'danger':
        return pressed ? '#B71C1C' : theme.danger;
      case 'outline':
      case 'ghost':
        return pressed ? theme.backgroundElement : 'transparent';
      default:
        return theme.primary;
    }
  };

  const getTextColor = () => {
    if (disabled || loading) return theme.textMuted;
    switch (variant) {
      case 'primary':
      case 'danger':
        return '#FFFFFF';
      case 'outline':
        return theme.primary;
      case 'secondary':
      case 'ghost':
        return theme.text;
      default:
        return '#FFFFFF';
    }
  };

  const getBorderColor = () => {
    if (variant === 'outline') {
      return disabled ? theme.border : theme.primary;
    }
    return 'transparent';
  };

  const sizeStyles = {
    sm: { paddingVertical: Spacing.one, paddingHorizontal: Spacing.two },
    md: { paddingVertical: Spacing.two + 2, paddingHorizontal: Spacing.four },
    lg: { paddingVertical: Spacing.three, paddingHorizontal: Spacing.five },
  }[size];

  const fontSizeStyles = {
    sm: { fontSize: 13 },
    md: { fontSize: 15, fontWeight: '600' as const },
    lg: { fontSize: 17, fontWeight: '700' as const },
  }[size];

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        sizeStyles,
        {
          backgroundColor: getBackgroundColor(pressed),
          borderColor: getBorderColor(),
          borderWidth: variant === 'outline' ? 1.5 : 0,
        },
        style,
      ]}
      disabled={disabled || loading}
      {...props}>
      {loading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, fontSizeStyles, { color: getTextColor() }, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    gap: Spacing.two,
  },
  text: {
    textAlign: 'center',
  },
});

