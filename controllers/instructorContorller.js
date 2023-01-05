import User from "../models/userModel.js";
import Stripe from "stripe";
import queryString from "query-string";
import Course from "../models/courseModel.js";

const stripe = new Stripe({
  apiKey:
    "sk_test_51LXndkDYMG4T7awfmvkPRDsPxpt3235MqKL7Ic0hx8Kov7U9BntIa0RC1nvleWfxn6S2RSDZUpatgI2VOE0ATyC000xC8mztj1",
});

export const makeInstructor = async (req, res) => {
  try {
    //1. find user from db
    const user = await User.findById(req.user._id).exec();
    //2. if user dont have stripe_account_id yet, then create new
    if (!user.stripe_account_id) {
      const account = await stripe.accounts.create({
        type: "express",
      });
      // console.log('ACCOUNT=>', account.id);
      user.stripe_account_id = account._id;
      user.save();
    }
    //3. create account link based on account id (for frontend to complete onboarding)
    let accountLink = await stripe.AccountLinksResource.create({
      account: user.stripe_account_id,
      refresh_url: process.env.STRIPE_REDIRECT_URL,
      return_url: process.env.STRIPE_REDIRECT_URL,
      type: "accoutn_onboarding",
    });
    // console.log(accountLink);
    //4. pre-fill any info such as email (optional), then send url response to frontend
    accountLink = Object.assign(accountLink, {
      "stripe_user[email]": user.email,
    });
    //5. then send account link as response to frontend
    res.send(`${accountLink.url}?${queryString.stringify(accountLink)}`);
  } catch (err) {
    console.log("MAKE INSTRUCTOR ERR", err);
  }
};

export const getAccountStatus = async (req, res) => {
  try {
    // const user = await User.findById(req.user._id).exec();
    // const account = await stripe.accounts.retrieve(user.stripe_account_id);

    const userid = "6398346ebc77d7429eb49e02";

    if (!true) {
      return res.status(401).send("Unauthorized");
    } else {
      const statusUpdated = await User.findByIdAndUpdate(
        userid,
        {
          stripe_seller: "acct_1IbdFAPc6rV1LK1E",
          $addToSet: { role: "Instructor" },
        },
        { new: true }
      )
        .select("-password")
        .exec();
      // statusUpdated.password = undefined;
      res.json(statusUpdated);
    }
  } catch (err) {
    console.log("getAccountStatus Error");
  }
};

export const currentInstructor = async (req, res) => {
  try {
    let user = await User.findById(req.user._id).select("-password").exec();

    if (!user.role.includes("Instructor")) {
      return res.status(403);
    } else {
      res.json({ ok: true });
    }
  } catch (er) {
    console.log(err);
  }
};

export const instructorCourses = async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.user._id })
      .sort({ createdAt: -1 })
      .exec();
    res.json(courses);
  } catch (err) {
    console.log(err);
  }
};
