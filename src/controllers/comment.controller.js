import mongoose, { isValidObjectId } from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

})

const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video Id")
    }

    const { content } = req.body
    if (!content) {
        throw new ApiError(400, "Content is required!.")
    }

    const createComment = await Comment.create({
        content,
        video: videoId,
        owner: req.user?._id
    })

    if (!createComment) {
        throw new ApiError(400, "Something went wrong while adding comment")
    }

    return res.status(200)
        .json(new ApiResponse(200, createComment, "Comment added successfully"))
})

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment id")
    }

    const { content } = req.body

    if (!content) {
        throw new ApiError(400, "content is required for update comment")
    }

    const comment = await Comment.findById(commentId)

    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }

    if (comment?.owner.toString() != req.user?._id) {
        throw new ApiError(404, "Only valid user can update comment")
    }

    const updatedComment = await Comment.findByIdAndUpdate(commentId,
        {
            $set: {
                content
            }
        }, { new: true }
    )

    if (!updateComment) {
        throw new ApiError(400, "Something went wrong while updating comment")
    }

    return res.status(200).json(new ApiResponse(200, { updatedComment }, "comment update successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params

    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"Invalid commentId")
    }

    const comment=await Comment.findById(commentId)

    if(!comment){
        throw new ApiError(404,"Comment don't exist")
    }

    if(comment?.owner.toString()!=req.user?._id){
        throw new ApiError(401,"Only valid user can delete comment")
    }

    const deleteComment=await Comment.findByIdAndDelete(commentId)

    if(!deleteComment){
        throw new ApiError(400,"Something went wrong while deleting comment")
    }

    return res.status(200).json(new ApiResponse(200,{},"comment delete successfully"))
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}
