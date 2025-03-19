import { v2 as cloudinary } from "cloudinary";

export const getBannerUrl = async (req, res) => {
  try {
    const { img } = req.body;

    // Input validation
    if (!img) {
      return res.status(400).json({ error: "Image data is required" });
    }

    // Upload image to Cloudinary
    const uploadedResponse = await cloudinary.uploader.upload(img);

    // Send the secure URL of the uploaded image in the response
    res.status(200).json(uploadedResponse.secure_url);
  } catch (error) {
    console.error("Error uploading image to Cloudinary:", error);
    res.status(500).json({ error: "Failed to upload image" });
  }
};
