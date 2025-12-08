import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, './config/.env') })
import express from 'express'
import {createHandler} from 'graphql-http/lib/use/express'
import { auth } from './schema/auth.js'
import jwt from "jsonwebtoken"

import * as indexRouter from './src/module/index.router.js'
import playground from 'graphql-playground-middleware-express'
const expressPlayground = playground.default
const app = express()
import connection from './DB/connection.js'
import { globalError } from './src/services/asyncHandler.js'
import cors from "cors"
var corsOption = {
    origin: "*",
    optionsSuccessStatus: 200
}
app.use(cors("*"))
const port = process.env.PORT || 3000
const baseUrl = process.env.baseUrl
app.use(express.json())
app.use('/auth', indexRouter.authRouter)
app.use('/user', indexRouter.userRouter)
app.use('/posts', indexRouter.postRouter)
app.use('/reels', indexRouter.reelRouter)
app.use('/stories', indexRouter.storyRouter)
app.use('/chats', indexRouter.chatsRouter)

app.use(globalError)
connection()
const server = app.listen(port, () => console.log(`Example app listening on port ${port}!`))
app.use(express.json())
app.use('/graphql', createHandler({ schema: auth, graphiql: true }))
app.get('/playground', expressPlayground({ endpoint: '/graphql' }))
app.get('/', (req, res) => res.send('Hello World2!'))

import * as socket from './common/socket.js'
import { notification } from './common/notification.js';

import { Socket } from 'socket.io'
import userModel from './DB/model/user.model.js'

const io = socket.init(server)

io.on("connection", (socket) => {

socket.on('updateSocketId', async (userToken) => {
              const decoded = jwt.verify(userToken, process.env.tokenSignature);

  
  if (!decoded.id) return;
  try {
    await userModel.findByIdAndUpdate(decoded.id, { socketID: socket.id });
  } catch (e) { console.error(e); }
});



socket.on('notification', async (data) => {
  try {
    if (!data || !data.eventName || !data.to) return;

    const actor = await userModel.findById(data.data).select('userName _id').lean();
    if (!actor) return;

 const text = `${actor.userName} ${notification[data.eventName]}`;


    const notificationData = {
      text,
      data: actor._id,          
      type: data.type || data.eventName,
      createdAt: new Date()
    };

    const pushed = await userModel.findByIdAndUpdate(
      data.to,
      { $push: { notifications: notificationData } },
      { new: true, select: 'socketID notifications' }
    ).lean();

    if (pushed && pushed.socketID) {
      io.to(pushed.socketID).emit('notification', {
        message: 'New notification',
        payload: notificationData
      });
    }
  } catch (err) {
    console.error('Notification handler error:', err);
  }
});


})