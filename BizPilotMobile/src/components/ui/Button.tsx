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
import { LinearGradient } from 'expo-linear-gradient';

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
    styles[size],
    disabled && styles.disabled,
    style,
  ];

  const textStyleCombined = [
    styles.text,
    styles[`${size}Text`],
    disabled && styles.disabledText,
    textStyle,
  ];

  const getTextColor = () => {
    if (disabled) return '#9ca3af';
    switch (variant) {
      case 'primary': return '#ffffff';
      case 'secondary': return '#e5e7eb';
      case 'danger': return '#ffffff';
      case 'ghost': return '#a78bfa';
      default: return '#ffffff';
    }
  };

  const renderContent = () => (
    <>
      {loading && (
        <ActivityIndicator
          size="small"
          color={getTextColor()}
          style={styles.loader}
        />
      )}
      {icon && !loading && icon}
      <Text style={[textStyleCombined, { color: getTextColor() }]}>{title}</Text>
    </>
  );

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        style={[buttonStyle, styles.primaryContainer]}
        onPress={handlePress}
        disabled={disabled || loading}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={disabled ? ['#4b5563', '#4b5563'] : ['#a78bfa', '#9333ea']}
          style={[styles.primaryGradient, styles[size]]}
        >
          {renderContent()}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[buttonStyle, styles[variant]]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {renderContent()}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    shadowColor: '#a78bfa',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  
  primaryContainer: {
    shadowColor: '#a78bfa',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  
  primaryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  
  secondary: {
    backgroundColor: '#1e293b80',
    borderWidth: 1,
    borderColor: '#475569',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#334155',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  
  danger: {
    backgroundColor: '#dc2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  
  ghost: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0,
    elevation: 0,
  },
  
  // Sizes
  sm: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  
  md: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  
  lg: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 8,
  },
  
  // Disabled state
  disabled: {
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  
  // Text styles
  text: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // Size text styles
  smText: {
    fontSize: 14,
  },
  
  mdText: {
    fontSize: 16,
  },
  
  lgText: {
    fontSize: 18,
    fontWeight: '700',
  },
  
  disabledText: {
    color: '#9ca3af',
  },
  
  loader: {
    marginRight: 8,
  },
}); 