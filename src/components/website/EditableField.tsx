"use client";

import { useRef, useEffect, useState } from "react";

interface Props {
    field: string;
    value: string;
    editMode?: boolean;
    onEdit?: (field: string, value: string) => void;
    /** Allow newlines (paragraph-like fields). Default: false — Enter confirms. */
    multiline?: boolean;
    /** Extra classes on the contentEditable wrapper */
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
    const ref = useRef<HTMLDivElement>(null);
    const [editing, setEditing] = useState(false);
    /** Track the committed value so Escape can revert */
    const committed = useRef(value);

    // Keep committed ref in sync when value changes externally (e.g. AI suggestions)
    useEffect(() => {
        committed.current = value;
        // If not currently being typed in, sync the DOM text to the new value
        if (ref.current && !editing) {
            // Walk inner text nodes and update — simpler: just update textContent of
            // the ONE text child that the single root child element has.
            const inner = ref.current.querySelector("[data-editable-text]");
            if (inner && inner.textContent !== value) {
                inner.textContent = value;
            }
        }
    }, [value, editing]);

    if (!editMode) return <>{children}</>;

    const save = (el: HTMLElement) => {
        const newVal = el.textContent?.trim() ?? "";
        setEditing(false);
        if (newVal !== committed.current) {
            committed.current = newVal;
            onEdit?.(field, newVal);
        }
    };

    const cancel = (el: HTMLElement) => {
        // Revert DOM to last committed value
        const inner = el.querySelector("[data-editable-text]");
        if (inner) inner.textContent = committed.current;
        else el.textContent = committed.current;
        setEditing(false);
    };

    return (
        <div
            ref={ref}
            contentEditable
            suppressContentEditableWarning
            spellCheck
            onFocus={() => setEditing(true)}
            onBlur={(e) => save(e.currentTarget)}
            onKeyDown={(e) => {
                if (e.key === "Escape") {
                    e.preventDefault();
                    cancel(e.currentTarget);
                    e.currentTarget.blur();
                }
                if (!multiline && e.key === "Enter") {
                    e.preventDefault();
                    e.currentTarget.blur(); // triggers onBlur → save
                }
            }}
            className={`relative outline-none cursor-text rounded transition-shadow duration-150 ${wrapClassName}`}
            style={{
                // Subtle ring on hover (via outline), strong ring when actively editing
                outline: editing
                    ? `2px solid ${accentColor}`
                    : undefined,
                outlineOffset: "3px",
            }}
            onMouseEnter={(e) => {
                if (!editing) e.currentTarget.style.outline = `1px dashed ${accentColor}99`;
                e.currentTarget.style.outlineOffset = "3px";
            }}
            onMouseLeave={(e) => {
                if (!editing) e.currentTarget.style.outline = "";
            }}
            title="Click to edit"
        >
            {children}
        </div>
    );
}
