import React, { useState } from 'react';
import { 
  Building2, 
  User, 
  Receipt, 
  Send, 
  ShieldCheck, 
  Sparkles, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  TrendingUp,
  Tag,
  Clock
} from 'lucide-react';

interface ReceiptItem {
  id: string;
  name: string;
  category: string;
  amount: number;
  mode: 'BUSINESS' | 'PERSONAL';
  status: string;
  time: string;
  isDeductible: boolean;
}

const INITIAL_RECEIPTS: ReceiptItem[] = [
  {
    id: 'rec-1',
    name: 'Central de Abastos S.A.',
    category: 'Insumo Cocina',
    amount: 1450.00,
    mode: 'BUSINESS',
    status: '[ ✦ AUDITADO // OK ]',
    time: 'Hoy 11:42 AM',
    isDeductible: true,
  },
  {
    id: 'rec-2',
    name: 'CFE Suministrador Básicos',
    category: 'Gasto Fijo Oficina',
    amount: 3210.00,
    mode: 'BUSINESS',
    status: '[ ✦ AUDITADO // OK ]',
    time: 'Ayer 04:15 PM',
    isDeductible: true,
  },
  {
    id: 'rec-3',
    name: 'Supermercado Central',
    category: 'Despensa Personal',
    amount: 890.50,
    mode: 'PERSONAL',
    status: '[ ✦ AUDITADO // OK ]',
    time: 'Ayer 08:30 PM',
    isDeductible: false,
  },
];

const PRESETS = [
  { label: '🥩 Insumos Restaurante ($650)', text: 'Compré $650 en carne y verduras para el restaurante', mode: 'BUSINESS' as const },
  { label: '🚕 Uber Cliente ($180)', text: 'Viaje en Uber $180.50 para reunión con cliente', mode: 'BUSINESS' as const },
  { label: '🛒 Despensa Hogar ($420)', text: 'Pagué $420 en despensa y frutas para la casa', mode: 'PERSONAL' as const },
  { label: '⛽ Gasolina Reparto ($750)', text: 'Carga de gasolina $750.00 para camioneta de entregas', mode: 'BUSINESS' as const },
  { label: '☕ Café y Cine ($240)', text: 'Cafetería y boletos de cine $240 fin de semana', mode: 'PERSONAL' as const },
];

export const StampyDemo: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'BUSINESS' | 'PERSONAL'>('BUSINESS');
  const [inputText, setInputText] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [lcdMessage, setLcdMessage] = useState<string>(
    'STAMPY OS v0.1 // SISTEMA LISTO\nSelecciona un modo y envía un gasto para auditar.'
  );
  const [receipts, setReceipts] = useState<ReceiptItem[]>(INITIAL_RECEIPTS);
  const [lastAuditResult, setLastAuditResult] = useState<{
    vendor: string;
    category: string;
    amount: number;
    tax: number;
    mode: 'BUSINESS' | 'PERSONAL';
  } | null>(null);

  // Client-Side NLP & Audit Engine
  const parseExpense = (text: string, currentMode: 'BUSINESS' | 'PERSONAL') => {
    // 1. Extraer monto numérico
    const amountMatch = text.match(/\$?\s*(\d+([.,]\d{1,2})?)/);
    const amount = amountMatch ? parseFloat(amountMatch[1].replace(',', '.')) : 450.00;

    // 2. Clasificación semántica por palabras clave
    const lower = text.toLowerCase();
    let vendor = 'Comercio Local / Varios';
    let category = currentMode === 'BUSINESS' ? 'Insumos Generales' : 'Gastos Personales';
    let isDeductible = currentMode === 'BUSINESS';

    if (lower.includes('carne') || lower.includes('verdura') || lower.includes('insumo') || lower.includes('comida') || lower.includes('restaurante')) {
      vendor = currentMode === 'BUSINESS' ? 'Distribuidora de Alimentos' : 'Supermercado Local';
      category = currentMode === 'BUSINESS' ? 'Insumos de Cocina' : 'Alimentación Personal';
    } else if (lower.includes('uber') || lower.includes('taxi') || lower.includes('transporte') || lower.includes('viaje')) {
      vendor = 'Uber Technologies Inc.';
      category = currentMode === 'BUSINESS' ? 'Transporte & Logística' : 'Movilidad Privada';
    } else if (lower.includes('gasolina') || lower.includes('shell') || lower.includes('pemex') || lower.includes('combustible')) {
      vendor = 'Estación de Servicio Pemex #410';
      category = currentMode === 'BUSINESS' ? 'Combustible Operativo' : 'Gasolina Auto Propio';
    } else if (lower.includes('luz') || lower.includes('cfe') || lower.includes('internet') || lower.includes('oficina')) {
      vendor = 'CFE Suministrador de Servicios';
      category = 'Servicios Fijos Oficina';
    } else if (lower.includes('cine') || lower.includes('café') || lower.includes('despensa')) {
      vendor = 'Comercio Minorista';
      category = 'Ocio & Hogar';
      isDeductible = false;
    }

    const tax = isDeductible ? +(amount * 0.16).toFixed(2) : 0;

    return { vendor, category, amount, tax, isDeductible };
  };

  const handleSimulate = (textToProcess?: string) => {
    const rawText = textToProcess || inputText || (activeMode === 'BUSINESS' ? 'Gasté $450 en insumos de cocina' : 'Pagué $350 en despensa');
    setIsSimulating(true);
    setLcdMessage('⏳ AUDITANDO TICKET DE TELEGRAM...\nValidando reglas de segregación ' + activeMode + '...');

    setTimeout(() => {
      const parsed = parseExpense(rawText, activeMode);
      const isBiz = activeMode === 'BUSINESS';
      
      const newReceipt: ReceiptItem = {
        id: 'rec-' + Date.now(),
        name: parsed.vendor,
        category: parsed.category,
        amount: parsed.amount,
        mode: activeMode,
        status: '[ ✦ AUDITADO // OK ]',
        time: 'Hace un momento',
        isDeductible: parsed.isDeductible,
      };

      setReceipts(prev => [newReceipt, ...prev]);
      setLastAuditResult({
        vendor: parsed.vendor,
        category: parsed.category,
        amount: parsed.amount,
        tax: parsed.tax,
        mode: activeMode,
      });

      setLcdMessage(
        `[ ✦ TICKET AUDITADO // OK ]\n` +
        `Proveedor: ${parsed.vendor}\n` +
        `Categoría: ${parsed.category} (${activeMode})\n` +
        `Monto: $${parsed.amount.toFixed(2)} MXN ${isBiz ? `| IVA Acred: $${parsed.tax.toFixed(2)}` : '| No deducible'}`
      );
      setIsSimulating(false);
      setInputText('');
    }, 450);
  };

  const handleDelete = (id: string) => {
    setReceipts(prev => prev.filter(r => r.id !== id));
  };

  const handleReset = () => {
    setReceipts(INITIAL_RECEIPTS);
    setLcdMessage('STAMPY OS v0.1 // SISTEMA LISTO\nSelecciona un modo y envía un gasto para auditar.');
    setLastAuditResult(null);
  };

  // Métricas en tiempo real
  const totalBusiness = receipts
    .filter(r => r.mode === 'BUSINESS')
    .reduce((acc, curr) => acc + curr.amount, 0);
  const totalPersonal = receipts
    .filter(r => r.mode === 'PERSONAL')
    .reduce((acc, curr) => acc + curr.amount, 0);
  const totalDeductibleTax = receipts
    .filter(r => r.isDeductible)
    .reduce((acc, curr) => acc + (curr.amount * 0.16), 0);

  return (
    <div className="w-full rounded-2xl bg-[rgba(26,14,31,0.92)] border border-[rgba(147,80,115,0.35)] shadow-2xl p-4 sm:p-6 lg:p-8 flex flex-col gap-6 text-[#F8F4E9]">
      {/* Header del Simulador con Selector Dual-Scope */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-[rgba(147,80,115,0.25)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-[#10b981] flex items-center justify-center text-slate-950 font-bold text-xl shadow-lg shadow-emerald-500/20">
            S
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-[#F8F4E9]">
                STAMPY
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                CLIENT-SIDE ENGINE // 100% OFFLINE
              </span>
            </div>
            <p className="text-xs text-[#F6DBC0]/75">
              Auditor Financiero & Segregación Dual de Gastos
            </p>
          </div>
        </div>

        {/* Switch Dual-Scope (Negocio vs Personal) */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[rgba(18,9,22,0.9)] border border-[rgba(147,80,115,0.3)] shadow-inner">
          <button
            onClick={() => setActiveMode('BUSINESS')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
              activeMode === 'BUSINESS'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                : 'text-[#F6DBC0]/70 hover:text-[#F8F4E9]'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>MODO NEGOCIO</span>
          </button>
          <button
            onClick={() => setActiveMode('PERSONAL')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
              activeMode === 'PERSONAL'
                ? 'bg-[#c084fc] text-[#500989] shadow-md shadow-[#c084fc]/25'
                : 'text-[#F6DBC0]/70 hover:text-[#F8F4E9]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>MODO PERSONAL</span>
          </button>
        </div>
      </div>

      {/* Pantalla LCD Industrial Retro */}
      <div className="rounded-xl bg-[#0c1510] border-2 border-emerald-950 p-4 font-mono shadow-inner relative overflow-hidden">
        <div className="absolute top-2 right-3 flex items-center gap-2 text-[10px] text-emerald-500/60 uppercase tracking-widest select-none">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>LCD AUDIT TELEMETRY</span>
        </div>
        <div className="text-[11px] text-emerald-600 mb-1">
          // CANAL: TELEGRAM_GATEWAY_BOT // SCOPE: {activeMode}
        </div>
        <pre className="text-xs sm:text-sm text-emerald-400 whitespace-pre-wrap leading-relaxed font-mono">
          {lcdMessage}
        </pre>
      </div>

      {/* Presets Rápidos */}
      <div className="flex flex-col gap-2">
        <span className="font-mono text-xs text-[#F6DBC0]/70 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#c084fc]" />
          Casos de prueba preconfigurados (haz clic para auditar):
        </span>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setActiveMode(preset.mode);
                handleSimulate(preset.text);
              }}
              disabled={isSimulating}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all cursor-pointer active:scale-95 disabled:opacity-50 ${
                preset.mode === 'BUSINESS'
                  ? 'bg-emerald-950/30 hover:bg-emerald-900/40 border-emerald-500/30 text-emerald-300'
                  : 'bg-purple-950/30 hover:bg-purple-900/40 border-purple-500/30 text-purple-300'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Entrada Interactiva de Telegram */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSimulate()}
            placeholder={`Escribe un mensaje de gasto (Ej: "Gasté $520 en papelería de oficina")...`}
            className="w-full px-4 py-2.5 rounded-xl bg-[rgba(18,9,22,0.85)] border border-[rgba(147,80,115,0.4)] text-sm text-[#F8F4E9] placeholder-[rgba(246,219,192,0.4)] focus:outline-none focus:border-[#c084fc] transition-colors"
          />
        </div>
        <button
          onClick={() => handleSimulate()}
          disabled={isSimulating}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-[#10b981] hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-mono text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{isSimulating ? 'AUDITANDO...' : 'AUDITAR TICKET'}</span>
        </button>
      </div>

      {/* Tarjetas de Métricas en Vivo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-xl bg-[rgba(18,9,22,0.7)] border border-emerald-500/25 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#F6DBC0]/70 font-mono">
            <span>GASTO NEGOCIO</span>
            <Building2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">
              ${totalBusiness.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-emerald-500/80 block mt-0.5">
              100% Segregado para contabilidad
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[rgba(18,9,22,0.7)] border border-purple-500/25 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#F6DBC0]/70 font-mono">
            <span>GASTO PERSONAL</span>
            <User className="w-4 h-4 text-[#c084fc]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-[#c084fc]">
              ${totalPersonal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-purple-400/80 block mt-0.5">
              Aislado de la cuenta fiscal
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[rgba(18,9,22,0.7)] border border-[rgba(147,80,115,0.3)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#F6DBC0]/70 font-mono">
            <span>IVA ACREDITABLE EST.</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-amber-300">
              ${totalDeductibleTax.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-[#F6DBC0]/60 block mt-0.5">
              Calculado sobre base de negocio (16%)
            </span>
          </div>
        </div>
      </div>

      {/* Tabla / Ledger de Recibos Auditados */}
      <div className="flex flex-col gap-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#F8F4E9] flex items-center gap-2">
            <Receipt className="w-4 h-4 text-[#c084fc]" />
            Libro de Tickets Auditados en Tiempo Real
          </h3>
          <button
            onClick={handleReset}
            className="text-xs font-mono text-[#F6DBC0]/60 hover:text-[#c084fc] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Restablecer demo</span>
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[rgba(147,80,115,0.25)] bg-[rgba(18,9,22,0.6)]">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[rgba(35,23,39,0.7)] text-[#F6DBC0]/70 border-b border-[rgba(147,80,115,0.25)]">
              <tr>
                <th className="py-2.5 px-3.5">ESTADO</th>
                <th className="py-2.5 px-3.5">PROVEEDOR / CONCEPTO</th>
                <th className="py-2.5 px-3.5">CATEGORÍA</th>
                <th className="py-2.5 px-3.5">ÁMBITO</th>
                <th className="py-2.5 px-3.5 text-right">MONTO</th>
                <th className="py-2.5 px-3.5 text-center">ACCIÓN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(147,80,115,0.15)]">
              {receipts.map((r) => (
                <tr key={r.id} className="hover:bg-[rgba(80,45,85,0.15)] transition-colors">
                  <td className="py-3 px-3.5">
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3 h-3" />
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-[#F8F4E9] font-sans font-medium">
                    <div>{r.name}</div>
                    <div className="text-[10px] text-[#F6DBC0]/50 font-mono">{r.time}</div>
                  </td>
                  <td className="py-3 px-3.5 text-[#F6DBC0]/80">
                    {r.category}
                  </td>
                  <td className="py-3 px-3.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      r.mode === 'BUSINESS'
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                    }`}>
                      {r.mode}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-right font-bold text-[#F8F4E9]">
                    ${r.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3.5 text-center">
                    <button
                      onClick={() => handleDelete(r.id)}
                      title="Eliminar de la simulación"
                      className="p-1 rounded text-[#F6DBC0]/40 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
