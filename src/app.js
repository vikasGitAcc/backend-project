import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors"
import helmet from "helmet"

const app = express()
app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials:true
}))
// app.use(
//     helmet.contentSecurityPolicy({
//         directives:{
//             defaultSrc:["'self'"],
//             connectSrc:["'self'","http://localhost:8000"]
//         }
//     })
// )
app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({limit:"16kb",extended:true}))
app.use(express.static("public"))
app.use(cookieParser())

// import routerself

 import  userRouter  from "./routes/user.routes.js"

//Transfering router controls to userRouter

 app.use("/api/v1/users",userRouter)
 app.get("/test",(req,res,next)=>{
    res.send("Yes the server is running correctly")
 })


export {app}