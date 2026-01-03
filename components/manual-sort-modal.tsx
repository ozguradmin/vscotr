"use client"

import { useState } from "react"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, Save, RotateCcw, Loader2 } from "lucide-react"
import { databases, APPWRITE_CONFIG } from "@/lib/appwrite/client"
import { VscoImage } from "@/components/vsco-image"

interface ManualSortModalProps {
    isOpen: boolean
    onClose: () => void
    posts: any[]
    onSaveSuccess: () => void
}

function SortableItem({ id, post }: { id: string, post: any }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="aspect-square relative group bg-muted overflow-hidden touch-none cursor-move select-none">
            {post.image_url ? (
                <img src={post.image_url} alt="" className="w-full h-full object-cover pointer-events-none select-none" />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-xs">?</div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        </div>
    )
}

export function ManualSortModal({ isOpen, onClose, posts, onSaveSuccess }: ManualSortModalProps) {
    const [items, setItems] = useState(posts)
    const [saving, setSaving] = useState(false)
    const [activeId, setActiveId] = useState<string | null>(null)

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const handleDragStart = (event: any) => {
        setActiveId(event.active.id)
    }

    const handleDragEnd = (event: any) => {
        const { active, over } = event

        if (active.id !== over?.id) {
            setItems((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id)
                const newIndex = items.findIndex((item) => item.id === over?.id)
                return arrayMove(items, oldIndex, newIndex)
            })
        }
        setActiveId(null)
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            // Update order_index for all items based on new array order
            // Optimally, only update modified ones, but simpler to update all for guarantee
            await Promise.all(items.map((post, index) =>
                databases.updateDocument(
                    APPWRITE_CONFIG.DATABASE_ID,
                    APPWRITE_CONFIG.COLLECTIONS.POSTS,
                    post.id,
                    { order_index: index }
                )
            ))
            onSaveSuccess()
            onClose()
        } catch (e) {
            console.error("Save sort error", e)
            alert("Sıralama kaydedilemedi.")
        } finally {
            setSaving(false)
        }
    }

    // Reset items when modal opens/posts change
    useState(() => {
        setItems(posts)
    })

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-background w-full max-w-lg rounded-xl shadow-2xl overflow-hidden border border-border flex flex-col max-h-[85vh]">
                <div className="p-4 border-b border-border flex items-center justify-between bg-card/50">
                    <div>
                        <h2 className="text-lg font-bold tracking-tight">Grid Düzeni</h2>
                        <p className="text-xs text-muted-foreground">Sürükleyip bırakarak sıralamayı değiştirin.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-accent rounded-full text-muted-foreground hover:text-foreground">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 bg-background">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                        onDragStart={handleDragStart}
                    >
                        <SortableContext items={items.map(p => p.id)} strategy={rectSortingStrategy}>
                            <div className="grid grid-cols-3 gap-1">
                                {items.map((post) => (
                                    <SortableItem key={post.id} id={post.id} post={post} />
                                ))}
                            </div>
                        </SortableContext>
                        <DragOverlay>
                            {activeId ? (
                                <div className="aspect-square relative overflow-hidden shadow-2xl opacity-90 scale-105 z-50 ring-2 ring-primary">
                                    <img src={items.find(i => i.id === activeId)?.image_url} className="w-full h-full object-cover" />
                                </div>
                            ) : null}
                        </DragOverlay>
                    </DndContext>
                </div>

                <div className="p-4 border-t border-border bg-card/50 flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose} disabled={saving}>İptal</Button>
                    <Button onClick={handleSave} disabled={saving} className="min-w-[100px]">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Kaydet
                    </Button>
                </div>
            </div>
        </div>
    )
}
