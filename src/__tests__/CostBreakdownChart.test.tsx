import { render } from '@testing-library/react';
import { CostBreakdownChart } from '../components/charts/CostBreakdownChart';

describe('CostBreakdownChart', () => {
  it('should render without crashing', () => {
    const mockData = {
      materialCost: 100,
      laborCost: 50,
      totalCost: 150
    };
    render(<CostBreakdownChart data={mockData} />);
    // TODO: Add more specific tests for cost breakdown chart logic
  });
});