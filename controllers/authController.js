import User from "../models/userModel.js";
import { genHashedPassword, comparePassword } from "../utils/auth.js";
import jwt from "jsonwebtoken";
import AWS from "aws-sdk";
import { nanoid } from "nanoid";
import Cookies from "js-cookie";

const awsConfig = {
  accessKeyId: process.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: "us-east-1",
  apiVersion: process.env.AWS_API_VERSION,
};

const SES = new AWS.SES(awsConfig);

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // validation
    if (!name) return res.status(400).send("Name is required");

    if (!password || password.length < 6) {
      return res.status(400).send("Password is required and min 6 chars long");
    }

    let userExist = await User.findOne({ email }).exec();

    if (userExist) return res.status(400).send("Email already exists");

    //hash password
    const hashedPassword = await genHashedPassword(password);

    //register
    const user = new User({
      name,
      email,
      password: hashedPassword,
    });

    await user.save();

    return res.json({ status: "okay" });
  } catch (err) {
    console.log(err);
    return res.status(400).send("Error, try again");
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).exec();

    if (!user) return res.status(400).send("No user found");

    //Check password
    const match = await comparePassword(password, user.password);

    if (!match) return res.status(400).send("Password does not match");

    // create signed jwt
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // return user and token to client, exclude hashed password
    user.password = undefined;
    // send token in cookie
    // res.cookie("token", token, {
    //   httpOnly: true,
    //   // secure: true, // only works on https
    // });

    const array = [user, { token }];
    console.log(array[0]);
    res.json([user, { token }]);
  } catch (err) {
    console.log(err);
    return res.status(400).send("Error, try again");
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie("token");
    return res.json({ message: "Signout Success" });
  } catch (err) {
    console.log(err);
  }
};

export const currentUser = async (req, res) => {
  console.log("FROM CURRENT USER");
  try {
    console.log("INSIDE CURRENT USER");
    const user = await User.findById(req.headers.userid)
      .select("-password")
      .exec();
    console.log("CURRENT_USER", user);
    return res.json({ ok: true });
  } catch (err) {
    console.log("THIS IS CURRENT USER ERROR");
    console.log(err);
  }
};

export const sendTestEmail = async (req, res) => {
  // console.log("Send email using SES");
  // res.json({ ok: true });

  const params = {
    Source: process.env.EMAIL_FROM,
    Destination: {
      ToAddresses: ["kaviarasu.ns@gmail.com"],
    },
    ReplyToAddresses: [process.env.EMAIL_FROM],
    Message: {
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: `
            <html>
            <h1>Reset password link</h1>
            <p>Please use the following link to reset your password</p>
            </html>
          `,
        },
      },
      Subject: {
        Charset: "UTF-8",
        Data: "Password reset link",
      },
    },
  };

  const emailSent = SES.sendEmail(params).promise();

  emailSent
    .then((data) => {
      console.log(data);
      res.json({ ok: true });
    })
    .catch((err) => {
      console.log(err);
    });
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const shortCode = nanoid(6).toUpperCase();
    const user = await User.findOneAndUpdate(
      { email },
      { passwordResetCode: shortCode }
    );

    if (!user) return res.status(400).send("User not found");

    // prepare for email
    const params = {
      Source: process.env.EMAIL_FROM,
      Destination: {
        ToAddresses: [email],
      },

      Message: {
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: `
            <html>
            <h1>Reset password link</h1>
            <p>Use this code to reset your password</p>
            <h2 style="color: red">${shortCode}</h2>
            <i>ceiyone.com</i>
            </html>
          `,
          },
        },
        Subject: {
          Charset: "UTF-8",
          Data: "Reset Password",
        },
      },
    };

    const emailSent = SES.sendEmail(params).promise();

    emailSent
      .then((data) => {
        console.log(data);
        res.json({ ok: true });
      })
      .catch((err) => {
        console.log(err);
      });
  } catch (err) {
    console.log(err);
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    // console.table({ email, code, newPassword });

    const hashedPassword = await genHashedPassword(newPassword);

    const user = User.findOneAndUpdate(
      { email, passwordResetCode: code },
      { password: hashedPassword, passwordResetCode: "" }
    ).exec();
    res.json({ ok: true });
  } catch (err) {
    console.log(err);
    return res.status(400).send("Error! Try again.");
  }
};
