import { Component } from '@angular/core';
import { AuthService } from '../auth.service'; // Ajusta la ruta si es necesario
import { Router } from '@angular/router';
import { Roles } from '../roles';
import { NotificationService } from '../notificacion.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {


  correo: string = '';
  cedula: string = '';
  error: string = '';

  constructor(private authService: AuthService, private router: Router, private notificationService: NotificationService) { }

iniciarSesion() {
  if (!this.correo || !this.cedula) {
    this.notificationService.showWarningReport(
      'Campos incompletos',
      'Por favor ingresa los campos requeridos para iniciar sesión.',
      'Entendido'
    );
    return;
  }

  this.notificationService.showLoading('Iniciando sesión...');

  this.authService.login(this.correo, this.cedula).subscribe({
    next: (respuesta) => {
      this.notificationService.hideLoading();

      const token = respuesta.token;
      this.authService.guardarToken(token);

      const rol = this.authService.ObtenerIdRol();

      if (rol === 13) {
        this.router.navigate(['/inicio/bienvenida']);
      } else if (rol === 17) {
        this.router.navigate(['/inicio/bienvenida']);
      } else if (rol === 14) {
        this.router.navigate(['/inicio/bienvenida']);
      } else if (rol === 15) {
        this.router.navigate(['/inicio/bienvenida']);
      } else if (rol === 12) {
        this.router.navigate(['/inicio/bienvenida']);
      } else if (rol === 18) {
        this.router.navigate(['/inicio/bienvenida']);
      } else {
        this.notificationService.showWarningReport(
          'Rol no autorizado',
          'Tu rol no tiene acceso a esta plataforma.',
          'Entendido'
        );
      }
    },
    error: (err) => {
      this.notificationService.hideLoading();
      const mensaje = err?.error?.mensaje || 'Ocurrió un error inesperado';
      this.notificationService.showError(mensaje);
    }
  });
}




}
