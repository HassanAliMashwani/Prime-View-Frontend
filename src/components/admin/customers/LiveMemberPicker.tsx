'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, UserCheck, UserPlus, X, Loader2, Building2 } from 'lucide-react';
import { PickerMember, searchMembersForPicker } from '@/lib/dal/customers';
import { getActiveAdminSession } from '@/lib/dal/adminAuth';

interface LiveMemberPickerProps {
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
  autoFocus?: boolean;
  inputClassName?: string;
}

export default function LiveMemberPicker({
  id,
  name,
  value,
  onChange,
  selectedMember,
  onSelectMember,
  placeholder = 'Type customer name, membership no, CNIC, or phone...',
  required = false,
  disabled = false,
  className = '',
  autoFocus = false,
  inputClassName = '',
}: LiveMemberPickerProps) {
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

  // Debounced search with 250ms delay and cancellation
  useEffect(() => {
    // If a member is already selected or query is empty, do not show live search results
    if (selectedMember || !value.trim()) {
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
        const res = await searchMembersForPicker(session, value, controller.signal);
        if (!controller.signal.aborted) {
          if (res.ok && res.members) {
            setResults(res.members.slice(0, 8));
            setIsOpen(true);
          } else {
            setResults([]);
            setIsOpen(true);
          }
          setIsLoading(false);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setIsLoading(false);
          setResults([]);
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
    onChange(member.fullName);
    setIsOpen(false);
    setResults([]);
  };

  const handleUseAsNew = () => {
    onSelectMember(null);
    setIsOpen(false);
    setResults([]);
  };

  const handleClear = () => {
    onSelectMember(null);
    onChange('');
    setResults([]);
    setIsOpen(false);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' && value.trim()) {
        setIsOpen(true);
      }
      return;
    }

    const totalItems = results.length + 1; // +1 for "Use this as a new customer"

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % totalItems);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + totalItems) % totalItems);
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0) {
        e.preventDefault();
        if (highlightedIndex < results.length) {
          handleSelect(results[highlightedIndex]);
        } else {
          handleUseAsNew();
        }
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* If a saved member is selected, show compact locked field with name and clear control */}
      {selectedMember ? (
        <div className="flex items-center justify-between px-3 py-2 bg-emerald-50/80 border border-emerald-300 rounded-xl text-xs h-[38px] shadow-2xs transition-all">
          <div className="flex items-center gap-2 min-w-0">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="font-bold text-emerald-950 truncate text-xs">
              {selectedMember.fullName}
            </span>
          </div>

          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer shrink-0 ml-2 flex items-center justify-center"
            title="Clear and change customer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            ref={inputRef}
            id={id}
            name={name}
            type="text"
            required={required}
            disabled={disabled}
            autoFocus={autoFocus}
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              if (!isOpen && e.target.value.trim()) {
                setIsOpen(true);
              }
            }}
            onFocus={() => {
              if (value.trim()) {
                setIsOpen(true);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoComplete="off"
            className={`w-full pr-8 py-2 px-3 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 transition-all ${inputClassName} ${
              disabled ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white text-slate-900'
            }`}
          />

          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-slate-400 pointer-events-none">
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
            ) : value ? (
              <button
                type="button"
                tabIndex={-1}
                onClick={handleClear}
                className="pointer-events-auto p-0.5 hover:text-slate-600 cursor-pointer"
                title="Clear input"
              >
                <X className="w-3 h-3" />
              </button>
            ) : (
              <Search className="w-3.5 h-3.5 text-slate-400" />
            )}
          </div>
        </div>
      )}

      {/* Dropdown Results List */}
      {isOpen && !selectedMember && value.trim() && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 animate-in fade-in slide-in-from-top-1 duration-150 max-h-72 overflow-y-auto">
          {isLoading && results.length === 0 ? (
            <div className="p-3 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
              <span>Searching society members...</span>
            </div>
          ) : results.length > 0 ? (
            <>
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
                        <strong className="text-xs font-serif font-bold text-slate-900">
                          {m.fullName}
                        </strong>
                        {m.membershipNo && (
                          <span className="font-mono text-[9px] bg-slate-100 text-slate-700 font-bold px-1.5 py-0.2 rounded border border-slate-200">
                            {m.membershipNo}
                          </span>
                        )}
                        <span className="font-mono text-[10px] text-slate-500">
                          {m.cnic}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2 flex-wrap">
                        {m.phone && <span>Ph: {m.phone}</span>}
                        {m.city && <span>• {m.city}</span>}
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
            </>
          ) : !isLoading ? (
            <div className="p-2.5 text-center text-xs text-slate-400">
              No existing member found matching &ldquo;{value}&rdquo;
            </div>
          ) : null}

          {/* Last Row: Use this as a new customer */}
          <div
            onClick={handleUseAsNew}
            onMouseEnter={() => setHighlightedIndex(results.length)}
            className={`p-2.5 cursor-pointer transition-colors flex items-center gap-2 text-xs font-semibold ${
              highlightedIndex === results.length
                ? 'bg-blue-50 text-blue-900'
                : 'bg-slate-50/60 hover:bg-slate-100/80 text-slate-600'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <div className="min-w-0 truncate">
              <span>Use &ldquo;<strong>{value}</strong>&rdquo; as a new customer</span>
              <span className="text-[10px] text-slate-400 block font-normal">
                Register a new person who is not on file yet
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
