import { render, screen } from '@testing-library/react';
import { Navigation } from '../components/layout/Navigation';
import { MemoryRouter } from 'react-router-dom';

describe('Navigation', () => {
  it('renders navigation links', () => {
    render(
      <MemoryRouter>
        <Navigation />
      </MemoryRouter>
    );
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/inventory/i)).toBeInTheDocument();
    // Add more link checks as needed
  });

  it('highlights the active link', () => {
    // TODO: Simulate navigation and check active class
  });
}); 