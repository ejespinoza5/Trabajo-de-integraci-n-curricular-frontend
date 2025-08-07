import { Component, EventEmitter, Input, OnInit, Output, ChangeDetectorRef } from '@angular/core';
import { AuthService } from '../auth.service';
import { Router, NavigationStart } from '@angular/router';
import { NotificationService } from '../notificacion.service';

@Component({
  selector: 'app-principal',
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.css'
})
export class PrincipalComponent implements OnInit {

  sidebarOpen = true;
  isDarkMode: boolean = false;
  isInicioPage: boolean = false;
  nombreUsuario: string = '';
  apellidoUsuario: string = '';
  mostrarMenuUsuario: boolean = false;
  isMobile: boolean = false;
  mobileMenuOpen: boolean = false;
  configMenuOpen: boolean = false;

  ObtenerAnioActual= new Date().getFullYear();

  constructor(public usuarioService: AuthService, private router:Router, private notificationService: NotificationService, private cdr: ChangeDetectorRef

  ) {
    // Cierra el menú al navegar y controla el sidebar en inicio
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.mostrarMenuUsuario = false;
      }
      // Verificar en cada evento de navegación
      this.checkInicioPage();
    });
  }
  ngOnInit(): void {
    this.ObtenerNombreUsuario();
    this.loadDarkModePreference();
    this.checkMobileScreen();

    // Verificar estado inicial con un pequeño delay para asegurar que la URL esté disponible
    setTimeout(() => {
      this.checkInicioPage();
    }, 100);

    // Escuchar cambios en el tamaño de la ventana
    window.addEventListener('resize', () => {
      this.checkMobileScreen();
    });

    // Cerrar menús al hacer clic fuera de ellos
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.config-menu-container')) {
        this.closeConfigMenu();
      }
      if (!target.closest('.mobile-menu-container')) {
        this.closeMobileMenu();
      }
    });
  }


  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  checkInicioPage() {
    const currentUrl = this.router.url;
    const wasInicioPage = this.isInicioPage;

    this.isInicioPage = currentUrl === '/inicio/bienvenida';

    // Si estamos en la página de inicio, ocultar el sidebar automáticamente
    if (this.isInicioPage) {
      this.sidebarOpen = false;
    }

    // Forzar detección de cambios si el estado cambió
    if (wasInicioPage !== this.isInicioPage) {
      this.cdr.detectChanges();
    }

  }

  ObtenerNombreUsuario() {
    const idRol = this.usuarioService.ObtenerIdRol();
    const idUsuario = this.usuarioService.ObtenerIdToken();
    if (idRol == 17 || idRol == 1) {
      if (!idUsuario) {
        return;
      }
      this.usuarioService.getCoordinadorById(idUsuario).subscribe({
        next: (data) => {
          this.nombreUsuario = data.NOMBRE_COORDINADOR.toUpperCase();
          this.apellidoUsuario = data.APELLIDO_COORDINADOR.toUpperCase();
        },
        error: (err) => {
        }
      });
    } else {
      if (!idUsuario) {
        return;
      }
      this.usuarioService.getUsuarioById(idUsuario).subscribe({
        next: (data) => {
          this.nombreUsuario = data.NOMBRES_USUARIOS.toUpperCase();
          this.apellidoUsuario = data.APELLIDOS_USUARIOS.toUpperCase();
        },
        error: (err) => {
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
    } else if (idRol == 18) {
      return "VICERRECTOR";
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



      // Limpiar datos locales manualmente en caso de error del servicio
      this.limpiarDatosLocales();

      // Redirigir de todas formas por seguridad
      this.redirigirALogin();
    }

  } catch (error) {
    this.redirigirALogin();
  }
}

private redirigirALogin() {
  window.location.href = 'https://horarios.istla-sigala.edu.ec/';
}



private limpiarDatosLocales() {
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch (error) {
  }
}

toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    this.applyDarkMode();
    this.saveDarkModePreference();

  }

   private applyDarkMode(): void {
    if (this.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  private saveDarkModePreference(): void {
    localStorage.setItem('darkMode', this.isDarkMode.toString());
  }

  // Cargar preferencia guardada
  private loadDarkModePreference(): void {
    const savedPreference = localStorage.getItem('darkMode');
    if (savedPreference !== null) {
      this.isDarkMode = savedPreference === 'true';
    } else {
      // Detectar preferencia del sistema
      this.isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    this.applyDarkMode();
  }

  cerrarMenuUsuario() {
    this.mostrarMenuUsuario = false;
  }

  // Métodos para manejo del menú móvil
  checkMobileScreen(): void {
    this.isMobile = window.innerWidth < 1024; // lg breakpoint de Tailwind
    if (this.isMobile) {
      this.sidebarOpen = false; // Cerrar sidebar en móviles
    }
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  // Métodos para manejo del menú de configuración
  toggleConfigMenu(): void {
    this.configMenuOpen = !this.configMenuOpen;
  }

  closeConfigMenu(): void {
    this.configMenuOpen = false;
  }

}
