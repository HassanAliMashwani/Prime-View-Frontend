'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Building2, X } from 'lucide-react';
import { PickerMember, searchMembersForPicker } from '@/lib/dal/customers';
import { getActiveAdminSession } from '@/lib/dal/adminAuth';
import { formatCnic } from '@/lib/utils/cnic';

interface LiveCnicMemberPickerProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (val: string) => void;
  selectedMember: PickerMember | null;
  onSelectMember: (member: PickerMember | null) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  autoFocus?: boolean;
}

export default function LiveCnicMemberPicker({
  id,
  name,
  value,
  onChange,
  selectedMember,
  onSelectMember,
  placeholder = '00000-0000000-0',
  required = false,
  disabled = false,
  className = '',
  inputClassName = '',
  autoFocus = false,
}: LiveCnicMemberPickerProps) {
  const [results, setResults] = useState<PickerMember[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search with 250ms delay
  // One digit is enough. Dashes do not matter.
  useEffect(() => {
    const rawVal = value || '';
    const digitsOnly = rawVal.replace(/\D/g, '');

    // If a member is already selected or no digits/characters typed, do not show live search results
    if (selectedMember || (!rawVal.trim() && digitsOnly.length === 0)) {
      setResults([]);
      setIsOpen(false);
      setIsLoading(false);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      return;
    }

    setIsLoading(true);
    setHighlightedIndex(-1);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timer = setTimeout(async () => {
      try {
        const session = getActiveAdminSession();
        // Query with raw value or digits - backend handles dash-insensitivity
        const res = await searchMembersForPicker(session, rawVal, controller.signal);
        if (!controller.signal.aborted) {
          if (res.ok && res.members && res.members.length > 0) {
            setResults(res.members.slice(0, 8));
            setIsOpen(true);
          } else {
            setResults([]);
            setIsOpen(false);
          }
          setIsLoading(false);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setIsLoading(false);
          setResults([]);
          setIsOpen(false);
        }
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value, selectedMember]);

  const handleSelect = (member: PickerMember) => {
    onSelectMember(member);
    onChange(member.cnic ? formatCnic(member.cnic) : value);
    setIsOpen(false);
    setResults([]);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) {
      if (e.key === 'ArrowDown' && value.trim() && results.length > 0) {
        setIsOpen(true);
      }
      return;
    }

    const totalItems = results.length;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % totalItems);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + totalItems) % totalItems);
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < results.length) {
        e.preventDefault();
        handleSelect(results[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const isLocked = Boolean(selectedMember) || disabled;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="text"
          required={required}
          disabled={isLocked}
          autoFocus={autoFocus}
          maxLength={15}
          value={value}
          onChange={(e) => {
            const formatted = formatCnic(e.target.value);
            onChange(formatted);
            if (!isOpen && formatted.trim() && results.length > 0) {
              setIsOpen(true);
            }
          }}
          onFocus={() => {
            if (value.trim() && !isLocked && results.length > 0) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className={`w-full pr-8 py-2 px-3 text-xs font-mono rounded-xl border transition-all ${inputClassName} ${
            isLocked
              ? 'bg-emerald-50/50 border-emerald-200 text-slate-700 cursor-not-allowed'
              : 'bg-white border-slate-300 text-slate-900 focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10'
          }`}
        />

        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-slate-400 pointer-events-none">
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
          ) : !isLocked && value ? (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => {
                onChange('');
                setResults([]);
                setIsOpen(false);
                inputRef.current?.focus();
              }}
              className="pointer-events-auto p-0.5 hover:text-slate-600 cursor-pointer"
              title="Clear CNIC"
            >
              <X className="w-3 h-3" />
            </button>
          ) : (
            <Search className="w-3.5 h-3.5 text-slate-400" />
          )}
        </div>
      </div>

      {/* Dropdown Results List under CNIC box */}
      {isOpen && !isLocked && value.trim() && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 animate-in fade-in slide-in-from-top-1 duration-150 max-h-72 overflow-y-auto">
          <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Matching Saved Members</span>
            <span>{results.length} of max 8</span>
          </div>
          {results.map((m, idx) => {
            const isHighlighted = idx === highlightedIndex;
            return (
              <div
                key={m.id}
                onClick={() => handleSelect(m)}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={`p-2.5 cursor-pointer transition-colors flex items-center justify-between gap-3 text-left ${
                  isHighlighted ? 'bg-emerald-50/90 text-emerald-950' : 'hover:bg-slate-50 text-slate-800'
                }`}
              >
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      {m.cnic ? formatCnic(m.cnic) : m.cnic}
                    </span>
                    <strong className="text-xs font-serif font-bold text-slate-900">
                      {m.fullName}
                    </strong>
                    {m.membershipNo && (
                      <span className="font-mono text-[9px] bg-slate-100 text-slate-700 font-bold px-1.5 py-0.2 rounded border border-slate-200">
                        {m.membershipNo}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2 flex-wrap">
                    {m.city && <span>City: {m.city}</span>}
                    {m.phone && <span>• Ph: {m.phone}</span>}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    <Building2 className="w-3 h-3 text-slate-400" />
                    <span>{m.plotCount} {m.plotCount === 1 ? 'Plot' : 'Plots'}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
