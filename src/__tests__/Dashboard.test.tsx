import { render } from '@testing-library/react';
import { Dashboard } from '../components/dashboard/Dashboard';

describe('Dashboard', () => {
  it('should render without crashing', () => {
    render(<Dashboard />);
    // TODO: Add more specific tests for dashboard logic
  });
}); 