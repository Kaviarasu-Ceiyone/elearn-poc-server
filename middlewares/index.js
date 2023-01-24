import expressJwt from "express-jwt";
import User from "../models/userModel.js";
import Course from "../models/courseModel.js";

// export const requireSignin = expressJwt({
//   getToken: (req, res) => {
//     console.log("FROM REQUIRE SING IN", req.headers["cookie-token"]);
//     req.headers["cookie-token"];
//   },
//   secret: "ASDJF3W3JDKLJF03080D",
//   algorithms: ["HS256"],
// });

export const requireSignin = async (req, res, next) => {
  console.log("This is requireSignin middlewear");
  next();
};

export const isInstructor = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).exec();
    if (!user.role.includes("Instructor")) {
      return res.sendStatus(403);
    } else {
      next();
    }
  } catch (err) {
    console.log("THIS IS REQUIRE SIGNIN ERROR", err);
  }
};

export const isEnrolled = async (req, res, next) => {
  console.log("FROM IS ENROLLED", req.headers.userid);
  try {
    const user = await User.findById(req.headers.userid).exec();
    const course = await Course.findOne({ slug: req.params.slug }).exec();

    // ! check if course id is found in user courses array
    let ids = [];
    for (let i = 0; i < user.courses.length; i++) {
      ids.push(user.courses[i].toString());

      if (!ids.includes(course._id.toString())) {
        res.sendStatus(403);
      } else {
        next();
      }
    }
  } catch (err) {
    console.log(err);
  }
};
