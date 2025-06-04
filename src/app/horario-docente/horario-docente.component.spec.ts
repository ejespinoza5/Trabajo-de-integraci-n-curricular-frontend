import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HorarioDocenteComponent } from './horario-docente.component';

describe('HorarioDocenteComponent', () => {
  let component: HorarioDocenteComponent;
  let fixture: ComponentFixture<HorarioDocenteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HorarioDocenteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HorarioDocenteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
