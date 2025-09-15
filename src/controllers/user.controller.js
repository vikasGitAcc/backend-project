import { asyncHandler } from "../utils/asyncHandler/asyncHandler.js";
import { apiError } from "../utils/ErrorHandling/apiError.js";
import User from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinaryUplaod/cloudinaryUpload.js";
import { apiResponse } from "../utils/ErrorHandling/apiResponse.js";

const registerHandler = asyncHandler( async(req,res)=>{
      // input from the user
      // validation - email, username
      // existing user 
      // avatar file is required
      //upload files with multer, check cloudnary
      //create user object - create entry in db
      //remove password and refresh token from user object  
      //check for user creation
      //return res

      const {username,password,fullName,email} = req.body
      console.log(username,email,password,fullName);

      if([
            username,password,fullName,email
      ].some((field)=>field?.trim()=="")
      ){
          throw new apiError(400,"All fields are required")
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 
      if(!emailRegex.test(email)) throw new apiError(400,"Invalid email syntax")
      
      const passwordRegex = /((?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[\W]).{8,64})/;
      if(!passwordRegex.test(password)) throw new apiError(400,"Password must include symbols, numbers, uppercase, lowercase and a minimum length of 8")
      
      const existedUser = User.findOne(
            {$or : [{email},{username}]}
      )
      if(existedUser) throw new apiError(409, "User already existed")      

      const avatarLocalPath = req.files?.avatar[0]?.path
      const coverImageLocalPath = req.files?.coverImage[0]?.path

      if(avatarLocalPath) throw new apiError(400, "Avatar file is required")
      
      const avatar =  await uploadOnCloudinary(avatarLocalPath)      
      const coverImage =  await uploadOnCloudinary(coverImageLocalPath)
      
      if(!avatar) throw new apiError(400, "Avatar failed to upload on cloudinary")

      const user = await User.create({
            username:username.toLowerCase(),
            email,
            password,
            fullName,
            avatar:avatar.url,
            coverImage:coverImage?.url || ""
      })
      
      const createdUser = await User.findById(user._id).select("-password -refreshToken");

      if(!createdUser) throw new apiError(500,"Something went wrong while registering a user")

      return res.status(201).json(new apiResponse(200, createdUser, "User registered successfully"))      
}) 

export {registerHandler}