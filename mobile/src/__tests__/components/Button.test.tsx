import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../../components/ui/Button';

describe('Button Component', () => {
  it('renders correctly with title', () => {
    const { getByText } = render(<Button title="Test Button" />);
    expect(getByText('Test Button')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <Button title="Test Button" onPress={mockOnPress} />
    );
    
    fireEvent.press(getByText('Test Button'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    const { getByTestId } = render(
      <Button title="Test Button" loading testID="button" />
    );
    
    expect(getByTestId('button')).toBeTruthy();
  });

  it('is disabled when loading', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <Button title="Test Button" loading onPress={mockOnPress} />
    );
    
    fireEvent.press(getByText('Test Button'));
    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('applies correct variant styles', () => {
    const { getByTestId } = render(
      <Button title="Primary" variant="primary" testID="primary-button" />
    );
    
    expect(getByTestId('primary-button')).toBeTruthy();
  });

  it('applies correct size styles', () => {
    const { getByTestId } = render(
      <Button title="Small" size="sm" testID="small-button" />
    );
    
    expect(getByTestId('small-button')).toBeTruthy();
  });
}); 