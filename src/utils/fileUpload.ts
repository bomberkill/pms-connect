import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

export const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

/**
 * Uploads a file to Firebase Storage and returns its public URL and path.
 * @param file The file to upload.
 * @param path The path in the bucket (e.g., 'public/userId/profile').
 * @returns An object with the public URL and the uploaded path for rollbacks.
 */
export const uploadFileToFirebase = async (
    file: File,
    path: string
): Promise<{ publicUrl: string, uploadedPath: string }> => {
    const storage = getStorage();
    const fileName = `${Date.now()}_${file.name}`;
    const filePath = `${path}/${fileName}`;
    const storageRef = ref(storage, filePath);

    const snapshot = await uploadBytes(storageRef, file);
    const publicUrl = await getDownloadURL(snapshot.ref);

    return { publicUrl, uploadedPath: snapshot.ref.fullPath };
};
