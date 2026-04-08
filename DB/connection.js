import mongoose from "mongoose";

// const connection = () => {
//   // mongoose.set("bufferCommands", false);

//   return mongoose.connect(process.env.MONGO_URI, {
//     serverSelectionTimeoutMS: 30000,
//   });
// };
const connection = async ()=>{
    return await mongoose.connect(process.env.MONGO_URI)
    .then(()=> console.log(`connected on ...... `))
    .catch(err=>console.log(`fail to connect `))
}
export default connection;
