import {Router} from "express";
import { changePassword, getCurrentUser, getUserProfileDetails, getUserWatchHistory, loginUser, logoutUser, registerHandler, renewAccessToken, updateUserAvatar, updateUserCoverImage, updateUserDetails } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name : "avatar",
            maxCount:1
        },
        {
            name : "coverImage",
            maxCount:2
        }
    ]),   
    registerHandler
)

router.route("/login").post(loginUser);
router.route("/logout").post(verifyToken, logoutUser);
router.route("/refresh-token").post(renewAccessToken);
router.route("/change-password").post(verifyToken, changePassword);
router.route("/current-user").get(verifyToken, getCurrentUser);
router.route("update-account").patch(verifyToken, updateUserDetails);
router.route("/update-avatar").patch(verifyToken, upload.single("avatar"), updateUserAvatar);
router.route("update-coverImage").patch(verifyToken, upload.single("coverImage"), updateUserCoverImage);
router.route("/channel/:userName").get(verifyToken, getUserProfileDetails);
router.route("/history").get(verifyToken, getUserWatchHistory)
export default router;