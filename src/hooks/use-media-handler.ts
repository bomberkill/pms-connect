import { useState, useCallback } from 'react';
import { MediaType } from '@/types/Post';

export interface MediaPreview {
    url: string;
    type: MediaType;
    name: string;
}

export const useMediaHandler = (maxFiles: number = 4) => {
    const [mediaFiles, setMediaFiles] = useState<File[]>([]);
    const [mediaPreviews, setMediaPreviews] = useState<MediaPreview[]>([]);

    const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        if (files.length === 0) return;

        const combinedFiles = [...mediaFiles, ...files].slice(0, maxFiles);
        setMediaFiles(combinedFiles);

        const newPreviews = combinedFiles.map(file => ({
            url: URL.createObjectURL(file),
            name: file.name,
            type: file.type.startsWith("video/")
                ? MediaType.VIDEO
                : file.type.startsWith("image/")
                    ? MediaType.IMAGE
                    : MediaType.DOCUMENT,
        }));

        // Clean up old object URLs before setting new ones
        mediaPreviews.forEach(p => URL.revokeObjectURL(p.url));
        setMediaPreviews(newPreviews);

        // Clear the file input so the same file can be selected again
        event.target.value = '';
    }, [mediaFiles, mediaPreviews, maxFiles]);

    const removeMedia = useCallback((index: number) => {
        const newFiles = mediaFiles.filter((_, i) => i !== index);
        const newPreviews = mediaPreviews.filter((_, i) => i !== index);
        const removedPreview = mediaPreviews[index];

        if (removedPreview) {
            URL.revokeObjectURL(removedPreview.url);
        }

        setMediaFiles(newFiles);
        setMediaPreviews(newPreviews);
    }, [mediaFiles, mediaPreviews]);

    const resetMedia = useCallback(() => {
        mediaPreviews.forEach(p => URL.revokeObjectURL(p.url));
        setMediaFiles([]);
        setMediaPreviews([]);
    }, [mediaPreviews]);

    return { mediaFiles, mediaPreviews, handleFileChange, removeMedia, resetMedia };
};