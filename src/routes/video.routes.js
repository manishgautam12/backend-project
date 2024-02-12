import { Router } from "express";
import { deleteVideo, getAllVideos, getVideoById, publishAVideo, togglePublishStatus, updateVideo } from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router=Router();

router.route("/").get(getAllVideos)
router.route("/publish-video").post(verifyJWT, upload.fields([
    {
        name:"videoFile",
        maxCount:1
    },
    {
        name:"thumbnail",
        maxCount:1
    }
]),
publishAVideo
)

router
    .route("/:videoId")
    .get(getVideoById)
    .delete(deleteVideo)
    .patch(verifyJWT,upload.single("thumbnail"),updateVideo);

router.route("/toggle/publish/:videoId").patch(togglePublishStatus);

export default router;