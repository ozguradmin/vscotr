"use client"

import type React from "react"

import { useState, useRef, useCallback, useMemo } from "react"
import {
  Search,
  Menu,
  X,
  Upload,
  ImageIcon,
  Sliders,
  RotateCw,
  FlipHorizontal,
  Undo2,
  Redo2,
  Check,
  RotateCcw,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { VscoLogo } from "@/components/vsco-logo"
import { SearchModal } from "@/components/search-modal"
import { MobileMenu } from "@/components/mobile-menu"
import { storage, databases, APPWRITE_CONFIG } from "@/lib/appwrite/client"
import { ID } from "appwrite"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { VscoImage } from "@/components/vsco-image"
import { useAuth } from "@/lib/auth-context"

interface CreateViewProps {
  userId: string
  username: string
}

// VSCO presetleri
const presets = [
  { id: "original", name: "Orijinal", filter: "none" },
  { id: "a1", name: "A1", filter: "sepia(0.1) saturate(1.3) contrast(1.1)" },
  { id: "a4", name: "A4", filter: "sepia(0.2) saturate(1.1) brightness(1.05)" },
  { id: "a6", name: "A6", filter: "sepia(0.3) saturate(0.9) contrast(1.1)" },
  { id: "c1", name: "C1", filter: "saturate(1.4) contrast(0.9) brightness(1.1)" },
  { id: "c3", name: "C3", filter: "saturate(1.2) hue-rotate(10deg) brightness(1.05)" },
  { id: "f2", name: "F2", filter: "sepia(0.1) saturate(1.5) contrast(1.05)" },
  { id: "g3", name: "G3", filter: "grayscale(0.2) contrast(1.2) brightness(0.95)" },
  { id: "hb1", name: "HB1", filter: "saturate(1.1) contrast(1.15) brightness(0.95)" },
  { id: "hb2", name: "HB2", filter: "saturate(0.9) contrast(1.2) sepia(0.05)" },
  { id: "j1", name: "J1", filter: "sepia(0.15) saturate(1.1) brightness(1.1)" },
  { id: "k1", name: "K1", filter: "grayscale(0.1) contrast(1.1) saturate(1.2)" },
  { id: "m3", name: "M3", filter: "sepia(0.2) contrast(1.05) saturate(1.1)" },
  { id: "m5", name: "M5", filter: "sepia(0.25) brightness(1.05) contrast(1.1)" },
  { id: "p5", name: "P5", filter: "saturate(1.3) contrast(1.05) hue-rotate(-5deg)" },
  { id: "t1", name: "T1", filter: "sepia(0.1) saturate(1.2) brightness(1.1)" },
]

export function CreateView({ userId, username }: CreateViewProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const { currentProfile, user } = useAuth() // Added useAuth destructuring
  const [image, setImage] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [aspectRatio, setAspectRatio] = useState(1)
  const [activeTab, setActiveTab] = useState<"presets" | "adjust">("presets")
  const [selectedPreset, setSelectedPreset] = useState("original")
  const [caption, setCaption] = useState("")
  const [postDate, setPostDate] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [flipH, setFlipH] = useState(false)
  const [showEffects, setShowEffects] = useState(false)

  const initialAdjustments = {
    exposure: 0,
    contrast: 0,
    saturation: 0,
    temperature: 0,
    highlights: 0,
    shadows: 0,
    vignette: 0,
    grain: 0,
    fade: 0,
    sharpness: 0,
  }

  const [adjustments, setAdjustments] = useState(initialAdjustments)
  const [history, setHistory] = useState<(typeof adjustments)[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()



  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new window.Image()
        img.onload = () => {
          setAspectRatio(img.width / img.height)
        }
        img.src = event.target?.result as string
        setImage(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith("image/")) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new window.Image()
        img.onload = () => {
          setAspectRatio(img.width / img.height)
        }
        img.src = event.target?.result as string
        setImage(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const updateAdjustment = (key: keyof typeof adjustments, value: number) => {
    const newAdjustments = { ...adjustments, [key]: value }
    setAdjustments(newAdjustments)

    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newAdjustments)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setAdjustments(history[historyIndex - 1])
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setAdjustments(history[historyIndex + 1])
    }
  }

  const resetAdjustments = () => {
    setAdjustments(initialAdjustments)
    setSelectedPreset("original")
    setRotation(0)
    setFlipH(false)
    setHistory([])
    setHistoryIndex(-1)
  }

  const getFilterStyle = () => {
    const preset = presets.find((p) => p.id === selectedPreset)
    const presetFilter = preset?.filter || "none"

    const adjustmentFilters = [
      `brightness(${1 + adjustments.exposure / 100})`,
      `contrast(${1 + adjustments.contrast / 100})`,
      `saturate(${1 + adjustments.saturation / 100})`,
      adjustments.temperature > 0 ? `sepia(${adjustments.temperature / 200})` : "",
      adjustments.fade > 0 ? `opacity(${1 - adjustments.fade / 200})` : "",
    ]
      .filter(Boolean)
      .join(" ")

    return {
      filter: `${presetFilter} ${adjustmentFilters}`.trim(),
      transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1})`,
    }
  }

  const handlePublish = async () => {
    if (!imageFile || !image) return

    setIsUploading(true)

    try {
      // 1. Prepare Image (Canvas conversion logic remains same)
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      const img = new Image()

      await new Promise((resolve) => {
        img.onload = resolve
        img.src = image
      })

      let width = img.width
      let height = img.height
      const maxDimension = 1920

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = (height / width) * maxDimension
          width = maxDimension
        } else {
          width = (width / height) * maxDimension
          height = maxDimension
        }
      }

      canvas.width = width
      canvas.height = height
      ctx?.drawImage(img, 0, 0, width, height)

      // Convert to Blob (WebP)
      const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), "image/webp", 0.85))
      const fileToUpload = new File([blob], "image.webp", { type: "image/webp" })

      // 2. Upload to Cloudflare R2 (Bypassing Appwrite Storage Bandwidth)
      // Get Presigned URL
      const presignRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: 'image.webp',
          contentType: 'image/webp'
        })
      });

      if (!presignRes.ok) throw new Error('Upload init failed');
      const { uploadUrl, publicUrl } = await presignRes.json();

      // Upload directly to R2
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: fileToUpload,
        headers: {
          'Content-Type': 'image/webp'
        }
      });

      if (!uploadRes.ok) throw new Error('R2 Upload failed');

      // 3. Use Cloudflare Public URL
      const imageUrl = publicUrl;

      // 4. Create Post Document
      await databases.createDocument(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.COLLECTIONS.POSTS,
        ID.unique(),
        {
          user_id: userId,
          image_url: imageUrl,
          caption: caption || null,
          created_at: postDate ? new Date(postDate).toISOString() : new Date().toISOString(),
          aspect_ratio: aspectRatio,
          order_index: Math.floor(Date.now() / 1000)
        }
      )

      // Fix Redirect to use current username
      const targetUsername = currentProfile?.username || user?.name
      router.push(`/${targetUsername}`)
      router.refresh()
    } catch (error) {
      console.error("[Create] Upload/Publish error:", error)
      alert("Yükleme sırasında bir hata oluştu: " + (error as any).message)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="flex items-center justify-between h-14 px-4 max-w-6xl mx-auto">
          <Link href="/akis" className="flex items-center gap-2">
            <VscoLogo className="w-8 h-8" />
            <span className="font-semibold tracking-wide">vscotr</span>
          </Link>
          <div className="flex items-center gap-1">
            {image && (
              <Button onClick={handlePublish} disabled={isUploading} size="sm" className="hidden md:flex">
                {isUploading ? "Yükleniyor..." : "Paylaş"}
              </Button>
            )}
            <button className="p-2 hover:bg-accent rounded-full transition-colors" onClick={() => setSearchOpen(true)}>
              <Search className="w-5 h-5" />
            </button>
            <button
              className="p-2 hover:bg-accent rounded-full transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      <MobileMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} currentUserId={userId} />
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      <main className="flex-1 flex flex-col lg:flex-row">
        <div className="flex-1 flex items-center justify-center p-4 bg-muted/30">
          {image ? (
            <div className="relative max-w-full max-h-[60vh] lg:max-h-[80vh]">
              <img
                src={image || "/placeholder.svg"}
                alt="Preview"
                className="max-w-full max-h-[60vh] lg:max-h-[80vh] object-contain"
                style={getFilterStyle()}
              />
            </div>
          ) : (
            <div
              className="w-full max-w-md aspect-square border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-foreground transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <Upload className="w-12 h-12 text-muted-foreground" />
              <p className="text-muted-foreground text-center px-4">Fotoğraf yüklemek için tıkla veya sürükle bırak</p>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
            </div>
          )}
        </div>

        {image && (
          <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-border bg-background flex flex-col">
            <div className="p-3 border-b border-border">
              <button
                onClick={() => setShowEffects(!showEffects)}
                className="w-full flex items-center justify-between text-sm font-medium hover:bg-accent p-2 rounded"
              >
                <span>{showEffects ? "Efektleri Gizle" : "Efektleri Göster"}</span>
                {showEffects ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {showEffects && (
              <>
                <div className="flex border-b border-border">
                  <button
                    onClick={() => setActiveTab("presets")}
                    className={`flex-1 py-3 text-sm font-medium ${activeTab === "presets" ? "border-b-2 border-foreground" : "text-muted-foreground"
                      }`}
                  >
                    <ImageIcon className="w-4 h-4 mx-auto" />
                  </button>
                  <button
                    onClick={() => setActiveTab("adjust")}
                    className={`flex-1 py-3 text-sm font-medium ${activeTab === "adjust" ? "border-b-2 border-foreground" : "text-muted-foreground"
                      }`}
                  >
                    <Sliders className="w-4 h-4 mx-auto" />
                  </button>
                </div>

                <div className="flex items-center justify-center gap-2 p-2 border-b border-border">
                  <button onClick={() => setRotation((r) => r + 90)} className="p-2 hover:bg-accent rounded-full">
                    <RotateCw className="w-4 h-4" />
                  </button>
                  <button onClick={() => setFlipH(!flipH)} className="p-2 hover:bg-accent rounded-full">
                    <FlipHorizontal className="w-4 h-4" />
                  </button>
                  <button onClick={resetAdjustments} className="p-2 hover:bg-accent rounded-full" title="Sıfırla">
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={undo}
                    disabled={historyIndex <= 0}
                    className="p-2 hover:bg-accent rounded-full disabled:opacity-30"
                  >
                    <Undo2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={redo}
                    disabled={historyIndex >= history.length - 1}
                    className="p-2 hover:bg-accent rounded-full disabled:opacity-30"
                  >
                    <Redo2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  {activeTab === "presets" ? (
                    <div className="grid grid-cols-3 gap-2">
                      {presets.map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => setSelectedPreset(preset.id)}
                          className={`aspect-square rounded-lg overflow-hidden relative ${selectedPreset === preset.id ? "ring-2 ring-foreground" : ""
                            }`}
                        >
                          <img
                            src={image || "/placeholder.svg"}
                            alt={preset.name}
                            className="w-full h-full object-cover"
                            style={{ filter: preset.filter }}
                          />
                          <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs py-1 text-center">
                            {preset.name}
                          </span>
                          {selectedPreset === preset.id && (
                            <div className="absolute top-1 right-1 bg-foreground text-background rounded-full p-0.5">
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {[
                        { key: "exposure", label: "Pozlama", min: -100, max: 100 },
                        { key: "contrast", label: "Kontrast", min: -100, max: 100 },
                        { key: "saturation", label: "Doygunluk", min: -100, max: 100 },
                        { key: "temperature", label: "Sıcaklık", min: -100, max: 100 },
                        { key: "highlights", label: "Aydınlık", min: -100, max: 100 },
                        { key: "shadows", label: "Gölge", min: -100, max: 100 },
                        { key: "vignette", label: "Vinyet", min: 0, max: 100 },
                        { key: "grain", label: "Grenli", min: 0, max: 100 },
                        { key: "fade", label: "Soluk", min: 0, max: 100 },
                        { key: "sharpness", label: "Keskinlik", min: 0, max: 100 },
                      ].map(({ key, label, min, max }) => (
                        <div key={key}>
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-sm">{label}</Label>
                            <span className="text-xs text-muted-foreground">
                              {adjustments[key as keyof typeof adjustments]}
                            </span>
                          </div>
                          <Slider
                            value={[adjustments[key as keyof typeof adjustments]]}
                            min={min}
                            max={max}
                            step={1}
                            onValueChange={([value]) => updateAdjustment(key as keyof typeof adjustments, value)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="p-4 border-t border-border space-y-4">
              <Button onClick={handlePublish} disabled={isUploading} className="w-full md:hidden">
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Yükleniyor...
                  </>
                ) : (
                  "Paylaş"
                )}
              </Button>
              <div>
                <Label htmlFor="caption" className="text-sm">
                  Açıklama (isteğe bağlı)
                </Label>
                <Textarea
                  id="caption"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Bir açıklama ekle..."
                  className="mt-1 resize-none"
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="postDate" className="text-sm">
                  Tarih (isteğe bağlı)
                </Label>
                <Input
                  id="postDate"
                  type="date"
                  value={postDate ? new Date(postDate).toISOString().slice(0, 10) : ""}
                  onChange={(e) => setPostDate(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
