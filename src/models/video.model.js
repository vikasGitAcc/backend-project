import mongoose from "mongoose"
import {mongooseAggregatePaginate} from "mongoose-aggregate-paginate-v2"

const videoSchema = new mongoose.Schema(
    {
        title : {
            type : String,
            required : true
        },   
        description : {
            type : String,
        },   
        thumbnail : {
            type : String,     // cloudnary response            
            required : true
        },   
        videoFile : {
            type : String,     // cloundnary response
            required : true
        },   
        duration : {
            type : Number,    //cloundnary send response after uploading file
            required : true
        },   
        owner : {
            type : mongoose.Schema.Types.ObjectId,
            ref : "User"
        },
        views : {
            type: Number,
            default : 0
        },
        isPublished:{
            type: Boolean,
            default : true
        }   
    },
    {
        timestamps:true
    }
)

videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video",videoSchema)