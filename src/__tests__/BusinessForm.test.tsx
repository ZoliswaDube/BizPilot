import { render, screen } from '@testing-library/react';
import BusinessForm from '../components/business/BusinessForm';

describe('BusinessForm', () => {
  it('should render without crashing', () => {
    render(<BusinessForm />);
    // TODO: Add more specific tests for business form fields and logic
    expect(screen.getByRole('form')).toBeInTheDocument();
  });
}); 