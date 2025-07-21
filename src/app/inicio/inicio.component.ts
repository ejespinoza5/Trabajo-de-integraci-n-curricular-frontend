import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { NotificationService } from '../notificacion.service';

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css'
})
export class InicioComponent implements OnInit {
  dashboardData: any = null;
   loading: boolean = true;
  error: string = '';
constructor(public usuarioService: AuthService, private router:Router, private notificationService: NotificationService){}
ngOnInit(): void {
  this.cargarDashboard();
}

  cargarDashboard(): void {
    this.usuarioService.dashboard().subscribe({
      next: (data) => {
        this.dashboardData = data;
        this.loading = false;
        if (!this.dashboardData || Object.keys(this.dashboardData).length === 0) {
          this.error = 'No se encontraron datos para mostrar en el dashboard.';
          this.notificationService.showWarning(this.error);
        }
      },
      error: (error) => {
        this.notificationService.showError('Error al cargar el dashboard');
      }
    });
  }
// Función para navegar a las rutas
  navegarA(ruta: string): void {
    this.router.navigate([ruta]);
  }

  // Función para verificar si el usuario tiene los roles necesarios
  tieneAcceso(roles: string[]): boolean {
    return this.usuarioService.tieneRol(roles);
  }

  // Obtener las opciones del menú según el rol del usuario
  obtenerOpcionesMenu(): any[] {
    const opciones = [
      {
        titulo: 'Gestionar Aulas',
        descripcion: 'Administrar aulas del sistema',
        ruta: '/inicio/gestionar-aulas',
        icono: 'building',
        roles: ['SUPERADMINISTRADOR', 'ADMINISTRADOR']
      },
      {
        titulo: 'Coordinadores',
        descripcion: 'Gestionar coordinadores',
        ruta: '/inicio/coordinadores',
        icono: 'users',
        roles: ['SUPERADMINISTRADOR', 'ADMINISTRADOR']
      },
      {
        titulo: 'Generar Horarios',
        descripcion: 'Crear nuevos horarios académicos',
        ruta: '/inicio/generar-horario',
        icono: 'calendar',
        roles: ['COORDINADOR', 'SUPERADMINISTRADOR', 'ADMINISTRADOR']
      },
      {
        titulo: 'Generar Reportes',
        descripcion: 'Crear reportes del sistema',
        ruta: '/inicio/generar-reporte',
        icono: 'chart',
        roles: ['SUPERADMINISTRADOR', 'COORDINADOR', 'ADMINISTRADOR']
      },
      {
        titulo: 'Ver Horarios',
        descripcion: 'Visualizar horarios académicos',
        ruta: '/inicio/ver-horario',
        icono: 'calendar',
        roles: ['COORDINADOR', 'SUPERADMINISTRADOR', 'ADMINISTRADOR']
      },
      {
        titulo: 'Ver Horarios Docentes',
        descripcion: 'Visualizar horarios de docentes',
        ruta: '/inicio/ver-horario-docente',
        icono: 'teaching',
        roles: ['SUPERADMINISTRADOR', 'COORDINADOR', 'ADMINISTRADOR']
      },
      {
        titulo: 'Mi Horario',
        descripcion: 'Ver mi horario personal',
        ruta: '/inicio/mi-horario',
        icono: 'schedule',
        roles: ['ESTUDIANTE']
      },
      {
        titulo: 'Horario Docente',
        descripcion: 'Mi horario como docente',
        ruta: '/inicio/docente-horario',
        icono: 'teaching',
        roles: ['DOCENTE']
      }
    ];

    return opciones.filter(opcion => this.tieneAcceso(opcion.roles));
  }


}
