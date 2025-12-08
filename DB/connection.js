import mongoose from "mongoose";

const connection = async ()=>{
    return await mongoose.connect("mongodb+srv://ziad:00241300@cluster0.bxnbg.mongodb.net/instagram")
    .then(()=> console.log(`connected on ...... `))
    .catch(err=>console.log(`fail to connect `))
}

export default connection;