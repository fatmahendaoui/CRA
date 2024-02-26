import swal from 'sweetalert2';

const displayAlert = (
  title: string,
  text: string,
  confirmButtonText: string,
  icon: 'success' | 'error' | 'warning' | 'info' | 'question',
  footer?: string,
): void => {
  swal.fire({
    customClass: {
      popup: 'border-radius-40',
      footer:'borderbutton'
    },
    title,
    text,
    icon,
    confirmButtonText,
    footer,
    confirmButtonColor: '#E11D74'
  });
};

export const displayLoading = (
  title: string,
  text: string,
): void => {
  swal.fire({
    title,
    customClass: {
      popup: 'border-radius-40',
      footer:'borderbutton'
    },
    text,
    showConfirmButton: false,
    allowOutsideClick: false,
    allowEscapeKey: false,
    allowEnterKey: false,
    backdrop: true,
  });
};

export const handleResponseSuccessWithAlerts = (
  title: string,
  message: string,
  close: string,
  bootstrap: () => void = () => { },
  footer?: string,
) => {
  bootstrap();
  displayAlert(
    title,
    message,
    close,
    'success',
    footer,
  );
};

export const handleResponseErrorWithAlerts = (
  title: string,
  message: string,
  close: string,
  footer?: string,
): void => {
  displayAlert(
    title,
    message,
    close,
    'error',
    footer,
  );
};

export const displayConfirmationAlert = (
  title: string,
  confirmButtonText: string,
  cancelButtonText: string,
) => {
  return swal.fire({
    title,
    customClass: {
      popup: 'border-radius-40',
      footer:'borderbutton'
    },
    icon: 'info',
    iconColor: '#EF4064',
    showCancelButton: true,
    confirmButtonColor: '#E11D74',
    cancelButtonColor: '#d33',
    confirmButtonText,
    cancelButtonText,
  });
}
export const displayAlertwarning = (
  title: string,
  confirmButtonText: string,
  text:string
) => {
  return swal.fire({
    title,
    customClass: {
      popup: 'border-radius-40',
      footer:'borderbutton'
    },
    icon: 'warning',
    iconColor: '#EF4064',
    showCancelButton: false,
    confirmButtonColor: '#E11D74',
    confirmButtonText,
    text
  });
}
export const handleResponseWithAlerts = (
  title: string,
  message: string,
  close: string,
  bootstrap: () => void = () => { },
  footer?: string,
) => {
  bootstrap();
  displayAlert(
    title,
    message,
    close,
    'error',
    footer,
  );
};


export const closeDialogs = swal.close;
