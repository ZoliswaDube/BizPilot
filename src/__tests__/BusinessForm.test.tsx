import { render, screen } from '@testing-library/react';
import { BusinessForm } from '../components/business/BusinessForm';

describe('BusinessForm', () => {
  it('should render without crashing', () => {
    render(<BusinessForm />);
    // Assert main heading and a key input are present
    expect(screen.getByRole('heading', { name: /edit business/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter business name/i)).toBeInTheDocument();
  });
}); 