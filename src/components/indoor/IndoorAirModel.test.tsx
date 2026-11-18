import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import IndoorAirModel from './IndoorAirModel';

describe('IndoorAirModel Component', () => {
  it('renders single-zone mass-balance metrics accurately for given outdoor PM2.5', () => {
    render(<IndoorAirModel outdoorPm25={200} />);

    expect(screen.getByText(/Single-Zone Room Air Quality Model/i)).toBeInTheDocument();
    expect(screen.getByText(/Estimated Indoor PM2.5/i)).toBeInTheDocument();
    expect(screen.getByText(/Daily Particulate Avoided/i)).toBeInTheDocument();
  });

  it('updates filtration unit when user changes purifier dropdown option', () => {
    render(<IndoorAirModel outdoorPm25={250} />);

    const purifierSelect = screen.getByLabelText(/Filtration Unit/i) as HTMLSelectElement;
    expect(purifierSelect).toBeInTheDocument();

    // Select "No Purifier Active"
    fireEvent.change(purifierSelect, { target: { value: '0' } });
    expect(purifierSelect.value).toBe('0');

    // Select "DIY Box-Fan + MERV 13"
    fireEvent.change(purifierSelect, { target: { value: '300' } });
    expect(purifierSelect.value).toBe('300');
  });

  it('allows switching ventilation strategies between sealed and open windows', () => {
    render(<IndoorAirModel outdoorPm25={180} />);

    const ventilationSelect = screen.getByLabelText(/Window Enclosure/i) as HTMLSelectElement;
    expect(ventilationSelect).toBeInTheDocument();

    fireEvent.change(ventilationSelect, { target: { value: 'windows_open' } });
    expect(ventilationSelect.value).toBe('windows_open');
  });
});
