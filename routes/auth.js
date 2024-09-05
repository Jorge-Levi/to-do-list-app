const express = require("express");
const passport = require("passport");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const router = express.Router();

// Mostrar el formulario de login
router.get("/login", (req, res) => res.render("login"));

// Ruta para iniciar sesión
router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

// Ruta para cerrar sesión
router.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).send("Error al cerrar sesión");
    }
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).send("Error al cerrar sesión");
      }
      res.clearCookie("connect.sid");
      res.redirect("/login");
    });
  });
});

// Mostrar el formulario de registro
router.get("/register", (req, res) => res.render("register"));

// Ruta para registrar nuevos usuarios
router.post("/register", async (req, res) => {
  const { username, password } = req.body;
  try {
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).send("El usuario ya existe.");
    }

    const newUser = new User({ username, password });
    newUser.password = await bcrypt.hash(password, 10);
    await newUser.save();
    req.flash("success_msg", "Usuario registrado exitosamente");
    res.redirect("/login");
  } catch (err) {
    res.status(500).send("Error al registrar el usuario.");
  }
});

module.exports = router;
