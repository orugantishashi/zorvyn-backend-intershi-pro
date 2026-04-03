/**
 * User Model (MongoDB / Mongoose)
 * - Stores authentication credentials and role for access control
 */
const mongoose = require("mongoose");
const userSchema= new mongoose.Schema({
    name:{ type:String, required:true},
    email:{ type:String, required:true},
    password:{ type:String, required:true},
    role:{
    type: String,
    default: "user",
        enum: ["user", "admin","analyst"]
    }
})
module.exports= mongoose.model("finance",userSchema)
