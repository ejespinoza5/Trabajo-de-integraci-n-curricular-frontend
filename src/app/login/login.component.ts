import { Component } from '@angular/core';
import { AuthService } from '../auth.service'; // Ajusta la ruta si es necesario
import { Router } from '@angular/router';

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
        this.router.navigate(['/inicio']);
      },
      error: (err) => {
        this.error = 'Correo o contraseña incorrectos';
        console.error(err);
      }
    });
  }
}
