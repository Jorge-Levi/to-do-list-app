// Importar las dependencias
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");

// Inicializar la aplicación Express
const app = express();

// Middleware para procesar datos de formularios y JSON
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Conexión a MongoDB usando Mongoose (sin las opciones obsoletas)
mongoose
  .connect("mongodb://localhost/todo-app")
  .then(() => console.log("Conectado a MongoDB"))
  .catch((err) => console.log("Error al conectar a MongoDB:", err));

// Configuración de la sesión
app.use(
  session({
    secret: "your-secret-key", // Cambia esto por una clave segura
    resave: false,
    saveUninitialized: true,
  })
);

// Inicializar Passport y las sesiones
app.use(passport.initialize());
app.use(passport.session());

// Estrategia de Passport para autenticación local
passport.use(
  new LocalStrategy((username, password, done) => {
    // Aquí buscamos al usuario en la base de datos
    User.findOne({ username: username }, (err, user) => {
      if (err) return done(err);
      if (!user) return done(null, false, { message: "Usuario no encontrado" });

      // Comparar la contraseña ingresada con la almacenada en la base de datos
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) throw err;
        if (isMatch) {
          return done(null, user);
        } else {
          return done(null, false, { message: "Contraseña incorrecta" });
        }
      });
    });
  })
);

// Serializar y deserializar usuarios
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => done(err, user));
});

// Ruta principal
app.get("/", (req, res) => {
  res.send("Bienvenido a la To-Do List App");
});

// Iniciar el servidor en el puerto 3000
app.listen(3000, () => {
  console.log("Servidor corriendo en http://localhost:3000");
});
