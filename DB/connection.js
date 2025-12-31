import mongoose from "mongoose";

const connection = () => {
  mongoose.set("bufferCommands", false);

  return mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 30000,
  });
};

export default connection;
