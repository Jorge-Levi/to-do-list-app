// Importar las dependencias
require("dotenv").config(); // Para usar variables de entorno
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const flash = require("connect-flash");
const helmet = require("helmet");
const compression = require("compression"); // Importar el middleware de compresión
const path = require("path"); // Para servir archivos estáticos
const cookieParser = require("cookie-parser");
const csrf = require("csurf");



// Inicializar la aplicación Express
const app = express();

// Middleware de compresión
app.use(compression());

// Configurar EJS como motor de plantillas
app.set("view engine", "ejs");

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, "public")));

// Middleware de seguridad con Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    frameguard: { action: "deny" }, // Evitar que la página sea cargada en un iframe
  })
);

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
    name: "sessionId", // Nombre de la cookie de sesión
    secret: process.env.SESSION_SECRET || "default-secret-key", // Cambiar por una clave secreta en producción
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true, // Evita que el cliente acceda a la cookie desde JavaScript
      secure: process.env.NODE_ENV === "production", // Cookies seguras solo si el entorno es producción (HTTPS)
      sameSite: "strict", // Evitar el envío de cookies a otros dominios (previene CSRF)
      maxAge: 1000 * 60 * 30, // La cookie expira en 30 minutos
    },
  })
);

// Middleware para parsear cookies
app.use(cookieParser());

// Middleware CSRF
const csrfProtection = csrf({ cookie: true });
app.use(csrfProtection);

// Deshabilitar caché de sesiones
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
});

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

// Ruta principal: redirigir a login o dashboard
app.get("/", (req, res) => {
  if (req.isAuthenticated()) {
    res.redirect("/dashboard");
  } else {
    res.redirect("/login");
  }
});

// Importar y usar las rutas
const authRoutes = require("./routes/auth");
const taskRoutes = require("./routes/tasks");

app.use("/", authRoutes);
app.use("/", taskRoutes);

// Iniciar el servidor en el puerto 4000
app.listen(4000, () => {
  console.log("Servidor corriendo en http://localhost:4000");
});
