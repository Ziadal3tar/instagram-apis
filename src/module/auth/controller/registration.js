import userModel from '../../../../DB/model/user.model.js'

import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken';
import { asyncHandler } from '../../../services/asyncHandler.js';
import { findById, findByIdAndDelete, findOneAndUpdate, findOne, find, findByIdAndUpdate, create, findOneAndDelete } from '../../../../DB/DBMethods.js';
import cloudinary from '../../../services/cloudinary.js'

export const signUp = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  const user = await findOne({ model: userModel, condition: { email } })
  if (user) {
    res.status(409).json({ message: 'this email already register' })
  } else {
    let addUser = new userModel(req.body);
    let savedUser = await addUser.save()
    res.status(201).json({ message: "added successfully", savedUser })
  }

})

export const logIn = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await findOne({ model: userModel, condition: { email } })
  if (!user) {
    res.status(404).json({ message: 'You have to register first' })

  } else {
    let compare = bcrypt.compareSync(password, user.password, parseInt(process.env.SALTROUND))
    if (compare) {
      if (!user.confirmEmail) {
        res.status(400).json({ message: 'You have to confirm email first' })

      } else {
        let token = jwt.sign({ id: user._id, isLoggedIn: true }, process.env.tokenSignature, { expiresIn: 60 * 60 * 24 * 2 })
        res.status(200).json({ message: "welcome", token, id: user._id })
      }
    } else {
      res.status(400).json({ message: 'In-valid password' })

    }
  }
})







export const loginWithGoogle = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  const user = await findOne({ model: userModel, condition: { email } })
  if (user) {
    res.status(409).json({ success: false, message: 'this email already register' })
  } else {

    let addUser = new userModel(req.body);
    let savedUser = await addUser.save()
    
    res.status(201).json({ success: true, message: "added successfully", savedUser, id: savedUser._id  })
  }
})
export const loginWithFB = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  const user = await findOne({ model: userModel, condition: { email } })
  if (user) {
    res.status(409).json({ success: false, message: 'this email already register' })
  } else {

    let addUser = new userModel(req.body);
    let savedUser = await addUser.save()
    res.status(201).json({ success: true, message: "added successfully", savedUser , id: savedUser._id  })
  }
})



export const logInWithFbOrGoogle = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  const user = await findOne({ model: userModel, condition: { email } })
  if (!user) {
    res.status(404).json({ message: 'You have to register first' })

  } else {
 
        let token = jwt.sign({ id: user._id, isLoggedIn: true }, process.env.tokenSignature, { expiresIn: 60 * 60 * 24 * 2 })
        res.status(200).json({success: true, message: "welcome", token, id: user._id })
   
  }
})