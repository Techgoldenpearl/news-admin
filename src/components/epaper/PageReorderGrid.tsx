"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { epaperApi } from "@/lib/api";
import { GripVertical, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Page {
  id: number;
  pageNumber: number;
  imageUrl: string;
  thumbnailUrl: string | null;
}

function SortablePage({ page, onDelete, onSelect, selected }: { page: Page; onDelete: (id: number) => void; onSelect: (id: number) => void; selected: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: page.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className={`relative border-2 rounded-lg overflow-hidden aspect-[3/4] bg-gray-50 cursor-pointer ${selected ? "border-blue-500" : "border-transparent"}`}
      onClick={() => onSelect(page.id)}
    >
      <img src={page.thumbnailUrl || page.imageUrl} alt={`Page ${page.pageNumber}`} className="w-full h-full object-cover" />
      <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center py-0.5">{page.pageNumber}</span>
      <button
        type="button"
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className="absolute top-1 left-1 bg-white/90 rounded-full p-1 cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical size={12} />
      </button>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onDelete(page.id); }}
        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}

interface PageReorderGridProps {
  issueId: number;
  pages: Page[];
  onPagesChange: (pages: Page[]) => void;
  selectedPageId: number | null;
  onSelectPage: (id: number) => void;
}

export default function PageReorderGrid({ issueId, pages, onPagesChange, selectedPageId, onSelectPage }: PageReorderGridProps) {
  const [saving, setSaving] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = pages.findIndex((p) => p.id === active.id);
    const newIndex = pages.findIndex((p) => p.id === over.id);
    const reordered = arrayMove(pages, oldIndex, newIndex).map((p, i) => ({ ...p, pageNumber: i + 1 }));
    onPagesChange(reordered);

    setSaving(true);
    try {
      await epaperApi.reorderPages(issueId, reordered.map((p) => ({ id: p.id, pageNumber: p.pageNumber })));
    } catch {
      toast.error("Failed to save new page order");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (pageId: number) => {
    if (!confirm("Delete this page?")) return;
    try {
      await epaperApi.deletePage(pageId);
      onPagesChange(pages.filter((p) => p.id !== pageId).map((p, i) => ({ ...p, pageNumber: i + 1 })));
      toast.success("Page deleted");
    } catch { toast.error("Failed to delete page"); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-sm">Pages ({pages.length}) — drag to reorder</h4>
        {saving && <span className="text-xs text-gray-400">Saving order…</span>}
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={pages.map((p) => p.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-6 gap-2">
            {pages.map((page) => (
              <SortablePage
                key={page.id}
                page={page}
                onDelete={handleDelete}
                onSelect={onSelectPage}
                selected={selectedPageId === page.id}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
