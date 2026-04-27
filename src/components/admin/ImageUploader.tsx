'use client'

import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { UploadCloud, X, Star } from 'lucide-react'
import Image from 'next/image'

interface ProductImage {
  id?: string
  url: string
  publicId?: string
  isPrimary?: boolean
  sortOrder?: number
}

interface ImageUploaderProps {
  productId?: string
  images: ProductImage[]
  onUploadSuccess: (image: ProductImage) => void
  onRemoveImage?: (id: string) => void
  onSetPrimary?: (id: string) => void
}

export function ImageUploader({ productId, images, onUploadSuccess, onRemoveImage, onSetPrimary }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setUploading(true)
      setError(null)
      try {
        const uploadPromises = acceptedFiles.map(async (file, index) => {
          const formData = new FormData()
          formData.append('file', file)

          // If images list is empty and this is the first file in the batch, make it primary
          const isPrimary = images.length === 0 && index === 0

          const res = await fetch(`/api/admin/upload`, {
            method: 'POST',
            body: formData,
          })

          const data = await res.json()
          if (!res.ok || !data.success) {
            throw new Error(data.error || 'Upload failed')
          }

          return {
            id: Math.random().toString(36).substring(7),
            url: data.data.url,
            publicId: data.data.publicId,
            isPrimary,
            sortOrder: images.length + index,
          }
        })

        const results = await Promise.all(uploadPromises)
        results.forEach(img => onUploadSuccess(img))
      } catch (err: any) {
        setError(err.message)
      } finally {
        setUploading(false)
      }
    },
    [images.length, onUploadSuccess]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    maxSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 8,
  })

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed border-[#E5E5E5] p-8 text-center cursor-pointer transition-colors bg-[#FAFAFA] ${
          isDragActive ? 'border-[#000000] bg-gray-50' : 'hover:border-[#000000]'
        }`}
      >
        <input {...getInputProps()} />
        <UploadCloud className="mx-auto h-8 w-8 text-[#A3A3A3] mb-2" />
        <p className="text-sm text-[#000000]">
          {isDragActive ? 'Drop images here...' : 'Drag images here or click to upload'}
        </p>
        <p className="text-xs text-[#737373] mt-1">JPEG, PNG, WEBP (Max 5MB)</p>
      </div>

      {error && <p className="text-sm text-[#EF4444]">{error}</p>}
      {uploading && <p className="text-sm text-[#000000] animate-pulse">Uploading...</p>}

      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((img) => (
            <div key={img.id || img.url} className="relative group border border-[#E5E5E5] aspect-square">
              <Image src={img.url} alt="Product image" fill className="object-cover" />
              {img.isPrimary ? (
                <div className="absolute top-2 left-2 bg-black text-white p-1 rounded-full shadow z-10">
                  <Star className="h-4 w-4 fill-current" />
                </div>
              ) : (
                onSetPrimary && (
                  <button
                    type="button"
                    onClick={() => onSetPrimary(img.id || img.url)}
                    className="absolute top-2 left-2 bg-white/80 text-gray-400 p-1 rounded-full shadow opacity-0 group-hover:opacity-100 hover:text-black hover:bg-white transition-all z-10"
                    title="Set as Thumbnail"
                  >
                    <Star className="h-4 w-4" />
                  </button>
                )
              )}
              {onRemoveImage && (
                <button
                  type="button"
                  onClick={() => onRemoveImage(img.id as string)}
                  className="absolute top-2 right-2 bg-white/80 p-1 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                >
                  <X className="h-4 w-4 text-[#EF4444]" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
