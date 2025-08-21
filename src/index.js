import dotenv from "dotenv"
import dbConnect from "./db/dbConnect.js"
import { app } from "./app.js"
dotenv.config({path:"./.env"})
const port = process.env.PORT
dbConnect().then(()=>{
    app.listen(port||4000,()=>{
        console.log(`Server is running at PORT : http://localhost:${port}`)
    })
}).catch((err)=>console.log("MongoDB connection failed : ",err))