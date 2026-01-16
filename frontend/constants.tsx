
import { Alumni } from './types';

export const UAI_COLORS = {
  primary: '#2F4A64',
  secondary: '#7FB7A5',
  accent: '#5B7D8D',
  chartColors: ['#2F4A64', '#3E5D79', '#567290', '#6C88A5', '#7FB7A5', '#9AC9BA', '#B5DBC9', '#D0EDD9']
};

export const CARRERAS = [
  'Psicología',
  'Periodismo',
  'Derecho',
  'Ingeniería Comercial',
  'Ingeniería en Diseño',
  'Ingeniería Civil Industrial',
  'Ingeniería Civil Informática',
  'Ingeniería Civil en Bioingeniería',
  'Ingeniería Civil en Energía',
  'Ingeniería Civil Mecánica',
  'Ingeniería Civil en Minería'
];

export const RUBROS = ['Tecnología', 'Banca y Finanzas', 'Consumo Masivo', 'Minería', 'Consultoría', 'Retail', 'Educación', 'Salud'];
export const EMPRESAS = ['Google', 'Bci', 'Latam Airlines', 'Falabella', 'Walmart', 'Codelco', 'Accenture', 'Amazon', 'Enel', 'Scotiabank'];
export const CARGOS = ['Analista', 'Consultor', 'Ingeniero de Software', 'Jefe de Proyectos', 'Gerente de Área', 'Director', 'Fundador', 'Socio'];
export const DEPARTAMENTOS = [
  'Marketing',
  'Comercial',
  'Finanzas',
  'Operaciones',
  'Tecnología',
  'Recursos Humanos',
  'Estrategia y Dirección',
  'Legal y Compliance',
  'Innovación y Emprendimiento',
  'Sector Público',
  'Educación / Academia'
];

export const generateMockData = (count: number): Alumni[] => {
  const data: Alumni[] = [];
  for (let i = 0; i < count; i++) {
    const hasData = Math.random() > 0.10;
    data.push({
      id: `ALU-${i}`,
      carrera: CARRERAS[Math.floor(Math.random() * CARRERAS.length)],
      empleadoPrimerAnio: Math.random() > 0.12,
      rubro: hasData ? RUBROS[Math.floor(Math.random() * RUBROS.length)] : null,
      empresa: hasData ? EMPRESAS[Math.floor(Math.random() * EMPRESAS.length)] : null,
      departamento: hasData ? DEPARTAMENTOS[Math.floor(Math.random() * DEPARTAMENTOS.length)] : null,
      cargo: hasData ? CARGOS[Math.floor(Math.random() * CARGOS.length)] : null,
    });
  }
  return data;
};
