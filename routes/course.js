import express from "express";
import formidable from "express-formidable";

const router = express.Router();

//middleware
import {
  isInstructor,
  requireSignin,
  isEnrolled,
} from "../middlewares/index.js";

// controllers
import {
  uploadImage,
  removeImage,
  create,
  read,
  uploadVideo,
  removeVideo,
  addLesson,
  update,
  removeLesson,
  updateLesson,
  publishCourse,
  unpublishCourse,
  courses,
  checkEnrollment,
  freeEnrollment,
  userCourses,
} from "../controllers/courseController.js";

router.get("/courses", courses);

//image
router.post("/course/upload-image", uploadImage);
router.post("/course/remove-image", removeImage);
// course
router.post("/course", requireSignin, isInstructor, create);
router.put("/course/:slug", requireSignin, update);
router.get("/course/:slug", read);
router.post(
  "/course/video-upload/:instructorId",
  requireSignin,
  formidable({ maxFileSize: 500 * 1024 * 1024 }),
  uploadVideo
);
router.post("/course/video-remove/:instructorId", requireSignin, removeVideo);

// publish unpublish
router.put("/course/publish/:courseId", requireSignin, publishCourse);
router.put("/course/unpublish/:courseId", requireSignin, unpublishCourse);

router.post(`/course/lesson/:slug/:instructorId`, requireSignin, addLesson);
router.put(`/course/lesson/:slug/:instructorId`, requireSignin, updateLesson);
router.put("/course/:slug/:lessonId", requireSignin, removeLesson);

router.get("/check-enrollment/:courseId", requireSignin, checkEnrollment);

// enrollment
router.post("/free-enrollment/:courseId", requireSignin, freeEnrollment);

router.get("/user-courses", requireSignin, userCourses);

router.get("/user/course/:slug", requireSignin, read);

export const courseRouter = router;
