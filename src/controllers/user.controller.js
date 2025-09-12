import { asyncHandler } from "../utils/asyncHandler/asyncHandler.js";

const registerHandler = asyncHandler( async(req,res)=>{
     res.status(200).json({
        message: "Hello to everyone"
     })      
}) 

export {registerHandler}