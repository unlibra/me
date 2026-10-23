import { IconFilePlus } from "./icons";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type ReactNode,
} from "react";

import { useMessages } from "@/tools/i18n";

import { useToast } from "./toast";

export interface FullPageDropZoneProps {
  onFileDrop: (file: File) => void;
  validateFile?: (file: File) => string | null | Promise<string | null>;
  accept?: string; // e.g., "image/*"
  children: ReactNode;
}

export function FullPageDropZone({
  onFileDrop,
  validateFile,
  accept,
  children,
}: FullPageDropZoneProps) {
  const { common } = useMessages();
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);
  const toast = useToast();

  // dragenter and dragleave are counted with the same condition, so that
  // each counted enter has its counted leave
  const handleDragEnter = useCallback((e: globalThis.DragEvent) => {
    e.preventDefault();
    if (!isCountedDrag(e)) return;

    dragCounterRef.current++;
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: globalThis.DragEvent) => {
    if (!isCountedDrag(e)) return;

    dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  // The drag ended (a drag that started on the page, such as text)
  const handleDragEnd = useCallback(() => {
    dragCounterRef.current = 0;
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: globalThis.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current = 0;
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: globalThis.DragEvent) => {
    e.preventDefault();
  }, []);

  useEffect(() => {
    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("drop", handleDrop);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("dragend", handleDragEnd);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("drop", handleDrop);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("dragend", handleDragEnd);
    };
  }, [
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    handleDragOver,
    handleDragEnd,
  ]);

  const handleDropOnDiv = useCallback(
    async (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      // Reset drag counter and state
      dragCounterRef.current = 0;
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      if (!file) return;

      // Validate file type if accept prop is provided
      if (accept && !isFileTypeAccepted(file, accept)) {
        toast.error(common.unsupportedFileType);
        return;
      }

      // Validate file with custom validator
      if (validateFile) {
        try {
          const error = await validateFile(file);
          if (error) {
            toast.error(error);
            return;
          }
        } catch (err) {
          // Validator threw an error - treat as validation failure
          console.error("File validation error:", err);
          toast.error(common.fileValidationError);
          return;
        }
      }

      onFileDrop(file);
    },
    [accept, validateFile, onFileDrop, toast, common],
  );

  return (
    <div onDrop={handleDropOnDiv} className="relative">
      {children}

      {/* Drag Overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-500/10 p-8 backdrop-blur-sm">
          <div className="flex size-full flex-col items-center justify-center gap-4 rounded-2xl border-4 border-dashed border-blue-500">
            <IconFilePlus className="size-12" />
            <p className="text-xl font-semibold">{common.dropToUpload}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Whether a dragenter or dragleave counts toward showing the overlay: a drag
 * of files, not over an input (sliders, text fields, etc.).
 */
function isCountedDrag(e: globalThis.DragEvent): boolean {
  if (!e.dataTransfer?.types.includes("Files")) return false;
  const target = e.target;
  return !(target instanceof Element && target.closest("input"));
}

// Helper function to check if file type is accepted
function isFileTypeAccepted(file: File, accept: string): boolean {
  const acceptedTypes = accept.split(",").map((type) => type.trim());

  return acceptedTypes.some((type) => {
    if (type.endsWith("/*")) {
      // e.g., "image/*"
      const category = type.split("/")[0];
      return file.type.startsWith(`${category}/`);
    }
    // e.g., ".png", ".jpg"
    if (type.startsWith(".")) {
      return file.name.toLowerCase().endsWith(type.toLowerCase());
    }
    // Exact mime type match
    return file.type === type;
  });
}
