import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video Id")
    }

    const likedVideo=await Like.findOne({
        video:videoId,
        likedBy:req.user?._id
    })

    if(likedVideo){
        await Like.findByIdAndDelete(likedVideo?._id)

        return res.status(200)
        .json(new ApiResponse(200,{},"Video unliked successfully"))
    }

    const videoLiked=await Like.create({
        video:videoId,
        likedBy:req.user?._id
    })

    return res.status(200)
    .json(new ApiResponse(200,videoLiked,"Video liked successfully"));
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    
    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"Invalid comment Id")
    }

    const likedComment=await Like.findOne({
        comment:commentId,
        likedBy:req.user?._id
    })

    if(likedComment){
        await Like.findByIdAndDelete(likedComment?._id)

        return res.status(200).json(new ApiResponse(200,{},"Comment unliked successfully"))
    }

    const commentLiked=await Like.create({
        comment:commentId,
        likedBy:req.user?._id
    })

    return res.status(200).json(new ApiResponse(200,{commentLiked},"comment liked successfully"))

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}