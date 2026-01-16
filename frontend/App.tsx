
import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, LabelList, Label
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [state, setState] = useState<DashboardState>({
    selectedCareers: [...CARRERAS],
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
          const mappedData = rows.map(mapGraduateRow);
          setData(mappedData);
          // Debug: ver todas las carreras únicas
          const uniqueCareers = [...new Set(mappedData.map(a => a.carrera))];
          console.log('Carreras únicas en los datos:', uniqueCareers);
          console.log('Total de registros:', mappedData.length);
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
      .slice(0, 5);
  }, [filteredData]);

  const deptosChartData = useMemo((): ChartData[] => {
    const counts: Record<string, number> = {};
    filteredData.forEach(a => {
      if (a.departamento) counts[a.departamento] = (counts[a.departamento] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const top5 = sorted.slice(0, 5);
    const others = sorted.slice(5).reduce((acc, curr) => acc + curr[1], 0);
    const result = top5.map(([name, value]) => ({ name, value }));
    if (others > 0) result.push({ name: 'Otros', value: others });
    return result;
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

  const toggleCareer = (career: string) => {
    setState(prev => ({
      ...prev,
      selectedCareers: prev.selectedCareers.includes(career)
        ? prev.selectedCareers.filter(c => c !== career)
        : [...prev.selectedCareers, career]
    }));
  };

  const toggleAllCareers = () => {
    setState(prev => ({
      ...prev,
      selectedCareers: prev.selectedCareers.length === CARRERAS.length ? [] : [...CARRERAS]
    }));
  };

  return (
    <div className="flex h-screen bg-[#7FB7A5] overflow-hidden">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-[#2F4A64] text-white p-3 rounded-xl shadow-lg hover:bg-[#274158] transition-colors"
        aria-label="Toggle menu"
      >
        {isSidebarOpen ? <X size={24} /> : <Filter size={24} />}
      </button>

      {/* Sidebar Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Vertical Menu */}
      <aside className={`
        w-72 bg-[#2F4A64] border-r border-[#2A4259] overflow-y-auto p-6 flex flex-col space-y-2 scrollbar-custom
        fixed lg:static inset-y-0 left-0 z-40
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#7FB7A5 #2F4A64'
        } as React.CSSProperties & {
          scrollbarWidth?: string;
          scrollbarColor?: string;
        }}
      >
        <div className="mb-4">
          <img
            src="/logo_uai.png"
            alt="UAI Alumni Red Egresados"
            className="w-full h-auto max-h-16 object-contain"
          />
          <h2 className="mt-5 text-xl font-bold tracking-wide text-white text-center">
            Pregrado Alumni
          </h2>
        </div>

        <button
          onClick={toggleAllCareers}
          className={`text-left px-4 py-3 rounded-2xl text-xs font-medium border transition-all duration-300 ease-in-out transform hover:scale-[1.02] ${
            state.selectedCareers.length === CARRERAS.length
              ? 'bg-white border-white text-[#2F4A64] shadow-sm' 
              : 'bg-[#274158] border-[#33526C] text-white/70 hover:bg-[#2B4760]'
          }`}
        >
          Todas las carreras de pregrado
        </button>

        {CARRERAS.map(carrera => {
          const isSelected = state.selectedCareers.includes(carrera);
          return (
            <button
              key={carrera}
              onClick={() => toggleCareer(carrera)}
              className={`text-left px-4 py-2.5 rounded-2xl text-[11px] font-medium border transition-all duration-300 ease-in-out transform hover:scale-[1.02] flex items-center gap-2 ${
                isSelected
                  ? 'bg-white border-white text-[#2F4A64] shadow-sm font-bold'
                  : 'bg-[#274158] border-[#33526C] text-white/70 hover:bg-[#2B4760]'
              }`}
            >
              <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all duration-300 ease-in-out ${
                isSelected ? 'bg-[#7FB7A5] border-[#7FB7A5]' : 'border-white/30'
              }`}>
                {isSelected && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span>{carrera}</span>
            </button>
          );
        })}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scrollbar-custom"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#2F4A64 #7FB7A5'
        } as React.CSSProperties & {
          scrollbarWidth?: string;
          scrollbarColor?: string;
        }}
      >
        <div className="max-w-[1200px] mx-auto space-y-4 sm:space-y-6 pt-16 lg:pt-0">
          {(loading || error) && (
            <div className="text-[11px] font-semibold uppercase tracking-wide">
              {loading && <span className="text-slate-500">Cargando datos desde el backend...</span>}
              {error && <span className="text-red-600">No se pudo conectar al backend: {error}</span>}
            </div>
          )}
          
          {/* Top Row: KPIs + Cargos Chart */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
            {/* KPI 1 */}
            <div className="sm:col-span-1 lg:col-span-3 bg-white border border-[#2F4A64] rounded-xl shadow-lg p-4 sm:p-6 flex flex-col items-center justify-center text-center">
              <h2 className="text-6xl font-black text-slate-900 leading-none">
                {kpis.employabilityRate.toFixed(0)}%
              </h2>
              <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-slate-800 leading-tight">
                Índice de Empleabilidad<br/>al primer año
              </p>
            </div>

            {/* KPI 2 */}
            <div className="sm:col-span-1 lg:col-span-4 bg-white border border-[#2F4A64] rounded-xl shadow-lg p-4 sm:p-6 flex flex-col items-center justify-center text-center">
              <h2 className="text-6xl font-black text-slate-900 leading-none">
                {kpis.total.toLocaleString()}
              </h2>
              <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-slate-800 leading-tight">
                Total de estudiantes egresados
              </p>
            </div>

            {/* Cargos Chart (Vertical Bars) */}
            <div className="sm:col-span-2 lg:col-span-5 bg-white border border-[#2F4A64] rounded-xl shadow-lg p-4 sm:p-6">
              <h4 className="text-[10px] font-bold uppercase text-center mb-4 tracking-widest text-slate-800">
                Cargos más comunes<br/>entre nuestros egresados UAI
              </h4>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cargosChartData} margin={{ top: 20, right: 20, left: 0, bottom: 10 }} barCategoryGap="20%">
                    <Bar 
                      dataKey="value" 
                      fill={UAI_COLORS.primary} 
                      radius={[4, 4, 0, 0]}
                      cursor="pointer"
                      maxBarSize={60}
                      onMouseEnter={(data, index, e) => {
                        e.target.style.opacity = '0.8';
                      }}
                      onMouseLeave={(data, index, e) => {
                        e.target.style.opacity = '1';
                      }}
                    >
                      <LabelList 
                        dataKey="value" 
                        position="top" 
                        style={{ fontSize: '10px', fontWeight: 'bold', fill: '#2F4A64' }}
                        formatter={(value: number) => {
                          const total = cargosChartData.reduce((sum, item) => sum + item.value, 0);
                          return `${((value / total) * 100).toFixed(1)}%`;
                        }}
                      />
                    </Bar>
                    <XAxis dataKey="name" hide />
                    <Tooltip 
                      cursor={{fill: 'rgba(127, 183, 165, 0.1)'}} 
                      contentStyle={{fontSize: '10px'}}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Bottom Row: Rubros, Empresas, Departamentos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 items-stretch">
            
            {/* Rubros Chart */}
            <div className="bg-white border border-[#2F4A64] rounded-xl shadow-lg p-4 sm:p-6">
              <h4 className="text-[10px] font-bold uppercase text-center mb-4 tracking-widest text-slate-800">
                Rubros empresariales donde trabajan actualmente nuestros egresados UAI
              </h4>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={rubrosChartData}
                      cx="50%"
                      cy="45%"
                      outerRadius={75}
                      stroke="none"
                      dataKey="value"
                      label={(props: any) => {
                        const RADIAN = Math.PI / 180;
                        const { cx, cy, midAngle, outerRadius, value } = props;
                        const radius = outerRadius + 15;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        const total = rubrosChartData.reduce((sum, item) => sum + item.value, 0);
                        return (
                          <text x={x} y={y} fill="#2F4A64" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" style={{ fontSize: '11px', fontWeight: 'bold' }}>
                            {`${((value / total) * 100).toFixed(1)}%`}
                          </text>
                        );
                      }}
                      labelLine={false}
                      style={{ cursor: 'pointer' }}
                      activeShape={{
                        strokeWidth: 2,
                        stroke: '#ffffff'
                      }}
                    >
                      {rubrosChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={UAI_COLORS.chartColors[index % UAI_COLORS.chartColors.length]} />
                      ))}
                    </Pie>
                    <Legend 
                      verticalAlign="bottom" 
                      height={50}
                      iconType="circle"
                      wrapperStyle={{ fontSize: '9px', paddingTop: '10px' }}
                    />
                    <Tooltip 
                      contentStyle={{fontSize: '10px', borderRadius: '8px'}}
                      formatter={(value: number) => {
                        const total = rubrosChartData.reduce((sum, item) => sum + item.value, 0);
                        return `${value} (${((value / total) * 100).toFixed(1)}%)`;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Empresas Chart (Horizontal Bars) */}
            <div className="bg-white border border-[#2F4A64] rounded-xl shadow-lg p-4 sm:p-6">
              <h4 className="text-[10px] font-bold uppercase text-center mb-4 tracking-widest text-slate-800">
                Empresas con mayor<br/>número de empleados UAI
              </h4>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={empresasChartData} margin={{ left: -10, right: 30 }} barCategoryGap="15%">
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 600}} width={80} />
                    <Bar 
                      dataKey="value" 
                      fill={UAI_COLORS.primary} 
                      radius={[0, 4, 4, 0]} 
                      maxBarSize={35}
                      cursor="pointer"
                      onMouseEnter={(data, index, e) => {
                        e.target.style.opacity = '0.8';
                      }}
                      onMouseLeave={(data, index, e) => {
                        e.target.style.opacity = '1';
                      }}
                    >
                      <LabelList 
                        dataKey="value" 
                        position="right" 
                        style={{ fontSize: '10px', fontWeight: 'bold', fill: '#2F4A64' }}
                        formatter={(value: number) => {
                          const total = empresasChartData.reduce((sum, item) => sum + item.value, 0);
                          return `${((value / total) * 100).toFixed(1)}%`;
                        }}
                      />
                    </Bar>
                    <Tooltip 
                      cursor={{fill: 'rgba(127, 183, 165, 0.1)'}} 
                      contentStyle={{fontSize: '10px'}}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Departamentos Chart (Donut) */}
            <div className="bg-white border border-[#2F4A64] rounded-xl shadow-lg p-4 sm:p-6">
              <h4 className="text-[10px] font-bold uppercase text-center mb-4 tracking-widest text-slate-800">
                Departamentos más comunes<br/>entre nuestros egresados UAI
              </h4>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deptosChartData}
                      cx="50%"
                      cy="45%"
                      innerRadius={50}
                      outerRadius={80}
                      stroke="none"
                      dataKey="value"
                      label={(props: any) => {
                        const RADIAN = Math.PI / 180;
                        const { cx, cy, midAngle, outerRadius, value } = props;
                        const radius = outerRadius + 15;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        const total = deptosChartData.reduce((sum, item) => sum + item.value, 0);
                        return (
                          <text x={x} y={y} fill="#2F4A64" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" style={{ fontSize: '11px', fontWeight: 'bold' }}>
                            {`${((value / total) * 100).toFixed(1)}%`}
                          </text>
                        );
                      }}
                      labelLine={false}
                      style={{ cursor: 'pointer' }}
                      activeShape={{
                        strokeWidth: 2,
                        stroke: '#ffffff'
                      }}
                    >
                      {deptosChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={UAI_COLORS.chartColors[index % UAI_COLORS.chartColors.length]} />
                      ))}
                    </Pie>
                    <Legend 
                      verticalAlign="bottom" 
                      height={50}
                      iconType="circle"
                      wrapperStyle={{ fontSize: '9px', paddingTop: '10px' }}
                    />
                    <Tooltip 
                      contentStyle={{fontSize: '10px'}} 
                      formatter={(value: number) => {
                        const total = deptosChartData.reduce((sum, item) => sum + item.value, 0);
                        return `${value} (${((value / total) * 100).toFixed(1)}%)`;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* New Section: Matrix Empresa x Departamento */}
          <div className="bg-white border border-[#2F4A64] rounded-xl shadow-lg p-4 sm:p-6">
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
                      <tr key={row} className="transition-colors duration-200">
                        <td className="border border-slate-300 p-2 font-bold bg-white text-slate-700">{row}</td>
                        {matrixData.colKeys.map(col => {
                          const val = matrixData.matrix[row][col];
                          return (
                            <td key={col} className={`border border-slate-300 p-2 text-center transition-all duration-200 ${val > 0 ? 'text-[#2F4A64] font-black hover:bg-[#7FB7A5]/20 hover:scale-110 cursor-pointer' : 'text-slate-300'}`}>
                              {val}
                            </td>
                          );
                        })}
                        <td className="border border-slate-300 p-2 text-center font-black bg-slate-50 text-slate-900 hover:bg-slate-100 transition-colors duration-200">
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

          <footer className="pt-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-[10px] font-bold uppercase text-slate-400 text-center sm:text-left">
            <span>Indicadores calculados solo con trabajos actuales</span>
            <span>UAI • Alumni Traceability Platform</span>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default App;
