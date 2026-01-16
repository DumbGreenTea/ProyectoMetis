
export interface Alumni {
  id: string;
  carrera: string;
  empleadoPrimerAnio: boolean;
  rubro: string | null;
  empresa: string | null;
  departamento: string | null;
  cargo: string | null;
}

export interface DashboardState {
  selectedCareers: string[];
  selectedCompany: string | null;
}

export interface ChartData {
  name: string;
  value: number;
}

export interface GraduateRow {
  rut: string;
  career: string;
  graduation_date: string | null;
  work_current: boolean;
  country: string;
  company: string;
  department: string;
  role: string;
  industry: string;
  job_start_date: string | null;
}
