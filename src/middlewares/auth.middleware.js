import { asyncHandler } from "../utils/asyncHandler/asyncHandler.js";
import jwt from "jsonwebtoken"
import { apiError } from "../utils/ErrorHandling/apiError.js";
import User from "../models/user.model.js";

export const verifyToken = asyncHandler(async(req, _ ,next)=>{
    try {
        const token =  req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","");
        if(!token){
            throw new apiError(401,"Unautorized access");
        } 
        const result =  jwt.verify(accessToken,process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(result?._id);
        if(!user) throw new apiError(404,"invalid user credentials");
        
        req.user = user;
        next();
    } catch (error) {
         throw new apiError(401, error?.message || "Something went wrong");  
    }
      
})