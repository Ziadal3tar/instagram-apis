import mongoose from "mongoose";
import dns from "dns";

dns.setServers([
  process.env.DNS_PRIMARY || "8.8.8.8",
  process.env.DNS_SECONDARY || "8.8.4.4",
]);
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
