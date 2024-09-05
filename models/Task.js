const mongoose = require("mongoose");

// Definir el esquema de Tarea
const TaskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Relación con el modelo Usuario
    required: true,
  },
  task: {
    type: String,
    required: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

// Exportar el modelo de Tarea
const Task = mongoose.model("Task", TaskSchema);
module.exports = Task;
