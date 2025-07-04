import { ChangeDetectorRef, Component, OnInit, ViewChild, NgZone, OnDestroy } from '@angular/core';
import { HorariosService } from '../horarios.service';
import { AulasService } from '../aulas.service';
import { CalendarOptions, EventInput, EventClickArg, Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { FullCalendarComponent } from '@fullcalendar/angular';
import esLocale from '@fullcalendar/core/locales/es';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { NotificationService } from '../notificacion.service';
import rrulePlugin from '@fullcalendar/rrule';
import { VerHorariosDocentesService } from '../ver-horarios-docentes.service';
// Interfaces
interface HorarioResponse {
  id: number;
  success: boolean;
  message: string;
}

interface HorarioDetalle {
  id?: number;
  docente: { id: number; nombre: string; };
  asignatura: { id: number; nombre: string; };
  carrera: {
    id: number;
    nombre: string;
    carreras?: Array<{ id: number; nombre: string; }>; // Para carreras articuladas
  };
  curso: {
    id: number | string;
    nombre: string;
    cursos?: Array<{ id: number; nombre: string; }>; // Para cursos articulados
  };
  aula: { id: number; nombre: string; };
  dia: { id: number; nombre: string; };
  horaInicio: string;
  horaFin: string;
  fechaInicio: string;
  fechaFin: string;
  tipoClase?: string; // ✅ Hacer obligatorio este campo
  grupoArticulado?: any;
}

// Clase para manejo de colores optimizada
class ColorManager {
  private static readonly PALETTE = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
    '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA',
    '#F1948A', '#85C1E9', '#F4D03F', '#A9DFBF', '#D7DBDD', '#FAD7A0',
    '#E8DAEF', '#D5DBDB', '#FADBD8', '#D1F2EB', '#FCF3CF', '#EBDEF0',
    '#EBF5FB', '#FEF9E7', '#EAEDED', '#FDF2E9', '#F4ECF7', '#EAF2F8'
  ];

  private colorMap = new Map<number, string>();
  private usedColorsCount = 0;

  // Genera colores usando HSL para mejor distribución
  private generateHSLColor(index: number): string {
    const hue = (index * 137.508) % 360; // Número áureo para distribución uniforme
    const saturation = 70 + (index % 3) * 10; // Variación en saturación
    const lightness = 65 + (index % 2) * 10; // Variación en brillo
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  getColorForSubject(subjectId: number): string {
    if (!this.colorMap.has(subjectId)) {
      let color: string;

      if (this.usedColorsCount < ColorManager.PALETTE.length) {
        color = ColorManager.PALETTE[this.usedColorsCount];
      } else {
        // Genera colores dinámicamente cuando se agota la paleta
        color = this.generateHSLColor(this.usedColorsCount);
      }

      this.colorMap.set(subjectId, color);
      this.usedColorsCount++;
    }

    return this.colorMap.get(subjectId)!;
  }

  // Método para obtener todos los colores asignados
  getAllColors(): Map<number, string> {
    return new Map(this.colorMap);
  }

  // Resetea el manager de colores
  reset(): void {
    this.colorMap.clear();
    this.usedColorsCount = 0;
  }
}

@Component({
  selector: 'app-generar-horarios',
  templateUrl: './generar-horarios.component.html',
  styleUrl: './generar-horarios.component.css'
})
export class GenerarHorariosComponent implements OnInit, OnDestroy {
  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;

  // Subjects para manejo de subscripciones
  private destroy$ = new Subject<void>();
  searchInput = new Subject<string>();

  // Manager de colores optimizado
  private colorManager = new ColorManager();

  // Datos para formularios y filtros
  periodos: any[] = [];
  aulas: any[] = [];
  dias: any[] = [];
  carreras: any[] = [];
  carrerasArticuladas: any[] = [];
  docenteAsignaturaNivel: any[] = [];

  // Variables de selección con valores por defecto
  readonly DEFAULT_SELECTION = 0;
  readonly DEFAULT_COMBINATION = '0';

  PeriodoSeleccionado = this.DEFAULT_SELECTION;
  CombinacionSeleccionada: string = this.DEFAULT_COMBINATION;
  DocenteSeleccionado = this.DEFAULT_SELECTION;
  AulaSeleccionada = this.DEFAULT_SELECTION;
  DiaSeleccionado = this.DEFAULT_SELECTION;
  CarreraSeleccionada = this.DEFAULT_SELECTION;
  NivelSeleccionado = this.DEFAULT_SELECTION;
  AsignaturaSeleccionada = this.DEFAULT_SELECTION;
  horaInicio = '';
  horaFin = '';
  fechaInicio = '';
  fechaFin = '';
  mensajeError = '';

  // Variables para el modal
  modalVisible = false;
  horarioSeleccionado: HorarioDetalle | null = null;
  modoEdicion = false;
  editHoraInicio = '';
  editHoraFin = '';
  editFechaInicio = '';
  editFechaFin = '';
  editAulaSeleccionada = this.DEFAULT_SELECTION;
  editDiaSeleccionado = this.DEFAULT_SELECTION;
  editDocenteSeleccionado = this.DEFAULT_SELECTION;
  mensajeModal = '';
  tipoMensajeModal: 'error' | 'success' | '' = '';

  // Arrays de horarios
  todosLosHorarios: HorarioDetalle[] = [];
  horariosFiltrados: HorarioDetalle[] = [];

  // Estado de acordeón
  isAccordionOpen = false;

  // Nuevas propiedades para clases articuladas
  tiposClase = [
    { nombre: 'Clase Regular', valor: 'regular' },
    { nombre: 'Clase Articulada', valor: 'articulada' }
  ];



  tipoClaseSeleccionado: string = 'regular';
  cursosArticulados: Array<{ ID_CURSOS: number, ID_CARRERAS: number, NOMBRE_CARRERAS?: string, NOMBRE_CURSOS?: string }> = [];
  nuevaCarreraArticulada: number = 0;
  nuevoCursoArticulado: number = 0;
  cursosDisponibles: any[] = [];
  cursos: any[] = [];
  docentes: any[] = [];

  // Configuración del calendario optimizada
  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, rrulePlugin],
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
      const asignaturaId = info.event.extendedProps['asignaturaId'];
      if (asignaturaId) {
        info.el.style.backgroundColor = this.colorManager.getColorForSubject(asignaturaId);
        info.el.style.borderColor = this.colorManager.getColorForSubject(asignaturaId);
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
    private ngZone: NgZone,
    private notificationService: NotificationService,
    private verHorariosDocentesService: VerHorariosDocentesService
  ) {
    this.setupSearchDebounce();
  }

  // Configurar debounce para búsqueda
  private setupSearchDebounce(): void {
    this.searchInput.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(term => {
      // Lógica de búsqueda si es necesaria
    });
  }

  ngOnInit(): void {
    this.cargarDatosIniciales();
  }


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }



  // Getter para acceder a la API del calendario
  get calendarApi(): Calendar | null {
    return this.calendarComponent?.getApi() || null;
  }

  // Método optimizado para alternar acordeón
  toggleAccordion(): void {
    this.isAccordionOpen = !this.isAccordionOpen;
  }

  // Carga inicial optimizada con manejo de errores
  private cargarDatosIniciales(): void {
    // Cargar períodos
    this.horariosService.obtenerPeriodos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.periodos = data;
          if (this.periodos.length > 0) {
            this.PeriodoSeleccionado = this.periodos[this.periodos.length - 1].ID_PERIODO;
            this.onPeriodoChange(this.PeriodoSeleccionado);
          }
        },
        error: (err) => this.handleError('Error al cargar períodos', err)
      });

    // Cargar aulas
    this.aulasService.obtenerAulas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => this.aulas = data,
        error: (err) => this.handleError('Error al cargar aulas', err)
      });

    // Cargar días
    this.horariosService.obtenerDias()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => this.dias = data,
        error: (err) => this.handleError('Error al cargar días', err)
      });

    this.cargarTodosLosHorarios();

    this.horariosService.obtenerCursos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => this.cursos = data,
        error: (err) => this.handleError('Error al cargar cursos', err)
      });
  }

  // Método optimizado para cargar horarios
  cargarTodosLosHorarios(): void {
    this.notificationService.showLoading('Cargando horarios...');

    // ✅ SOLUCIÓN: Forzar actualización del cache
    this.horariosService.obtenerTodosHorarios(true) // ✅ Pasar true para forzar refresh
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: HorarioDetalle[]) => {
          this.notificationService.hideLoading();


          this.todosLosHorarios = data;
          this.assignColorsToSchedules(data);

          if (this.PeriodoSeleccionado > 0) {
            this.filtrarHorariosPorPeriodo(this.PeriodoSeleccionado);
          } else {
            this.horariosFiltrados = [...this.todosLosHorarios];
            this.actualizarEventosCalendario();
          }
        },
        error: (err) => {
          this.notificationService.hideLoading();
          this.handleError('Error al cargar los horarios', err);
        }
      });
  }


  // Método optimizado para asignar colores
  private assignColorsToSchedules(horarios: HorarioDetalle[]): void {
    // Resetear colores para nueva carga
    this.colorManager.reset();

    // Obtener materias únicas y asignar colores
    const uniqueSubjects = new Set(horarios.map(h => h.asignatura.id));
    uniqueSubjects.forEach(subjectId => {
      this.colorManager.getColorForSubject(subjectId);
    });
  }

  // Filtrar horarios optimizado
  filtrarHorariosPorPeriodo(idPeriodo: number): void {
    // ✅ SOLUCIÓN: Forzar actualización del cache
    this.horariosService.obtenerHorariosPorPeriodoAgrupados(idPeriodo, true)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: HorarioDetalle[]) => {
          this.horariosFiltrados = data;
          this.actualizarEventosCalendario();
        },
        error: (err) => this.handleError('Error al filtrar horarios por periodo', err)
      });
  }
  private combinarFechaHora(fecha: string, hora: string): string {
    const fechaObj = new Date(fecha);
    const [horas, minutos] = hora.split(':');
    fechaObj.setHours(parseInt(horas), parseInt(minutos), 0, 0);
    return fechaObj.toISOString();
  }

  // Actualización de eventos optimizada
  actualizarEventosCalendario(): void {
    const eventos: EventInput[] = this.horariosFiltrados.map(horario => {
      const fechaInicio = new Date(horario.fechaInicio);
      const fechaFin = new Date(horario.fechaFin);
      fechaFin.setDate(fechaFin.getDate() + 1);

      // ✅ SOLUCIÓN: Manejar tanto cursos simples como múltiples
      let cursoNombre: string;
      if (horario.curso.cursos && horario.curso.cursos.length > 0) {
        // Es una clase articulada con múltiples cursos
        cursoNombre = horario.curso.nombre; // Ya viene formateado del backend
      } else {
        // Es una clase regular
        cursoNombre = horario.curso.nombre;
      }

      return {
        id: `horario-${horario.id}`,
        title: `${horario.asignatura.nombre}\n${horario.aula.nombre}\n${cursoNombre}`, // ✅ Agregar curso al título
        daysOfWeek: [this.convertirDiaAFullCalendar(horario.dia.id)],
        startTime: horario.horaInicio,
        endTime: horario.horaFin,
        startRecur: fechaInicio,
        endRecur: fechaFin,
        extendedProps: {
          horarioId: horario.id,
          asignaturaId: horario.asignatura.id,
          docente: horario.docente.nombre,
          aula: horario.aula.nombre,
          carrera: horario.carrera.nombre,
          curso: cursoNombre,
          tipoClase: horario.tipoClase || 'REGULAR', // ✅ Incluir tipo de clase
          cursosArticulados: horario.curso.cursos || null // ✅ Incluir cursos articulados
        }
      };
    });

    this.ngZone.run(() => {
      if (this.calendarApi) {
        this.calendarApi.removeAllEvents();
        this.calendarApi.addEventSource(eventos);

        requestAnimationFrame(() => {
          this.calendarApi?.refetchEvents();
          this.calendarApi?.render();
        });
      } else {
        this.calendarOptions = {
          ...this.calendarOptions,
          events: eventos
        };
        this.cdr.detectChanges();
      }
    });
  }

  // Manejo centralizado de errores
  private handleError(message: string, error: any): void {
    console.error(message, error);
    this.mensajeError = message;
    this.notificationService?.showError?.(message);
  }

  // Conversión de día optimizada
  convertirDiaAFullCalendar(diaId: number): number {
    return diaId === 7 ? 0 : diaId;
  }


  // Handlers de cambio optimizados
  onPeriodoChange(idPeriodo: number): void {
    this.PeriodoSeleccionado = idPeriodo;
    this.resetSelections();
    this.limpiarFormulario();

    this.horariosService.obtenerCarrerasPeriodo(idPeriodo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => this.carreras = data,
        error: (err) => this.handleError('Error al cargar carreras', err)
    });

    this.horariosService.obtenerCarrerasPeriodoArticulado(idPeriodo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => this.carrerasArticuladas = data,
        error: (err) => this.handleError('Error al cargar carreras', err)
    });


    this.horariosService.obtenerDocentePeriodo(idPeriodo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.docentes = data;
        },
        error: (err) => this.handleError('Error al cargar docentes', err)
      });

    this.filtrarHorariosPorPeriodo(idPeriodo);
  }

  onCarreraChange(idCarrera: number): void {
    this.CarreraSeleccionada = idCarrera;
    this.resetSelections();

    if (this.PeriodoSeleccionado > 0 && idCarrera > 0) {
      this.horariosService.obtenerDocenteAsignaturaNivel(this.PeriodoSeleccionado, idCarrera)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (data) => this.docenteAsignaturaNivel = data,
          error: (err) => this.handleError('Error al cargar combinaciones', err)
        });
    }
  }

  // Búsqueda personalizada optimizada
  customSearchFn = (term: string, item: any): boolean => {
    if (!term) return true;

    const searchTerm = term.toLowerCase();
    return item.DOCENTE?.toLowerCase().includes(searchTerm) ||
      item.ASIGNATURA?.toLowerCase().includes(searchTerm) ||
      item.NIVEL?.toLowerCase().includes(searchTerm);
  };



  // Manejo de combinación optimizado
  onCombinacionChange(combinacion: any): void {
    this.resetCombinationSelections();

    if (!combinacion || combinacion === this.DEFAULT_COMBINATION) {
      return;
    }

    if (typeof combinacion === 'object') {
      this.setSelectionFromObject(combinacion);
    } else if (typeof combinacion === 'string') {
      this.setSelectionFromString(combinacion);
    }
  }

  private setSelectionFromObject(combinacion: any): void {
    this.DocenteSeleccionado = Number(combinacion.ID_DOCENTE) || 0;
    this.AsignaturaSeleccionada = Number(combinacion.ID_ASIGNATURA) || 0;
    this.NivelSeleccionado = Number(combinacion.ID_CURSOS) || 0;
  }

  private setSelectionFromString(combinacion: string): void {
    const ids = combinacion.split('-');
    if (ids.length === 3) {
      this.DocenteSeleccionado = Number(ids[0]) || 0;
      this.AsignaturaSeleccionada = Number(ids[1]) || 0;
      this.NivelSeleccionado = Number(ids[2]) || 0;
    }
  }

  private resetCombinationSelections(): void {
    this.DocenteSeleccionado = this.DEFAULT_SELECTION;
    this.AsignaturaSeleccionada = this.DEFAULT_SELECTION;
    this.NivelSeleccionado = this.DEFAULT_SELECTION;
  }

  private resetSelections(): void {
    this.CombinacionSeleccionada = this.DEFAULT_COMBINATION;
    this.resetCombinationSelections();
    this.docenteAsignaturaNivel = [];
  }

  // Asignar horario optimizado
  asignarHorario(): void {
    if (!this.validateHorarioData()) {
      this.notificationService.showWarningReport(
        'Datos incompletos',
        'Por favor, completa todos los campos requeridos antes de asignar el horario.',
        'Entendido'
      );
      return;
    }

    const horarioData = this.buildHorarioData();
    this.notificationService.showLoading('Asignando horario...');

    this.horariosService.asignarHorario(horarioData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: HorarioResponse) => {
          this.notificationService.hideLoading();

          if (res.id) {
            this.notificationService.showSuccessReport(
              'Horario asignado',
              'El horario se asignó correctamente.',
              'Continuar'
            );

            // ✅ SOLUCIÓN: Recargar todos los horarios en lugar de solo obtener el detalle
            this.cargarTodosLosHorarios(); // Esto forzará la actualización completa

            this.limpiarFormulario();

            this.isAccordionOpen = false;
          }
        },
        error: (err) => {
          this.notificationService.hideLoading();
          let mensaje = 'Error desconocido al asignar el horario';

          if (err.error?.output?.payload?.message) {
            mensaje = err.error.output.payload.message;
          } else if (err.error?.message) {
            mensaje = err.error.message;
          } else if (err.message) {
            mensaje = err.message;
          }

          this.notificationService.showErrorReport('Error', mensaje, 'Cerrar');
        }
      });
  }



  private validateHorarioData(): boolean {
    const requiredFields = [
      this.PeriodoSeleccionado,
      this.DocenteSeleccionado,
      this.AsignaturaSeleccionada,
      this.DiaSeleccionado,
      this.AulaSeleccionada
    ];

    if (requiredFields.some(field => !field) || !this.horaInicio || !this.horaFin) {
      this.mensajeError = 'Debe completar todos los campos obligatorios';
      return false;
    }

    // Validación específica para tipo de clase
    if (this.tipoClaseSeleccionado === 'regular') {
      return this.CarreraSeleccionada > 0 && this.NivelSeleccionado > 0;
    } else if (this.tipoClaseSeleccionado === 'articulada') {
      return this.cursosArticulados.length > 0;
    }

    return false;
  }

  private buildHorarioData(): any {
    let horarioData: any = {
      ID_PERIODO: this.PeriodoSeleccionado,
      ID_DOCENTE: this.DocenteSeleccionado,
      ID_ASIGNATURA: this.AsignaturaSeleccionada,
      ID_DIA: this.DiaSeleccionado,
      ID_AULA: this.AulaSeleccionada,
      HORA_INICIO: this.horaInicio,
      HORA_FIN: this.horaFin,
      FECHA_INICIO: this.fechaInicio,
      FECHA_FIN: this.fechaFin
    };

    if (this.tipoClaseSeleccionado === 'regular') {
      horarioData.ID_CARRERAS = this.CarreraSeleccionada;
      horarioData.ID_CURSOS = this.NivelSeleccionado;
    } else if (this.tipoClaseSeleccionado === 'articulada') {
      horarioData.cursosArticulados = this.cursosArticulados;
    }

    return horarioData;
  }

  // Limpiar formulario
  limpiarFormulario(): void {
    this.AulaSeleccionada = this.DEFAULT_SELECTION;
    this.DiaSeleccionado = this.DEFAULT_SELECTION;
    this.cursosArticulados = [];
    this.CarreraSeleccionada = this.DEFAULT_SELECTION;
    this.DocenteAsignaturaSeleccionada = null;
    this.docentes = [];
    this.DocenteSeleccionado = 0;
  }

  // Obtener detalle de horario
  obtenerDetalleHorario(idHorario: number): void {
    this.horariosService.obtenerDetalleHorario(idHorario)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (detalle: HorarioDetalle) => {
          detalle.id = idHorario;

          // ✅ SOLUCIÓN: Verificar si ya existe antes de agregar
          const existeIndex = this.todosLosHorarios.findIndex(h => h.id === idHorario);
          if (existeIndex >= 0) {
            this.todosLosHorarios[existeIndex] = detalle;
          } else {
            this.todosLosHorarios = [...this.todosLosHorarios, detalle];
          }

          if (this.PeriodoSeleccionado > 0) {
            const existeFiltradoIndex = this.horariosFiltrados.findIndex(h => h.id === idHorario);
            if (existeFiltradoIndex >= 0) {
              this.horariosFiltrados[existeFiltradoIndex] = detalle;
            } else {
              this.horariosFiltrados = [...this.horariosFiltrados, detalle];
            }

            this.colorManager.getColorForSubject(detalle.asignatura.id);
            this.actualizarEventosCalendario();
          }
        },
        error: (err) => this.handleError('Error al obtener el detalle del horario', err)
      });
  }

  // Formatear hora optimizado
  formatHora = (hora: string): string => {
    return hora ? hora.substring(0, 5) : '';
  };

  // Formatear fecha optimizado
  formatFecha = (fecha: string): string => {
    return fecha ? fecha.split('T')[0] : '';
  };

  // Getter optimizado para materias únicas
  get materiasUnicas(): Array<{ id: number, nombre: string, color: string }> {
    const materiasMap = new Map<number, { id: number, nombre: string, color: string }>();

    this.horariosFiltrados.forEach(horario => {
      const id = horario.asignatura.id;
      if (!materiasMap.has(id)) {
        materiasMap.set(id, {
          id: id,
          nombre: horario.asignatura.nombre,
          color: this.colorManager.getColorForSubject(id)
        });
      }
    });

    return Array.from(materiasMap.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  // MÉTODOS PARA EL MODAL (continuarían igual pero con optimizaciones similares)

 abrirModalDetalleHorario(horarioId: number): void {
  const horario = this.horariosFiltrados.find(h => h.id === horarioId);

  if (horario) {
    this.horarioSeleccionado = { ...horario };
    this.modoEdicion = false;
    this.editHoraInicio = this.formatHora(horario.horaInicio);
    this.editHoraFin = this.formatHora(horario.horaFin);
    this.editAulaSeleccionada = horario.aula.id;
    this.editDiaSeleccionado = horario.dia.id;
    this.editFechaFin = this.formatFecha(horario.fechaFin);
    this.editFechaInicio = this.formatFecha(horario.fechaInicio);
    this.editDocenteSeleccionado = Number(horario.docente.id);

    // ✅ CORRECCIÓN: Preservar el tipo de clase correctamente
    if (!horario.tipoClase) {
      // Si no tiene tipoClase definido, determinarlo por los cursos
      if (horario.curso.cursos && horario.curso.cursos.length > 0) {
        this.horarioSeleccionado.tipoClase = 'articulada';
      } else {
        this.horarioSeleccionado.tipoClase = 'regular';
      }
    }

    this.modalVisible = true;
  }
}


  cerrarModal(): void {
    this.modalVisible = false;
    this.horarioSeleccionado = null;
    this.modoEdicion = false;
    this.mensajeModal = '';
    this.tipoMensajeModal = '';
  }

  activarModoEdicion(): void {
    this.modoEdicion = true;
    this.mensajeModal = '';
    this.tipoMensajeModal = '';
  }

  cancelarEdicion(): void {
    if (this.horarioSeleccionado) {
      this.editDocenteSeleccionado = this.horarioSeleccionado.docente.id;
      this.editHoraInicio = this.formatHora(this.horarioSeleccionado.horaInicio);
      this.editHoraFin = this.formatHora(this.horarioSeleccionado.horaFin);
      this.editAulaSeleccionada = this.horarioSeleccionado.aula.id;
      this.editDiaSeleccionado = this.horarioSeleccionado.dia.id;
      this.editFechaFin = this.formatFecha(this.horarioSeleccionado.fechaFin);
      this.editFechaInicio = this.formatFecha(this.horarioSeleccionado.fechaInicio);
    }

    this.modoEdicion = false;
    this.mensajeModal = '';
    this.tipoMensajeModal = '';
  }

  // Los métodos restantes del modal continuarían con la misma lógica pero aplicando
  // las mismas optimizaciones de manejo de errores y subscripciones

  // Guarda los cambios en un horario
guardarCambiosHorario(): void {
  if (!this.horarioSeleccionado || !this.horarioSeleccionado.id) {
    this.notificationService.showErrorReport(
      'Error',
      'No se puede actualizar el horario',
      'Cerrar'
    );
    return;
  }

  // Comprobar si los valores son válidos antes de enviar
  if (!this.editAulaSeleccionada || !this.editDiaSeleccionado) {
    this.notificationService.showErrorReport(
      'Error',
      'Debe seleccionar un aula y un día válidos',
      'Cerrar'
    );
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
    this.notificationService.showErrorReport(
      'Error',
      'Debe proporcionar horarios válidos',
      'Cerrar'
    );
    return;
  }

  // Convertir los IDs a números para asegurar que sean del tipo correcto
  const aulaId = Number(this.editAulaSeleccionada);
  const diaId = Number(this.editDiaSeleccionado);
    const docenteId = Number(this.editDocenteSeleccionado);


  const aulaSeleccionada = this.aulas.find(a => Number(a.ID_AULA) === aulaId);
  const diaSeleccionado = this.dias.find(d => Number(d.ID_DIA) === diaId);

  // Verificar si encontramos el aula y el día antes de continuar
  if (!aulaSeleccionada || !diaSeleccionado) {
    this.notificationService.showErrorReport(
      'Error',
      'No se pudo encontrar el aula o el día seleccionado',
      'Cerrar'
    );
    return;
  }

  // ✅ CORRECCIÓN: Construir datos según el tipo de horario
  let horarioActualizado: any = {
    ID_HORARIO: Number(this.horarioSeleccionado.id),
    ID_PERIODO: this.PeriodoSeleccionado,
    ID_DOCENTE: docenteId,
    ID_ASIGNATURA: this.horarioSeleccionado.asignatura.id,
    ID_AULA: aulaId,
    ID_DIA: diaId,
    HORA_INICIO: this.formatHora(this.editHoraInicio),
    HORA_FIN: this.formatHora(this.editHoraFin),
    FECHA_INICIO: this.formatFecha(this.editFechaInicio),
    FECHA_FIN: this.formatFecha(this.editFechaFin),
  };

    // ✅ CORRECCIÓN: Preservar el tipo de horario original
    if (this.horarioSeleccionado.tipoClase === 'ARTICULADA' ||
        (this.horarioSeleccionado.carrera.carreras && this.horarioSeleccionado.carrera.carreras.length > 0)) {
      // Es un horario articulado - preservar los cursos articulados CORRECTAMENTE
      horarioActualizado.cursosArticulados = this.horarioSeleccionado.carrera.carreras?.map(carrera => ({
        ID_CURSOS: this.horarioSeleccionado!.curso.id,        // ✅ Usar ! para asegurar que no es null
        ID_CARRERAS: carrera.id,                             // ✅ ID de cada carrera (4, 5)
        ID_ASIGNATURA: this.horarioSeleccionado!.asignatura.id // ✅ Usar ! para asegurar que no es null
      })) || [];

    } else {
      // Es un horario regular - enviar carrera y curso individuales
      horarioActualizado.ID_CARRERAS = this.horarioSeleccionado!.carrera.id;
      horarioActualizado.ID_CURSOS = this.horarioSeleccionado!.curso.id;
    }

  // Mostrar loading
  this.notificationService.showLoading('Actualizando horario...');

  this.horariosService.actualizarHorario(horarioActualizado).subscribe({
    next: (response) => {
      this.notificationService.hideLoading();

      if (!this.horarioSeleccionado?.docente) {
        this.notificationService.showErrorReport(
          'Error',
          'El docente no está definido',
          'Cerrar'
        );
        return;
      }

            // ...dentro de guardarCambiosHorario()...
            const horarioDetalleActualizado: HorarioDetalle = {
        ...this.horarioSeleccionado,
        horaInicio: formatearHora(this.editHoraInicio),
        horaFin: formatearHora(this.editHoraFin),
        fechaInicio: this.editFechaInicio,
        fechaFin: this.editFechaFin,
        aula: {
          id: aulaId,
          nombre: aulaSeleccionada.NOMBRE_AULA
        },
        dia: {
          id: diaId,
          nombre: diaSeleccionado.NOMBRE_DIA
        },
        // ✅ FORZAR el tipo de clase según la estructura
        tipoClase: (this.horarioSeleccionado.carrera.carreras && this.horarioSeleccionado.carrera.carreras.length > 0)
                    ? 'ARTICULADA'  // ✅ Usar el mismo formato que viene del backend
                    : 'regular',
        // ✅ NO sobrescribir curso ni carrera para articulados
        curso: this.horarioSeleccionado.curso,
        carrera: this.horarioSeleccionado.carrera
      };

      this.ngZone.run(() => {
        this.actualizarHorarioEnListas(horarioDetalleActualizado);

        // Mostrar mensaje de éxito
        this.notificationService.showSuccess(
          response.mensaje || 'Horario actualizado correctamente'
        );

        this.modoEdicion = false;

        // Esperar a que el modal se actualice antes de cerrar
        setTimeout(() => {
          this.cerrarModal();
          // Forzar una actualización completa del calendario
          this.cargarTodosLosHorarios();
        }, 1500);
      });
    },
    error: (error) => {
      this.notificationService.hideLoading();
      console.error('Error en la actualización:', error);

      let mensajeError = 'Error al actualizar el horario';

      // Manejo específico de errores del backend
      if (error.status === 403 && error.error && error.error.message) {
        mensajeError = error.error.message;
      } else if (error.status === 404 && error.error && error.error.message) {
        mensajeError = error.error.message;
      } else if (error.status === 409 && error.error && error.error.message) {
        mensajeError = error.error.message;
      } else if (error.error) {
        if (error.error.message) {
          mensajeError = error.error.message;
        } else if (typeof error.error === 'string') {
          mensajeError = error.error;
        }
      } else if (error.message) {
        mensajeError = error.message;
      }

      this.notificationService.showErrorReport(
        'Error',
        mensajeError,
        'Cerrar'
      );
    }
  });
}

  // Actualiza el horario en todas las listas
  private actualizarHorarioEnListas(horarioActualizado: HorarioDetalle): void {
    // ✅ SOLUCIÓN: Mejorar la actualización de listas
    const actualizarLista = (lista: HorarioDetalle[]) =>
      lista.map(h => h.id === horarioActualizado.id ? horarioActualizado : h);

    this.horariosFiltrados = actualizarLista(this.horariosFiltrados);
    this.todosLosHorarios = actualizarLista(this.todosLosHorarios);
    this.horarioSeleccionado = horarioActualizado;

    this.ngZone.run(() => {
      if (this.calendarApi) {
        const eventoId = `horario-${horarioActualizado.id}`;
        const eventoExistente = this.calendarApi.getEventById(eventoId);

        if (eventoExistente) {
          eventoExistente.remove();
        }

        // ✅ Manejar curso múltiple en la actualización
        let cursoNombre: string;
        if (horarioActualizado.curso.cursos && horarioActualizado.curso.cursos.length > 0) {
          cursoNombre = horarioActualizado.curso.nombre;
        } else {
          cursoNombre = horarioActualizado.curso.nombre;
        }

        const nuevoEvento = {
          id: eventoId,
          title: `${horarioActualizado.asignatura.nombre}\n${horarioActualizado.aula.nombre}\n${cursoNombre}`,
          startTime: horarioActualizado.horaInicio,
          endTime: horarioActualizado.horaFin,
          daysOfWeek: [this.convertirDiaAFullCalendar(horarioActualizado.dia.id)],
          extendedProps: {
            horarioId: horarioActualizado.id,
            asignaturaId: horarioActualizado.asignatura.id,
            docente: horarioActualizado.docente.nombre,
            aula: horarioActualizado.aula.nombre,
            carrera: horarioActualizado.carrera.nombre,
            curso: cursoNombre,
            tipoClase: horarioActualizado.tipoClase || 'REGULAR',
            cursosArticulados: horarioActualizado.curso.cursos || null
          }
        };

        this.calendarApi.addEvent(nuevoEvento);
        this.calendarApi.refetchEvents();
      } else {
        this.actualizarEventosCalendario();
      }

      this.cdr.detectChanges();
    });
  }

  // Elimina un horario
  eliminarHorario(): void {
    if (!this.horarioSeleccionado || !this.horarioSeleccionado.id) {
      this.notificationService.showWarningReport(
        'Selección requerida',
        'No se puede eliminar el horario porque no se ha seleccionado ninguno.',
        'Entendido'
      );
      return;
    }

    this.notificationService.showConfirm(
      '¿Estás seguro?',
      'Esta acción eliminará el horario y no se puede deshacer.',
      'Sí, eliminar',
      'Cancelar'
    ).then((confirmado: boolean) => {
      if (confirmado) {
        this.notificationService.showLoading('Eliminando horario...');

        this.horariosService.eliminarHorario(this.horarioSeleccionado!.id!).subscribe({
          next: () => {
            const horarioId = this.horarioSeleccionado?.id;

            if (horarioId) {
              this.horariosFiltrados = this.horariosFiltrados.filter(h => h.id !== horarioId);
              this.todosLosHorarios = this.todosLosHorarios.filter(h => h.id !== horarioId);
              this.actualizarEventosCalendario();
              this.cerrarModal();

              this.notificationService.showSuccess(
                'Horario eliminado correctamente.'
              );
            }

            this.notificationService.hideLoading();
          },
          error: (err) => {
            this.notificationService.hideLoading();

            let mensaje = 'Error al eliminar el horario';
            if (err.error?.output?.payload?.message) {
              mensaje = err.error.output.payload.message;
            } else if (err.error?.message) {
              mensaje = err.error.message;
            } else if (err.message) {
              mensaje = err.message;
            }

            this.notificationService.showErrorReport('Error', mensaje, 'Cerrar');
          }
        });
      }
    });
  }

  //metodos para clases articuladas y regulares
  onTipoClaseChange(tipo: string) {
    this.tipoClaseSeleccionado = tipo;

    if (tipo === 'articulada') {
      this.CarreraSeleccionada = this.DEFAULT_SELECTION;
      this.cursosArticulados = [];
    } else {
      this.cursosArticulados = [];
      this.nuevaCarreraArticulada = 0;
      this.nuevoCursoArticulado = 0;
    }

  }

  onNuevaCarreraArticuladaChange(carreraId: number) {
    this.nuevaCarreraArticulada = carreraId;
    this.nuevoCursoArticulado = 0;

    if (carreraId) {
      this.cursosDisponibles = this.cursos;
    } else {
      this.cursosDisponibles = [];
    }
  }

agregarCursoArticulado() {
  if (this.nuevaCarreraArticulada && this.nuevoCursoArticulado) {
    const yaExiste = this.cursosArticulados.some(curso =>
      curso.ID_CARRERAS === this.nuevaCarreraArticulada &&
      curso.ID_CURSOS === this.nuevoCursoArticulado
    );

    if (!yaExiste) {
      // Buscar los objetos completos para obtener los nombres
      const carreraSeleccionada = this.carrerasArticuladas.find(c => c.ID_CARRERAS === this.nuevaCarreraArticulada);
      const cursoSeleccionado = this.cursosDisponibles.find(c => c.ID_CURSOS === this.nuevoCursoArticulado);

      this.cursosArticulados.push({
        ID_CARRERAS: this.nuevaCarreraArticulada,
        ID_CURSOS: this.nuevoCursoArticulado,
        NOMBRE_CARRERAS: carreraSeleccionada?.NOMBRE_CARRERAS || 'Sin nombre',
        NOMBRE_CURSOS: cursoSeleccionado?.NOMBRE_CURSOS || 'Sin nombre'
      });

      this.nuevaCarreraArticulada = 0;
      this.nuevoCursoArticulado = 0;
      this.cursosDisponibles = [];
    } else {
      this.notificationService.showWarning('Esta combinación ya está agregada');
    }
  }
}

  eliminarCursoArticulado(index: number) {
    this.cursosArticulados.splice(index, 1);
  }

  getCarreraNombre(carreraId: number): string {
    const carrera = this.carrerasArticuladas.find(c => c.ID_CARRERAS === carreraId);
    return carrera ? carrera.NOMBRE_CARRERAS : 'N/A';
  }

  getCursoNombre(cursoId: number): string {
    const curso = this.cursos.find(c => c.ID_CURSOS === cursoId);
    return curso ? curso.NOMBRE_CURSOS : 'N/A';
  }

  cargarDocenteAsignaturaNivel() {
    if (this.PeriodoSeleccionado > 0) {
      let parametros: any = {
        periodo: this.PeriodoSeleccionado
      };

      if (this.tipoClaseSeleccionado === 'regular' && this.CarreraSeleccionada > 0) {
        parametros.carrera = this.CarreraSeleccionada;
      } else if (this.tipoClaseSeleccionado === 'articulada' && this.cursosArticulados.length > 0) {
        parametros.cursosArticulados = this.cursosArticulados;
      }

      this.horariosService.obtenerDocenteAsignaturaNivel(this.PeriodoSeleccionado, parametros.carrera || null)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (data) => this.docenteAsignaturaNivel = data,
          error: (err) => this.handleError('Error al cargar combinaciones', err)
        });
    }
  }

  // Tipo/Interfaz
  DocenteAsignaturaSeleccionada: {
    ID_DOCENTE: number;
    DOCENTE: string;
    ID_ASIGNATURA: number;
    ASIGNATURA: string;
  } | null = null;



  // Método para cargar datos (reemplaza tu método actual)
  cargarDocentesConAsignaturas(idPeriodo: number) {
    this.horariosService.obtenerDocentePeriodo(idPeriodo).subscribe({
      next: (data) => {
        // Tu JSON ya viene con la estructura correcta
        this.docentes = data;
      },
      error: (error) => {

      }
    });
  }

  // Método cuando cambia la selección
  onDocenteAsignaturaChange(seleccionado: any) {
    if (seleccionado) {
      this.DocenteSeleccionado = seleccionado.ID_DOCENTE;
      this.AsignaturaSeleccionada = seleccionado.ID_ASIGNATURA;
    }
  }

  // Devuelve una lista de docentes únicos (por ID) para evitar duplicados en el select
  // En tu componente
get docentesUnicos() {
  return this.docentes.filter((docente, index, self) =>
    index === self.findIndex(d => d.ID_DOCENTE === docente.ID_DOCENTE)
  );
}
}