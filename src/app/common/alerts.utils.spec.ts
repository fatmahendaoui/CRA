import swal from 'sweetalert2';
import { displayConfirmationAlert, displayLoading, handleResponseErrorWithAlerts, handleResponseSuccessWithAlerts } from "./alerts.utils";

describe('Alerts utils', () => {
  it('should display loading', () => {
    const fireSpyOn = spyOn(swal, 'fire');
    displayLoading('title', 'additional text');

    expect(fireSpyOn).toHaveBeenCalledWith({
      title: 'title',
      text: 'additional text',
      showConfirmButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
      allowEnterKey: false,
      backdrop: true
    } as any);
  });

  it('should display success alert', () => {
    const fireSpyOn = spyOn(swal, 'fire');
    handleResponseSuccessWithAlerts('title', 'additional text', 'close');

    expect(fireSpyOn).toHaveBeenCalledWith({
      title: 'title',
      text: 'additional text',
      icon: 'success',
      confirmButtonText: 'close'
    } as any);
  });

  it('should display error alert', () => {
    const fireSpyOn = spyOn(swal, 'fire');
    handleResponseErrorWithAlerts('title', 'additional text', 'close');

    expect(fireSpyOn).toHaveBeenCalledWith({
      title: 'title',
      text: 'additional text',
      icon: 'error',
      confirmButtonText: 'close'
    } as any);
  });

  it('should display confirmation alert', () => {
    const fireSpyOn = spyOn(swal, 'fire');
    displayConfirmationAlert('title', 'confirmation', 'cancel');

    expect(fireSpyOn).toHaveBeenCalledWith({
      title: 'title',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'confirmation',
      cancelButtonText: 'cancel',
    } as any);
  });
});


