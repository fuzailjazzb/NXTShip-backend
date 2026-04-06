const TeamMember = require("../models/TeamMember");
const bcrypt = require("bcryptjs");

/* ================= ADD MEMBER ================= */

exports.addMember = async (req, res) => {
  try {

    const userId = req.user.id;
    const { name, email, password } = req.body;

    console.log("➕ Adding member:", email);

    const hashed = await bcrypt.hash(password, 10);

    const member = await TeamMember.create({
      userId,
      name,
      email,
      password: hashed
    });

    res.json({ success: true, member });

  } catch (err) {
    console.log("❌ Add member error:", err.message);
    res.status(500).json({ success: false });
  }
};

/* ================= GET MEMBERS ================= */

exports.getMembers = async (req, res) => {
  try {

    const userId = req.user.id;

    const members = await TeamMember.find({ userId });

    res.json({ success: true, members });

  } catch (err) {
    console.log("❌ Fetch members error:", err.message);
    res.status(500).json({ success: false });
  }
};

/* ================= TOGGLE STATUS ================= */

exports.toggleMember = async (req, res) => {
  try {

    const { id } = req.params;

    const member = await TeamMember.findById(id);

    member.isActive = !member.isActive;
    await member.save();

    res.json({ success: true });

  } catch (err) {
    console.log("❌ Toggle error:", err.message);
    res.status(500).json({ success: false });
  }
};

/* ================= DELETE ================= */

exports.deleteMember = async (req, res) => {
  try {

    const { id } = req.params;

    await TeamMember.findByIdAndDelete(id);

    res.json({ success: true });

  } catch (err) {
    console.log("❌ Delete error:", err.message);
    res.status(500).json({ success: false });
  }
};