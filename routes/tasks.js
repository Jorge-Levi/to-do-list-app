const express = require("express");
const { body, validationResult } = require("express-validator"); // Importamos express-validator
const Task = require("../models/Task");
const { ensureAuthenticated } = require("../middleware/auth");
const router = express.Router();

// Mostrar las tareas del usuario autenticado con el token CSRF
router.get("/dashboard", ensureAuthenticated, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user._id });
    res.render("dashboard", { user: req.user, tasks, csrfToken: req.csrfToken() });
  } catch (err) {
    res.status(500).send("Error al cargar las tareas");
  }
});

// Crear nueva tarea con validación
router.post(
  "/task",
  ensureAuthenticated,
  [
    body("task")
      .trim()
      .notEmpty().withMessage("El campo de la tarea no puede estar vacío."),
  ],
  async (req, res) => {
    const { task } = req.body;

    // Manejo de errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      try {
        const tasks = await Task.find({ userId: req.user._id }); // Cargamos las tareas existentes
        return res.render("dashboard", {
          user: req.user,
          tasks,
          errors: errors.array(),
        });
      } catch (err) {
        return res.status(500).send("Error al cargar las tareas para mostrar los errores.");
      }
    }

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
  }
);

// Actualizar el estado de una tarea (completada o no)
router.post("/task/update/:id", ensureAuthenticated, async (req, res) => {
  const taskId = req.params.id;
  const isCompleted = req.body.completed === "true";

  try {
    await Task.findByIdAndUpdate(taskId, { completed: isCompleted });
    res.redirect("/dashboard");
  } catch (err) {
    res.status(500).send("Error al actualizar la tarea.");
  }
});

// Ruta para eliminar una tarea
router.post("/task/delete", ensureAuthenticated, async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.body.id);
    res.redirect("/dashboard");
  } catch (err) {
    res.status(500).send("Error al eliminar la tarea.");
  }
});

// Ruta para actualizar el texto de una tarea con validación
router.post(
  "/task/update-text/:id",
  ensureAuthenticated,
  [
    body("task")
      .trim()
      .notEmpty().withMessage("El texto de la tarea no puede estar vacío."),
  ],
  async (req, res) => {
    const taskId = req.params.id;
    const updatedTask = req.body.task;

    // Manejo de errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      try {
        const tasks = await Task.find({ userId: req.user._id }); // Cargamos las tareas existentes
        return res.render("dashboard", {
          user: req.user,
          tasks,
          errors: errors.array(),
        });
      } catch (err) {
        return res.status(500).send("Error al cargar las tareas para mostrar los errores.");
      }
    }

    try {
      await Task.findByIdAndUpdate(taskId, { task: updatedTask });
      res.redirect("/dashboard");
    } catch (err) {
      res.status(500).send("Error al actualizar la tarea.");
    }
  }
);

module.exports = router;
