// Importar las dependencias
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const flash = require("connect-flash");
const User = require("./models/User");
const Task = require("./models/Task");

// Inicializar la aplicación Express
const app = express();

// Configurar EJS como motor de plantillas
app.set("view engine", "ejs");

// Middleware para procesar datos de formularios y JSON
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Servir archivos estáticos
app.use(express.static("public"));

// Conexión a MongoDB usando Mongoose
mongoose
  .connect("mongodb://localhost/todo-app")
  .then(() => console.log("Conectado a MongoDB"))
  .catch((err) => console.error("Error al conectar a MongoDB:", err));

// Configuración de la sesión
app.use(
  session({
    secret: "your-secret-key", // Cambia esto por una clave segura
    resave: false,
    saveUninitialized: true,
  })
);

// Inicializar connect-flash
app.use(flash());

// Configurar middleware para manejar mensajes flash
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error"); // Para los errores de Passport
  next();
});

// Inicializar Passport y las sesiones
app.use(passport.initialize());
app.use(passport.session());

// Estrategia de Passport para autenticación local
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      // Buscar al usuario en la base de datos usando Promesas con async/await
      const user = await User.findOne({ username });
      if (!user) {
        return done(null, false, { message: "Usuario no encontrado" });
      }

      // Comparar la contraseña ingresada con la almacenada en la base de datos
      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        return done(null, user);
      } else {
        return done(null, false, { message: "Contraseña incorrecta" });
      }
    } catch (err) {
      return done(err);
    }
  })
);

// Serializar y deserializar usuarios
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Middleware de autenticación
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}

// Ruta principal: redirigir a login o dashboard
app.get("/", (req, res) => {
  if (req.isAuthenticated()) {
    res.redirect("/dashboard");
  } else {
    res.redirect("/login");
  }
});

// Mostrar el formulario de registro
app.get("/register", (req, res) => {
  res.render("register");
});

// Ruta para registrar nuevos usuarios
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  try {
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).send("El usuario ya existe.");
    }

    // Crear un nuevo usuario y cifrar la contraseña
    const newUser = new User({ username, password });
    newUser.password = await bcrypt.hash(password, 10);

    // Guardar el nuevo usuario en la base de datos
    await newUser.save();
    req.flash("success_msg", "Usuario registrado exitosamente");
    res.redirect("/login");
  } catch (err) {
    res.status(500).send("Error al registrar el usuario.");
  }
});

// Mostrar el formulario de inicio de sesión
app.get("/login", (req, res) => {
  res.render("login");
});

// Ruta para iniciar sesión
app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

// Ruta para cerrar sesión
app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).send("Error al cerrar sesión");
    }
    req.session.destroy((err) => {
      // Destruir la sesión manualmente
      if (err) {
        return res.status(500).send("Error al cerrar sesión");
      }
      res.clearCookie("connect.sid"); // Limpiar la cookie de la sesión
      res.redirect("/login");
    });
  });
});

// Mostrar las tareas del usuario autenticado
app.get("/dashboard", ensureAuthenticated, async (req, res) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");

  try {
    const tasks = await Task.find({ userId: req.user._id });
    res.render("dashboard", { user: req.user, tasks });
  } catch (err) {
    res.status(500).send("Error al cargar las tareas");
  }
});

// Crear nueva tarea
app.post("/task", ensureAuthenticated, async (req, res) => {
  const { task } = req.body;
  try {
    const newTask = new Task({
      userId: req.user._id,
      task,
    });
    await newTask.save();
    res.redirect("/dashboard");
  } catch (err) {
    res.status(500).send("Error al crear la tarea");
  }
});

// Actualizar el estado de una tarea (completada o no)
app.post("/task/update/:id", ensureAuthenticated, async (req, res) => {
  console.log("Estado de completado:", req.body.completed); // Verificar el valor de completed
  const taskId = req.params.id;
  const isCompleted = req.body.completed === "true";

  try {
    await Task.findByIdAndUpdate(taskId, { completed: isCompleted });
    res.redirect("/dashboard");
  } catch (err) {
    console.error("Error al actualizar la tarea:", err);
    res.status(500).send("Error al actualizar la tarea.");
  }
});

// Ruta para eliminar una tarea
app.post("/task/delete", ensureAuthenticated, async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.body.id);
    res.redirect("/dashboard");
  } catch (err) {
    res.status(500).send("Error al eliminar la tarea.");
  }
});

// Ruta para actualizar el texto de una tarea
app.post("/task/update-text/:id", ensureAuthenticated, async (req, res) => {
  const taskId = req.params.id;
  const updatedTask = req.body.task; // El nuevo texto de la tarea

  try {
    await Task.findByIdAndUpdate(taskId, { task: updatedTask });
    res.redirect("/dashboard");
  } catch (err) {
    console.error("Error al actualizar el texto de la tarea:", err);
    res.status(500).send("Error al actualizar la tarea.");
  }
});


// Iniciar el servidor en el puerto 4000
app.listen(4000, () => {
  console.log("Servidor corriendo en http://localhost:4000");
});
