"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PhotoMetadata, PhotoModuleType } from "@/lib/types";
import { cx } from "@/lib/utils";

const maxPhotoSizeBytes = 10 * 1024 * 1024;
const supportedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

type MessageState = {
  status: "idle" | "success" | "error";
  message: string;
};

type UploadPhotosInput = {
  files: File[];
  moduleType: PhotoModuleType;
  entityId: string;
  zoneId?: string;
  companyId?: string;
  siteId?: string;
  uploadedBy?: string;
};

type UploadPhotosResponse = {
  photos: PhotoMetadata[];
  message?: string;
};

export async function uploadPhotos({
  files,
  moduleType,
  entityId,
  zoneId,
  companyId,
  siteId,
  uploadedBy,
}: UploadPhotosInput): Promise<UploadPhotosResponse> {
  if (files.length === 0) {
    return { photos: [] };
  }

  const formData = new FormData();
  formData.set("moduleType", moduleType);
  formData.set("entityId", entityId);
  appendOptional(formData, "zoneId", zoneId);
  appendOptional(formData, "companyId", companyId);
  appendOptional(formData, "siteId", siteId);
  appendOptional(formData, "uploadedBy", uploadedBy);
  files.forEach((file) => formData.append("files", file));

  const response = await fetch("/api/photos", {
    method: "POST",
    body: formData,
  });
  const payload = (await response.json()) as Partial<UploadPhotosResponse> & {
    message?: string;
  };

  if (!response.ok) {
    throw new Error(payload.message ?? "Upload photo impossible.");
  }

  return {
    photos: payload.photos ?? [],
    message: payload.message,
  };
}

export function PendingPhotoSelector({
  files,
  onFilesChange,
  disabled = false,
}: {
  files: File[];
  onFilesChange: (files: File[]) => void;
  disabled?: boolean;
}) {
  const [message, setMessage] = useState<MessageState>({
    status: "idle",
    message: "",
  });
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const previews = useObjectUrls(files);

  function addFiles(fileList: FileList | null) {
    const result = validateFiles(Array.from(fileList ?? []));

    if (result.validFiles.length > 0) {
      onFilesChange([...files, ...result.validFiles]);
    }

    setMessage({
      status: result.errors.length > 0 ? "error" : "idle",
      message: result.errors[0] ?? "",
    });
  }

  function removeFile(index: number) {
    onFilesChange(files.filter((_, fileIndex) => fileIndex !== index));
    setMessage({ status: "idle", message: "" });
  }

  return (
    <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-950">Photos</h2>
          <p className="mt-1 text-sm text-slate-500">
            Ajoutez des photos terrain. Elles seront liées à l'audit après
            l'enregistrement.
          </p>
        </div>
        <PhotoButtons
          disabled={disabled}
          onCameraClick={() => cameraInputRef.current?.click()}
          onGalleryClick={() => galleryInputRef.current?.click()}
        />
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => {
          addFiles(event.target.files);
          event.target.value = "";
        }}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => {
          addFiles(event.target.files);
          event.target.value = "";
        }}
      />

      {message.message ? <MessageBox state={message} /> : null}

      {files.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${file.lastModified}-${index}`}
              className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
            >
              <img
                src={previews[index]}
                alt={file.name}
                className="aspect-square w-full object-cover"
              />
              <div className="p-2">
                <p className="truncate text-xs font-black text-slate-700">
                  {file.name}
                </p>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => removeFile(index)}
                  className="mt-2 min-h-11 w-full rounded-lg border border-red-200 bg-white px-2 py-2 text-xs font-black text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Retirer
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm font-bold text-slate-500">
          Aucune photo ajoutée pour cet audit.
        </p>
      )}
    </section>
  );
}

export function PhotoManager({
  moduleType,
  entityId,
  zoneId,
  initialPhotos,
  title = "Photos",
  emptyLabel = "Aucune photo enregistrée.",
  allowUpload = true,
  allowDelete = true,
}: {
  moduleType: PhotoModuleType;
  entityId: string;
  zoneId?: string;
  initialPhotos: PhotoMetadata[];
  title?: string;
  emptyLabel?: string;
  allowUpload?: boolean;
  allowDelete?: boolean;
}) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoMetadata | undefined>(
    undefined,
  );
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<MessageState>({
    status: "idle",
    message: "",
  });
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(fileList: FileList | null) {
    const result = validateFiles(Array.from(fileList ?? []));

    if (result.errors.length > 0) {
      setMessage({ status: "error", message: result.errors[0] });
      return;
    }

    if (result.validFiles.length === 0) {
      return;
    }

    setIsPending(true);
    setMessage({ status: "idle", message: "" });

    try {
      const payload = await uploadPhotos({
        files: result.validFiles,
        moduleType,
        entityId,
        zoneId,
      });

      setPhotos((currentPhotos) => [...payload.photos, ...currentPhotos]);
      setMessage({
        status: "success",
        message: payload.message ?? "Photo ajoutée.",
      });
    } catch (error) {
      setMessage({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Erreur réseau pendant l'upload photo.",
      });
    } finally {
      setIsPending(false);
    }
  }

  async function handleDelete(photo: PhotoMetadata) {
    if (!window.confirm("Supprimer cette photo ?")) {
      return;
    }

    setIsPending(true);
    setMessage({ status: "idle", message: "" });

    try {
      const response = await fetch(`/api/photos/${photo.$id}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(payload.message ?? "Suppression impossible.");
      }

      setPhotos((currentPhotos) =>
        currentPhotos.filter((currentPhoto) => currentPhoto.$id !== photo.$id),
      );
      setSelectedPhoto(undefined);
      setMessage({
        status: "success",
        message: payload.message ?? "Photo supprimée.",
      });
    } catch (error) {
      setMessage({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Droits insuffisants ou réseau indisponible.",
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-950">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {photos.length} photo{photos.length > 1 ? "s" : ""} enregistrée
            {photos.length > 1 ? "s" : ""}.
          </p>
        </div>
        {allowUpload ? (
          <PhotoButtons
            disabled={isPending}
            onCameraClick={() => cameraInputRef.current?.click()}
            onGalleryClick={() => galleryInputRef.current?.click()}
          />
        ) : null}
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => {
          void handleUpload(event.target.files);
          event.target.value = "";
        }}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => {
          void handleUpload(event.target.files);
          event.target.value = "";
        }}
      />

      {message.message ? <MessageBox state={message} /> : null}

      {photos.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {photos.map((photo) => (
            <button
              key={photo.$id}
              type="button"
              onClick={() => setSelectedPhoto(photo)}
              className="group min-h-11 min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 text-left transition hover:border-blue-200 hover:shadow-sm"
            >
              <img
                src={`/api/photos/${photo.$id}/image?variant=thumb`}
                alt={photo.fileName}
                loading="lazy"
                className="aspect-square w-full object-cover"
              />
              <span className="block truncate px-2 py-2 text-xs font-black text-slate-700 group-hover:text-[#0f4c81]">
                {photo.fileName}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm font-bold text-slate-500">
          {emptyLabel}
        </p>
      )}

      {selectedPhoto ? (
        <PhotoLightbox
          photo={selectedPhoto}
          allowDelete={allowDelete}
          isPending={isPending}
          onClose={() => setSelectedPhoto(undefined)}
          onDelete={() => void handleDelete(selectedPhoto)}
        />
      ) : null}
    </section>
  );
}

function PhotoButtons({
  disabled,
  onCameraClick,
  onGalleryClick,
}: {
  disabled: boolean;
  onCameraClick: () => void;
  onGalleryClick: () => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:flex">
      <button
        type="button"
        disabled={disabled}
        onClick={onCameraClick}
        className="min-h-11 rounded-lg bg-[#0f4c81] px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-[#0a365c] disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        Prendre photo
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={onGalleryClick}
        className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Galerie
      </button>
    </div>
  );
}

function PhotoLightbox({
  photo,
  allowDelete,
  isPending,
  onClose,
  onDelete,
}: {
  photo: PhotoMetadata;
  allowDelete: boolean;
  isPending: boolean;
  onClose: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid bg-slate-950/90 p-3 sm:p-6">
      <div className="flex min-h-0 flex-col rounded-lg bg-white shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-3 sm:p-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-slate-950">
              {photo.fileName}
            </p>
            <p className="text-xs font-bold text-slate-500">
              {formatFileSize(photo.fileSize)}
            </p>
          </div>
          <div className="flex gap-2">
            {allowDelete ? (
              <button
                type="button"
                disabled={isPending}
                onClick={onDelete}
                className="min-h-11 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Supprimer
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-50"
            >
              Fermer
            </button>
          </div>
        </div>
        <div className="grid min-h-0 flex-1 place-items-center bg-slate-100 p-2 sm:p-4">
          <img
            src={`/api/photos/${photo.$id}/image?variant=full`}
            alt={photo.fileName}
            className="max-h-full max-w-full rounded-lg object-contain"
          />
        </div>
      </div>
    </div>
  );
}

function MessageBox({ state }: { state: MessageState }) {
  return (
    <p
      className={cx(
        "mt-4 rounded-lg border px-3 py-2 text-sm font-bold",
        state.status === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-red-200 bg-red-50 text-red-700",
      )}
    >
      {state.message}
    </p>
  );
}

function validateFiles(files: File[]) {
  const validFiles: File[] = [];
  const errors: string[] = [];

  files.forEach((file) => {
    if (!supportedMimeTypes.has(file.type)) {
      errors.push(
        "Format non supporté. Utilisez une image JPEG, PNG, WebP, HEIC ou HEIF.",
      );
      return;
    }

    if (file.size > maxPhotoSizeBytes) {
      errors.push("Photo trop volumineuse. Taille maximale : 10 Mo.");
      return;
    }

    validFiles.push(file);
  });

  return { validFiles, errors };
}

function useObjectUrls(files: File[]) {
  const urls = useMemo(() => files.map((file) => URL.createObjectURL(file)), [
    files,
  ]);

  useEffect(() => {
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [urls]);

  return urls;
}

function appendOptional(
  formData: FormData,
  key: string,
  value: string | undefined,
) {
  if (value) {
    formData.set(key, value);
  }
}

function formatFileSize(size: number) {
  if (!Number.isFinite(size) || size <= 0) {
    return "Taille inconnue";
  }

  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)} Ko`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} Mo`;
}
