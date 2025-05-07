import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-principal',
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.css'
})
export class PrincipalComponent implements OnInit {

  sidebarOpen = true;

  nombreUsuario: string = '';
  apellidoUsuario: string = '';

  constructor(private usuarioService: AuthService, private router:Router) {}
  ngOnInit(): void {
    this.ObtenerNombreUsuario();
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  ObtenerNombreUsuario() {
    const idUsuario = this.usuarioService.ObtenerIdToken();
    console.log('ID de usuario:', idUsuario); // Verifica si el ID se obtiene correctamente
    if (!idUsuario) {
      console.error('No se pudo obtener el ID del usuario del token');
      return;
    }
    this.usuarioService.getUsuarioById(idUsuario).subscribe({
      next: (data) => {
        this.nombreUsuario = data.NOMBRES_USUARIOS.toUpperCase();
        this.apellidoUsuario = data.APELLIDOS_USUARIOS.toUpperCase();
      },
      error: (err) => {
        console.error('Error al obtener el nombre', err);
      }
    });
  }

  ObtenerNombreRol(){
    const idRol = this.usuarioService.ObtenerIdRol();
    if (idRol == 1 || idRol == 17) {
      return "ADMINISTRADOR";
    } else if (idRol == 13) {
      return "SUPERADMINISTRADOR";
    } else if (idRol == 14) {
      return "ESTUDIANTE";
    } else if (idRol == 15) {
      return "DOCENTE";
    }
    return "ROL DESCONOCIDO";
  }

  isActive(path: string): boolean {
    return this.router.url === path;
  }
  esRutaGestionarAulas(): boolean {
    return this.router.url.startsWith('/inicio/gestionar-aulas') || this.router.url.startsWith('/inicio/editar-aula');
  }

  CerrarSesion() {
    this.usuarioService.cerrarSesion();
    this.router.navigate(['/login']);
  }

}
