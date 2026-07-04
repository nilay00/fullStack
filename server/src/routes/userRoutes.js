const express = require("express");
const {
  browseUsers, getUserById, updateMyProfile, toggleSaveProfile, getSavedProfiles,
  updatePrivacySettings, deleteGalleryPhoto, toggleBlockUser,
} = require("../controllers/userController");
const { protect } = require("../middleware/auth");

const router = express.Router();
router.use(protect);

router.get("/browse", browseUsers);
router.get("/saved", getSavedProfiles);
router.put("/me", updateMyProfile);
router.put("/me/privacy", updatePrivacySettings);
router.delete("/me/gallery/:photoId", deleteGalleryPhoto);
router.post("/save/:id", toggleSaveProfile);
router.post("/block/:id", toggleBlockUser);
router.get("/:id", getUserById);

module.exports = router;
