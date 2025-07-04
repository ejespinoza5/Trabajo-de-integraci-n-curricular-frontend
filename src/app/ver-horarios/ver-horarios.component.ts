import { Component, OnInit } from '@angular/core';
import { Periodo, VerHorariosService } from '../ver-horarios.service';
import { CalendarOptions, EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import { AuthService } from '../auth.service';
import { NotificationService } from '../notificacion.service';

@Component({
  selector: 'app-ver-horarios',
  templateUrl: './ver-horarios.component.html',
  styleUrl: './ver-horarios.component.css'
})
export class VerHorariosComponent implements OnInit {
  PeriodoSeleccionado: number = 0;
  CarreraSeleccionada: number = 0;
  CursoSeleccionado: number = 0;
  periodos: Periodo[] = [];
  carreras: any[] = [];
  cursos: any[] = [];
  estados: string[] = ['PENDIENTE', 'APROBADO', 'NO APROBADO'];
  estadoGeneral: string = '';
  mensajeExito: string = '';

  horariosFiltrados: any[] = [];
  materiasUnicas: any[] = [];
  coloresMaterias: { [id: number]: string } = {};
  mensajeError: string = '';

  // Variables para el modal
  mostrarModal: boolean = false;
  horarioSeleccionado: any = null;

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'timeGridWeek',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek'
    },
    weekends: true,
    allDaySlot: false,
    slotMinTime: '07:00:00',
    slotMaxTime: '19:00:00',
    height: 'auto',
    locales: [esLocale],
    locale: 'es',
    events: [],
    slotLabelFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    },
    buttonText: {
      today: 'Hoy',
      month: 'Mes',
      week: 'Semana',
      day: 'Día'
    },
    eventDataTransform: (event) => {
      return event;
    },
    // Eliminamos el callback datesSet que causaba el problema
    eventDidMount: (info) => {
      if (info.event.extendedProps['asignaturaId']) {
        info.el.style.backgroundColor = this.getColorMateria(info.event.extendedProps['asignaturaId']);
      }
    },
    eventClick: (clickInfo: EventClickArg) => {
      this.abrirModalDetalleHorario(clickInfo.event.extendedProps['horarioId']);
    }
  };

  constructor(private verHorariosService: VerHorariosService, public usuarioService: AuthService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.cargarPeriodos();
  }

  cargarPeriodos(): void {
    this.verHorariosService.obtenerPeriodos().subscribe({
      next: (data) => {
        this.periodos = data;
        if (this.periodos.length > 0) {
          this.PeriodoSeleccionado = this.periodos[this.periodos.length - 1].id;
          this.onPeriodoChange(this.PeriodoSeleccionado);
        }
      },
      error: (err) => {
        console.error('Error al cargar periodos:', err);
        this.mensajeError = 'Error al cargar los periodos';
      }
    });
  }

  onPeriodoChange(idPeriodo: number): void {
    if (!idPeriodo) {
      this.carreras = [];
      this.cursos = [];
      this.CarreraSeleccionada = 0;
      this.CursoSeleccionado = 0;
      return;
    }

    this.verHorariosService.obtenerCarrerasPorPeriodo(idPeriodo).subscribe({
      next: (data) => {
        this.carreras = data;
        this.cursos = [];
        this.CarreraSeleccionada = 0;
        this.CursoSeleccionado = 0;
        this.limpiarCalendario();
      },
      error: (err) => {
        console.error('Error al cargar carreras:', err);
        this.mensajeError = 'Error al cargar las carreras';
      }
    });
  }

  onCarreraChange(): void {
    if (this.PeriodoSeleccionado && this.CarreraSeleccionada) {
      this.cargarCursos();
    } else {
      this.cursos = [];
      this.CursoSeleccionado = 0;
      this.limpiarCalendario();
      this.estadoGeneral = '';
    }
  }

  obtenerEstadoGeneral(horarios: any[]): string {
    const estados = horarios.map(h => h.estado);

    const todosAprobados = estados.every(e => e === 'APROBADO');
    const todosNoAprobados = estados.every(e => e === 'NO APROBADO');

    if (todosAprobados) return 'APROBADO';
    if (todosNoAprobados) return 'NO APROBADO';

    return 'PENDIENTE';
  }

  cargarCursos(): void {
    if (this.PeriodoSeleccionado && this.CarreraSeleccionada) {
      this.verHorariosService
        .obtenerCursosPorPeriodoYCarrera(this.PeriodoSeleccionado, this.CarreraSeleccionada)
        .subscribe({
          next: (data) => {
            this.cursos = data;
            this.CursoSeleccionado = 0;
            this.limpiarCalendario();
          },
          error: (err) => {
            console.error('Error al cargar cursos:', err);
            this.mensajeError = 'Error al cargar los cursos';
          }
        });
    }
  }

  onCursoChange(): void {
    if (this.PeriodoSeleccionado && this.CarreraSeleccionada && this.CursoSeleccionado) {
      this.cargarHorarios();
    } else {
      this.limpiarCalendario();
    }
  }

 actualizarEstado(): void {
  if (this.PeriodoSeleccionado && this.CarreraSeleccionada && this.CursoSeleccionado && this.estadoGeneral) {
    this.notificationService.showLoading('Actualizando estado...');

    this.verHorariosService.editarEstado(
      this.PeriodoSeleccionado,
      this.CarreraSeleccionada,
      this.CursoSeleccionado,
      this.estadoGeneral
    ).subscribe({
      next: (response) => {
        this.notificationService.hideLoading();
        this.notificationService.showSuccess(response.mensaje || 'Estado actualizado correctamente');
      },
      error: (err) => {
        this.notificationService.hideLoading();
        const mensaje = err?.error?.message || 'Error al actualizar el estado';
        this.notificationService.showError(mensaje);
      }
    });
  } else {
    this.notificationService.showWarningReport(
      'Filtros incompletos',
      'Por favor, selecciona el periodo, la carrera, el curso y el estado antes de actualizar.',
      'Entendido'
    );
  }
}


  cargarHorarios(): void {
  if (this.PeriodoSeleccionado && this.CarreraSeleccionada && this.CursoSeleccionado) {
    this.mensajeError = '';
    this.notificationService.showLoading('Cargando horarios...');

    this.verHorariosService
      .obtenerHorariosPorPeriodoCarreraCurso(
        this.PeriodoSeleccionado,
        this.CarreraSeleccionada,
        this.CursoSeleccionado
      )
      .subscribe({
        next: (data: any[]) => {
          this.notificationService.hideLoading();

          this.horariosFiltrados = data;
          this.asignarColoresAMaterias();
          this.actualizarEventosCalendario();
          this.estadoGeneral = this.obtenerEstadoGeneral(this.horariosFiltrados);
        },
        error: (err) => {
          this.notificationService.hideLoading();
          console.error('Error al cargar los horarios:', err);
          this.mensajeError = 'Error al cargar los horarios';
          this.limpiarCalendario();
        }
      });
  }
}


  limpiarCalendario(): void {
    this.horariosFiltrados = [];
    this.materiasUnicas = [];
    this.coloresMaterias = {};
    this.contadorColores = 0;
    this.calendarOptions = {
      ...this.calendarOptions,
      events: []
    };
  }

  asignarColoresAMaterias(): void {
    this.materiasUnicas = [];
    this.coloresMaterias = {};
    this.contadorColores = 0;

    const materiasMap = new Map<number, string>();

    this.horariosFiltrados.forEach(horario => {
      const materia = horario.asignatura;
      if (!materiasMap.has(materia.id)) {
        materiasMap.set(materia.id, materia.nombre);
      }
    });

    Array.from(materiasMap, ([id, nombre]) => {
      if (!this.coloresMaterias[id]) {
        this.coloresMaterias[id] = this.generarColorAleatorio();
      }
      return { id, nombre };
    }).forEach(materia => {
      this.materiasUnicas.push(materia);
    });
  }

  private coloresDisponibles = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
    '#F59E0B', '#EF4444', '#10B981', '#8B5CF6', '#06B6D4'
  ];
  private contadorColores = 0;

  generarColorAleatorio(): string {
    const color = this.coloresDisponibles[this.contadorColores % this.coloresDisponibles.length];
    this.contadorColores++;
    return color;
  }

  getColorMateria(id: number): string {
    return this.coloresMaterias[id] || '#6B7280';
  }

  // MÉTODO CORREGIDO: Usar eventos recurrentes para evitar el corrimiento de días
  actualizarEventosCalendario(): void {
    if (this.horariosFiltrados.length > 0) {
      this.actualizarEventosCalendarioRecurrente();
    }
  }

// MÉTODO MODIFICADO: Usar eventos recurrentes con fechas específicas
actualizarEventosCalendarioRecurrente(): void {
  if (this.horariosFiltrados.length === 0) return;

  const eventos = this.horariosFiltrados.map(horario => {
    const diaSemana = this.obtenerDiaSemanaISO(horario.dia.nombre);

    // Convertir las fechas del horario a formato Date
    const fechaInicio = new Date(horario.fechaInicio);
    const fechaFin = new Date(horario.fechaFin);

    return {
      title: `${horario.asignatura.nombre}\n${horario.docente.nombre}\n${horario.aula.nombre}`,
      daysOfWeek: [diaSemana], // Usar daysOfWeek para eventos recurrentes
      startTime: horario.horaInicio,
      endTime: horario.horaFin,
      startRecur: fechaInicio.toISOString().split('T')[0], // Fecha de inicio de recurrencia
      endRecur: fechaFin.toISOString().split('T')[0], // Fecha de fin de recurrencia
      backgroundColor: this.getColorMateria(horario.asignatura.id),
      borderColor: this.getColorMateria(horario.asignatura.id),
      extendedProps: {
        horarioId: horario.id,
        asignaturaId: horario.asignatura.id,
        aula: horario.aula.nombre,
        docente: horario.docente.nombre,
        asignatura: horario.asignatura.nombre,
        fechaInicio: horario.fechaInicio,
        fechaFin: horario.fechaFin
      }
    };
  });

  this.calendarOptions = {
    ...this.calendarOptions,
    events: eventos
  };
}

  // NUEVO MÉTODO: Obtener día de la semana para FullCalendar (0=domingo, 1=lunes, etc.)
  obtenerDiaSemanaISO(nombreDia: string): number {
    const dias: { [key: string]: number } = {
      'Domingo': 0,
      'Lunes': 1,
      'Martes': 2,
      'Miércoles': 3,
      'Miercoles': 3,
      'Jueves': 4,
      'Viernes': 5,
      'Sábado': 6,
      'Sabado': 6
    };
    return dias[nombreDia] ?? 1;
  }

  // MÉTODOS MANTENIDOS PERO YA NO SE USAN (puedes eliminarlos si quieres)
  actualizarEventosParaSemanaActual(fechaReferencia: Date): void {
    // Este método ya no se usa con la nueva implementación
    console.warn('Este método ya no se usa. Se mantiene por compatibilidad.');
  }

  obtenerInicioSemana(fecha: Date): Date {
    const fechaCopia = new Date(fecha);
    const dia = fechaCopia.getDay();
    const diferencia = dia === 0 ? -6 : 1 - dia;
    fechaCopia.setDate(fechaCopia.getDate() + diferencia);
    return fechaCopia;
  }

  obtenerFechaParaDiaSemana(inicioSemana: Date, diaSemana: number): string {
    const fecha = new Date(inicioSemana);
    const diasAgregar = diaSemana === 0 ? 6 : diaSemana - 1;
    fecha.setDate(inicioSemana.getDate() + diasAgregar);
    return fecha.toISOString().split('T')[0];
  }

  obtenerDiaSemana(nombreDia: string): number {
    const dias: { [key: string]: number } = {
      'Domingo': 0,
      'Lunes': 1,
      'Martes': 2,
      'Miércoles': 3,
      'Miercoles': 3,
      'Jueves': 4,
      'Viernes': 5,
      'Sábado': 6,
      'Sabado': 6
    };
    return dias[nombreDia] ?? 1;
  }

  obtenerFechaProxima(diaSemana: number): string {
    const hoy = new Date();
    const diaActual = hoy.getDay();
    const diferencia = diaSemana === diaActual ? 0 : (diaSemana + 7 - diaActual) % 7;
    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() + diferencia);
    return fecha.toISOString().split('T')[0];
  }

  // Método mejorado para abrir el modal
  abrirModalDetalleHorario(horarioId: number): void {
    const horario = this.horariosFiltrados.find(h => h.id === horarioId);
    if (horario) {
      this.horarioSeleccionado = {
        id: horario.id,
        asignatura: horario.asignatura.nombre,
        docente: horario.docente.nombre,
        aula: horario.aula.nombre,
        dia: horario.dia.nombre,
        horaInicio: horario.horaInicio,
        horaFin: horario.horaFin,
        color: this.getColorMateria(horario.asignatura.id),
        codigo: horario.asignatura.codigo || 'N/A',
        creditos: horario.asignatura.creditos || 'N/A',
        carrera: horario.carrera.nombre,
        curso: horario.curso.nombre || 'N/A',
      };
      this.mostrarModal = true;
    }
  }

  // Método para cerrar el modal
  cerrarModal(): void {
    this.mostrarModal = false;
    this.horarioSeleccionado = null;
  }

  // Método para formatear la hora
  formatearHora(hora: string): string {
    if (!hora) return '';
    const [hours, minutes] = hora.split(':');
    return `${hours}:${minutes}`;
  }
}
