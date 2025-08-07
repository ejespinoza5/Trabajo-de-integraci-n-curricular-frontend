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
        this.animarEstadisticas();
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
        roles: ['SUPERADMINISTRADOR', 'COORDINADOR', 'ADMINISTRADOR','VICERRECTOR']
      },
      {
        titulo: 'Ver Horarios',
        descripcion: 'Visualizar horarios académicos',
        ruta: '/inicio/ver-horario',
        icono: 'calendar',
        roles: ['COORDINADOR', 'SUPERADMINISTRADOR', 'ADMINISTRADOR','VICERRECTOR']
      },
      {
        titulo: 'Ver Horarios Docentes',
        descripcion: 'Visualizar horarios de docentes',
        ruta: '/inicio/ver-horario-docente',
        icono: 'teaching',
        roles: ['SUPERADMINISTRADOR', 'COORDINADOR', 'ADMINISTRADOR','VICERRECTOR']
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

  // Variables para los valores animados
  aulasAnimado = 0;
  coordinadoresAnimado = 0;
  docentesAnimado = 0;
  asignaturasAnimado = 0;
  carrerasAnimado = 0;

  // Llama a esta función después de cargar dashboardData
  animarEstadisticas() {
    if (!this.dashboardData || !this.dashboardData.estadisticas) return;

    // Pequeño delay para que se vea mejor la animación
    setTimeout(() => {
      this.animarContador('aulasAnimado', this.dashboardData.estadisticas.aulas);
    }, 100);

    setTimeout(() => {
      this.animarContador('coordinadoresAnimado', this.dashboardData.estadisticas.coordinadores);
    }, 200);

    setTimeout(() => {
      this.animarContador('docentesAnimado', this.dashboardData.estadisticas.docentes);
    }, 300);

    setTimeout(() => {
      this.animarContador('asignaturasAnimado', this.dashboardData.estadisticas.asignaturas);
    }, 400);

    setTimeout(() => {
      this.animarContador('carrerasAnimado', this.dashboardData.estadisticas.carreras);
    }, 500);
  }

  animarContador(prop: string, valorFinal: number, duracion: number = 2000) {
    (this as any)[prop] = 0;
    if (valorFinal === 0) return;

    const inicio = Date.now();
    const animacion = () => {
      const tiempoTranscurrido = Date.now() - inicio;
      const progreso = Math.min(tiempoTranscurrido / duracion, 1);

      // Función de easing para que la animación sea más suave (ease-out)
      const valorEased = 1 - Math.pow(1 - progreso, 3);
      const valorActual = Math.round(valorEased * valorFinal);

      (this as any)[prop] = valorActual;

      if (progreso < 1) {
        requestAnimationFrame(animacion);
      } else {
        (this as any)[prop] = valorFinal;
      }
    };

    requestAnimationFrame(animacion);
  }


}
