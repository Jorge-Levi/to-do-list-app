const express = require("express");
const Task = require("../models/Task");
const { ensureAuthenticated } = require("../middleware/auth");
const router = express.Router();


// Middleware para deshabilitar el almacenamiento en caché
function noCache(req, res, next) {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.set("Pragma", "no-cache");
  res.set("Expires", "-1");
  next();
}

// Mostrar las tareas del usuario autenticado
router.get("/dashboard", ensureAuthenticated, noCache, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user._id });
    res.render("dashboard", { user: req.user, tasks });
  } catch (err) {
    res.status(500).send("Error al cargar las tareas");
  }
});


// Crear nueva tarea
router.post("/task", ensureAuthenticated, async (req, res) => {
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

// Ruta para actualizar el texto de una tarea
router.post("/task/update-text/:id", ensureAuthenticated, async (req, res) => {
  const taskId = req.params.id;
  const updatedTask = req.body.task;

  try {
    await Task.findByIdAndUpdate(taskId, { task: updatedTask });
    res.redirect("/dashboard");
  } catch (err) {
    res.status(500).send("Error al actualizar la tarea.");
  }
});

module.exports = router;
