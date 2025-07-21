import { render, screen, fireEvent } from '@testing-library/react';
import { QRGenerator } from '../components/qr/QRGenerator';

describe('QRGenerator', () => {
  it('renders input and generates QR code', () => {
    render(<QRGenerator />);
    const input = screen.getByPlaceholderText(/enter text/i);
    expect(input).toBeInTheDocument();
    fireEvent.change(input, { target: { value: 'test' } });
    // TODO: Check if QR code updates
  });
}); 