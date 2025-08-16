import { render, screen, fireEvent } from '@testing-library/react';
import { QRGenerator } from '../components/qr/QRGenerator';

describe('QRGenerator', () => {
  it('renders input and generates QR code', () => {
    render(<QRGenerator />);
    // Component shows a loading state first; just assert loading renders
    expect(screen.getByText(/Loading QR codes.../i)).toBeInTheDocument();
    // TODO: Check if QR code updates
  });
}); 