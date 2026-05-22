"use client";

interface StarRatingProps {
  value: number | null;
  onChange?: (v: number) => void;
  readonly?: boolean;
}

export default function StarRating({ value, onChange, readonly = false }: StarRatingProps) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={`text-xl transition-colors ${
            readonly ? "cursor-default" : "hover:scale-110"
          } ${
            value !== null && star <= value
              ? "text-amber-500"
              : "text-stone-300 dark:text-stone-600"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
