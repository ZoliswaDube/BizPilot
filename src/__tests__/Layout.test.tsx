import { render, screen } from '@testing-library/react';
import { Layout } from '../components/layout/Layout';

describe('Layout', () => {
  it('renders children inside layout', () => {
    render(
      <Layout>
        <div data-testid="child">Test Child</div>
      </Layout>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('applies layout structure', () => {
    const { container } = render(
      <Layout>
        <div>Content</div>
      </Layout>
    );
    expect(container.textContent).toContain('Content');
  });
}); 