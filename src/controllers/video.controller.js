import { Video } from "../models/video.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"


const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    if ([title, description].some((field) => field?.trim() === "")) {
        throw new ApiError(400, 'All field required')
    }

    const videoLocalPath = req.files?.videoFile[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path

    if (!videoLocalPath) {
        throw new ApiError(401, "video file is required")
    }
    if (!thumbnailLocalPath) {
        throw new ApiError(401, "thumbnail file is required")
    }

    const videoFile = await uploadOnCloudinary(videoLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if (!videoFile) {
        throw new ApiError(401, "video file url is required")
    }

    if (!thumbnail) {
        throw new ApiError(401, "thumnail url is required")
    }

    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        title,
        description,
        duration: videoFile.duration,
        owner: req.user?._id,

    })

    const createdVideo=await Video.findById(video._id)

    if(!createdVideo){
        throw new ApiError(500, "Something went wrong while uploading video object in DB")
    }
    return res
    .status(200)
    .json( new ApiResponse(200, "Video Published Successfully", createdVideo) )

    
})

export {
    publishAVideo,
}

