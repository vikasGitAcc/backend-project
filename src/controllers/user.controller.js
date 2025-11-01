import { asyncHandler } from "../utils/asyncHandler/asyncHandler.js";
import { apiError } from "../utils/ErrorHandling/apiError.js";
import User from "../models/user.model.js";
import { removeFromCloudinary, uploadOnCloudinary } from "../utils/cloudinaryUplaod/cloudinaryUpload.js";
import { apiResponse } from "../utils/ErrorHandling/apiResponse.js";
import jwt from "jsonwebtoken";
import fs from "fs";

function extractPublicId(url) {
  const extention = url.match(/\.[^/.]+$/)[0];
  const arr = url.split("/");
  const publicId = arr.filter(word => word.includes(extention));
  return publicId.toString().replace(/\.[^/.]+$/, "");
}

const options = {
  httpOnly: true,
  secure: true
}

const registerHandler = asyncHandler(async (req, res) => {
  // input from the user
  // validation - email, username
  // existing user
  // avatar file is required
  //upload files with multer, check cloudnary
  //create user object - create entry in db
  //remove password and refresh token from user object
  //check for user creation
  //return res

  const { userName, password, fullName, email } = req.body;
  console.log(userName, email, password, fullName);

  if (
    [userName, password, fullName, email].some((field) => field?.trim() == "")
  ) {
    throw new apiError(400, "All fields are required");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) throw new apiError(400, "Invalid email syntax");

  const passwordRegex = /((?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[\W]).{8,64})/;
  if (!passwordRegex.test(password))
    throw new apiError(
      400,
      "Password must include symbols, numbers, uppercase, lowercase and a minimum length of 8"
    );

  const existedUser = await User.findOne({ $or: [{ email }, { userName }] });

  if (existedUser) throw new apiError(409, "User already existed");

  const avatarLocalPath = req.files?.avatar[0]?.path;

  if (!avatarLocalPath) throw new apiError(400, "Avatar file is required");
  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar) throw new apiError(400, "Avatar failed to upload on cloudinary");

  let coverImageLocalPath;
  let coverImageArr = req.files.coverImage;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    coverImageArr.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  let coverImage;
  if (coverImageLocalPath) {
    coverImage = await uploadOnCloudinary(coverImageLocalPath);
  }

  const user = await User.create({
    userName: userName.toLowerCase(),
    email,
    password,
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  console.log(user);

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser)
    throw new apiError(500, "Something went wrong while registering a user");

  return res
    .status(201)
    .json(new apiResponse(200, createdUser, "User registered successfully"));
});

const generateRefeshTokenAndAccessToken = async (userId) => {
  const user = await User.findById(userId);

  const refreshToken = user.generateRefreshToken();
  const accessToken = user.generateAccessToken();


  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { refreshToken, accessToken };
};

const loginUser = asyncHandler(async (req, res, next) => {
  //req.body --> data
  //email, password --> destructure
  //find user
  //password auhenticity
  //generate access token and refresh token
  // user ---> access and refresh token
  //user res --> suucessfuly logged in

  const { userName, email, password } = req.body;

  if (!(userName || email)) throw new apiError(400, "Username or email is required")

  const user = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (!user) {
    throw new apiError(404, "User does not exist");
  }

  const result = await user.isCorrect(password);

  if (!result) {
    throw new apiError(401, "Invalid user credentials");
  }
  const { accessToken, refreshToken } = await generateRefeshTokenAndAccessToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  next();
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new apiResponse(
        200,
        {
          loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    $set: {
      refreshToken: undefined,
      new: true
    },
  });

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new apiResponse(200, {}, "User logged out successfully"))

});

const renewAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) throw new apiError(401, "refresh token not found")
  try {
    const decodedToken = await jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id);

    if (!user) throw new apiError(401, "user not found, invalid refresh token");
    if (incomingRefreshToken !== user?.refreshToken) throw new apiError(401, "Refresh token provided by the user is not valid");

    const { accessToken, refreshToken } = generateRefeshTokenAndAccessToken(user._id);
    return res.stauts(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(new apiResponse(200, { accessToken, refreshToken }, "Access token refreshed successfully"));

  } catch (error) {
    throw new apiError(400, error?.message || "invalid refresh token");
  }

});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;

  if (!(currentPassword && newPassword && confirmNewPassword)) throw new apiError(400, "all fields are mandatory");



  if (newPassword !== confirmNewPassword) throw new apiError(400, "Your new password doesn't match with the confirm password");

  const user = await User.findById(req.user._id);
  const isPasswordCorrect = await user.isCorrect(currentPassword);

  if (!isPasswordCorrect) throw new apiError(400, "Old password is invalid");

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new apiResponse(200, {}, "Password has been changed successfully"));
})

const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(new apiResponse(200, req.user, "Current user fetched successfully"));
})

const updateUserDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  const updatedFields = {};
  if (fullName) updatedFields.fullName = fullName;
  if (email) updatedFields.email = email;

  if (!fullName || !email) throw new apiError(400, "Either fullName or email field is required");
  const user = await User.findByIdAndUpdate(req.user?._id,
    { $set: updatedFields },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new apiResponse(200, user, "User details updated successfully"));

});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) throw new apiError("Multer files is missing (updateUserAvatar : ERROR)");

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar.url) throw new apiError(400, "Avatar failed to upload on cloundinary (updateUserAvatar : ERROR)");

  //delete previous cloudinary avatar file
  const publicId = extractPublicId(req.user?.avatar);
  const output = await removeFromCloudinary(publicId);
  if (!output) throw new apiError(400, "fail to delete old cloudinary avatar file");

  const user = await User.findByIdAndUpdate(req.user?._id, { $set: { avatar: avatar.url } }, { new: true }).select("-password");
  req.user = user;
  return res.
    status(200)
    .json(200, user, "avatar has been updated successfully");
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) throw new apiError(400, "Multer file is missing (updateUserCoverImage : ERROR)");

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!coverImage) throw new apiError(400, "Cover image failed to upload on cloudinary (updateUserCoverImage : ERROR)");

  //remove old cover file from cloudinary

  const publicId = extractPublicId(req.user?.coverImage);
  let result = true;
  if (publicId) {
    result = await removeFromCloudinary(publicId);
  }

  if (!result) throw new apiError(400, "fail to remove cover image from cloudinary")

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { set: { coverImage: coverImage.url } },
    { new: true }
  ).select("-password");

  req.user = user;

  return res
    .status(200)
    .json(new apiResponse(200, user, "Cover image updated successfully"));
})

const getUserProfileDetails = asyncHandler(async (req, res) => {
  const userName = req.params;

  if (!userName.trim()) throw new apiError(400, "username passed as params is invalid");

  const channel = await User.aggregate([
    {
      $match: {
        userName: userName.toLowerCase()
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers"
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo"
      }
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers"
        },
        channelSubscribedCount: {
          $size: "$subscribedTo"
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user._id, "$subscribers.subscriber"] },
            then: true,
            else: false
          }
        }
      }
    },
    {
      $project: {
        userName: 1,
        fullName: 1,
        email: 1,
        avatar: 1,
        coverImage: 1,
        subscribersCount: 1,
        channelSubscribedCount: 1,
        isSubscribed: 1
      }
    }
  ]);

  if (!channel?.length) {
    throw new apiError(400, "fail to fetch the user details");
  }

  return res
    .status(200)
    .json(new apiResponse(200, channel[0], "user data fetched successfully"));

})

const getUserWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id)
      }
    }, {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    userName: 1,
                    fullName: 1,
                    email: 1,
                    avatar: 1
                  }
                }
              ]
            }
          },
          {
            $addFields: {
              owner: {
                $arrayElemAt: ["$owner", 0]
              }
            }
          }
        ]
      }
    }
  ])

  return res.status(200).json(new apiResponse(200, user[0].watchHistory, "watch history fetched successfully"));
})

export { registerHandler, logoutUser, loginUser, renewAccessToken, changePassword, getCurrentUser, updateUserDetails, updateUserAvatar, updateUserCoverImage, getUserProfileDetails, getUserWatchHistory };

