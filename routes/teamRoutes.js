const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/teamController");
const auth = require("../middleware/authMiddleware");

router.post("/", auth, ctrl.addMember);
router.get("/", auth, ctrl.getMembers);
router.put("/:id", auth, ctrl.toggleMember);
router.delete("/:id", auth, ctrl.deleteMember);

module.exports = router;