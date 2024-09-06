const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const User = require("../models/User");

module.exports = function (passport) {
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log(`[PASSPORT] Intentando autenticar al usuario: ${username}`);
        
        // Buscar al usuario por su nombre de usuario
        const user = await User.findOne({ username });
        if (!user) {
          console.log("[PASSPORT] Usuario no encontrado");
          return done(null, false, { message: "Usuario no encontrado" });
        }

        console.log("[PASSPORT] Usuario encontrado, verificando contraseña...");
        
        // Comparar la contraseña ingresada con la almacenada
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
          console.log("[PASSPORT] Contraseña correcta. Usuario autenticado.");
          return done(null, user);
        } else {
          console.log("[PASSPORT] Contraseña incorrecta.");
          return done(null, false, { message: "Contraseña incorrecta" });
        }
      } catch (err) {
        console.error("[PASSPORT] Error durante la autenticación:", err);
        return done(err);
      }
    })
  );

  // Serialización del usuario
  passport.serializeUser((user, done) => {
    console.log(`[PASSPORT] Serializando usuario con ID: ${user.id}`);
    done(null, user.id);
  });

  // Deserialización del usuario
  passport.deserializeUser(async (id, done) => {
    try {
      console.log(`[PASSPORT] Deserializando usuario con ID: ${id}`);
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      console.error("[PASSPORT] Error durante la deserialización:", err);
      done(err);
    }
  });
};
