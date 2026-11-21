import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AppShell from './AppShell';
import { NAV_ITEMS } from './Sidebar';

describe('AppShell Component', () => {
  const defaultProps = {
    activeView: 'today' as const,
    onNavigate: vi.fn(),
    language: 'en' as const,
    onLanguageChange: vi.fn(),
    onProfileClick: vi.fn(),
    currentCity: 'Delhi, India',
    onSelectCity: vi.fn(),
    aqi: 245,
    category: 'Poor',
    chipBg: '#FEF3C7',
    textColor: '#92400E',
  };

  it('renders all 8 nav items in the desktop sidebar navigation', () => {
    render(
      <AppShell {...defaultProps}>
        <div>Main content</div>
      </AppShell>
    );

    const mainNav = screen.getByRole('navigation', { name: 'Main' });
    expect(mainNav).toBeInTheDocument();

    for (const item of NAV_ITEMS) {
      expect(screen.getByRole('link', { name: new RegExp(item.label, 'i') })).toBeInTheDocument();
    }
    expect(NAV_ITEMS).toHaveLength(8);
  });

  it('marks the active view link with aria-current="page"', () => {
    render(
      <AppShell {...defaultProps} activeView="budget">
        <div>Budget content</div>
      </AppShell>
    );

    const activeLink = screen.getByRole('link', { name: /breath budget/i });
    expect(activeLink).toHaveAttribute('aria-current', 'page');

    const inactiveLink = screen.getByRole('link', { name: /today/i });
    expect(inactiveLink).not.toHaveAttribute('aria-current');
  });

  it('invokes onNavigate when a sidebar nav link is clicked', () => {
    const onNavigate = vi.fn();
    render(
      <AppShell {...defaultProps} onNavigate={onNavigate}>
        <div>Main content</div>
      </AppShell>
    );

    const planLink = screen.getByRole('link', { name: /my plan/i });
    fireEvent.click(planLink);

    expect(onNavigate).toHaveBeenCalledWith('plan');
  });

  it('renders skip-to-content accessibility link targeting main-content', () => {
    render(
      <AppShell {...defaultProps}>
        <div>Main content</div>
      </AppShell>
    );

    const skipLink = screen.getByRole('link', { name: /skip to main content/i });
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');
  });

  it('displays compact NAQI chip with number and category in top bar', () => {
    render(
      <AppShell {...defaultProps} aqi={312} category="Very Poor">
        <div>Main content</div>
      </AppShell>
    );

    const statusBadge = screen.getByRole('status', {
      name: /Current atmospheric condition: NAQI 312, Very Poor/i,
    });
    expect(statusBadge).toBeInTheDocument();
    expect(screen.getByText('312')).toBeInTheDocument();
    expect(screen.getByText('Very Poor')).toBeInTheDocument();
  });
});
