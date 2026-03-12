
import { storage } from './appwrite';
import { ID } from 'appwrite';

/**
 * Appwrite Storage Service
 * Use this for all image-related operations (uploads, previews, deletions).
 * Bucket ID should be created in your Appwrite Console.
 */

// Replacement: Enter your Bucket ID from Appwrite console here
export const IMAGES_BUCKET_ID = 'general-images'; 

export const storageService = {
  /**
   * Upload an image file to Appwrite Storage
   * @param file The file object (from an <input type="file" />)
   * @returns The uploaded file object including its ID
   */
  async uploadImage(file: File) {
    try {
      const response = await storage.createFile(
        IMAGES_BUCKET_ID,
        ID.unique(),
        file
      );
      return response;
    } catch (error) {
      console.error('Appwrite Storage Upload Error:', error);
      throw error;
    }
  },

  /**
   * Get a viewable URL for an image stored in Appwrite
   * @param fileId The ID of the file in the bucket
   * @param width Optional width for resizing
   * @param height Optional height for resizing
   * @returns A URL string that can be used in <img> tags
   */
  getImageUrl(fileId: string, width?: number, height?: number) {
    try {
      return storage.getFilePreview(
        IMAGES_BUCKET_ID, 
        fileId,
        width,
        height
      ).toString();
    } catch (error) {
      console.error('Appwrite Storage Preview Error:', error);
      return '';
    }
  },

  /**
   * Delete an image from Appwrite Storage
   * @param fileId The ID of the file to delete
   */
  async deleteImage(fileId: string) {
    try {
      await storage.deleteFile(IMAGES_BUCKET_ID, fileId);
    } catch (error) {
      console.error('Appwrite Storage Deletion Error:', error);
      throw error;
    }
  }
};
