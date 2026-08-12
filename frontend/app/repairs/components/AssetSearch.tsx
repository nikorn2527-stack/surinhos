'use client';

import { useState, useEffect, useRef } from 'react';

const API_BASE = 'http://192.168.1.120:5000';

interface Asset {
  id: number;
  asset_code: string;
  name: string;
  category: string;
  building: string;
  floor: string;
  department: string;
  status: string;
}

interface AssetSearchProps {
  onSelect: (asset: Asset) => void;
  selectedAsset: Asset | null;
  onClear: () => void;
}

export default function AssetSearch({ onSelect, selectedAsset, onClear }: AssetSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Asset[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setIsSearching(true);
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const res = await fetch(`${API_BASE}/api/assets`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const allAssets: Asset[] = await res.json();
          const filtered = allAssets.filter((a) =>
            a.asset_code?.toLowerCase().includes(query.toLowerCase()) ||
            a.name?.toLowerCase().includes(query.toLowerCase()) ||
            a.asset_number_1?.toLowerCase().includes(query.toLowerCase())
          ).slice(0, 10);
          setResults(filtered);
          setIsOpen(true);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  const handleSelect = (asset: Asset) => {
    onSelect(asset);
    setQuery(asset.name);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label className="label pb-1">
        <span className="label-text text-xs text-gray-500">ค้นหาครุภัณฑ์จากฐานข้อมูล (ไม่บังคับ)</span>
      </label>
      <div className="relative">
        <input
          type="text"
          placeholder="พิมพ์รหัส หรือ ชื่อครุภัณฑ์..."
          className="input input-bordered input-sm w-full pr-8"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (selectedAsset) onClear();
          }}
          onFocus={() => { if (results.length > 0) setIsOpen(true); }}
        />
        {isSearching && (
          <span className="loading loading-spinner loading-xs absolute right-3 top-1/2 -translate-y-1/2"></span>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {results.map((asset) => (
            <button
              key={asset.id}
              type="button"
              className="w-full text-left px-3 py-2 hover:bg-teal-50 border-b border-gray-50 last:border-0 transition-colors"
              onClick={() => handleSelect(asset)}
            >
              <div className="font-semibold text-sm text-teal-700">{asset.asset_code}</div>
              <div className="text-xs text-gray-600">{asset.name}</div>
              <div className="text-xs text-gray-400">
                {asset.building || ''} {asset.floor ? `ชั้น ${asset.floor}` : ''} {asset.department || ''}
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedAsset && (
        <div className="mt-2 p-2 bg-teal-50 rounded-lg border border-teal-100 text-sm">
          <div className="flex justify-between items-start">
            <div>
              <span className="font-bold text-teal-700">{selectedAsset.asset_code}</span>
              <span className="text-gray-600 ml-2">{selectedAsset.name}</span>
            </div>
            <button
              type="button"
              onClick={() => { onClear(); setQuery(''); }}
              className="btn btn-ghost btn-xs text-gray-400"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
