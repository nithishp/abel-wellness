"use client";

import { useState, useEffect, useRef } from "react";
import { FiSearch, FiPackage, FiAlertCircle, FiCheck } from "react-icons/fi";

/**
 * MedicationSearch - Autocomplete component for searching and selecting medications
 * from inventory with stock information
 */
export default function MedicationSearch({
  value,
  onChange,
  onSelect,
  selectedInventoryItem,
  placeholder = "Search medication...",
  disabled = false,
}) {
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedItem, setSelectedItem] = useState(
    selectedInventoryItem || null,
  );
  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update local query when value prop changes
  useEffect(() => {
    if (value !== undefined && value !== query) {
      setQuery(value);
    }
  }, [value]);

  // Search inventory when query changes
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/billing/prescription?action=search-inventory&query=${encodeURIComponent(query)}&limit=10`,
        );
        if (response.ok) {
          const data = await response.json();
          setResults(data.items || []);
          setShowDropdown(true);
        }
      } catch (error) {
        console.error("Error searching inventory:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setQuery(newValue);
    setSelectedItem(null);
    onChange?.(newValue);
  };

  const handleSelectItem = (item) => {
    setQuery(item.name);
    setSelectedItem(item);
    setShowDropdown(false);
    onChange?.(item.name);
    onSelect?.(item);
  };

  const handleFocus = () => {
    if (results.length > 0) {
      setShowDropdown(true);
    }
  };

  const getStockStatusColor = (stock) => {
    if (stock <= 0) return "text-red-400";
    if (stock < 10) return "text-amber-400";
    return "text-emerald-400";
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full px-4 py-2.5 pl-10 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
        />
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {selectedItem && !isLoading && (
          <FiCheck className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
        )}
      </div>

      {/* Dropdown results */}
      {showDropdown && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-600/50 rounded-xl shadow-lg max-h-64 overflow-y-auto">
          {results.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectItem(item)}
              className="w-full px-4 py-3 text-left hover:bg-slate-700/50 transition-colors border-b border-slate-700/50 last:border-b-0 first:rounded-t-xl last:rounded-b-xl"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{item.name}</p>
                  {item.generic_name && (
                    <p className="text-xs text-slate-400 truncate">
                      {item.generic_name}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    {item.potency && (
                      <span className="text-xs px-1.5 py-0.5 bg-violet-500/20 text-violet-400 rounded">
                        {item.potency}
                      </span>
                    )}
                    {item.strength && (
                      <span className="text-xs px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                        {item.strength}
                      </span>
                    )}
                    {item.dosage_form && (
                      <span className="text-xs text-slate-400">
                        {item.dosage_form}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium text-white">
                    ₹{item.selling_price || 0}
                  </p>
                  <div
                    className={`flex items-center gap-1 text-xs ${getStockStatusColor(item.current_stock)}`}
                  >
                    <FiPackage className="w-3 h-3" />
                    <span>
                      {item.current_stock > 0
                        ? `${item.current_stock} ${item.unit_of_measure || "units"}`
                        : "Out of stock"}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {showDropdown &&
        query.length >= 2 &&
        results.length === 0 &&
        !isLoading && (
          <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-600/50 rounded-xl shadow-lg p-4">
            <div className="flex items-center gap-2 text-slate-400">
              <FiAlertCircle className="w-4 h-4" />
              <span className="text-sm">No medications found in inventory</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              You can still type a custom medication name
            </p>
          </div>
        )}

      {/* Selected item info */}
      {selectedItem && (
        <div className="mt-2 p-2 bg-slate-700/30 rounded-lg border border-slate-600/30">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">
              Linked to inventory:{" "}
              <span className="text-emerald-400">{selectedItem.name}</span>
            </span>
            <span className={getStockStatusColor(selectedItem.current_stock)}>
              Stock: {selectedItem.current_stock}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
