import { Component } from '@angular/core';
import { AuthService } from '../auth.service'; // Ajusta la ruta si es necesario
import { Router } from '@angular/router';
import { Roles } from '../roles';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {


  correo: string = '';
  cedula: string = '';
  error: string = '';

  constructor(private authService: AuthService, private router: Router) { }

iniciarSesion() {
  this.authService.login(this.correo, this.cedula).subscribe({
    next: (respuesta) => {
      const token = respuesta.token;
      this.authService.guardarToken(token);

      const rol = this.authService.ObtenerIdRol();

      if (rol === 13) {
        this.router.navigate(['/inicio/gestionar-aulas']);
      } else if (rol === 17) {
        this.router.navigate(['/inicio/generar-horario']);
      } else if (rol === 14) {
        this.router.navigate(['/inicio/mi-horario']);
      } else if (rol === 15) {
        this.router.navigate(['/inicio/docente-horario']);
      } else {
        this.error = 'Rol no autorizado';
      }
    },
    error: (err) => {
      this.error = err.error?.mensaje || 'Ocurrió un error inesperado';
      console.error(err);
    }
  });
}



}
