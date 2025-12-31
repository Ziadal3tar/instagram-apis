import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

/* =======================
   PATH & ENV
======================= */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "./config/.env") });

/* =======================
   APP INIT
======================= */
const app = express();

/* =======================
   DB
======================= */
import connection from "./DB/connection.js";
mongoose.set("bufferCommands", false);

/* =======================
   GRAPHQL
======================= */
import { createHandler } from "graphql-http/lib/use/express";
import { auth } from "./schema/auth.js";
import playground from "graphql-playground-middleware-express";
const expressPlayground = playground.default;

/* =======================
   ROUTERS
======================= */
import * as indexRouter from "./src/module/index.router.js";

/* =======================
   SOCKET
======================= */
import * as socketIO from "./common/socket.js";
import { notification } from "./common/notification.js";
import userModel from "./DB/model/user.model.js";

/* =======================
   ERROR HANDLER
======================= */
import { globalError } from "./src/services/asyncHandler.js";

/* =======================
   MIDDLEWARES
======================= */
app.use(cors({ origin: "*", optionsSuccessStatus: 200 }));
app.use(express.json());

/* =======================
   PING (UPTIME)
======================= */
app.get("/ping", (req, res) => {
  res.status(200).send("pong");
});

/* =======================
   REST ROUTES
======================= */
app.use("/auth", indexRouter.authRouter);
app.use("/user", indexRouter.userRouter);
app.use("/posts", indexRouter.postRouter);
app.use("/reels", indexRouter.reelRouter);
app.use("/stories", indexRouter.storyRouter);
app.use("/chats", indexRouter.chatsRouter);

/* =======================
   GRAPHQL ROUTES
======================= */
app.use("/graphql", createHandler({ schema: auth, graphiql: true }));
app.get("/playground", expressPlayground({ endpoint: "/graphql" }));

/* =======================
   ROOT
======================= */
app.get("/", (req, res) => res.send("API is running 🚀"));

/* =======================
   GLOBAL ERROR
======================= */
app.use(globalError);

/* =======================
   START SERVER AFTER DB
======================= */
const PORT = process.env.PORT || 3000;

connection()
  .then(() => {
    console.log("✅ MongoDB connected");

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

    /* =======================
       SOCKET.IO
    ======================= */
    const io = socketIO.init(server);

    io.on("connection", (socket) => {
      console.log("🟢 Socket connected:", socket.id);

      socket.on("updateSocketId", async (userToken) => {
        try {
          const decoded = jwt.verify(userToken, process.env.tokenSignature);
          if (!decoded?.id) return;

          await userModel.findByIdAndUpdate(decoded.id, {
            socketID: socket.id,
          });
        } catch (err) {
          console.error("updateSocketId error:", err);
        }
      });

      socket.on("notification", async (data) => {
        try {
          if (!data?.eventName || !data?.to) return;

          const actor = await userModel
            .findById(data.data)
            .select("userName _id")
            .lean();

          if (!actor) return;

          const text = `${actor.userName} ${notification[data.eventName]}`;

          const notificationData = {
            text,
            data: actor._id,
            type: data.type || data.eventName,
            createdAt: new Date(),
          };

          const pushed = await userModel.findByIdAndUpdate(
            data.to,
            { $push: { notifications: notificationData } },
            { new: true, select: "socketID notifications" }
          ).lean();

          if (pushed?.socketID) {
            io.to(pushed.socketID).emit("notification", {
              message: "New notification",
              payload: notificationData,
            });
          }
        } catch (err) {
          console.error("notification error:", err);
        }
      });

      socket.on("disconnect", () => {
        console.log("🔴 Socket disconnected:", socket.id);
      });
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });
