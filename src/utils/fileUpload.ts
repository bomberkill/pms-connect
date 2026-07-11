import { apolloClient } from "@/graphql/apolloClient";
import { GET_UPLOAD_URL, DELETE_UPLOADED_FILE } from "@/graphql/queries/storage";

export const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export type UploadPurpose =
    | "AVATAR"
    | "COVER_PICTURE"
    | "POST_MEDIA"
    | "GROUP_PICTURE"
    | "ACCREDITATION_DOCUMENT";

/**
 * Uploads a file directly to Cloudflare R2 using a presigned URL issued by
 * the backend, and returns its public URL and object key (needed to delete
 * it later, e.g. on rollback or when replacing a profile picture).
 */
export const uploadFileToR2 = async (
    file: File,
    purpose: UploadPurpose
): Promise<{ publicUrl: string; key: string }> => {
    const { data } = await apolloClient.mutate({
        mutation: GET_UPLOAD_URL,
        variables: {
            input: { purpose, fileName: file.name, contentType: file.type },
        },
    });

    const { uploadUrl, publicUrl, key } = data.getUploadUrl;

    const response = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
    });
    if (!response.ok) {
        throw new Error(`Failed to upload file to storage (${response.status}).`);
    }

    return { publicUrl, key };
};

/**
 * Deletes a previously uploaded file (rollback on failure, or replacing an
 * existing profile/cover picture).
 */
export const deleteUploadedFile = async (key: string): Promise<void> => {
    await apolloClient.mutate({
        mutation: DELETE_UPLOADED_FILE,
        variables: { key },
    });
};
