import { render } from '@testing-library/react';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';

describe('ProtectedRoute', () => {
  it('should render without crashing', () => {
    render(<ProtectedRoute />);
    // TODO: Add more specific tests for protected route logic
  });
}); 