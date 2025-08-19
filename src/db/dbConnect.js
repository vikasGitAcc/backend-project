import mongoose from "mongoose"
import { MONGODB_NAME } from "../constants.js"

async function dbConnect () {
    try{
    const connectionResponse = await mongoose.connect(`${process.env.MONGODB_URL}/${MONGODB_NAME}`);
    console.log(`MongoDB is connected at Host ${connectionResponse.connection.host}`)
    }catch(err){
       console.log("MongoDB error : ",err)
    }
    

}

export default dbConnect;