import React, { useState } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { theme, componentStyles } from '../../styles/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  inputStyle?: ViewStyle;
  variant?: 'default' | 'outlined' | 'filled';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Input({
  label,
  error,
  containerStyle,
  inputStyle,
  variant = 'default',
  leftIcon,
  rightIcon,
  ...textInputProps
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const inputContainerStyle = [
    styles.inputContainer,
    styles[variant],
    isFocused && styles.focused,
    error && styles.error,
    leftIcon && styles.withLeftIcon,
    rightIcon && styles.withRightIcon,
    inputStyle,
  ];

  const textInputStyle = [
    styles.input,
    leftIcon && styles.inputWithLeftIcon,
    rightIcon && styles.inputWithRightIcon,
  ];

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={inputContainerStyle}>
        {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}
        
        <TextInput
          {...textInputProps}
          style={textInputStyle}
          onFocus={(e) => {
            setIsFocused(true);
            textInputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            textInputProps.onBlur?.(e);
          }}
          placeholderTextColor={theme.colors.gray[400]}
        />
        
        {rightIcon && <View style={styles.rightIconContainer}>{rightIcon}</View>}
      </View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.sm,
  },
  
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.gray[200],
    marginBottom: theme.spacing.xs,
  },
  
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    ...componentStyles.input.default,
  },
  
  default: {
    backgroundColor: theme.colors.dark[800],
    borderColor: theme.colors.dark[600],
  },
  
  outlined: {
    backgroundColor: 'transparent',
    borderColor: theme.colors.dark[600],
    borderWidth: 1,
  },
  
  filled: {
    backgroundColor: theme.colors.dark[700],
    borderColor: 'transparent',
  },
  
  focused: {
    ...componentStyles.input.focused,
    shadowColor: theme.colors.primary[500],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  
  error: {
    borderColor: theme.colors.danger[500],
    borderWidth: 1,
  },
  
  withLeftIcon: {
    paddingLeft: theme.spacing.xs,
  },
  
  withRightIcon: {
    paddingRight: theme.spacing.xs,
  },
  
  input: {
    flex: 1,
    fontSize: theme.fontSize.base,
    color: theme.colors.gray[100],
    paddingVertical: 0, // Remove default padding to use container padding
  },
  
  inputWithLeftIcon: {
    marginLeft: theme.spacing.xs,
  },
  
  inputWithRightIcon: {
    marginRight: theme.spacing.xs,
  },
  
  leftIconContainer: {
    marginLeft: theme.spacing.xs,
  },
  
  rightIconContainer: {
    marginRight: theme.spacing.xs,
  },
  
  errorText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.danger[500],
    marginTop: theme.spacing.xs,
    marginLeft: theme.spacing.xs,
  },
}); 