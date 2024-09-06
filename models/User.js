const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  loginAttempts: { type: Number, required: true, default: 0 },
  lockUntil: { type: Date }
});

// Método para verificar si la cuenta está bloqueada
UserSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Método para comparar contraseñas
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Método para incrementar los intentos fallidos
UserSchema.methods.incLoginAttempts = function() {
  // Si el bloqueo ya ha expirado, reiniciar los intentos
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  // Incrementar el número de intentos fallidos
  const updates = { $inc: { loginAttempts: 1 } };
  // Bloquear la cuenta si se alcanzan 5 intentos
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 1000 }; // Bloquear por 2 minutos
  }
  return this.updateOne(updates);
};

// Método para resetear los intentos fallidos después de un inicio de sesión exitoso
UserSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 }
  });
};

module.exports = mongoose.model('User', UserSchema);
