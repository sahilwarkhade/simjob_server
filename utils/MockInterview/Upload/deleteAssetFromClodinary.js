import { v2 as cloudinary } from "cloudinary";

export async function deleteAssetFromCloudinary(publicId) {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        throw new Error(`Failed to delete asset: ${error.message}`);
    }
}
