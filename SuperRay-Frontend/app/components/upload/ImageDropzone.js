'use client'
import { useId, useState } from "react";
import { MdOutlineCloudUpload } from "react-icons/md";
import { ACCEPTED_IMAGE_TYPES, MAX_UPLOAD_SIZE_MB } from "../../../utils/config";

const ImageDropzone = ({ onFileSelected, disabled = false }) => {
    const inputId = useId();
    const [isDragging, setIsDragging] = useState(false);

    const handleDrop = (event) => {
        event.preventDefault();
        setIsDragging(false);
        if (disabled) return;
        const file = event.dataTransfer.files?.[0];
        if (file) onFileSelected(file);
    };

    return (
        <label
            htmlFor={inputId}
            onDragOver={(event) => {
                event.preventDefault();
                if (!disabled) setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/40 ${isDragging ? "border-brand bg-brand/10" : "border-white/15 bg-ink-950 hover:border-white/30"
                } ${disabled ? "pointer-events-none opacity-60" : ""}`}
        >
            <MdOutlineCloudUpload className="text-4xl text-brand" aria-hidden="true" />
            <span className="mt-3 font-medium text-slate-100">
                <span className="text-brand-light underline underline-offset-2">Choose an image</span> or drag it here
            </span>
            <span className="mt-1 text-sm text-slate-500">PNG or JPEG, up to {MAX_UPLOAD_SIZE_MB} MB</span>
            <input
                id={inputId}
                type="file"
                accept={ACCEPTED_IMAGE_TYPES.join(",")}
                className="sr-only"
                disabled={disabled}
                onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) onFileSelected(file);
                    event.target.value = "";
                }}
            />
        </label>
    );
};

export default ImageDropzone;
