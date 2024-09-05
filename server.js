// Importar las dependencias
require("dotenv").config(); // Para usar variables de entorno
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const flash = require("connect-flash");
const helmet = require("helmet");

// Inicializar la aplicación Express
const app = express();

// Configurar EJS como motor de plantillas
app.set("view engine", "ejs");

// Middleware de seguridad
app.use(helmet());

// Middleware para procesar datos de formularios y JSON
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Servir archivos estáticos
app.use(express.static("public"));

// Conexión a MongoDB usando variables de entorno
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost/todo-app")
  .then(() => console.log("Conectado a MongoDB"))
  .catch((err) => console.error("Error al conectar a MongoDB:", err));

// Configuración de la sesión
app.use(
  session({
    secret: process.env.SESSION_SECRET || "default-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 3600000 }, // Configurar tiempo de expiración de las cookies
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

// Inicializar Passport y la sesión
app.use(passport.initialize());
app.use(passport.session());

// Cargar la configuración de Passport
require("./config/passport")(passport);

// Importar y usar las rutas
const authRoutes = require("./routes/auth");
const taskRoutes = require("./routes/tasks");

app.use("/", authRoutes);
app.use("/", taskRoutes);

// Iniciar el servidor en el puerto 4000
app.listen(4000, () => {
  console.log("Servidor corriendo en http://localhost:4000");
});

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Permitir scripts internos (aunque no recomendado)
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  })
);