import { render, screen, fireEvent } from '@testing-library/react';
import { ImageInput } from '../components/ui/image-input';

describe('ImageInput', () => {
  it('renders file input', () => {
    render(<ImageInput value={null} onChange={jest.fn()} />);
    expect(screen.getByLabelText(/upload/i)).toBeInTheDocument();
  });

  it('calls onChange when file is selected', () => {
    const handleChange = jest.fn();
    render(<ImageInput value={null} onChange={handleChange} />);
    const input = screen.getByLabelText(/upload/i);
    fireEvent.change(input, { target: { files: [new File([''], 'test.png', { type: 'image/png' })] } });
    expect(handleChange).toHaveBeenCalled();
  });
}); 