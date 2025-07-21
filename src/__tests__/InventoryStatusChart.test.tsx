import { render } from '@testing-library/react';
import { InventoryStatusChart } from '../components/charts/InventoryStatusChart';

describe('InventoryStatusChart', () => {
  it('should render without crashing', () => {
    render(<InventoryStatusChart data={[]} />);
    // TODO: Add more specific tests for inventory status chart logic
  });
}); 