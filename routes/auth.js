const express = require("express");
const passport = require("passport");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const router = express.Router();
const rateLimit = require("express-rate-limit");

// Configurar la limitación de solicitudes para el inicio de sesión
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Limitar cada IP a 5 intentos de inicio de sesión en este tiempo
  message:
    "Has alcanzado el límite de intentos. Intenta nuevamente en 15 minutos.",
  standardHeaders: true, // Devuelve las cabeceras `RateLimit-*` estándar
  legacyHeaders: false, // Deshabilita los encabezados `X-RateLimit-*` antiguos
});

// Mostrar el formulario de login con el token CSRF
router.get("/login", (req, res) => {
  res.render("login", { csrfToken: req.csrfToken() });
});

// Ruta para iniciar sesión con rate limiter y bloqueo temporal
router.post("/login", loginLimiter, async (req, res, next) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      req.flash("error_msg", "Usuario no encontrado.");
      return res.redirect("/login");
    }

    // Verificar si la cuenta está bloqueada
    if (user.isLocked) {
      req.flash(
        "error_msg",
        "Tu cuenta está bloqueada temporalmente. Intenta nuevamente más tarde."
      );
      return res.redirect("/login");
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      // Si la contraseña es incorrecta, incrementar los intentos fallidos
      await user.incLoginAttempts();
      req.flash("error_msg", "Contraseña incorrecta. Intenta nuevamente.");
      return res.redirect("/login");
    }

    // Si la contraseña es correcta, reiniciar los intentos fallidos
    await user.resetLoginAttempts();
    req.login(user, function (err) {
      if (err) return next(err);
      res.redirect("/dashboard");
    });
  } catch (err) {
    next(err);
  }
});

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

// Mostrar el formulario de registro con el token CSRF
router.get("/register", (req, res) => {
  res.render("register", { csrfToken: req.csrfToken(), errors: [], data: {} });
});

// Ruta para registrar nuevos usuarios con validación
router.post(
  "/register",
  [
    body("username")
      .trim()
      .notEmpty()
      .withMessage("El nombre de usuario es obligatorio.")
      .isLength({ min: 3 })
      .withMessage("El nombre de usuario debe tener al menos 3 caracteres."),
    body("password")
      .notEmpty()
      .withMessage("La contraseña es obligatoria.")
      .isLength({ min: 6 })
      .withMessage("La contraseña debe tener al menos 6 caracteres."),
  ],
  async (req, res) => {
    const { username, password } = req.body;

    // Manejar errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Renderizar con los errores y los datos ingresados por el usuario
      return res.render("register", {
        errors: errors.array(),
        data: req.body, // Pasar los datos del formulario de vuelta a la vista
      });
    }

    try {
      const userExists = await User.findOne({ username });
      if (userExists) {
        req.flash("error_msg", "El usuario ya existe.");
        return res.redirect("/register");
      }

      const newUser = new User({ username, password });
      newUser.password = await bcrypt.hash(password, 10);
      await newUser.save();
      req.flash("success_msg", "Usuario registrado exitosamente");
      res.redirect("/login");
    } catch (err) {
      res.status(500).send("Error al registrar el usuario.");
    }
  }
);

module.exports = router;
