import { render, screen } from '@testing-library/react';
import { Logo } from '../components/common/Logo';

describe('Logo', () => {
  it('renders the logo image', () => {
    render(<Logo />);
    // Logo renders an SVG, not an <img/>
    const svg = screen.getByTestId('svg') || document.querySelector('svg');
    expect(svg).toBeTruthy();
    // Optionally check src or alt
  });
}); 