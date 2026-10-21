'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Building2, ChevronDown, Check, Search } from 'lucide-react';
import { PAKISTAN_DEPOSITORY_BANKS } from '@/data/pakistanBanks';

interface BankComboboxProps {
  id?: string;
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

export function BankCombobox({
  id = 'receipt-bank-name',
  value,
  onChange,
  disabled = false,
  required = true,
  placeholder = 'Select or type bank name (e.g. Meezan Bank Limited)',
  className = '',
}: BankComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Filtered banks based on user input
  const filteredBanks = useMemo(() => {
    const query = (value || '').trim().toLowerCase();
    if (!query) {
      return PAKISTAN_DEPOSITORY_BANKS;
    }
    return PAKISTAN_DEPOSITORY_BANKS.filter((b) =>
      b.toLowerCase().includes(query)
    );
  }, [value]);

  const isExactMatch = useMemo(() => {
    return PAKISTAN_DEPOSITORY_BANKS.some(
      (b) => b.toLowerCase() === (value || '').trim().toLowerCase()
    );
  }, [value]);

  const handleSelectBank = (bankName: string) => {
    onChange(bankName);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setIsOpen(true);
      return;
    }

    if (isOpen) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredBanks.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredBanks.length - 1
        );
      } else if (e.key === 'Enter') {
        if (highlightedIndex >= 0 && highlightedIndex < filteredBanks.length) {
          e.preventDefault();
          handleSelectBank(filteredBanks[highlightedIndex]);
        }
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          list="pakistan-depository-banks-datalist"
          autoComplete="off"
          className="w-full pl-9 pr-9 py-2.5 text-xs sm:text-sm rounded-xl border border-black/15 bg-white text-[#151914] placeholder:text-[#9BA392] focus:outline-hidden focus:border-[#43612B] focus:ring-2 focus:ring-[#43612B]/10 font-medium transition-all"
        />
        <Building2 className="w-4 h-4 text-[#6B7462] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => {
            if (!disabled) {
              setIsOpen((prev) => !prev);
              inputRef.current?.focus();
            }
          }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#6B7462] hover:text-[#151914] cursor-pointer"
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Hidden datalist for browser fallback & accessibility */}
      <datalist id="pakistan-depository-banks-datalist">
        {PAKISTAN_DEPOSITORY_BANKS.map((bank) => (
          <option key={bank} value={bank} />
        ))}
      </datalist>

      {/* Interactive Floating Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-xl border border-black/10 bg-white shadow-xl py-1 animate-in fade-in zoom-in-95 duration-100 text-xs sm:text-sm">
          {filteredBanks.length > 0 ? (
            filteredBanks.map((bank, index) => {
              const isSelected = bank.toLowerCase() === (value || '').trim().toLowerCase();
              const isHighlighted = index === highlightedIndex;
              return (
                <div
                  key={bank}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelectBank(bank);
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`px-3 py-2 flex items-center justify-between cursor-pointer transition-colors ${
                    isHighlighted
                      ? 'bg-[#F2F5ED] text-[#151914]'
                      : isSelected
                      ? 'bg-[#EAF0E7]/60 text-[#43612B] font-semibold'
                      : 'text-[#151914] hover:bg-slate-50'
                  }`}
                >
                  <span className="truncate">{bank}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#43612B] shrink-0 ml-2" />}
                </div>
              );
            })
          ) : (
            <div className="px-3 py-2 text-slate-500 italic text-xs">
              No matching bank in official list.
            </div>
          )}

          {/* Indicator for custom typed bank name */}
          {value.trim() && !isExactMatch && (
            <div className="px-3 py-2 border-t border-slate-100 bg-amber-50/70 text-amber-900 text-[11px] flex items-center gap-1.5">
              <span className="font-bold">Custom Bank:</span>
              <span className="truncate">&ldquo;{value.trim()}&rdquo; will be recorded on slip.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
