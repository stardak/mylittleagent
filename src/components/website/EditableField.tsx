"use client";

import { useState, useRef, useEffect } from "react";
import { Pencil } from "lucide-react";

interface Props {
    field: string;
    value: string;
    editMode?: boolean;
    onEdit?: (field: string, value: string) => void;
    multiline?: boolean;
    /** Extra classes applied to the outer wrapper in edit mode */
    wrapClassName?: string;
    children: React.ReactNode;
    accentColor?: string;
}

export function EditableField({
    field,
    value,
    editMode,
    onEdit,
    multiline = false,
    wrapClassName = "",
    children,
    accentColor = "#1A9E96",
}: Props) {
    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState(value);
    const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

    // Keep draft in sync when value changes externally (e.g. AI applies suggestion)
    useEffect(() => { setDraft(value); }, [value]);

    useEffect(() => {
        if (isEditing) inputRef.current?.focus();
    }, [isEditing]);

    if (!editMode) return <>{children}</>;

    const save = () => {
        if (draft !== value) onEdit?.(field, draft);
        setIsEditing(false);
    };

    const cancel = () => {
        setDraft(value);
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className={`relative ${wrapClassName}`}>
                {multiline ? (
                    <textarea
                        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Escape") cancel();
                        }}
                        rows={4}
                        className="block w-full bg-white/10 backdrop-blur-sm border-2 rounded-xl p-3 outline-none resize-y text-inherit text-sm leading-relaxed"
                        style={{ borderColor: accentColor, minHeight: 80 }}
                    />
                ) : (
                    <input
                        ref={inputRef as React.RefObject<HTMLInputElement>}
                        type="text"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") save();
                            if (e.key === "Escape") cancel();
                        }}
                        className="block w-full bg-white/10 backdrop-blur-sm border-2 rounded-xl px-3 py-2 outline-none text-inherit"
                        style={{ borderColor: accentColor, fontSize: "inherit", fontFamily: "inherit" }}
                    />
                )}
                <div className="flex gap-2 mt-2">
                    <button
                        onClick={save}
                        className="px-3 py-1 text-xs font-semibold text-white rounded-full shadow-sm transition-opacity hover:opacity-90"
                        style={{ backgroundColor: accentColor }}
                    >
                        Save
                    </button>
                    <button
                        onClick={cancel}
                        className="px-3 py-1 text-xs font-semibold rounded-full border transition-colors"
                        style={{ borderColor: accentColor + "66", color: "inherit" }}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        );
    }

    return (
        <span
            role="button"
            tabIndex={0}
            className={`group relative inline-block cursor-pointer rounded transition-all outline-none
                hover:ring-2 hover:ring-offset-1 focus:ring-2 focus:ring-offset-1 ${wrapClassName}`}
            style={{ "--ring-color": accentColor } as React.CSSProperties}
            onClick={() => { setDraft(value); setIsEditing(true); }}
            onKeyDown={(e) => { if (e.key === "Enter") { setDraft(value); setIsEditing(true); } }}
            title={`Click to edit`}
        >
            {children}
            {/* Edit badge */}
            <span
                className="absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full flex items-center justify-center
                    opacity-0 group-hover:opacity-100 shadow-md transition-opacity z-20 pointer-events-none"
                style={{ backgroundColor: accentColor }}
            >
                <Pencil className="w-2.5 h-2.5 text-white" />
            </span>
        </span>
    );
}
