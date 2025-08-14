import streamifier from 'streamifier';
import { v2 as cloudinary } from 'cloudinary';


export async function uploadAudioToCloudinary(buffer, publicId) {
  if(!buffer) throw new Error("Buffer is undefined");
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'video', 
        public_id: publicId,
        folder: 'simjob/audio',
        format: 'wav',
      },
      (error, result) => {
        if (error) {return reject(error)};
        resolve(result.secure_url);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}
