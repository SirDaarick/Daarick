import React, { useState } from 'react';
import { 
  Building2, 
  User, 
  Receipt, 
  TrendingUp, 
  ShieldCheck, 
  AlertTriangle,
  ArrowRightLeft,
  Sparkles,
  Send
} from 'lucide-react';

interface ReceiptItem {
  id: string;
  name: string;
  category: string;
  amount: string;
  status: string;
  time: string;
  mode: 'BUSINESS' | 'PERSONAL';
}

const PRESET_MESSAGES = [
  { label: '🥩 Insumo Cocina ($450)', text: 'Gasté $450 en verdura e insumos de cocina', mode: 'BUSINESS' as const },
  { label: '🚕 Uber Cliente ($180)', text: 'Uber $180.50 visita con cliente corporativo', mode: 'BUSINESS' as const },
  { label: '🛒 Despensa Hogar ($350)', text: 'Pagué $350 en despensa del hogar', mode: 'PERSONAL' as const },
  { label: '⛽ Gasolina Reparto ($850)', text: 'Gasolina $850 para camioneta de reparto', mode: 'BUSINESS' as const },
  { label: '☕ Café y Cine ($220)', text: 'Café y boletos de cine $220 fin de semana', mode: 'PERSONAL' as const },
];

export const StampyDemo: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'BUSINESS' | 'PERSONAL'>('BUSINESS');
  const [isSimulating, setIsSimulating] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [lcdMessage, setLcdMessage] = useState<string | null>(null);
  const [receiptsList, setReceiptsList] = useState<ReceiptItem[]>([
    { id: '1', name: 'Central de Abastos S.A.', category: 'Insumo Cocina', amount: '$1,450.00', status: '[ ✦ OK ]', time: 'Hoy 11:42 AM', mode: 'BUSINESS' },
    { id: '2', name: 'CFE Suministrador', category: 'Gasto Fijo', amount: '$3,210.00', status: '[ ✦ OK ]', time: 'Ayer 04:15 PM', mode: 'BUSINESS' },
    { id: '3', name: 'Gasolinera Shell #402', category: 'Operativo', amount: '$850.00', status: '[ ✦ OK ]', time: '02 Oct 09:30 AM', mode: 'BUSINESS' },
    { id: '4', name: 'Supermercado Central', category: 'Despensa Personal', amount: '$620.00', status: '[ ✦ OK ]', time: '01 Oct 07:15 PM', mode: 'PERSONAL' },
  ]);

  const parseTextLocally = (text: string, mode: 'BUSINESS' | 'PERSONAL') => {
    const numMatch = text.match(/\$?\s*(\d+([.,]\d{1,2})?)/);
    const amountVal = numMatch ? parseFloat(numMatch[1].replace(',', '.')) : 450.00;
    const formattedAmount = `$${amountVal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

    const lower = text.toLowerCase();
    let name = 'Comercio Local / Varios';
    let category = mode === 'BUSINESS' ? 'Insumos Generales' : 'Gasto Personal';

    if (lower.includes('insumo') || lower.includes('cocina') || lower.includes('fruta') || lower.includes('carne') || lower.includes('verdura')) {
      name = mode === 'BUSINESS' ? 'Central de Abastos / Insumos' : 'Supermercado Local';
      category = mode === 'BUSINESS' ? 'Insumo Cocina' : 'Despensa Personal';
    } else if (lower.includes('uber') || lower.includes('transporte') || lower.includes('taxi')) {
      name = 'Uber Technologies Inc.';
      category = mode === 'BUSINESS' ? 'Transporte & Visita' : 'Movilidad Personal';
    } else if (lower.includes('gasolina') || lower.includes('shell') || lower.includes('combustible')) {
      name = 'Gasolinera Shell #402';
      category = mode === 'BUSINESS' ? 'Combustible Operativo' : 'Gasolina Auto Propio';
    } else if (lower.includes('despensa') || lower.includes('hogar')) {
      name = 'Supermercado Central';
      category = 'Despensa Personal';
    } else if (lower.includes('café') || lower.includes('cine') || lower.includes('cena')) {
      name = 'Restaurante / Ocio';
      category = 'Ocio sin culpa';
    }

    return { name, category, formattedAmount };
  };

  const handleSimulate = (customText?: string) => {
    setIsSimulating(true);
    setLcdMessage('AUDITANDO TICKET DE TELEGRAM... 🔍\nValidando reglas de segregación ' + activeMode + '...');

    const textToSimulate = customText || customInput || (activeMode === 'BUSINESS' 
      ? 'Gasté $450 en verdura e insumos' 
      : 'Pagué $350 en despensa del hogar');

    setTimeout(() => {
      const parsed = parseTextLocally(textToSimulate, activeMode);
      setLcdMessage(`[ ✦ AUDITADO // OK ]\n${parsed.formattedAmount} MXN registrado en ${parsed.category}.`);
      setReceiptsList(prev => [
        {
          id: 'rec-' + Date.now(),
          name: parsed.name,
          category: parsed.category,
          amount: parsed.formattedAmount,
          status: '[ ✦ OK ]',
          time: 'Hace un momento',
          mode: activeMode,
        },
        ...prev
      ]);
      setIsSimulating(false);
      setCustomInput('');
    }, 400);
  };

  const isBusiness = activeMode === 'BUSINESS';
  const filteredReceipts = receiptsList.filter(r => r.mode === activeMode);

  return (
    <div className="w-full rounded-2xl bg-[#E2E8F0] text-slate-800 p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-start shadow-2xl border border-slate-300 font-sans select-none">
      <style>{`
        .stampy-extrusion {
          background: #E2E8F0;
          box-shadow: -6px -6px 14px #FFFFFF, 6px 6px 14px #B8C1CC;
          border-radius: 0.75rem;
          transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .stampy-inset {
          background: #D8DFE9;
          box-shadow: inset 3px 3px 6px #A9B3BE, inset -3px -3px 6px #FFFFFF;
          border-radius: 0.75rem;
        }
        .stampy-screen {
          background-color: #064E3B;
          color: #34D399;
          text-shadow: 0 0 8px rgba(52, 211, 153, 0.6);
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          box-shadow: inset 2px 2px 5px rgba(0, 0, 0, 0.5);
          border-radius: 0.5rem;
        }
      `}</style>

      {/* Master Chassis Top Bar */}
      <header className="w-full max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4 p-4 stampy-extrusion mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
            S
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              STAMPY <span className="text-xs font-mono uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold">v0.1.0-alpha</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">Auditor Financiero & Gestor de Gastos</p>
          </div>
        </div>

        {/* Dual-Scope Mode Switch (Hardware Knurl) */}
        <div className="stampy-inset p-1.5 flex items-center gap-2">
          <button
            onClick={() => setActiveMode('BUSINESS')}
            className={`px-4 py-2 rounded-lg font-semibold text-xs tracking-wider uppercase transition-all flex items-center gap-2 cursor-pointer ${
              isBusiness 
                ? 'stampy-extrusion text-emerald-700 font-bold bg-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Modo Negocio (FinOps)</span>
          </button>
          <button
            onClick={() => setActiveMode('PERSONAL')}
            className={`px-4 py-2 rounded-lg font-semibold text-xs tracking-wider uppercase transition-all flex items-center gap-2 cursor-pointer ${
              !isBusiness 
                ? 'stampy-extrusion text-indigo-700 font-bold bg-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Modo Personal (Wealth)</span>
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <main className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Mascot LCD & Telemetry */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* Stampy Hardware Module */}
          <div className="stampy-extrusion p-6 flex flex-col items-center">
            {/* Visual Character Stamp */}
            <div className="relative w-32 h-36 stampy-inset flex flex-col items-center justify-center mb-6 p-4">
              <div className="text-4xl mb-1 select-none transition-transform hover:scale-110 cursor-pointer">
                {isBusiness ? '👔' : '🧢'}
              </div>
              <div className="w-16 h-10 stampy-screen flex items-center justify-center text-xs font-mono font-bold tracking-widest px-2">
                {isBusiness ? '[ OK ]' : '[ RELAX ]'}
              </div>
              <div className="mt-2 text-[10px] font-mono uppercase text-slate-500 font-semibold tracking-wider">
                STAMPY BOT
              </div>
            </div>

            {/* LCD Telemetry Screen */}
            <div className="w-full stampy-screen p-4 text-xs space-y-2 mb-4">
              <div className="flex items-center justify-between text-[10px] opacity-75 border-b border-emerald-800 pb-1">
                <span>// ESTADO EN VIVO</span>
                <span className="animate-pulse text-emerald-300">● ACTIVO</span>
              </div>
              <p className="font-mono leading-relaxed whitespace-pre-line text-emerald-300">
                {lcdMessage || (isBusiness 
                  ? 'MODO NEGOCIO AUDITADO. PRIME COST VIGILADO AL 54.2% (OBJETIVO <= 60%).' 
                  : 'MODO PERSONAL CALIBRADO. DISTRIBUCIÓN 50/30/20 EQUILIBRADA ESTE MES.')}
              </p>
              <div className="text-[10px] text-emerald-400 font-mono pt-1">
                [ ✦ TELEGRAM: VINCULADO ]
              </div>
            </div>

            {/* Presets Rápidos de Simulación */}
            <div className="w-full flex flex-col gap-2 mb-4">
              <span className="text-[10px] font-mono uppercase text-slate-500 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" /> Casos Rápidos para Probar:
              </span>
              <div className="flex flex-col gap-1.5">
                {PRESET_MESSAGES.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setActiveMode(preset.mode);
                      handleSimulate(preset.text);
                    }}
                    disabled={isSimulating}
                    className="text-left px-2.5 py-1.5 rounded-lg text-[11px] font-mono stampy-inset hover:bg-slate-200 text-slate-700 transition-colors truncate cursor-pointer disabled:opacity-50"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Campo Libre para Escribir y Enviar */}
            <div className="w-full flex gap-1.5 mb-3">
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSimulate()}
                placeholder="Ej: Gasté $450 en verdura..."
                className="flex-1 px-3 py-2 text-xs rounded-lg stampy-inset font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-400"
              />
              <button
                onClick={() => handleSimulate()}
                disabled={isSimulating}
                className="px-3 py-2 rounded-lg stampy-extrusion text-emerald-800 hover:bg-emerald-50 font-bold transition-all cursor-pointer disabled:opacity-50"
                title="Enviar ticket"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Action Button Principal */}
            <button 
              onClick={() => handleSimulate()}
              disabled={isSimulating}
              className="w-full py-2.5 px-4 stampy-extrusion text-emerald-800 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-emerald-50 transition-opacity disabled:opacity-50 cursor-pointer"
            >
              <Receipt className="w-4 h-4" />
              <span>{isSimulating ? 'Stampy Procesando...' : 'Simular Ingesta Telegram'}</span>
            </button>
          </div>

          {/* Owner's Bridge Card */}
          <div className="stampy-extrusion p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
                <ArrowRightLeft className="w-4 h-4 text-emerald-600" />
                <span>Puente del Sueldo</span>
              </div>
              <span className="text-[10px] font-mono uppercase bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-semibold">Atómico</span>
            </div>
            <p className="text-xs text-slate-600 mb-3">
              Nómina del negocio transferida directamente como ingreso a tu patrimonio personal.
            </p>
            <div className="stampy-inset p-3 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-mono">Último retiro:</span>
              <span className="font-mono font-bold text-sm text-emerald-700">$25,000.00 MXN</span>
            </div>
          </div>
        </div>

        {/* Right Columns: Metrics & Health */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Main KPI Panel */}
          <div className="stampy-extrusion p-6">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>{isBusiness ? 'Salud Operativa (Prime Cost Standard)' : 'Distribución Patrimonial (Regla 50 / 30 / 20)'}</span>
            </h3>

            {isBusiness ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="stampy-inset p-4">
                  <div className="text-[10px] font-mono text-slate-500 uppercase">Insumos (COGS)</div>
                  <div className="text-2xl font-bold font-mono text-slate-900 mt-1">31.4%</div>
                  <div className="text-[10px] text-emerald-600 font-medium mt-1">✓ Bajo control</div>
                </div>
                <div className="stampy-inset p-4">
                  <div className="text-[10px] font-mono text-slate-500 uppercase">Nómina Total</div>
                  <div className="text-2xl font-bold font-mono text-slate-900 mt-1">22.8%</div>
                  <div className="text-[10px] text-emerald-600 font-medium mt-1">✓ En rango esperado</div>
                </div>
                <div className="stampy-inset p-4 border border-emerald-300">
                  <div className="text-[10px] font-mono text-emerald-800 uppercase font-bold">Prime Cost Total</div>
                  <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">54.2%</div>
                  <div className="text-[10px] text-emerald-700 font-medium mt-1">Objetivo: &le; 60%</div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="stampy-inset p-4">
                  <div className="text-[10px] font-mono text-slate-500 uppercase">50% Necesidades</div>
                  <div className="text-2xl font-bold font-mono text-slate-900 mt-1">48.5%</div>
                  <div className="text-[10px] text-indigo-600 font-medium mt-1">Vivienda, despensa, salud</div>
                </div>
                <div className="stampy-inset p-4">
                  <div className="text-[10px] font-mono text-slate-500 uppercase">30% Deseos</div>
                  <div className="text-2xl font-bold font-mono text-slate-900 mt-1">28.0%</div>
                  <div className="text-[10px] text-indigo-600 font-medium mt-1">Ocio sin culpa</div>
                </div>
                <div className="stampy-inset p-4 border border-indigo-300">
                  <div className="text-[10px] font-mono text-indigo-800 uppercase font-bold">20% Ahorro / Inversión</div>
                  <div className="text-2xl font-bold font-mono text-indigo-700 mt-1">23.5%</div>
                  <div className="text-[10px] text-indigo-700 font-medium mt-1">Superando la meta</div>
                </div>
              </div>
            )}

            {/* Anomaly / Overprice Alert Banner */}
            <div className="stampy-inset p-4 flex items-start gap-3 border-l-4 border-amber-500">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                  {isBusiness ? 'Radar de Sobreprecios: Alerta Activa' : 'Detector de Fugas Hormiga'}
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  {isBusiness 
                    ? 'Proveedor "Distribuidora del Centro" aumentó el precio del aguacate un +24% respecto al promedio de las últimas 3 compras.' 
                    : 'Se detectaron 3 cargos recurrentes de streaming con nulo uso en los últimos 30 días.'}
                </p>
              </div>
            </div>
          </div>

          {/* Recent Audited Receipts Table Preview */}
          <div className="stampy-extrusion p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Últimos Comprobantes Auditados ({filteredReceipts.length})</span>
              </h3>
              <span className="text-xs font-mono text-slate-500">Scope: {activeMode}</span>
            </div>

            <div className="space-y-3">
              {filteredReceipts.map((item) => (
                <div key={item.id} className="stampy-inset p-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-slate-800">{item.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{item.category} • {item.time}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold font-mono text-slate-900">{item.amount}</span>
                    <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
