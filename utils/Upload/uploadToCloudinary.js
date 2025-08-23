import { v2 as cloudinary } from "cloudinary";

export async function uploadToCloudinary(
  filename,
  folder,
  format,
  resource_type
) {
  return await cloudinary.uploader.upload(filename, {
    resource_type,
    folder,
    format,
  });
}
