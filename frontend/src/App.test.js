import { render, screen } from '@testing-library/react';
import App from './App';

test('renders GalleryHub app', () => {
  render(<App />);
  // The app should render the login page or gallery page
  // On initial load (no token), it shows the login page
  const brandElement = screen.getByText(/GalleryHub/i);
  expect(brandElement).toBeInTheDocument();
});
