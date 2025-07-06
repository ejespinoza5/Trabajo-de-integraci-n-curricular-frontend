import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { NotificationService } from '../notificacion.service';

@Component({
  selector: 'app-principal',
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.css'
})
export class PrincipalComponent implements OnInit {

  sidebarOpen = true;

  nombreUsuario: string = '';
  apellidoUsuario: string = '';

  ObtenerAnioActual= new Date().getFullYear();

  constructor(public usuarioService: AuthService, private router:Router, private notificationService: NotificationService) {}
  ngOnInit(): void {
    this.ObtenerNombreUsuario();
  }


  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  ObtenerNombreUsuario() {
    const idRol = this.usuarioService.ObtenerIdRol();
    const idUsuario = this.usuarioService.ObtenerIdToken();
    if (idRol == 17 || idRol == 1) {
      console.log('ID de usuario:', idUsuario); // Verifica si el ID se obtiene correctamente
      if (!idUsuario) {
        console.error('No se pudo obtener el ID del usuario del token');
        return;
      }
      this.usuarioService.getCoordinadorById(idUsuario).subscribe({
        next: (data) => {
          this.nombreUsuario = data.NOMBRE_COORDINADOR.toUpperCase();
          this.apellidoUsuario = data.APELLIDO_COORDINADOR.toUpperCase();
        },
        error: (err) => {
          console.error('Error al obtener el nombre', err);
        }
      });
    } else {
      console.log('ID de usuario:', idUsuario);
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
  }

  ObtenerNombreRol(){
    const idRol = this.usuarioService.ObtenerIdRol();
    if (idRol == 1 || idRol == 17) {
      return "COORDINADOR";
    } else if (idRol == 13) {
      return "SUPERADMINISTRADOR";
    } else if (idRol == 14) {
      return "ESTUDIANTE";
    } else if (idRol == 15) {
      return "DOCENTE";
    } else if (idRol == 12) {
      return "ADMINISTRADOR";
    }
    return "ROL DESCONOCIDO";
  }

  isActive(path: string): boolean {
    return this.router.url === path;
  }
  esRutaGestionarAulas(): boolean {
    return this.router.url.startsWith('/inicio/gestionar-aulas') || this.router.url.startsWith('/inicio/editar-aula');
  }


async CerrarSesion() {
  try {
    // Mostrar diálogo de confirmación
    const confirmed = await this.notificationService.showConfirm(
      'Confirmar Cierre de Sesión',
      '¿Estás seguro de que deseas cerrar la sesión?',
      'Cerrar Sesión',
      'Cancelar'
    );

    if (!confirmed) {
      return; // Usuario canceló, salir de la función
    }

    // Usuario confirmó el cierre de sesión
    this.notificationService.showLoading('Cerrando sesión...');

    try {
      // Llamar al servicio de cierre de sesión y esperar a que termine
      await this.usuarioService.cerrarSesion();

      // Ocultar loading
      this.notificationService.hideLoading();



      // Redirigir inmediatamente después del mensaje
      this.redirigirALogin();

    } catch (error) {
      this.notificationService.hideLoading();
      console.error('Error al cerrar sesión:', error);



      // Limpiar datos locales manualmente en caso de error del servicio
      this.limpiarDatosLocales();

      // Redirigir de todas formas por seguridad
      this.redirigirALogin();
    }

  } catch (error) {
    console.error('Error en el diálogo de confirmación:', error);
    this.redirigirALogin();
  }
}

private redirigirALogin() {
  if (this.router) {
    this.router.navigate(['/login']).then(() => {
      window.location.reload();
    });
  } else {
    window.location.replace('/login');
  }
}


private limpiarDatosLocales() {
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch (error) {
    console.error('Error limpiando datos locales:', error);
  }
}

}
