import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Input } from '../../components/ui/Input';

describe('Input Component', () => {
  it('renders correctly with label', () => {
    const { getByText } = render(<Input label="Test Label" />);
    expect(getByText('Test Label')).toBeTruthy();
  });

  it('renders placeholder text', () => {
    const { getByPlaceholderText } = render(
      <Input placeholder="Enter text" />
    );
    expect(getByPlaceholderText('Enter text')).toBeTruthy();
  });

  it('calls onChangeText when text changes', () => {
    const mockOnChangeText = jest.fn();
    const { getByPlaceholderText } = render(
      <Input placeholder="Enter text" onChangeText={mockOnChangeText} />
    );
    
    fireEvent.changeText(getByPlaceholderText('Enter text'), 'new text');
    expect(mockOnChangeText).toHaveBeenCalledWith('new text');
  });

  it('shows error message', () => {
    const { getByText } = render(
      <Input label="Test" error="This field is required" />
    );
    expect(getByText('This field is required')).toBeTruthy();
  });

  it('handles focus and blur events', () => {
    const mockOnFocus = jest.fn();
    const mockOnBlur = jest.fn();
    const { getByPlaceholderText } = render(
      <Input 
        placeholder="Enter text" 
        onFocus={mockOnFocus}
        onBlur={mockOnBlur}
      />
    );
    
    const input = getByPlaceholderText('Enter text');
    fireEvent(input, 'focus');
    fireEvent(input, 'blur');
    
    expect(mockOnFocus).toHaveBeenCalledTimes(1);
    expect(mockOnBlur).toHaveBeenCalledTimes(1);
  });

  it('renders with secure text entry', () => {
    const { getByPlaceholderText } = render(
      <Input placeholder="Password" secureTextEntry />
    );
    
    const input = getByPlaceholderText('Password');
    expect(input.props.secureTextEntry).toBe(true);
  });
}); 