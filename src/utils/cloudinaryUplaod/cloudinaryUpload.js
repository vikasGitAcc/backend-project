import { v2 } from "cloudinary";
import fs from "fs"

v2.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export const uploadOnCloudinary = async (localFilePath) => {
  //file upload on cloudinary
  if (!localFilePath) return null;
  try {
    const response = await v2.uploader.upload(localFilePath, {
      resource_type: "auto",
    }); 

    fs.unlinkSync(localFilePath)
    console.log("file has been uploaded on cloudinary", response)
    return response

  } catch (error){
    fs.unlinkSync(localFilePath)  //remove locally stored temporary file on server  
    console.log("Cloudinary Error : ",error)  
  }
};
