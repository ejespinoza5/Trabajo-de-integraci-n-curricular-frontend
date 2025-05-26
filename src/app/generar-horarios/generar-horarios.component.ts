import { ChangeDetectorRef, Component, OnInit, ViewChild, NgZone } from '@angular/core';
import { HorariosService } from '../horarios.service';
import { AulasService } from '../aulas.service';
import { CalendarOptions, EventInput, EventClickArg, Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { FullCalendarComponent } from '@fullcalendar/angular';
import esLocale from '@fullcalendar/core/locales/es';
import { Subject } from 'rxjs';

interface HorarioResponse {
  id: number;
  success: boolean;
  message: string;
}

interface HorarioDetalle {
  id?: number;
  docente: { id: number; nombre: string; };
  asignatura: { id: number; nombre: string; };
  carrera: { id: number; nombre: string; };
  curso: { id: number; nombre: string; };
  aula: { id: number; nombre: string; };
  dia: { id: number; nombre: string; };
  horaInicio: string;
  horaFin: string;
}

@Component({
  selector: 'app-generar-horarios',
  templateUrl: './generar-horarios.component.html',
  styleUrl: './generar-horarios.component.css'
})
export class GenerarHorariosComponent implements OnInit {
  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;

  // Datos para formularios y filtros
  periodos: any[] = [];
  docentes: any[] = [];
  asignaturas: any[] = [];
  aulas: any[] = [];
  dias: any[] = [];
  carreras: any[] = [];
  niveles: any[] = [];

    docenteAsignaturaNivel: any[] = [];

  // Variables de selección
  PeriodoSeleccionado = 0;
   CombinacionSeleccionada: string = '0';
  DocenteSeleccionado = 0;
  AulaSeleccionada = 0;
  DiaSeleccionado = 0;
  CarreraSeleccionada = 0;
  NivelSeleccionado = 0;
  AsignaturaSeleccionada = 0;
  horaInicio = '';
  horaFin = '';
  mensajeError = '';

  // Variables para el modal
  modalVisible = false;
  horarioSeleccionado: HorarioDetalle | null = null;
  modoEdicion = false;
  editHoraInicio = '';
  editHoraFin = '';
  editAulaSeleccionada = 0;
  editDiaSeleccionado = 0;
  mensajeModal = '';
  tipoMensajeModal: 'error' | 'success' | '' = '';

  // Arrays de horarios
  todosLosHorarios: HorarioDetalle[] = [];
  horariosFiltrados: HorarioDetalle[] = [];
  coloresMateria: Map<number, string> = new Map();

  //Estado de acordeon
  isAccordionOpen: boolean = false;
  // Paleta de colores para las materias
  paletaColores: string[] = [
    '#FF9999', '#99FF99', '#9999FF', '#FFFF99', '#FF99FF', '#99FFFF', '#FFD699',
    '#E6C3C3', '#C3E6C3', '#C3C3E6', '#E6E6C3', '#E6C3E6', '#C3E6E6', '#E6D6C3',
    '#D6E6C3', '#C3D6E6', '#D6C3E6', '#E6C3D6', '#C3E6D6', '#FFB399', '#FFCC99',
    '#FFFF99', '#CCFF99', '#99FF99', '#99FFCC', '#99FFFF', '#99CCFF', '#9999FF',
    '#CC99FF', '#FF99FF', '#FF99CC', '#FF6666', '#66FF66', '#6666FF', '#FFFF66',
    '#FF66FF', '#66FFFF'
  ];

  // Configuración del calendario
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
    events: [],
    height: 'auto',
    locales: [esLocale],
    locale: 'es',
    slotLabelFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    },
    eventDidMount: (info) => {
      if (info.event.extendedProps['asignaturaId']) {
        info.el.style.backgroundColor = this.getColorMateria(info.event.extendedProps['asignaturaId']);
      }
    },
    eventClick: (clickInfo: EventClickArg) => {
      this.abrirModalDetalleHorario(clickInfo.event.extendedProps['horarioId']);
    }
  };

  constructor(
    private horariosService: HorariosService,
    private aulasService: AulasService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) { }

   // Método para abrir/cerrar el acordeón
   toggleAccordion(): void {
    this.isAccordionOpen = !this.isAccordionOpen;
  }

  // Getter para acceder a la API del calendario
  get calendarApi(): Calendar | null {
    return this.calendarComponent?.getApi() || null;
  }

  ngOnInit(): void {
    this.cargarDatosIniciales();
  }

  // Carga todos los datos necesarios al inicio
  private cargarDatosIniciales(): void {
    this.horariosService.obtenerPeriodos().subscribe(data => {
      this.periodos = data;
      if (this.periodos.length > 0) {
        this.PeriodoSeleccionado = this.periodos[this.periodos.length - 1].ID_PERIODO;
        this.onPeriodoChange(this.PeriodoSeleccionado);
      }
    });

    this.aulasService.obtenerAulas().subscribe(data => this.aulas = data);
    this.horariosService.obtenerDias().subscribe(data => this.dias = data);
    this.cargarTodosLosHorarios();
  }

  // Método para cargar todos los horarios
  cargarTodosLosHorarios(): void {
    this.horariosService.obtenerTodosHorarios().subscribe({
      next: (data: HorarioDetalle[]) => {
        this.todosLosHorarios = data;
        this.asignarColoresAMaterias();

        if (this.PeriodoSeleccionado > 0) {
          this.filtrarHorariosPorPeriodo(this.PeriodoSeleccionado);
        } else {
          this.horariosFiltrados = [...this.todosLosHorarios];
          this.actualizarEventosCalendario();
        }
      },
      error: (err) => {
        console.error('Error al cargar los horarios:', err);
        this.mensajeError = 'Error al cargar los horarios';
      }
    });
  }

  // Asigna colores a todas las materias únicas
  asignarColoresAMaterias(): void {
    const materias = new Set<number>();
    this.todosLosHorarios.forEach(horario => materias.add(horario.asignatura.id));
    Array.from(materias).forEach(materiaId => this.asignarColorAMateria(materiaId));
  }

  // Asigna un color a una materia específica
  asignarColorAMateria(materiaId: number): void {
    if (!this.coloresMateria.has(materiaId)) {
      const index = this.coloresMateria.size % this.paletaColores.length;
      this.coloresMateria.set(materiaId, this.paletaColores[index]);
    }
  }

  // Obtiene el color asignado a una materia
  getColorMateria(materiaId: number): string {
    return this.coloresMateria.get(materiaId) || '#CCCCCC';
  }

  // Filtra horarios por el periodo seleccionado
  filtrarHorariosPorPeriodo(idPeriodo: number): void {
    this.horariosService.obtenerHorariosPorPeriodo(idPeriodo).subscribe({
      next: (data: HorarioDetalle[]) => {
        this.horariosFiltrados = data;
        this.actualizarEventosCalendario();
      },
      error: (err) => {
        console.error('Error al filtrar horarios por periodo:', err);
        this.mensajeError = 'Error al cargar los horarios del periodo seleccionado';
      }
    });
  }

  // Actualiza los eventos mostrados en el calendario
  actualizarEventosCalendario(): void {
    const eventos: EventInput[] = this.horariosFiltrados.map(horario => ({
      id: `horario-${horario.id}`,
      title: `${horario.asignatura.nombre}\n${horario.aula.nombre}`,
      startTime: horario.horaInicio,
      endTime: horario.horaFin,
      daysOfWeek: [this.convertirDiaAFullCalendar(horario.dia.id)],
      extendedProps: {
        horarioId: horario.id,
        asignaturaId: horario.asignatura.id,
        docente: horario.docente.nombre,
        aula: horario.aula.nombre,
        carrera: horario.carrera.nombre,
        curso: horario.curso.nombre
      }
    }));

    this.ngZone.run(() => {
      if (this.calendarApi) {
        this.calendarApi.removeAllEvents();
        this.calendarApi.addEventSource(eventos);

        // Forzar actualización y redibujado del calendario
        setTimeout(() => {
          this.calendarApi!.refetchEvents();
          this.calendarApi!.render();
        }, 100);
      } else {
        this.calendarOptions = {
          ...this.calendarOptions,
          events: eventos
        };
        this.cdr.detectChanges();
      }
    });
  }

  // Convierte ID de día al formato de FullCalendar
  convertirDiaAFullCalendar(diaId: number): number {
    return diaId === 7 ? 0 : diaId;
  }

  // Acciones al cambiar selección de periodo
  onPeriodoChange(idPeriodo: number): void {
    this.PeriodoSeleccionado = idPeriodo;
    this.CarreraSeleccionada = 0;
    this.reiniciarSelecciones();
    // Cargar carreras disponibles para el periodo seleccionado
    this.horariosService.obtenerCarrerasPeriodo(idPeriodo).subscribe(data => {
      this.carreras = data;
    });

    this.filtrarHorariosPorPeriodo(idPeriodo);
  }

  onCarreraChange(idCarrera: number): void {
    this.CarreraSeleccionada = idCarrera;
    this.reiniciarSelecciones();

    // Cargar datos combinados de docente-asignatura-nivel
    if (this.PeriodoSeleccionado > 0 && idCarrera > 0) {
      this.horariosService.obtenerDocenteAsignaturaNivel(this.PeriodoSeleccionado, idCarrera).subscribe(data => {
        this.docenteAsignaturaNivel = data;
      });
    }
  }
searchInput = new Subject<string>();
  customSearchFn(term: string, item: any): boolean {
  term = term.toLowerCase();
  // Buscar en los tres campos: docente, asignatura y nivel
  return item.DOCENTE.toLowerCase().includes(term) ||
         item.ASIGNATURA.toLowerCase().includes(term) ||
         item.NIVEL.toLowerCase().includes(term);
}
onCombinacionChange(combinacion: any): void {
  // Si no hay selección o se seleccionó la opción por defecto
  if (!combinacion || combinacion === '0') {
    this.DocenteSeleccionado = 0;
    this.AsignaturaSeleccionada = 0;
    this.NivelSeleccionado = 0;
    return;
  }


  // Si el ng-select devuelve un objeto completo (cuando se usa el objeto entero como valor)
  if (typeof combinacion === 'object') {
    this.DocenteSeleccionado = Number(combinacion.ID_DOCENTE);
    this.AsignaturaSeleccionada = Number(combinacion.ID_ASIGNATURA);
    this.NivelSeleccionado = Number(combinacion.ID_CURSOS);
    return;
  }

  // Si el ng-select devuelve un string (mantiene la lógica original)
  if (typeof combinacion === 'string') {
    const ids = combinacion.split('-');

    if (ids.length === 3) {
      this.DocenteSeleccionado = Number(ids[0]);
      this.AsignaturaSeleccionada = Number(ids[1]);
      this.NivelSeleccionado = Number(ids[2]);
    }
  }
}

   reiniciarSelecciones(): void {
    this.CombinacionSeleccionada = '0';
    this.DocenteSeleccionado = 0;
    this.AsignaturaSeleccionada = 0;
    this.NivelSeleccionado = 0;
    this.docenteAsignaturaNivel = [];
  }


  // Carga las aulas disponibles
  onAulaChange(): void {
    this.aulasService.obtenerAulas().subscribe(data => {
      this.aulas = data;
    });
  }

  // Carga los días disponibles
  onDiaChange(): void {
    this.horariosService.obtenerDias().subscribe(data => {
      this.dias = data;
    });
  }



  // Asigna un nuevo horario
  asignarHorario(): void {
    this.mensajeError = '';

    const horarioData = {
      ID_PERIODO: this.PeriodoSeleccionado,
      ID_DOCENTE: this.DocenteSeleccionado,
      ID_ASIGNATURA: this.AsignaturaSeleccionada,
      ID_CARRERAS: this.CarreraSeleccionada,
      ID_CURSOS: this.NivelSeleccionado,
      ID_DIA: this.DiaSeleccionado,
      ID_AULA: this.AulaSeleccionada,
      HORA_INICIO: this.horaInicio,
      HORA_FIN: this.horaFin
    };

    this.horariosService.asignarHorario(horarioData).subscribe({
      next: (res: HorarioResponse) => {
        if (res.id) {
          this.obtenerDetalleHorario(res.id);
          this.limpiarFormulario();
        }
      },
      error: (err) => {
        this.mensajeError = err.message || 'Error al asignar horario';
      }
    });

    // Cerrar el acordeón después de asignar el horario
    this.isAccordionOpen = false;
  }

  // Limpia el formulario después de asignar un horario
  limpiarFormulario(): void {
    this.AulaSeleccionada = 0;
    this.DiaSeleccionado = 0;
    this.horaInicio = '';
    this.horaFin = '';
  }

  // Obtiene el detalle de un horario por ID
  obtenerDetalleHorario(idHorario: number): void {
    this.horariosService.obtenerDetalleHorario(idHorario).subscribe({
      next: (detalle: HorarioDetalle) => {
        detalle.id = idHorario;
        this.todosLosHorarios = [...this.todosLosHorarios, detalle];

        if (this.PeriodoSeleccionado > 0) {
          this.horariosFiltrados = [...this.horariosFiltrados, detalle];
          this.asignarColorAMateria(detalle.asignatura.id);
          this.actualizarEventosCalendario();
        }
      },
      error: () => {
        this.mensajeError = 'Error al obtener el detalle del horario';
      }
    });
  }

  // Formatea la hora de HH:MM:SS a HH:MM
  formatHora(hora: string): string {
    if (!hora) return '';
    return hora.substring(0, 5);
  }

  // Getter para obtener todas las materias únicas para la leyenda
  get materiasUnicas(): any[] {
    const materiasMap = new Map();
    this.horariosFiltrados.forEach(horario => {
      if (!materiasMap.has(horario.asignatura.id)) {
        materiasMap.set(horario.asignatura.id, {
          id: horario.asignatura.id,
          nombre: horario.asignatura.nombre
        });
      }
    });
    return Array.from(materiasMap.values());
  }

  // MÉTODOS PARA EL MODAL

  // Abre modal con detalles del horario
  abrirModalDetalleHorario(horarioId: number): void {
    const horario = this.horariosFiltrados.find(h => h.id === horarioId);

    if (horario) {
      this.horarioSeleccionado = { ...horario };
      this.modoEdicion = false;
      this.editHoraInicio = this.formatHora(horario.horaInicio);
      this.editHoraFin = this.formatHora(horario.horaFin);
      this.editAulaSeleccionada = horario.aula.id;
      this.editDiaSeleccionado = horario.dia.id;
      this.modalVisible = true;
    }
  }

  // Cierra el modal
  cerrarModal(): void {
    this.modalVisible = false;
    this.horarioSeleccionado = null;
    this.modoEdicion = false;
    this.mensajeModal = '';
    this.tipoMensajeModal = '';
  }

  // Activa el modo de edición
  activarModoEdicion(): void {
    this.modoEdicion = true;
    this.mensajeModal = '';
    this.tipoMensajeModal = '';
  }

  // Cancela la edición
  cancelarEdicion(): void {
    if (this.horarioSeleccionado) {
      this.editHoraInicio = this.formatHora(this.horarioSeleccionado.horaInicio);
      this.editHoraFin = this.formatHora(this.horarioSeleccionado.horaFin);
      this.editAulaSeleccionada = this.horarioSeleccionado.aula.id;
      this.editDiaSeleccionado = this.horarioSeleccionado.dia.id;
    }

    this.modoEdicion = false;
    this.mensajeModal = '';
    this.tipoMensajeModal = '';
  }

  // Guarda los cambios en un horario
  guardarCambiosHorario(): void {
    if (!this.horarioSeleccionado || !this.horarioSeleccionado.id) {
      this.mensajeModal = 'No se puede actualizar el horario';
      this.tipoMensajeModal = 'error';
      return;
    }

    // Comprobar si los valores son válidos antes de enviar
    if (!this.editAulaSeleccionada || !this.editDiaSeleccionado) {
      this.mensajeModal = 'Debe seleccionar un aula y un día válidos';
      this.tipoMensajeModal = 'error';
      return;
    }

    // Formatea la hora al formato HH:MM:SS
    const formatearHora = (hora: string): string => {
      if (!hora) return '';
      if (/^\d{2}:\d{2}:\d{2}$/.test(hora)) return hora;
      if (/^\d{2}:\d{2}$/.test(hora)) return `${hora}:00`;
      return hora;
    };

    // Validar que tengamos horas válidas
    if (!this.editHoraInicio || !this.editHoraFin) {
      this.mensajeModal = 'Debe proporcionar horarios válidos';
      this.tipoMensajeModal = 'error';
      return;
    }

    // Convertir los IDs a números para asegurar que sean del tipo correcto
    const aulaId = Number(this.editAulaSeleccionada);
    const diaId = Number(this.editDiaSeleccionado);


    const aulaSeleccionada = this.aulas.find(a => Number(a.ID_AULA) === aulaId);
    const diaSeleccionado = this.dias.find(d => Number(d.ID_DIA) === diaId);

    console.log('Aula encontrada:', aulaSeleccionada);
    console.log('Día encontrado:', diaSeleccionado);

    // Verificar si encontramos el aula y el día antes de continuar
    if (!aulaSeleccionada || !diaSeleccionado) {
      this.mensajeModal = 'Error: No se pudo encontrar el aula o el día seleccionado';
      this.tipoMensajeModal = 'error';
      return;
    }

    const horarioActualizado = {
      ID_HORARIO: Number(this.horarioSeleccionado.id),
      ID_PERIODO: this.PeriodoSeleccionado,
      ID_DOCENTE: this.horarioSeleccionado.docente.id,
      ID_ASIGNATURA: this.horarioSeleccionado.asignatura.id,
      ID_CARRERAS: this.horarioSeleccionado.carrera.id,
      ID_CURSOS: this.horarioSeleccionado.curso.id,
      ID_AULA: aulaId,
      ID_DIA: diaId,
      HORA_INICIO: formatearHora(this.editHoraInicio),
      HORA_FIN: formatearHora(this.editHoraFin)
    };

    this.horariosService.actualizarHorario(horarioActualizado).subscribe({
      next: () => {
        // Crear el objeto actualizado
        if (!this.horarioSeleccionado?.docente) {
          this.mensajeModal = 'Error: El docente no está definido';
          this.tipoMensajeModal = 'error';
          return;
        }

        const horarioDetalleActualizado: HorarioDetalle = {
          ...this.horarioSeleccionado,
          docente: this.horarioSeleccionado.docente, // Ensure docente is defined
          horaInicio: formatearHora(this.editHoraInicio),
          horaFin: formatearHora(this.editHoraFin),
          aula: {
            id: aulaId,
            nombre: aulaSeleccionada.NOMBRE_AULA
          },
          dia: {
            id: diaId,
            nombre: diaSeleccionado.NOMBRE_DIA
          }
        };

        this.ngZone.run(() => {
          this.actualizarHorarioEnListas(horarioDetalleActualizado);

          // Mostrar mensaje de éxito
          this.mensajeModal = 'Horario actualizado con éxito';
          this.tipoMensajeModal = 'success';
          this.modoEdicion = false;

          // Esperar a que el modal se actualice antes de cerrar
          setTimeout(() => {
            this.cerrarModal();
            // Forzar una actualización completa del calendario
            this.cargarTodosLosHorarios();
          }, 1500);
        });
      },
      error: (err) => {
        console.error('Error en la actualización:', err);
        let mensajeError = 'Error al actualizar el horario';

        if (err.error) {
          if (err.error.message) {
            mensajeError = err.error.message;
          } else if (typeof err.error === 'string') {
            mensajeError = err.error;
          }
        } else if (err.message) {
          mensajeError = err.message;
        }

        this.mensajeModal = mensajeError;
        this.tipoMensajeModal = 'error';
      }
    });
  }

  // Actualiza el horario en todas las listas
  private actualizarHorarioEnListas(horarioActualizado: HorarioDetalle): void {
    // Actualizar en las listas de datos
    this.horariosFiltrados = this.horariosFiltrados.map(h =>
      h.id === horarioActualizado.id ? horarioActualizado : h
    );

    this.todosLosHorarios = this.todosLosHorarios.map(h =>
      h.id === horarioActualizado.id ? horarioActualizado : h
    );

    this.horarioSeleccionado = horarioActualizado;

    // Forzar actualización del calendario usando ngZone para asegurar la detección de cambios
    this.ngZone.run(() => {
      // Eliminar específicamente el evento antiguo y agregar el nuevo
      if (this.calendarApi) {
        const eventoId = `horario-${horarioActualizado.id}`;
        const eventoExistente = this.calendarApi.getEventById(eventoId);

        if (eventoExistente) {
          eventoExistente.remove();
        }

        // Crear y agregar el nuevo evento
        const nuevoEvento = {
          id: eventoId,
          title: `${horarioActualizado.asignatura.nombre}\n${horarioActualizado.aula.nombre}`,
          startTime: horarioActualizado.horaInicio,
          endTime: horarioActualizado.horaFin,
          daysOfWeek: [this.convertirDiaAFullCalendar(horarioActualizado.dia.id)],
          extendedProps: {
            horarioId: horarioActualizado.id,
            asignaturaId: horarioActualizado.asignatura.id,
            docente: horarioActualizado.docente.nombre,
            aula: horarioActualizado.aula.nombre,
            carrera: horarioActualizado.carrera.nombre,
            curso: horarioActualizado.curso.nombre
          }
        };

        this.calendarApi.addEvent(nuevoEvento);
        this.calendarApi.refetchEvents();
      } else {
        // Si no hay referencia al API del calendario, actualizar todo
        this.actualizarEventosCalendario();
      }

      this.cdr.detectChanges();
    });
  }

  // Elimina un horario
  eliminarHorario(): void {
    if (!this.horarioSeleccionado || !this.horarioSeleccionado.id) {
      this.mensajeModal = 'No se puede eliminar el horario';
      this.tipoMensajeModal = 'error';
      return;
    }

    if (confirm('¿Está seguro que desea eliminar este horario? Esta acción no se puede deshacer.')) {
      this.horariosService.eliminarHorario(this.horarioSeleccionado.id).subscribe({
        next: () => {
          const horarioId = this.horarioSeleccionado?.id;

          if (horarioId) {
            this.horariosFiltrados = this.horariosFiltrados.filter(h => h.id !== horarioId);
            this.todosLosHorarios = this.todosLosHorarios.filter(h => h.id !== horarioId);
            this.actualizarEventosCalendario();
            this.cerrarModal();
          }
        },
        error: (err) => {
          this.mensajeModal = err.message || 'Error al eliminar el horario';
          this.tipoMensajeModal = 'error';
        }
      });
    }
  }


}
