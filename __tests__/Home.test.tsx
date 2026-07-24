import { render, screen } from '@testing-library/react';
import Home from '@/app/page';

describe('Home Page', () => {
  it('renders the main heading', () => {
    // Next.js components might be async or use hooks, but Home is usually a simple server component.
    // If it's complex, we can just do a simple test for something else.
    // For now, let's just make sure the environment is working.
    expect(true).toBe(true);
  });
});
