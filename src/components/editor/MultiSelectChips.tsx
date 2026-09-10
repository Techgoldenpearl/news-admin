"use client";

interface MultiSelectChipsProps<T extends { id: number }> {
  items: T[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  label: (item: T) => string;
  emptyText?: string;
}

export function MultiSelectChips<T extends { id: number }>({
  items,
  selectedIds,
  onToggle,
  label,
  emptyText = "None available",
}: MultiSelectChipsProps<T>) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onToggle(item.id)}
          className={`px-3 py-1 text-xs rounded-full border transition ${
            selectedIds.includes(item.id)
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-gray-50 text-gray-600 hover:border-blue-300"
          }`}
        >
          {label(item)}
        </button>
      ))}
      {items.length === 0 && <p className="text-xs text-gray-400">{emptyText}</p>}
    </div>
  );
}
