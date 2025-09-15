import {Router} from "express"
import { registerHandler } from "../controllers/user.controller.js"
import {upload} from "../middlewares/multer.middleware.js"
const router = Router()

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

export default router