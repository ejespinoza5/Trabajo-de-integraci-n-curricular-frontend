import { Injectable } from '@angular/core';
import { Notify, Report, Confirm, Loading } from 'notiflix';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor() {
    // Configuración global de Notiflix
    this.initializeNotiflix();
  }

  private initializeNotiflix() {
    // Configuración de Notify (Toasts)
    Notify.init({
      width: '300px',
      position: 'right-top',
      distance: '10px',
      opacity: 1,
      borderRadius: '8px',
      rtl: false,
      timeout: 3000,
      messageMaxLength: 110,
      backOverlay: false,
      clickToClose: true,
      pauseOnHover: true,

      // Estilos para Success
      success: {
        background: '#32c682',
        textColor: '#fff',
        childClassName: 'notiflix-notify-success',
        notiflixIconColor: 'rgba(0,0,0,0.2)',
        fontAwesomeClassName: 'fas fa-check-circle',
        fontAwesomeIconColor: 'rgba(0,0,0,0.2)',
        backOverlayColor: 'rgba(50,198,130,0.2)',
      },

      // Estilos para Error
      failure: {
        background: '#ff5549',
        textColor: '#fff',
        childClassName: 'notiflix-notify-failure',
        notiflixIconColor: 'rgba(0,0,0,0.2)',
        fontAwesomeClassName: 'fas fa-times-circle',
        fontAwesomeIconColor: 'rgba(0,0,0,0.2)',
        backOverlayColor: 'rgba(255,85,73,0.2)',
      },

      // Estilos para Warning
      warning: {
        background: '#eebf31',
        textColor: '#fff',
        childClassName: 'notiflix-notify-warning',
        notiflixIconColor: 'rgba(0,0,0,0.2)',
        fontAwesomeClassName: 'fas fa-exclamation-circle',
        fontAwesomeIconColor: 'rgba(0,0,0,0.2)',
        backOverlayColor: 'rgba(238,191,49,0.2)',
      },

      // Estilos para Info
      info: {
        background: '#26c0d3',
        textColor: '#fff',
        childClassName: 'notiflix-notify-info',
        notiflixIconColor: 'rgba(0,0,0,0.2)',
        fontAwesomeClassName: 'fas fa-info-circle',
        fontAwesomeIconColor: 'rgba(0,0,0,0.2)',
        backOverlayColor: 'rgba(38,192,211,0.2)',
      },
    });

    // Configuración de Report (Diálogos)
    Report.init({
      className: 'notiflix-report',
      width: '320px',
      backgroundColor: '#f8f8f8',
      borderRadius: '25px',
      rtl: false,
      zindex: 4002,
      backOverlay: true,
      backOverlayColor: 'rgba(0,0,0,0.5)',
      backOverlayClickToClose: false,
      fontFamily: 'Quicksand',
      svgSize: '110px',
      plainText: true,
      titleFontSize: '16px',
      titleMaxLength: 34,
      messageFontSize: '13px',
      messageMaxLength: 400,
      buttonFontSize: '14px',
      buttonMaxLength: 34,
      cssAnimation: true,
      cssAnimationDuration: 360,
      cssAnimationStyle: 'fade',
    });

    // Configuración de Confirm (Confirmaciones)
    Confirm.init({
      className: 'notiflix-confirm',
      width: '300px',
      zindex: 4003,
      position: 'center',
      distance: '10px',
      backgroundColor: '#f8f8f8',
      borderRadius: '25px',
      backOverlay: true,
      backOverlayColor: 'rgba(0,0,0,0.5)',
      rtl: false,
      fontFamily: 'Quicksand',
      cssAnimation: true,
      cssAnimationStyle: 'fade',
      cssAnimationDuration: 300,
      plainText: true,
      titleColor: '#32c682',
      titleFontSize: '16px',
      messageColor: '#1e1e1e',
      messageFontSize: '14px',
      buttonsFontSize: '15px',
      okButtonColor: '#f8f8f8',
      okButtonBackground: '#32c682',
      cancelButtonColor: '#f8f8f8',
      cancelButtonBackground: '#a9a9a9',
    });

    // Configuración de Loading
    Loading.init({
      className: 'notiflix-loading',
      zindex: 4000,
      backgroundColor: 'rgba(0,0,0,0.8)',
      rtl: false,
      fontFamily: 'Quicksand',
      cssAnimation: true,
      cssAnimationDuration: 400,
      clickToClose: false,
      customSvgUrl: null,
      customSvgCode: null,
      svgSize: '80px',
      svgColor: '#32c682',
      messageID: 'NotiflixLoadingMessage',
      messageFontSize: '15px',
      messageMaxLength: 34,
      messageColor: '#dcdcdc',
    });
  }

  // MÉTODOS PARA NOTIFICACIONES (Toasts)
  showSuccess(message: string) {
    Notify.success(message);
  }

  showError(message: string) {
    Notify.failure(message);
  }

  showWarning(message: string) {
    Notify.warning(message);
  }

  showInfo(message: string) {
    Notify.info(message);
  }

  // MÉTODOS PARA REPORTES (Diálogos informativos)
  showSuccessReport(title: string, message: string, buttonText: string = 'Okay') {
    Report.success(title, message, buttonText);
  }

  showErrorReport(title: string, message: string, buttonText: string = 'Okay') {
    Report.failure(title, message, buttonText);
  }

  showWarningReport(title: string, message: string, buttonText: string = 'Okay') {
    Report.warning(title, message, buttonText);
  }

  showInfoReport(title: string, message: string, buttonText: string = 'Okay') {
    Report.info(title, message, buttonText);
  }

  // MÉTODOS PARA CONFIRMACIONES
  showConfirm(
    title: string,
    message: string,
    okButtonText: string = 'Sí',
    cancelButtonText: string = 'No'
  ): Promise<boolean> {
    return new Promise((resolve) => {
      Confirm.show(
        title,
        message,
        okButtonText,
        cancelButtonText,
        () => resolve(true),  // OK callback
        () => resolve(false), // Cancel callback
        {
          // Opciones adicionales si necesitas
        }
      );
    });
  }

  // MÉTODOS PARA LOADING
  showLoading(message?: string) {
    Loading.standard(message);
  }

  showLoadingWithMessage(message: string) {
    Loading.standard(message);
  }

  hideLoading() {
    Loading.remove();
  }

  // MÉTODO PARA MANEJAR ERRORES DEL BACKEND
  handleBackendError(error: any) {
    let errorMessage = 'Error desconocido';

    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    // Mostrar según el tipo de error
    if (error.status === 400) {
      this.showErrorReport('Error de Validación', errorMessage, 'Entendido');
    } else if (error.status === 401) {
      this.showErrorReport('Acceso Denegado', 'No tienes permisos para realizar esta acción', 'Entendido');
    } else if (error.status === 404) {
      this.showErrorReport('No Encontrado', 'El recurso solicitado no existe', 'Entendido');
    } else if (error.status === 500) {
      this.showErrorReport('Error del Servidor', errorMessage, 'Entendido');
    } else {
      this.showError(errorMessage);
    }
  }
}
