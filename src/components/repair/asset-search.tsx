'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

interface Asset {
  id: string
  assetNo: string
  name: string
  category: string
  brand: string
  model: string
  serialNo: string | null
  location: string
  department: string | null
  status: string
}

interface AssetSearchProps {
  onSelect: (asset: Asset) => void
  selectedAsset: Asset | null
  onClear: () => void
}

export function AssetSearch({ onSelect, selectedAsset, onClear }: AssetSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Asset[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const searchAssets = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      setIsOpen(false)
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/assets?q=${encodeURIComponent(searchQuery)}`)
      const data = await res.json()
      setResults(data)
      setIsOpen(data.length > 0)
      setHighlightIndex(-1)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      searchAssets(query)
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, searchAssets])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (asset: Asset) => {
    onSelect(asset)
    setQuery('')
    setIsOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightIndex((prev) => Math.min(prev + 1, results.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightIndex((prev) => Math.max(prev - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (highlightIndex >= 0) {
          handleSelect(results[highlightIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        break
    }
  }

  if (selectedAsset) {
    return (
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">ข้อมูลครุภัณฑ์</label>
        <Card className="p-4 bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800">
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200">
                  {selectedAsset.assetNo}
                </span>
                <span className="text-xs text-muted-foreground">{selectedAsset.category}</span>
              </div>
              <p className="font-medium text-sm">{selectedAsset.name}</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>ยี่ห้อ: {selectedAsset.brand}</span>
                <span>รุ่น: {selectedAsset.model}</span>
                <span>สถานที่: {selectedAsset.location}</span>
                <span>แผนก: {selectedAsset.department || '-'}</span>
              </div>
            </div>
            <button
              onClick={onClear}
              className="p-1 rounded-md hover:bg-emerald-200 dark:hover:bg-emerald-800 text-emerald-600 dark:text-emerald-400 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-2" ref={containerRef}>
      <label className="text-sm font-medium text-foreground">ค้นหาครุภัณฑ์</label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="พิมพ์หมายเลขครุภัณฑ์ หรือ ชื่ออุปกรณ์..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-10"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
        )}
        {!loading && query && (
          <button
            onClick={() => { setQuery(''); setResults([]); setIsOpen(false) }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {isOpen && results.length > 0 && (
          <div className="absolute z-50 top-full mt-1 w-full bg-popover border rounded-lg shadow-lg max-h-64 overflow-y-auto">
            {results.map((asset, idx) => (
              <button
                key={asset.id}
                onClick={() => handleSelect(asset)}
                onMouseEnter={() => setHighlightIndex(idx)}
                className={`w-full px-4 py-3 text-left transition-colors flex items-start gap-3 ${
                  idx === highlightIndex
                    ? 'bg-accent'
                    : 'hover:bg-accent/50'
                } ${idx !== results.length - 1 ? 'border-b border-border' : ''}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-primary">{asset.assetNo}</span>
                    <span className="text-xs text-muted-foreground">{asset.category}</span>
                  </div>
                  <p className="text-sm font-medium truncate">{asset.name}</p>
                  <p className="text-xs text-muted-foreground">{asset.location} {asset.department ? `• ${asset.department}` : ''}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {!loading && query && results.length === 0 && (
          <div className="absolute z-50 top-full mt-1 w-full bg-popover border rounded-lg shadow-lg p-4 text-center text-sm text-muted-foreground">
            ไม่พบครุภัณฑ์ &quot;{query}&quot;
          </div>
        )}
      </div>
    </div>
  )
}
