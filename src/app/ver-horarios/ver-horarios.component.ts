import { Component, OnInit, HostListener, ChangeDetectorRef, NgZone } from '@angular/core';
import { Periodo, VerHorariosService } from '../ver-horarios.service';
import { CalendarOptions, EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import { AuthService } from '../auth.service';
import { NotificationService } from '../notificacion.service';
import { ReportesService } from '../reportes.service';

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

  // Variables para el modal de configuración de horas
  mostrarModalConfiguracion: boolean = false;
  configuracionHoras: { fechaInicio: string; fechaFin: string } = { fechaInicio: '', fechaFin: '' };
  fechasActuales: any = null;

  // Variables para PDF (como en generar-reportes)
  observacion: any;
  autoridades: any[] = [];

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'timeGridWeek',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek'
    },
    // ✅ NUEVO: Configuración consistente de botones
    buttonIcons: {
      prev: 'chevron-left',
      next: 'chevron-right',
      prevYear: 'chevrons-left',
      nextYear: 'chevrons-right'
    },
    buttonText: {
      today: 'Hoy',
      month: 'Mes',
      week: 'Semana',
      day: 'Día',
      prev: '‹',
      next: '›'
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

  // Propiedades para dropdowns personalizados
  dropdownPeriodoOpen = false;
  dropdownCarreraOpen = false;
  dropdownCursoOpen = false;
  searchTermPeriodo = '';
  searchTermCarrera = '';
  searchTermCurso = '';
  periodosFiltrados: Periodo[] = [];
  carrerasFiltradas: any[] = [];
  cursosFiltrados: any[] = [];

  constructor(
    private verHorariosService: VerHorariosService, 
    public usuarioService: AuthService,
    private notificationService: NotificationService, 
    private reporteService: ReportesService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) { }

  ngOnInit(): void {
    this.cargarPeriodos();
    this.cargarObservacion();
    this.cargarAutoridades();
  }

  // =============================
  // MÉTODOS PARA DROPDOWNS PERSONALIZADOS
  // =============================

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    
    if (!target.closest('.dropdown-container') && !target.closest('.dropdown-button')) {
      this.ngZone.run(() => {
        this.dropdownPeriodoOpen = false;
        this.dropdownCarreraOpen = false;
        this.dropdownCursoOpen = false;
        this.cdr.detectChanges();
      });
    }
  }

  toggleDropdownPeriodo(): void {
    this.ngZone.run(() => {
      this.dropdownPeriodoOpen = !this.dropdownPeriodoOpen;
      this.dropdownCarreraOpen = false;
      this.dropdownCursoOpen = false;
      if (this.dropdownPeriodoOpen) {
        this.periodosFiltrados = [...this.periodos];
      }
      this.cdr.detectChanges();
    });
  }

  toggleDropdownCarrera(): void {
    this.ngZone.run(() => {
      this.dropdownCarreraOpen = !this.dropdownCarreraOpen;
      this.dropdownPeriodoOpen = false;
      this.dropdownCursoOpen = false;
      if (this.dropdownCarreraOpen) {
        this.carrerasFiltradas = [...this.carreras];
      }
      this.cdr.detectChanges();
    });
  }

  toggleDropdownCurso(): void {
    this.ngZone.run(() => {
      this.dropdownCursoOpen = !this.dropdownCursoOpen;
      this.dropdownPeriodoOpen = false;
      this.dropdownCarreraOpen = false;
      if (this.dropdownCursoOpen) {
        this.cursosFiltrados = [...this.cursos];
      }
      this.cdr.detectChanges();
    });
  }

  getSelectedPeriodoName(): string {
    if (!this.PeriodoSeleccionado) return 'Seleccionar periodo';
    const periodo = this.periodos.find(p => p.id === this.PeriodoSeleccionado);
    return periodo ? periodo.nombre : 'Seleccionar period';
  }

  getSelectedCarreraName(): string {
    if (!this.CarreraSeleccionada) return 'Seleccionar carrera';
    const carrera = this.carreras.find(c => c.id === this.CarreraSeleccionada);
    return carrera ? carrera.nombre : 'Seleccionar carrera';
  }

  getSelectedCursoName(): string {
    if (!this.CursoSeleccionado) return 'Seleccionar curso';
    const curso = this.cursos.find(c => c.id === this.CursoSeleccionado);
    return curso ? curso.nombre : 'Seleccionar curso';
  }

  getFilteredPeriodos(): Periodo[] {
    if (!this.searchTermPeriodo) {
      return this.periodosFiltrados;
    }
    return this.periodosFiltrados.filter(periodo =>
      periodo.nombre.toLowerCase().includes(this.searchTermPeriodo.toLowerCase())
    );
  }

  getFilteredCarreras(): any[] {
    if (!this.searchTermCarrera) {
      return this.carrerasFiltradas;
    }
    return this.carrerasFiltradas.filter(carrera =>
      carrera.nombre.toLowerCase().includes(this.searchTermCarrera.toLowerCase())
    );
  }

  getFilteredCursos(): any[] {
    if (!this.searchTermCurso) {
      return this.cursosFiltrados;
    }
    return this.cursosFiltrados.filter(curso =>
      curso.nombre.toLowerCase().includes(this.searchTermCurso.toLowerCase())
    );
  }

  selectPeriodo(periodo: Periodo): void {
    this.PeriodoSeleccionado = periodo.id;
    this.dropdownPeriodoOpen = false;
    this.searchTermPeriodo = '';
    this.onPeriodoChange(periodo.id);
  }

  selectCarrera(carrera: any): void {
    this.CarreraSeleccionada = carrera.id;
    this.dropdownCarreraOpen = false;
    this.searchTermCarrera = '';
    this.onCarreraChange();
  }

  selectCurso(curso: any): void {
    this.CursoSeleccionado = curso.id;
    this.dropdownCursoOpen = false;
    this.searchTermCurso = '';
    this.onCursoChange();
  }

  cargarPeriodos(): void {
    this.verHorariosService.obtenerPeriodos().subscribe({
      next: (data) => {
        this.periodos = data;
        this.periodosFiltrados = [...data];
        if (this.periodos.length > 0) {
          this.PeriodoSeleccionado = this.periodos[this.periodos.length - 1].id;
          this.onPeriodoChange(this.PeriodoSeleccionado);
        }
      },
      error: (err) => {
        this.mensajeError = 'Error al cargar los periodos';
      }
    });
  }

  onPeriodoChange(idPeriodo: number): void {
    if (!idPeriodo) {
      this.carreras = [];
      this.carrerasFiltradas = [];
      this.cursos = [];
      this.cursosFiltrados = [];
      this.CarreraSeleccionada = 0;
      this.CursoSeleccionado = 0;
      return;
    }

    this.verHorariosService.obtenerCarrerasPorPeriodo(idPeriodo).subscribe({
      next: (data) => {
        this.carreras = data;
        this.carrerasFiltradas = [...data];
        this.cursos = [];
        this.cursosFiltrados = [];
        this.CarreraSeleccionada = 0;
        this.CursoSeleccionado = 0;
        this.limpiarCalendario();
      },
      error: (err) => {
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
            this.cursosFiltrados = [...data];
            this.CursoSeleccionado = 0;
            this.limpiarCalendario();
          },
          error: (err) => {
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

  // Filtrar horarios para evitar duplicados de clases articuladas
  const horariosUnicos = this.filtrarHorariosArticulados(this.horariosFiltrados);

  const eventos = horariosUnicos.map(horario => {
    const diaSemana = this.obtenerDiaSemanaISO(horario.dia.nombre);

    // Convertir las fechas del horario a formato Date
    const fechaInicio = new Date(horario.fechaInicio);
    const fechaFin = new Date(horario.fechaFin);

    return {
      title: this.generarTituloEvento(horario),
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
        fechaFin: horario.fechaFin,
        tipoClase: horario.tipoClase,
        grupoArticulado: horario.grupoArticulado
      }
    };
  });

  this.calendarOptions = {
    ...this.calendarOptions,
    events: eventos
  };
}

// NUEVO MÉTODO: Filtrar horarios para evitar duplicados de clases articuladas
filtrarHorariosArticulados(horarios: any[]): any[] {
  const horariosUnicos = new Map<string, any>();

  horarios.forEach(horario => {
    // Crear una clave única para identificar clases duplicadas
    const clave = `${horario.asignatura.id}-${horario.docente.id}-${horario.aula.id}-${horario.dia.id}-${horario.horaInicio}-${horario.horaFin}-${horario.fechaInicio}-${horario.fechaFin}`;
    
    // Si es una clase articulada, agregar información del grupo
    const claveArticulada = horario.tipoClase === 'ARTICULADA' && horario.grupoArticulado 
      ? `${clave}-${horario.grupoArticulado}`
      : clave;

    if (!horariosUnicos.has(claveArticulada)) {
      horariosUnicos.set(claveArticulada, horario);
    }
  });

  return Array.from(horariosUnicos.values());
}

// NUEVO MÉTODO: Generar título del evento considerando clases articuladas
generarTituloEvento(horario: any): string {
  const asignatura = horario.asignatura?.nombre || 'Sin asignatura';
  const docente = horario.docente?.nombre || 'Sin docente';
  const aula = horario.aula?.nombre || 'Sin aula';

  let titulo = `${asignatura}\n${docente}\n${aula}`;

  // Si es una clase articulada, agregar indicador y información de carreras y cursos
  if (horario.tipoClase === 'ARTICULADA') {
    titulo += `\n[ARTICULADA]`;
    
    // Agregar información de carreras
    const infoCarreras = this.obtenerInfoCarreras(horario.carrera);
    if (infoCarreras) {
      titulo += `\nCarreras: ${infoCarreras}`;
    }
    
    // Agregar información de cursos
    const infoCursos = this.obtenerInfoCursos(horario.curso);
    if (infoCursos) {
      titulo += `\nCursos: ${infoCursos}`;
    }
  }

  return titulo;
}

// NUEVO MÉTODO: Obtener información de carreras para el título del evento
obtenerInfoCarreras(carrera: any): string {
  if (!carrera) return '';

  // Si es una carrera múltiple (articulada)
  if (carrera.carreras && carrera.carreras.length > 0) {
    return carrera.carreras.map((c: any) => c.nombre).join(', ');
  }

  // Si es una carrera única
  return carrera.nombre || '';
}

// NUEVO MÉTODO: Obtener información de cursos para el título del evento
obtenerInfoCursos(curso: any): string {
  if (!curso) return '';

  // Si es un curso múltiple (articulado)
  if (curso.cursos && curso.cursos.length > 0) {
    return curso.cursos.map((c: any) => c.nombre).join(', ');
  }

  // Si es un curso único
  return curso.nombre || '';
}

// NUEVO MÉTODO: Obtener detalles completos de la carrera para el modal
obtenerDetallesCarrera(carrera: any): any {
  if (!carrera) return { nombre: 'Sin carrera', lista: [] };

  // Si es una carrera múltiple (articulada)
  if (carrera.carreras && carrera.carreras.length > 0) {
    return {
      nombre: carrera.nombre, // Nombre completo concatenado
      lista: carrera.carreras, // Array de carreras individuales
      esMultiple: true
    };
  }

  // Si es una carrera única
  return {
    nombre: carrera.nombre,
    lista: [carrera],
    esMultiple: false
  };
}

// NUEVO MÉTODO: Obtener detalles completos del curso para el modal
obtenerDetallesCurso(curso: any): any {
  if (!curso) return { nombre: 'Sin curso', lista: [] };

  // Si es un curso múltiple (articulado)
  if (curso.cursos && curso.cursos.length > 0) {
    return {
      nombre: curso.nombre, // Nombre completo concatenado
      lista: curso.cursos, // Array de cursos individuales
      esMultiple: true
    };
  }

  // Si es un curso único
  return {
    nombre: curso.nombre,
    lista: [curso],
    esMultiple: false
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
        carrera: this.obtenerDetallesCarrera(horario.carrera),
        curso: this.obtenerDetallesCurso(horario.curso),
        tipoClase: horario.tipoClase,
        grupoArticulado: horario.grupoArticulado,
        esArticulada: horario.tipoClase === 'ARTICULADA'
      };
      this.mostrarModal = true;
    }
  }

  // Método para cerrar el modal
  cerrarModal(): void {
    this.mostrarModal = false;
    this.horarioSeleccionado = null;
  }

  // Métodos para el modal de configuración de horas
  abrirModalConfiguracion(): void {
    this.cargarFechasActuales();
    this.mostrarModalConfiguracion = true;
  }

  cerrarModalConfiguracion(): void {
    this.mostrarModalConfiguracion = false;
    this.configuracionHoras = { fechaInicio: '', fechaFin: '' };
    this.fechasActuales = null;
  }

  cargarFechasActuales(): void {
    this.notificationService.showLoading('Cargando configuración actual...');
    
    this.verHorariosService.obtenerFechasLimites().subscribe({
      next: (response) => {
        this.notificationService.hideLoading();
        
        // Manejar el formato específico del backend
        if (response && response.success && response.data) {
          const fechasData = response.data;
          
          if (fechasData.fecha_inicial && fechasData.fecha_final) {
            this.fechasActuales = fechasData;
            // Convertir las fechas ISO a formato YYYY-MM-DD para los inputs
            this.configuracionHoras.fechaInicio = fechasData.fecha_inicial.split('T')[0];
            this.configuracionHoras.fechaFin = fechasData.fecha_final.split('T')[0];
          } else {
            console.warn('Propiedades de fechas no encontradas en:', fechasData);
            this.fechasActuales = null;
          }
        } else {
          console.warn('Formato de respuesta no válido:', response);
          this.fechasActuales = null;
        }
      },
      error: (err) => {
        this.notificationService.hideLoading();
        console.error('Error al cargar fechas actuales:', err);
        this.notificationService.showError('Error al cargar la configuración actual');
        this.fechasActuales = null;
      }
    });
  }

  guardarConfiguracion(): void {
    if (!this.configuracionHoras.fechaInicio || !this.configuracionHoras.fechaFin) {
      this.notificationService.showWarningReport(
        'Campos incompletos',
        'Por favor, completa ambas fechas antes de guardar.',
        'Entendido'
      );
      return;
    }

    if (new Date(this.configuracionHoras.fechaInicio) >= new Date(this.configuracionHoras.fechaFin)) {
      this.notificationService.showWarningReport(
        'Fechas inválidas',
        'La fecha inicial debe ser anterior a la fecha final.',
        'Entendido'
      );
      return;
    }

    this.notificationService.showLoading('Guardando configuración...');

    this.verHorariosService.actualizarFechasLimites(
      this.configuracionHoras.fechaInicio,
      this.configuracionHoras.fechaFin
    ).subscribe({
      next: (response) => {
        this.notificationService.hideLoading();
        this.notificationService.showSuccess('Configuración guardada correctamente');
        // Recargar las fechas actuales antes de cerrar el modal
        this.cargarFechasActuales();
        // Cerrar el modal después de un breve delay para que se vea la actualización
        setTimeout(() => {
          this.cerrarModalConfiguracion();
        }, 1000);
      },
      error: (err) => {
        this.notificationService.hideLoading();
        const mensaje = err?.error?.message || 'Error al guardar la configuración';
        this.notificationService.showError(mensaje);
      }
    });
  }

  // Método para formatear la hora
  formatearHora(hora: string): string {
    if (!hora) return '';
    const [hours, minutes] = hora.split(':');
    return `${hours}:${minutes}`;
  }

  // Método para generar PDF de horarios
  
  generarPDF(): void {
    if (!this.PeriodoSeleccionado || !this.CarreraSeleccionada || !this.CursoSeleccionado) {
      this.notificationService.showWarningReport(
        'Filtros incompletos',
        'Por favor, selecciona el periodo, la carrera y el curso antes de generar el PDF.',
        'Entendido'
      );
      return;
    }

    this.notificationService.showLoading('Generando PDF...');

    // Preparar datos igual que en generar-reportes
    const datos = {
      idPeriodo: this.PeriodoSeleccionado,
      idCarrera: this.CarreraSeleccionada,
      idCurso: this.CursoSeleccionado,
      observaciones: {
        PRACTICAS_PREPROFESIONALES_HORAS: this.observacion?.PRACTICAS_PREPROFESIONALES_HORAS || '',
        SERVICIO_COMUNITARIO_HORAS: this.observacion?.SERVICIO_COMUNITARIO_HORAS || '',
        INGLES_HORAS: this.observacion?.INGLES_HORAS || ''
      },
      autoridades: {
        rector: this.autoridades.find(auth => auth.ID_AUTORIDAD === 1)?.NOMBRE_AUTORIDAD || '',
        vicerrectora: this.autoridades.find(auth => auth.ID_AUTORIDAD === 2)?.NOMBRE_AUTORIDAD || ''
      }
    };

    this.reporteService.crearReporte(datos).subscribe({
      next: (blob: Blob) => {
        this.notificationService.hideLoading();
        
        // Crear URL del blob
        const url = window.URL.createObjectURL(blob);
        
        // Abrir el PDF en una nueva pestaña
        const nuevaPestana = window.open(url, '_blank');
        
        if (nuevaPestana) {
          this.notificationService.showSuccess(
            'El PDF se abrió en una nueva pestaña para previsualización.'
          );
        } else {
          // Si el navegador bloqueó la ventana emergente, mostrar mensaje
          this.notificationService.showWarningReport(
            'Ventana bloqueada',
            'El navegador bloqueó la ventana emergente. El PDF se descargará automáticamente.',
            'Entendido'
          );

          // Descargar como fallback
          const link = document.createElement('a');
          link.href = url;
          link.download = `horarios_${this.PeriodoSeleccionado}_${this.CarreraSeleccionada}_${this.CursoSeleccionado}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        
        // Limpiar la URL creada después de un tiempo
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 5000);
      },
      error: (error: any) => {
        this.notificationService.hideLoading();
        console.error('Error completo:', error);
        
        let mensaje = 'Error al generar el PDF';
        
        if (error.status === 404) {
          mensaje = 'El endpoint para generar PDF no fue encontrado. Verifica que el servidor backend esté corriendo y que el endpoint /v1/horarios-pdf esté disponible.';
        } else if (error.status === 0) {
          mensaje = 'No se pudo conectar con el servidor. Verifica que el backend esté corriendo en http://localhost:3000';
        } else if (error.status === 500) {
          mensaje = 'Error interno del servidor al generar el PDF';
        } else if (error?.error?.message) {
          mensaje = error.error.message;
        }
        
        this.notificationService.showError(mensaje);
      }
    });
  }

  // Métodos para cargar datos de configuración (como en generar-reportes)
  cargarObservacion(): void {
    const idCarrera = this.usuarioService.obtenerIdCarrera();
    if (idCarrera === null) {
      console.warn('No se pudo obtener la carrera del token');
      return;
    }

    this.reporteService.obtenerObservacionesPorCarrera(idCarrera).subscribe({
      next: (data) => {
        const observacionData = Array.isArray(data) ? data[0] : data;
        this.observacion = observacionData;
      },
      error: (err) => {
        console.warn('Error al cargar observaciones:', err);
        // Crear observación por defecto
        this.observacion = {
          PRACTICAS_PREPROFESIONALES_HORAS: '',
          SERVICIO_COMUNITARIO_HORAS: '',
          INGLES_HORAS: ''
        };
      }
    });
  }

  cargarAutoridades(): void {
    this.reporteService.obtenerAutoridades().subscribe({
      next: (data) => {
        this.autoridades = data;
      },
      error: (err) => {
        console.warn('Error al cargar autoridades:', err);
        // Crear autoridades por defecto
        this.autoridades = [
          { ID_AUTORIDAD: 1, NOMBRE_AUTORIDAD: '' },
          { ID_AUTORIDAD: 2, NOMBRE_AUTORIDAD: '' }
        ];
      }
    });
  }
}
