import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    
    // Define the aggregation pipeline stages based on the provided parameters
    const pipeline = [];

    // Match stage to filter based on user ID if provided
    if (userId) {
        pipeline.push({
            $match: {
                owner: mongoose.Types.ObjectId(userId)
            }
        });
    }

    // Match stage to filter based on a query if provided
    if (query) {
        pipeline.push({
            $match: {
                $or: [
                    { title: { $regex: query, $options: 'i' } },
                    { description: { $regex: query, $options: 'i' } }
                ]
            }
        });
    }

    // Sort stage
    const sortField = sortBy || 'createdAt';
    const sortOrder = sortType === 'desc' ? -1 : 1;
    pipeline.push({
        $sort: {
            [sortField]: sortOrder
        }
    });

    // Pagination using mongoose-aggregate-paginate-v2
    const options = {
        page: parseInt(page),
        limit: parseInt(limit)
    };

    // Apply aggregation pipeline and pagination
    const result = await Video.aggregatePaginate(pipeline, options);

    return res.status(200).json(new ApiResponse(200,result,"all find successfully"));
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

    // console.log(videoId)
    //TODO: update video details like title, description, thumbnail

    const { title, description } = req.body
    // console.log(title,description)
    const thumbnailLocalPath = req.file?.path
    // console.log("Hello",thumbnailLocalPath)
    let thumbnail
    let oldImageUrl

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video Id");
    }

    const currentVideo = await Video.findById(videoId)

    if (currentVideo?.owner.toString() != req.user?._id) {
        throw new ApiError(401, "Only admin can update video details")
    }

    if (!title && !description && !thumbnailLocalPath) {
        throw new ApiError(400, "Atleat one field pass to the update!..")
    }

    if (thumbnailLocalPath) {
        const video = await Video.findById(videoId).select("thumbnail")
        // console.log(video)
        oldImageUrl = video.thumbnail

        thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

        if (!thumbnail) {
            throw new ApiError(401, "Error while uploading thumbnail")
        }
    }

    const updatedVideo = await Video.findByIdAndUpdate(videoId,
        {
            $set: {
                title,
                description,
                thumbnail: thumbnail.url
            }
        }, { new: true }
    )

    if (!updatedVideo) {
        throw new ApiError(500, "Failed to update video, Please try later")
    }

    return res.status(200).json(
        new ApiResponse(200, { updatedVideo }, "Video update successfully")
    )
})


// panding with some error
const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid video Id")
    }

   const currentVideo=await Video.findById(videoId)

   if(currentVideo?.owner.toString()!=req.user?._id){
    throw new ApiError(401,"Only admin can delete video")
   }

   const deletedVideo=await Video.findByIdAndDelete(videoId)

   if(!deletedVideo){
    throw new ApiError(400, "Failed to delete the video please try again");
   }

    return res.status(200).json(new ApiResponse(200,deletedVideo,"video delete successfuly!"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "invalid video Id")
    }

    const currentVideo = await Video.findById(videoId)

    if (!currentVideo) {
        throw new ApiError(404, "video not found")
    }

    if (currentVideo?.owner.toString() != req.user?._id) {
        throw new ApiError(401, "Only admin can update video publish status")
    }

    const toggleVideoStatus = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublished: !currentVideo?.isPublished
            }
        },
        {
            new: true
        }
    )
    return res.status(200).json(new ApiResponse(200, { isPublished: toggleVideoStatus.isPublished }, "Video publish status update successfully"))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}

