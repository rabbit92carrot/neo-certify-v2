'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/cn';

interface PatientSuggestion {
  id: string;
  phone: string;
  maskedPhone: string;
}

interface PatientAutocompleteProps {
  onSelect: (patient: PatientSuggestion) => void;
  searchFn: (query: string) => Promise<PatientSuggestion[]>;
  placeholder?: string;
  className?: string;
}

export function PatientAutocomplete({
  onSelect,
  searchFn,
  placeholder = '환자 전화번호 검색',
  className,
}: PatientAutocompleteProps) {
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<PatientSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void searchFn(query).then((data) => {
        setResults(data);
        setIsOpen(data.length > 0);
        setActiveIndex(-1);
      });
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query, searchFn]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      const selected = results[activeIndex];
      if (selected) {
        onSelect(selected);
        setQuery(selected.maskedPhone);
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => results.length > 0 && setIsOpen(true)}
        placeholder={placeholder}
        role="combobox"
        aria-expanded={isOpen}
        aria-autocomplete="list"
        aria-controls="patient-listbox"
      />
      {isOpen && (
        <ul
          id="patient-listbox"
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-white py-1 shadow-md"
        >
          {results.map((patient, index) => (
            <li
              key={patient.id}
              role="option"
              aria-selected={index === activeIndex}
              className={cn(
                'cursor-pointer px-3 py-2 text-sm',
                index === activeIndex ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100'
              )}
              onMouseDown={() => {
                onSelect(patient);
                setQuery(patient.maskedPhone);
                setIsOpen(false);
              }}
            >
              {patient.maskedPhone}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
