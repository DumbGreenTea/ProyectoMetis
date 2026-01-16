
import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { Users, Filter, X } from 'lucide-react';
import { Alumni, DashboardState, ChartData, GraduateRow } from './types';
import { generateMockData, CARRERAS, UAI_COLORS } from './constants';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

const toOptionalText = (value: string | null | undefined) => {
  if (!value) return null;
  const normalized = value.trim();
  if (!normalized) return null;
  const lower = normalized.toLowerCase();
  if (lower === 'sin dato' || lower === 'sin información') return null;
  return normalized;
};

const mapGraduateRow = (row: GraduateRow, index: number): Alumni => ({
  id: row.rut || `ALU-${index}`,
  carrera: toOptionalText(row.career) ?? 'Sin dato',
  empleadoPrimerAnio: row.work_current,
  rubro: toOptionalText(row.industry),
  empresa: toOptionalText(row.company),
  departamento: toOptionalText(row.department),
  cargo: toOptionalText(row.role),
});

const App: React.FC = () => {
  const [data, setData] = useState<Alumni[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<DashboardState>({
    selectedCareers: [],
    selectedCompany: null
  });

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${API_BASE_URL}/analytics/graduates`);
        if (!response.ok) {
          throw new Error(`Error ${response.status} al cargar datos`);
        }
        const rows: GraduateRow[] = await response.json();
        if (active) {
          setData(rows.map(mapGraduateRow));
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Error al cargar datos');
          setData(generateMockData(1000));
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadData();
    return () => {
      active = false;
    };
  }, []);

  const filteredData = useMemo(() => {
    return data.filter(alumni => {
      const careerMatch = state.selectedCareers.length === 0 || state.selectedCareers.includes(alumni.carrera);
      const companyMatch = !state.selectedCompany || alumni.empresa === state.selectedCompany;
      return careerMatch && companyMatch;
    });
  }, [data, state]);

  const kpis = useMemo(() => {
    const total = filteredData.length;
    const employed1Yr = filteredData.filter(a => a.empleadoPrimerAnio).length;
    return {
      total,
      employabilityRate: total > 0 ? (employed1Yr / total) * 100 : 0,
    };
  }, [filteredData]);

  const rubrosChartData = useMemo((): ChartData[] => {
    const counts: Record<string, number> = {};
    filteredData.forEach(a => {
      const key = a.rubro || 'Sin información';
      counts[key] = (counts[key] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const top5 = sorted.slice(0, 5);
    const others = sorted.slice(5).reduce((acc, curr) => acc + curr[1], 0);
    const result = top5.map(([name, value]) => ({ name, value }));
    if (others > 0) result.push({ name: 'Otros', value: others });
    return result;
  }, [filteredData]);

  const empresasChartData = useMemo((): ChartData[] => {
    const counts: Record<string, number> = {};
    filteredData.forEach(a => {
      if (a.empresa) counts[a.empresa] = (counts[a.empresa] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [filteredData]);

  const cargosChartData = useMemo((): ChartData[] => {
    const counts: Record<string, number> = {};
    filteredData.forEach(a => {
      if (a.cargo) counts[a.cargo] = (counts[a.cargo] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [filteredData]);

  const deptosChartData = useMemo((): ChartData[] => {
    const counts: Record<string, number> = {};
    filteredData.forEach(a => {
      if (a.departamento) counts[a.departamento] = (counts[a.departamento] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 4);
  }, [filteredData]);

  // Matrix Logic: Empresa x Departamento
  const matrixData = useMemo(() => {
    // 1. Get Top 5 Companies
    const companyCounts: Record<string, number> = {};
    filteredData.forEach(a => {
      if (a.empresa) companyCounts[a.empresa] = (companyCounts[a.empresa] || 0) + 1;
    });
    const sortedCompanies = Object.entries(companyCounts).sort((a, b) => b[1] - a[1]);
    const top5Companies = sortedCompanies.slice(0, 5).map(e => e[0]);
    
    // 2. Get Top 5 Departments
    const deptCounts: Record<string, number> = {};
    filteredData.forEach(a => {
      if (a.departamento) deptCounts[a.departamento] = (deptCounts[a.departamento] || 0) + 1;
    });
    const sortedDepts = Object.entries(deptCounts).sort((a, b) => b[1] - a[1]);
    const top5Depts = sortedDepts.slice(0, 5).map(e => e[0]);

    // 3. Populate Matrix
    const matrix: Record<string, Record<string, number>> = {};
    const rowKeys = [...top5Companies, 'Otras empresas'];
    const colKeys = [...top5Depts, 'Otros departamentos'];

    rowKeys.forEach(r => {
      matrix[r] = {};
      colKeys.forEach(c => {
        matrix[r][c] = 0;
      });
    });

    filteredData.forEach(a => {
      if (!a.empresa || !a.departamento) return;
      
      const row = top5Companies.includes(a.empresa) ? a.empresa : 'Otras empresas';
      const col = top5Depts.includes(a.departamento) ? a.departamento : 'Otros departamentos';
      
      matrix[row][col] += 1;
    });

    return { rowKeys, colKeys, matrix };
  }, [filteredData]);

  const selectOnlyCareer = (career: string | null) => {
    setState(prev => ({
      ...prev,
      selectedCareers: career ? [career] : []
    }));
  };

  return (
    <div className="flex h-screen bg-[#f1f3f6] overflow-hidden">
      {/* Sidebar - Vertical Menu */}
      <aside className="w-72 bg-white border-r border-slate-200 overflow-y-auto p-6 flex flex-col space-y-2">
        <div className="mb-6">
          <div className="bg-[#BD2130] w-12 h-12 flex items-center justify-center rounded-lg mb-2">
            <span className="text-white font-bold text-xl uppercase">UAI</span>
          </div>
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Pregrado Alumni</h2>
        </div>

        <button
          onClick={() => selectOnlyCareer(null)}
          className={`text-left px-4 py-3 rounded-2xl text-xs font-medium border transition-all ${
            state.selectedCareers.length === 0 
              ? 'bg-slate-100 border-slate-300 text-slate-900 shadow-sm' 
              : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'
          }`}
        >
          Todas las carreras de pregrado
        </button>

        {CARRERAS.map(carrera => (
          <button
            key={carrera}
            onClick={() => selectOnlyCareer(carrera)}
            className={`text-left px-4 py-2.5 rounded-2xl text-[11px] font-medium border transition-all ${
              state.selectedCareers.includes(carrera)
                ? 'bg-white border-[#BD2130] text-[#BD2130] shadow-sm font-bold'
                : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'
            }`}
          >
            {carrera}
          </button>
        ))}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-[1200px] mx-auto space-y-6">
          {(loading || error) && (
            <div className="text-[11px] font-semibold uppercase tracking-wide">
              {loading && <span className="text-slate-500">Cargando datos desde el backend...</span>}
              {error && <span className="text-red-600">No se pudo conectar al backend: {error}</span>}
            </div>
          )}
          
          {/* Top Row: KPIs + Cargos Chart */}
          <div className="grid grid-cols-12 gap-6 items-stretch">
            {/* KPI 1 */}
            <div className="col-span-12 md:col-span-3 bg-white border border-black p-8 flex flex-col items-center justify-center text-center">
              <h2 className="text-6xl font-black text-slate-900 leading-none">
                {kpis.employabilityRate.toFixed(0)}%
              </h2>
              <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-slate-800 leading-tight">
                Índice de Empleabilidad<br/>al primer año
              </p>
            </div>

            {/* KPI 2 */}
            <div className="col-span-12 md:col-span-4 bg-white border border-black p-8 flex flex-col items-center justify-center text-center">
              <h2 className="text-6xl font-black text-slate-900 leading-none">
                {kpis.total.toLocaleString()}
              </h2>
              <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-slate-800 leading-tight">
                Total de estudiantes egresados
              </p>
            </div>

            {/* Cargos Chart (Vertical Bars) */}
            <div className="col-span-12 md:col-span-5 bg-white border border-black p-6">
              <h4 className="text-[10px] font-bold uppercase text-center mb-6 tracking-widest text-slate-800">
                Cargos más comunes<br/>entre nuestros egresados UAI
              </h4>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cargosChartData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                    <Bar dataKey="value" fill="#d1a3ff" radius={[4, 4, 0, 0]} />
                    <XAxis dataKey="name" hide />
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{fontSize: '10px'}} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Bottom Row: Rubros, Empresas, Departamentos */}
          <div className="grid grid-cols-12 gap-6 items-stretch">
            
            {/* Rubros Chart */}
            <div className="col-span-12 md:col-span-4 bg-white border border-black p-6">
              <h4 className="text-[10px] font-bold uppercase text-center mb-6 tracking-widest text-slate-800">
                Rubros empresariales donde trabajan actualmente nuestros egresados UAI
              </h4>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={rubrosChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      stroke="none"
                      dataKey="value"
                    >
                      {rubrosChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#3b0086', '#6315c2', '#a060f0', '#d1a3ff', '#e8d4ff'][index % 5]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{fontSize: '10px'}} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Empresas Chart (Horizontal Bars) */}
            <div className="col-span-12 md:col-span-4 bg-white border border-black p-6">
              <h4 className="text-[10px] font-bold uppercase text-center mb-6 tracking-widest text-slate-800">
                Empresas con mayor<br/>número de empleados UAI
              </h4>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={empresasChartData} margin={{ left: -10, right: 20 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 600}} width={80} />
                    <Bar dataKey="value" fill="#7d30f5" radius={[0, 4, 4, 0]} barSize={20} />
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{fontSize: '10px'}} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Departamentos Chart (Donut) */}
            <div className="col-span-12 md:col-span-4 bg-white border border-black p-6">
              <h4 className="text-[10px] font-bold uppercase text-center mb-6 tracking-widest text-slate-800">
                Departamentos más comunes<br/>entre nuestros egresados UAI
              </h4>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deptosChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      stroke="none"
                      dataKey="value"
                    >
                      {deptosChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#421a8d', '#6f42c1', '#a685e2', '#cdb4db'][index % 4]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{fontSize: '10px'}} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* New Section: Matrix Empresa x Departamento */}
          <div className="bg-white border border-black p-6">
            <h4 className="text-[10px] font-bold uppercase text-center mb-8 tracking-widest text-slate-800">
              Matriz Empresa × Departamento (Egresados Únicos)
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-slate-300 text-[10px]">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="border border-slate-300 p-2 text-left font-bold uppercase bg-white">Empresa \ Depto</th>
                    {matrixData.colKeys.map(col => (
                      <th key={col} className="border border-slate-300 p-2 text-center font-bold uppercase">{col}</th>
                    ))}
                    <th className="border border-slate-300 p-2 text-center font-bold uppercase bg-slate-100 text-slate-900">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {matrixData.rowKeys.map(row => {
                    const rowTotal = matrixData.colKeys.reduce((acc, col) => acc + matrixData.matrix[row][col], 0);
                    return (
                      <tr key={row} className="hover:bg-slate-50 transition-colors">
                        <td className="border border-slate-300 p-2 font-bold bg-white text-slate-700">{row}</td>
                        {matrixData.colKeys.map(col => {
                          const val = matrixData.matrix[row][col];
                          return (
                            <td key={col} className={`border border-slate-300 p-2 text-center ${val > 0 ? 'text-[#6315c2] font-black' : 'text-slate-300'}`}>
                              {val}
                            </td>
                          );
                        })}
                        <td className="border border-slate-300 p-2 text-center font-black bg-slate-50 text-slate-900">
                          {rowTotal}
                        </td>
                      </tr>
                    );
                  })}
                  {/* Totals Row */}
                  <tr className="bg-slate-100 font-bold">
                    <td className="border border-slate-300 p-2 uppercase">Total por Depto</td>
                    {matrixData.colKeys.map(col => (
                      <td key={col} className="border border-slate-300 p-2 text-center text-slate-900">
                        {matrixData.rowKeys.reduce((acc, row) => acc + matrixData.matrix[row][col], 0)}
                      </td>
                    ))}
                    <td className="border border-slate-300 p-2 text-center text-white bg-slate-900">
                      {matrixData.rowKeys.reduce((acc, row) => 
                        acc + matrixData.colKeys.reduce((colAcc, col) => colAcc + matrixData.matrix[row][col], 0)
                      , 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <footer className="pt-4 flex justify-between items-center text-[10px] font-bold uppercase text-slate-400">
            <span>Indicadores calculados solo con trabajos actuales</span>
            <span>UAI • Alumni Traceability Platform</span>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default App;
