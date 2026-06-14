import Swal from 'sweetalert2';

export function toastSuccess(message: string) {
  Swal.fire({
    icon: 'success',
    title: message,
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true,
  });
}

export function toastError(message: string) {
  Swal.fire({
    icon: 'error',
    title: message,
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 4000,
    timerProgressBar: true,
  });
}

export function toastInfo(message: string) {
  Swal.fire({
    icon: 'info',
    title: message,
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 2500,
  });
}

export function confirmAction(title: string, text: string) {
  return Swal.fire({
    title,
    text,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sí',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#ef4444',
  });
}

export function showSessionExpired() {
  Swal.fire({
    icon: 'warning',
    title: 'Sesión expirada',
    text: 'Tu sesión ha expirado. Serás redirigido al inicio de sesión.',
    confirmButtonText: 'Ok',
    allowOutsideClick: false,
  });
}
