const express = require("express");
const router = express.Router();
const User = require("../models/User");

router.post("/signup", async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.json({ message: "User created" });
  } catch (err) {
    res.status(400).json({ error: "Username already exists" });
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });

  if (!user) {
    return res.status(400).json({ error: "User not found" });
  }

  if (user.password !== password) {
    return res.status(400).json({ error: "Incorrect password" });
  }

  res.json({
    message: "Login successful",
    username: user.username
  });
});

module.exports = router;

