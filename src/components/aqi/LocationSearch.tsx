'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2, Navigation } from 'lucide-react';
import { searchCities, GeocodingResult } from '@/lib/api/openMeteo';

interface LocationSearchProps {
  currentCity: string;
  onSelectCity: (city: { name: string; latitude: number; longitude: number }) => void;
  isLoading?: boolean;
}

const DEFAULT_INDIAN_METROS = [
  { name: 'Delhi', latitude: 28.6519, longitude: 77.2315 },
  { name: 'Mumbai', latitude: 19.076, longitude: 72.8777 },
  { name: 'Kolkata', latitude: 22.5726, longitude: 88.3639 },
  { name: 'Patna', latitude: 25.5941, longitude: 85.1376 },
  { name: 'Lucknow', latitude: 26.8467, longitude: 80.9462 },
];

export default function LocationSearch({
  currentCity,
  onSelectCity,
  isLoading = false,
}: LocationSearchProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchSeqRef = useRef(0);

  // Debounced search guarded against out-of-order responses
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;

    const seq = ++searchSeqRef.current;
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchCities(trimmed);
        if (seq !== searchSeqRef.current) return;
        setSuggestions(results);
        setIsOpen(true);
      } catch (err) {
        console.error(err);
      } finally {
        if (seq === searchSeqRef.current) {
          setIsSearching(false);
        }
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Handle outside click to dismiss dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item: { name: string; latitude: number; longitude: number; admin1?: string }) => {
    const displayName = item.admin1 ? `${item.name}, ${item.admin1}` : item.name;
    onSelectCity({
      name: displayName,
      latitude: item.latitude,
      longitude: item.longitude,
    });
    setQuery('');
    setIsOpen(false);
    setSuggestions([]);
  };

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setIsGeolocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsGeolocating(false);
        onSelectCity({
          name: 'My Current Location',
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      (err) => {
        setIsGeolocating(false);
        setGeoError(
          err.code === err.PERMISSION_DENIED
            ? 'Location permission denied. Please search your city above.'
            : 'Unable to retrieve location coordinates.'
        );
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  };

  return (
    <div className="w-full relative" ref={dropdownRef}>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <div className="relative flex-1">
          <label htmlFor="city-search-input" className="sr-only">
            Search city for live air quality
          </label>
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin text-teal-800" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </div>
          <input
            id="city-search-input"
            type="text"
            role="combobox"
            aria-expanded={isOpen}
            aria-controls="city-suggestions-list"
            aria-autocomplete="list"
            value={query}
            onChange={(e) => {
              const val = e.target.value;
              setQuery(val);
              if (val.trim().length < 2) {
                setSuggestions([]);
                setIsSearching(false);
              }
            }}
            onFocus={() => {
              if (suggestions.length > 0) setIsOpen(true);
            }}
            placeholder={`Current: ${currentCity} — type to switch city...`}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-700 focus:border-teal-700 shadow-2xs transition-all"
          />
        </div>

        <button
          type="button"
          onClick={handleGeolocation}
          disabled={isGeolocating || isLoading}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 transition-colors shadow-2xs focus-visible:outline-2 focus-visible:outline-teal-800 disabled:opacity-50"
          aria-label="Use device geolocation"
        >
          {isGeolocating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-800" />
          ) : (
            <Navigation className="w-3.5 h-3.5 text-teal-800" />
          )}
          <span>{isGeolocating ? 'Locating...' : 'Locate Me'}</span>
        </button>
      </div>

      {geoError && (
        <p className="mt-1.5 text-xs text-amber-700" role="alert">
          {geoError}
        </p>
      )}

      {/* City suggestions dropdown */}
      {isOpen && suggestions.length > 0 && (
        <ul
          id="city-suggestions-list"
          role="listbox"
          className="absolute z-40 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto divide-y divide-slate-100"
        >
          {suggestions.map((item) => (
            <li
              key={item.id}
              role="option"
              aria-selected={false}
              onClick={() => handleSelect(item)}
              className="px-4 py-2.5 text-xs text-slate-800 hover:bg-teal-50/70 hover:text-teal-900 cursor-pointer flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-teal-800 shrink-0" />
                <span className="font-medium text-slate-900">{item.name}</span>
                {item.admin1 && (
                  <span className="text-slate-500 text-[11px]">{item.admin1}</span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                {item.country}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Quick metro selector chips */}
      <div className="mt-2.5 flex items-center flex-wrap gap-1.5 text-xs text-slate-500">
        <span className="text-[11px] font-medium text-slate-400">Smog hotspots:</span>
        {DEFAULT_INDIAN_METROS.map((metro) => (
          <button
            key={metro.name}
            type="button"
            onClick={() => handleSelect(metro)}
            className="px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-teal-50 hover:text-teal-900 text-slate-700 text-[11px] font-medium transition-colors border border-slate-200/60"
          >
            {metro.name}
          </button>
        ))}
      </div>
    </div>
  );
}
