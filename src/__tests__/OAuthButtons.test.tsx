import { render } from '@testing-library/react';
import { OAuthButtons } from '../components/auth/OAuthButtons';

describe('OAuthButtons', () => {
  it('should render without crashing', () => {
    render(<OAuthButtons />);
    // TODO: Add more specific tests for OAuth buttons logic
  });
}); 