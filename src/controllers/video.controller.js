import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

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

    const createdVideo = await Video.findById(video._id)

    if (!createdVideo) {
        throw new ApiError(500, "Something went wrong while uploading video object in DB")
    }
    return res
        .status(200)
        .json(new ApiResponse(200, "Video Published Successfully", createdVideo))


})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video Id")
    }

    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "video",
                as: "comments",
                pipeline: [
                    {
                        $project: {
                            content: 1,
                            owner: 1,
                            createdAt: 1
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            avatar: 1,
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                likesCount: {
                    $size: "$likes"
                },
                commentsCount: {
                    $size: "$comments"
                }
            }
        },
        {
            $project: {
                videoFile: 1,
                title: 1,
                description: 1,
                views: 1,
                createdAt: 1,
                isPublished: 1,
                duration: 1,
                owner: 1,
                owner: 1,
                likesCount: 1,
                commentsCount: 1,
                comments: 1
            }
        }
    ])

    if (!video) {
        throw new ApiError(404, "video not found")
    }

    await Video.findByIdAndUpdate(
        videoId,
        {
            $inc: { views: 1 }
        }, { new: true }
    )
    // console.log(video);

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video find by Id is successfully"))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

    const { title, description } = req.body
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video Id");
    }

    const currentVideo = await Video.findOne(videoId)

    if (currentVideo?.owner.toString() != req.user?._id) {
        throw new ApiError(401, "Only admin can update video details")
    }



})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}

