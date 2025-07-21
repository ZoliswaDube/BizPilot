import { render, screen } from '@testing-library/react';
import { Logo } from '../components/common/Logo';

describe('Logo', () => {
  it('renders the logo image', () => {
    render(<Logo />);
    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    // Optionally check src or alt
  });
}); 