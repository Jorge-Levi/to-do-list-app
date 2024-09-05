// Función para manejar la edición de tareas
function toggleEdit(taskId) {
    const form = document.getElementById("update-form-" + taskId);
    const taskText = document.getElementById("task-text-" + taskId);
  
    const formDisplay = window.getComputedStyle(form).display; // Detectar visibilidad actual del formulario
  
    if (formDisplay === "none") {
      form.style.display = "inline";  // Mostrar el formulario
      taskText.style.display = "none"; // Ocultar el texto original
    } else {
      form.style.display = "none";    // Ocultar el formulario
      taskText.style.display = "inline"; // Mostrar el texto original
    }
  }
  
  // Asignar eventos a todos los botones de editar cuando se cargue la página
  document.addEventListener("DOMContentLoaded", function() {
    const editButtons = document.querySelectorAll(".btn-edit");
  
    editButtons.forEach((button) => {
      button.addEventListener("click", function() {
        const taskId = button.getAttribute("data-task-id");
        toggleEdit(taskId);
      });
    });
  });
  