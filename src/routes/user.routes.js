import {Router} from "express";
import { getCurrentUser, loginUser, logoutUser, registerHandler, renewAccessToken, updateUserAvatar, updateUserCoverImage } from "../controllers/user.controller.js";
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
router.route("/logout").post(verifyToken,logoutUser);
router.route("/refresh-token").post(renewAccessToken);
router.route("/getCurrentUser").post(loginUser,verifyToken,getCurrentUser);
router.route("/updateAvatarFile").post(
    upload.single("avatar"),
    loginUser,verifyToken,updateUserAvatar);
router.route("/updateCoverImageFile").post(
    upload.single("coverImage"),
    loginUser,verifyToken,updateUserCoverImage);

export default router;