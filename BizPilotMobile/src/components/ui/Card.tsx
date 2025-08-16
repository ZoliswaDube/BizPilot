import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { theme, componentStyles } from '../../styles/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ 
  children, 
  style, 
  variant = 'default',
  padding = 'lg'
}: CardProps) {
  const cardStyle = [
    styles.base,
    styles[variant],
    styles[`padding${padding.charAt(0).toUpperCase() + padding.slice(1)}`],
    style,
  ];

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: theme.colors.dark[900],
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.dark[700] + '80', // 50% opacity like web app
  },
  
  default: {
    ...componentStyles.card.default,
  },
  
  elevated: {
    ...componentStyles.card.default,
    shadowColor: theme.colors.primary[500],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  
  outlined: {
    backgroundColor: 'transparent',
    borderColor: theme.colors.dark[600],
    borderWidth: 1,
    shadowOpacity: 0,
    elevation: 0,
  },
  
  // Padding variants
  paddingNone: {
    padding: 0,
  },
  
  paddingSm: {
    padding: theme.spacing.sm,
  },
  
  paddingMd: {
    padding: theme.spacing.md,
  },
  
  paddingLg: {
    padding: theme.spacing.lg,
  },
}); 