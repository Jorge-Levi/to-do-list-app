// Función para alternar el modo de edición
const editButtons = document.querySelectorAll('.btn-edit');

editButtons.forEach(button => {
  button.addEventListener('click', () => {
    const taskId = button.getAttribute('data-task-id');
    toggleEditForm(taskId);
  });
});

function toggleEditForm(taskId) {
  const form = document.getElementById("update-form-" + taskId);
  const taskText = document.getElementById("task-text-" + taskId);

  if (form.style.display === "none") {
    form.style.display = "inline-flex";  // Mostrar el formulario de edición
    taskText.style.display = "none";  // Ocultar el texto de la tarea
  } else {
    form.style.display = "none";  // Ocultar el formulario de edición
    taskText.style.display = "inline";  // Mostrar el texto de la tarea
  }
}
