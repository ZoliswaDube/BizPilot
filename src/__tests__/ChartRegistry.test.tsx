import { chartTheme, defaultChartOptions } from '../components/charts/ChartRegistry';

describe('ChartRegistry', () => {
  it('should export chart theme and options', () => {
    expect(chartTheme).toBeDefined();
    expect(defaultChartOptions).toBeDefined();
    // TODO: Add more specific tests for chart registry logic
  });
});