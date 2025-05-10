export function showToast(message = '', type = 'info') {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  
  if (type === 'error') {
    toast.style.backgroundColor = '#e74c3c'; // merah
  } else if (type === 'success') {
    toast.style.backgroundColor = '#27ae60'; // hijau
  }

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}
