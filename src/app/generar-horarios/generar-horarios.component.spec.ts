import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenerarHorariosComponent } from './generar-horarios.component';

describe('GenerarHorariosComponent', () => {
  let component: GenerarHorariosComponent;
  let fixture: ComponentFixture<GenerarHorariosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GenerarHorariosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GenerarHorariosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
