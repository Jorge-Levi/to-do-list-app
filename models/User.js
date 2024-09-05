const mongoose = require("mongoose");

// Definir el esquema del Usuario
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

// Exportar el modelo de Usuario
const User = mongoose.model("User", UserSchema);
module.exports = User;
