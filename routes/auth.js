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
  console.log("[LOGIN] Mostrando formulario de inicio de sesión.");
  res.render("login", { csrfToken: req.csrfToken() });
});

// Ruta para iniciar sesión con rate limiter y bloqueo temporal
router.post("/login", loginLimiter, async (req, res, next) => {
  const { username, password } = req.body;
  console.log(`[LOGIN] Intento de inicio de sesión por el usuario: ${username}`);

  try {
    const user = await User.findOne({ username });
    if (!user) {
      console.log(`[LOGIN] Usuario no encontrado: ${username}`);
      req.flash("error_msg", "Usuario no encontrado.");
      return res.redirect("/login");
    }

    // Verificar si la cuenta está bloqueada
    if (user.isLocked) {
      console.log(`[LOGIN] Usuario bloqueado: ${username}`);
      req.flash(
        "error_msg",
        "Tu cuenta está bloqueada temporalmente. Intenta nuevamente más tarde."
      );
      return res.redirect("/login");
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      console.log(`[LOGIN] Contraseña incorrecta para el usuario: ${username}`);
      // Si la contraseña es incorrecta, incrementar los intentos fallidos
      await user.incLoginAttempts();
      req.flash("error_msg", "Contraseña incorrecta. Intenta nuevamente.");
      return res.redirect("/login");
    }

    // Si la contraseña es correcta, reiniciar los intentos fallidos
    await user.resetLoginAttempts();
    console.log(`[LOGIN] Contraseña correcta para el usuario: ${username}`);
    
    req.login(user, function (err) {
      if (err) {
        console.error(`[LOGIN] Error al iniciar sesión: ${err.message}`);
        return next(err);
      }
      console.log(`[LOGIN] Usuario autenticado con éxito: ${username}`);
      res.redirect("/dashboard");
    });
  } catch (err) {
    console.error(`[LOGIN] Error al procesar la solicitud de inicio de sesión: ${err.message}`);
    next(err);
  }
});

// Ruta para cerrar sesión
router.get("/logout", (req, res) => {
  console.log("[LOGOUT] Cerrando sesión.");
  req.logout((err) => {
    if (err) {
      console.error(`[LOGOUT] Error al cerrar sesión: ${err.message}`);
      return res.status(500).send("Error al cerrar sesión");
    }
    req.session.destroy((err) => {
      if (err) {
        console.error(`[LOGOUT] Error al destruir la sesión: ${err.message}`);
        return res.status(500).send("Error al cerrar sesión");
      }
      res.clearCookie("connect.sid");
      console.log("[LOGOUT] Sesión cerrada con éxito.");
      res.redirect("/login");
    });
  });
});

// Mostrar el formulario de registro con el token CSRF
router.get("/register", (req, res) => {
  console.log("[REGISTER] Mostrando formulario de registro.");
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
    console.log(`[REGISTER] Intento de registro de usuario: ${username}`);

    // Manejar errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(`[REGISTER] Errores de validación: ${errors.array().map(e => e.msg).join(', ')}`);
      return res.render("register", {
        errors: errors.array(),
        data: req.body, // Pasar los datos del formulario de vuelta a la vista
      });
    }

    try {
      const userExists = await User.findOne({ username });
      if (userExists) {
        console.log(`[REGISTER] El usuario ya existe: ${username}`);
        req.flash("error_msg", "El usuario ya existe.");
        return res.redirect("/register");
      }

      const newUser = new User({ username, password });
      newUser.password = await bcrypt.hash(password, 10);
      await newUser.save();
      console.log(`[REGISTER] Usuario registrado con éxito: ${username}`);
      req.flash("success_msg", "Usuario registrado exitosamente");
      res.redirect("/login");
    } catch (err) {
      console.error(`[REGISTER] Error al registrar el usuario: ${err.message}`);
      res.status(500).send("Error al registrar el usuario.");
    }
  }
);

module.exports = router;
