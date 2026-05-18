"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Search, LoaderCircle, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  basePrice: number;
  variants?: { id: string; title: string; stock: number }[];
}

interface ProductComboboxProps {
  value: string;
  onChange: (value: string, product?: Product) => void;
}

export function ProductCombobox({ value, onChange }: ProductComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const fetchProducts = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products?search=${query}&limit=10`);
      const data = await res.json();
      if (data.success) {
        setResults(data.data.products);
        // If we have a value but no selected product name, try to find it in initial results
        if (value && !selectedProduct) {
          const match = data.data.products.find((p: Product) => p.id === value);
          if (match) setSelectedProduct(match);
        }
      }
    } catch (err) {
      console.error("Failed to fetch products", err);
    } finally {
      setLoading(false);
    }
  }, [value, selectedProduct]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, fetchProducts]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between rounded-none bg-white border-gray-200 font-body hover:bg-neutral-50"
        >
          <span className="truncate">
            {selectedProduct ? selectedProduct.name : "Search or select a product..."}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-none border-gray-200 font-body" align="start">
        <div className="flex items-center border-b border-gray-100 px-3 py-2">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <input
            className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="max-h-[300px] overflow-y-auto p-1">
          {loading ? (
            <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
              <LoaderCircle className="h-4 w-4 animate-spin mr-2" /> Searching...
            </div>
          ) : results.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No products found.
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {results.map((product) => (
                <div
                  key={product.id}
                  onClick={() => {
                    setSelectedProduct(product);
                    onChange(product.id, product);
                    setOpen(false);
                  }}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none hover:bg-neutral-100",
                    value === product.id ? "bg-neutral-100 text-neutral-900" : ""
                  )}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === product.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {product.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
