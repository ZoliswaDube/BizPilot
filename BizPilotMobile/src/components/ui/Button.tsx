import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { theme, componentStyles } from '../../styles/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
}: ButtonProps) {
  const handlePress = () => {
    if (disabled || loading) return;
    
    // Haptic feedback for better UX
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const buttonStyle = [
    styles.base,
    styles[variant],
    styles[size],
    disabled && styles.disabled,
    style,
  ];

  const textStyleCombined = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? theme.colors.white : theme.colors.gray[400]}
          style={styles.loader}
        />
      )}
      {icon && !loading && icon}
      <Text style={textStyleCombined}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.full,
    gap: theme.spacing.xs + 2, // 6px gap
    ...componentStyles.button.primary,
  },
  
  // Variants matching web app classes
  primary: {
    backgroundColor: theme.colors.primary[600],
    ...theme.shadows.primary,
  },
  
  secondary: {
    backgroundColor: theme.colors.dark[800] + '80',
    borderWidth: 1,
    borderColor: theme.colors.dark[600],
    shadowColor: theme.colors.dark[500],
    shadowOpacity: 0.1,
  },
  
  danger: {
    backgroundColor: theme.colors.danger[600],
    shadowColor: theme.colors.danger[500],
    shadowOpacity: 0.2,
  },
  
  ghost: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  
  // Sizes
  sm: {
    paddingHorizontal: theme.spacing.sm + 4, // 12px
    paddingVertical: theme.spacing.xs + 2, // 6px
    borderRadius: theme.borderRadius.md,
  },
  
  md: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  
  lg: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm + 3, // 11px
    borderRadius: theme.borderRadius.md,
  },
  
  // Disabled state
  disabled: {
    backgroundColor: theme.colors.gray[600],
    shadowOpacity: 0,
    elevation: 0,
  },
  
  // Text styles
  text: {
    fontWeight: theme.fontWeight.medium,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
  },
  
  primaryText: {
    color: theme.colors.white,
  },
  
  secondaryText: {
    color: theme.colors.gray[300],
  },
  
  dangerText: {
    color: theme.colors.white,
  },
  
  ghostText: {
    color: theme.colors.gray[400],
  },
  
  disabledText: {
    color: theme.colors.gray[500],
  },
  
  // Size-specific text
  smText: {
    fontSize: theme.fontSize.xs,
    lineHeight: theme.lineHeight.xs,
  },
  
  mdText: {
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
  },
  
  lgText: {
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
  },
  
  loader: {
    marginRight: theme.spacing.xs,
  },
}); 