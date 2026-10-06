import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Clock,
  DollarSign,
  TrendingUp,
  Bot,
  FileSpreadsheet,
  Calendar,
  BadgeAlert,
  Workflow,
  Headphones,
  UserCheck,
  Check,
  Copy,
  Settings,
  ShieldCheck,
  Shield,
  ArrowRight,
  ExternalLink,
  RotateCcw,
  Zap,
  Lock,
  Eye,
  EyeOff,
  FileDown,
  Mail,
  MessageSquare,
  Video
} from 'lucide-react';
import {
  AUTOMATION_CATALOG,
  DEFAULT_CLIENT_INPUTS_MXN,
  DEFAULT_CLIENT_INPUTS_USD,
  DEFAULT_DEVELOPER_CONFIG,
  calculateRoi,
  formatCurrency,
  buildProposalMarkdown,
  buildWhatsAppMessage,
  type AutomationItem,
  type ClientBleedInputs,
  type DeveloperConfig,
  type CalculationResult
} from '../data/calculatorEngine';

interface OpenRoiEventDetail {
  selectedIds?: string[];
  bleedInputs?: Partial<ClientBleedInputs>;
  currency?: 'USD' | 'MXN';
}

export interface RoiCalculatorProps {
  mode?: 'modal' | 'page';
}

export const RoiCalculatorModal: React.FC<RoiCalculatorProps> = ({ mode = 'modal' }) => {
  const isPage = mode === 'page';
  const [isOpen, setIsOpen] = useState(isPage);
  const [isCalculadoraRoute, setIsCalculadoraRoute] = useState(false);
  const [activeTab, setActiveTab] = useState<'catalog' | 'bleed' | 'roi'>('catalog');
  const [currency, setCurrency] = useState<'USD' | 'MXN'>('MXN'); // Default en Pesos Mexicanos (MXN)
  const [isConfidential, setIsConfidential] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAdminMode, setShowAdminMode] = useState(false);
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

  // Estados de cálculo (por defecto en MXN con valores pyme realistas)
  const [selectedIds, setSelectedIds] = useState<string[]>([
    'ai-sales-bot',
    'calendar-sync'
  ]);
  const [bleedInputs, setBleedInputs] = useState<ClientBleedInputs>(DEFAULT_CLIENT_INPUTS_MXN);
  const [devConfig, setDevConfig] = useState<DeveloperConfig>(DEFAULT_DEVELOPER_CONFIG);

  // Detección de ruta /calculadora
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.pathname.includes('/calculadora')) {
      setIsCalculadoraRoute(true);
    }
  }, []);

  // Escuchar evento global para abrir modal (desde Navbar, Hero o Chatbot)
  useEffect(() => {
    const handleOpen = (e: Event) => {
      // Si estamos en modo modal y ya estamos en la página /calculadora, omitir para no duplicar
      if (mode === 'modal' && typeof window !== 'undefined' && window.location.pathname.includes('/calculadora')) {
        return;
      }

      const customEvent = e as CustomEvent<OpenRoiEventDetail>;
      if (customEvent.detail) {
        if (customEvent.detail.selectedIds) {
          setSelectedIds(customEvent.detail.selectedIds);
        }
        if (customEvent.detail.bleedInputs) {
          setBleedInputs((prev) => ({ ...prev, ...customEvent.detail.bleedInputs }));
        }
        if (customEvent.detail.currency) {
          setCurrency(customEvent.detail.currency);
        }
      }

      if (mode === 'modal') {
        setIsOpen(true);
        document.body.style.overflow = 'hidden';
      }
    };

    window.addEventListener('open-roi-calculator', handleOpen);
    return () => window.removeEventListener('open-roi-calculator', handleOpen);
  }, [mode]);

  const closeModal = () => {
    if (mode === 'modal') {
      setIsOpen(false);
      document.body.style.overflow = '';
    }
  };

  useEffect(() => {
    if (mode !== 'modal') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, mode]);

  const handleCurrencySwitch = (newCurrency: 'USD' | 'MXN') => {
    if (newCurrency === currency) return;
    setCurrency(newCurrency);
    if (newCurrency === 'MXN') {
      setBleedInputs(DEFAULT_CLIENT_INPUTS_MXN);
    } else {
      setBleedInputs(DEFAULT_CLIENT_INPUTS_USD);
    }
  };

  const toggleAutomation = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Resultado reactivo determinista
  const result: CalculationResult = calculateRoi(
    selectedIds,
    bleedInputs,
    devConfig,
    currency
  );

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Bot':
        return <Bot className="w-5 h-5" />;
      case 'FileSpreadsheet':
        return <FileSpreadsheet className="w-5 h-5" />;
      case 'Calendar':
        return <Calendar className="w-5 h-5" />;
      case 'BadgeAlert':
        return <BadgeAlert className="w-5 h-5" />;
      case 'Workflow':
        return <Workflow className="w-5 h-5" />;
      case 'Headphones':
        return <Headphones className="w-5 h-5" />;
      case 'UserCheck':
        return <UserCheck className="w-5 h-5" />;
      default:
        return <Zap className="w-5 h-5" />;
    }
  };

  const handleCopyProposal = () => {
    const text = buildProposalMarkdown(
      selectedIds,
      bleedInputs,
      result,
      currency,
      isConfidential
    );

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppClick = () => {
    const whatsappMsg = buildWhatsAppMessage(
      selectedIds,
      result,
      currency,
      isConfidential
    );
    const whatsappUrl = `https://wa.me/525578666313?text=${encodeURIComponent(whatsappMsg)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleEmailClick = () => {
    const subject = encodeURIComponent(
      `Cotización de Automatización // ${selectedIds.length} soluciones seleccionadas (${currency})`
    );
    const body = encodeURIComponent(
      buildProposalMarkdown(
        selectedIds,
        bleedInputs,
        result,
        currency,
        isConfidential
      )
    );
    window.location.href = `mailto:e.danielgrz10@gmail.com?subject=${subject}&body=${body}`;
  };

  const handleBookingClick = () => {
    window.dispatchEvent(
      new CustomEvent('open-copilot-chat', {
        detail: {
          prompt: `Hola Erick 👋 Quiero agendar una videollamada para revisar la cotización que calculé:\n\n${buildProposalMarkdown(
            selectedIds,
            bleedInputs,
            result,
            currency,
            isConfidential
          )}`
        }
      })
    );
    if (mode === 'modal') {
      closeModal();
    }
  };

  // Si estamos en modo modal y es la ruta /calculadora, el componente modal no debe renderizarse
  // porque /calculadora ya renderiza la versión mode="page" directamente.
  if (mode === 'modal' && isCalculadoraRoute) {
    return null;
  }

  if (mode === 'modal' && !isOpen) {
    return null;
  }

  // Parámetros y límites de sliders según divisa
  const isMxn = currency === 'MXN';
  const laborMin = isMxn ? 50 : 5;
  const laborMax = isMxn ? 2000 : 150;
  const laborStep = isMxn ? 25 : 1;

  const ticketMin = isMxn ? 100 : 10;
  const ticketMax = isMxn ? 20000 : 1500;
  const ticketStep = isMxn ? 100 : 10;

  // Dimensiones del gráfico SVG
  const chartWidth = 600;
  const chartHeight = 220;
  const padding = { top: 25, right: 30, bottom: 35, left: 60 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const maxVal = Math.max(
    ...result.monthlyBreakdown.map((d) =>
      Math.max(d.cumulativeCostWithoutAutomation, d.cumulativeBenefitWithAutomation)
    ),
    1000
  );

  const getX = (month: number) => padding.left + ((month - 1) / 11) * innerWidth;
  const getY = (val: number) => padding.top + innerHeight - (val / maxVal) * innerHeight;

  // Puntos para líneas
  const pointsLoss = result.monthlyBreakdown
    .map((d) => `${getX(d.month)},${getY(d.cumulativeCostWithoutAutomation)}`)
    .join(' ');
  const pointsBenefit = result.monthlyBreakdown
    .map((d) => `${getX(d.month)},${getY(d.cumulativeBenefitWithAutomation)}`)
    .join(' ');
  const pointsInvestment = result.monthlyBreakdown
    .map((d) => `${getX(d.month)},${getY(d.cumulativeInvestmentWithAutomation)}`)
    .join(' ');

  // Encontrar mes de cruce (Breakeven)
  const breakevenMonthObj =
    result.monthlyBreakdown.find(
      (d) => d.cumulativeBenefitWithAutomation >= d.cumulativeInvestmentWithAutomation
    ) || result.monthlyBreakdown[result.monthlyBreakdown.length - 1];

  // 1. BARRA FLOTANTE DE PESTAÑAS Y CONTROLES (SIN CONTENEDOR ENVOLVENTE GIGANTE)
  const renderFloatingToolbar = () => (
    <div className="p-2 sm:p-2.5 rounded-2xl bg-[rgba(30,15,35,0.65)] backdrop-blur-xl border border-[rgba(147,80,115,0.35)] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-3 print:hidden">
      {/* Pestañas 1, 2, 3 */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto w-full md:w-auto">
        <button
          type="button"
          onClick={() => setActiveTab('catalog')}
          className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'catalog'
              ? 'bg-[#521f61] text-white border border-[#c084fc]/50 shadow-md'
              : 'text-[#F6DBC0]/70 hover:text-white hover:bg-[rgba(80,45,85,0.3)]'
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-[#c084fc]/20 flex items-center justify-center text-[11px] font-mono text-[#d8b4fe]">
            1
          </span>
          <span>Servicios & Soluciones ({selectedIds.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bleed')}
          className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'bleed'
              ? 'bg-[#521f61] text-white border border-[#c084fc]/50 shadow-md'
              : 'text-[#F6DBC0]/70 hover:text-white hover:bg-[rgba(80,45,85,0.3)]'
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-[#c084fc]/20 flex items-center justify-center text-[11px] font-mono text-[#d8b4fe]">
            2
          </span>
          <span>Diagnóstico de Fuga</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('roi')}
          className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'roi'
              ? 'bg-[#c084fc] text-[#160B1A] font-bold shadow-md'
              : 'text-[#F6DBC0]/70 hover:text-white hover:bg-[rgba(80,45,85,0.3)]'
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-[#160B1A]/20 flex items-center justify-center text-[11px] font-mono font-bold">
            3
          </span>
          <span>Dictamen de ROI</span>
        </button>
      </div>

      {/* Controles de Moneda y Configuración */}
      <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
        <div className="flex items-center bg-[rgba(80,45,85,0.4)] p-0.5 rounded-xl border border-[rgba(147,80,115,0.4)] text-xs font-mono">
          <button
            type="button"
            onClick={() => handleCurrencySwitch('MXN')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              currency === 'MXN'
                ? 'bg-[#c084fc] text-[#160B1A] font-bold shadow'
                : 'text-[#F8F4E9]/70 hover:text-white'
            }`}
          >
            MXN ($)
          </button>
          <button
            type="button"
            onClick={() => handleCurrencySwitch('USD')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              currency === 'USD'
                ? 'bg-[#c084fc] text-[#160B1A] font-bold shadow'
                : 'text-[#F8F4E9]/70 hover:text-white'
            }`}
          >
            USD ($)
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowAdminMode(!showAdminMode)}
          title="Modo Ingeniero (Ajuste de Tarifas y Parámetros Técnicos)"
          className={`p-2 rounded-xl border transition-all cursor-pointer ${
            showAdminMode
              ? 'bg-[#c084fc]/20 border-[#c084fc] text-[#d8b4fe]'
              : 'bg-[rgba(80,45,85,0.3)] border-[rgba(147,80,115,0.3)] text-[#F6DBC0]/70 hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4" />
        </button>

        {!isPage && (
          <button
            type="button"
            onClick={closeModal}
            className="p-2 rounded-xl bg-[rgba(80,45,85,0.3)] hover:bg-[rgba(80,45,85,0.6)] text-[#F8F4E9] transition-colors cursor-pointer"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );

  // 2. PANEL ADMINISTRADOR FLOTANTE
  const renderAdminPanel = () => {
    if (!showAdminMode) return null;
    return (
      <div className="p-5 rounded-2xl bg-[rgba(38,16,46,0.95)] backdrop-blur-xl border border-[#c084fc] shadow-2xl animate-fadeIn space-y-3 print:hidden">
        <div className="flex items-center justify-between border-b border-[rgba(147,80,115,0.3)] pb-2">
          <div className="flex items-center gap-2 text-[#d8b4fe]">
            <ShieldCheck className="w-5 h-5 text-[#c084fc]" />
            <span className="font-mono text-sm font-bold text-white uppercase tracking-wider">
              Panel de Control de Tarifas Técnicas (Vista Erick)
            </span>
          </div>
          <button
            type="button"
            onClick={() => setDevConfig(DEFAULT_DEVELOPER_CONFIG)}
            className="text-xs text-[#c084fc] hover:underline flex items-center gap-1 cursor-pointer font-mono"
          >
            <RotateCcw className="w-3 h-3" /> Restaurar por defecto
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block text-[#F6DBC0] mb-1 font-mono">
              Tarifa Base Erick ($ USD / hr):
            </label>
            <input
              type="number"
              value={devConfig.erickHourlyRateUSD}
              onChange={(e) =>
                setDevConfig({ ...devConfig, erickHourlyRateUSD: Number(e.target.value) || 0 })
              }
              className="w-full bg-[#160B1A] border border-[rgba(147,80,115,0.4)] rounded-lg p-2 text-white font-mono text-sm"
            />
            <span className="text-[11px] text-[#d8b4fe]/70 font-mono">
              ≈ {formatCurrency(devConfig.erickHourlyRateUSD * devConfig.exchangeRateUsdToMxn, 'MXN')}/hr
            </span>
          </div>

          <div>
            <label className="block text-[#F6DBC0] mb-1 font-mono">
              Tipo de Cambio (USD ➔ MXN):
            </label>
            <input
              type="number"
              step="0.1"
              value={devConfig.exchangeRateUsdToMxn}
              onChange={(e) =>
                setDevConfig({ ...devConfig, exchangeRateUsdToMxn: Number(e.target.value) || 18.5 })
              }
              className="w-full bg-[#160B1A] border border-[rgba(147,80,115,0.4)] rounded-lg p-2 text-white font-mono text-sm"
            />
            <span className="text-[11px] text-[#d8b4fe]/70 font-mono">Paridad para cálculo en pesos</span>
          </div>

          <div>
            <label className="block text-[#F6DBC0] mb-1 font-mono">
              Overhead Plataforma + QA:
            </label>
            <input
              type="number"
              value={devConfig.platformBaseHours + devConfig.meetingsAndPmHours}
              onChange={(e) => {
                const val = Number(e.target.value) || 0;
                setDevConfig({
                  ...devConfig,
                  platformBaseHours: Math.round(val * 0.6),
                  meetingsAndPmHours: Math.round(val * 0.4)
                });
              }}
              className="w-full bg-[#160B1A] border border-[rgba(147,80,115,0.4)] rounded-lg p-2 text-white font-mono text-sm"
            />
            <span className="text-[11px] text-[#d8b4fe]/70 font-mono">
              {devConfig.platformBaseHours + devConfig.meetingsAndPmHours} horas fijas
            </span>
          </div>

          <div>
            <label className="block text-[#F6DBC0] mb-1 font-mono">
              Captura de Valor (% Beneficio):
            </label>
            <input
              type="number"
              step="0.01"
              min="0.05"
              max="0.4"
              value={devConfig.valueCapturePercentage}
              onChange={(e) =>
                setDevConfig({
                  ...devConfig,
                  valueCapturePercentage: Number(e.target.value) || 0.15
                })
              }
              className="w-full bg-[#160B1A] border border-[rgba(147,80,115,0.4)] rounded-lg p-2 text-white font-mono text-sm"
            />
            <span className="text-[11px] text-[#d8b4fe]/70 font-mono">
              {(devConfig.valueCapturePercentage * 100).toFixed(0)}% del año 1
            </span>
          </div>
        </div>
      </div>
    );
  };

  // 3. CONTENIDO DE LAS PESTAÑAS (TARJETAS FLOTANTES SOBRE EL FONDO)
  const renderTabContent = () => (
    <div className="space-y-6">
      {/* TAB 1: CATÁLOGO DE SOLUCIONES */}
      {activeTab === 'catalog' && (
        <div className="space-y-5 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Catálogo de Soluciones para tu Negocio
              </h3>
              <p className="text-xs sm:text-sm text-[#F6DBC0]/80 mt-0.5">
                Selecciona los procesos que te quitan tiempo o donde pierdes clientes para calcular el costo y los beneficios.
              </p>
            </div>
            <div className="text-xs font-mono px-3.5 py-1.5 rounded-xl bg-[rgba(80,45,85,0.35)] backdrop-blur-md border border-[rgba(147,80,115,0.35)] text-[#d8b4fe] shrink-0 self-start sm:self-auto shadow-sm">
              Horas Técnicas Estimadas: <strong className="text-white">{result.totalProjectHours} hrs</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {AUTOMATION_CATALOG.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => toggleAutomation(item.id)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer select-none flex flex-col justify-between gap-3 shadow-lg ${
                    isSelected
                      ? 'bg-[rgba(82,31,97,0.75)] border-[#c084fc] shadow-[0_0_20px_rgba(192,132,252,0.25)] ring-1 ring-[#c084fc]/50'
                      : 'bg-[rgba(26,14,30,0.6)] hover:bg-[rgba(48,22,58,0.7)] border-[rgba(147,80,115,0.3)] backdrop-blur-md'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 border transition-all ${
                        isSelected
                          ? 'bg-[#c084fc] border-[#c084fc] text-[#160B1A]'
                          : 'bg-[rgba(30,12,36,0.5)] border-[rgba(147,80,115,0.5)] text-transparent'
                      }`}
                    >
                      <Check className={`w-4 h-4 stroke-[3] ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-sm sm:text-[15px] text-white flex items-center gap-1.5">
                          {getIcon(item.iconName)}
                          {item.name}
                        </span>
                        {item.popular && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30 shrink-0">
                            Más pedido
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#F6DBC0] mt-1.5 leading-relaxed">
                        {item.tagline}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 border-t border-[rgba(147,80,115,0.2)] text-[11px] font-mono text-[#d8b4fe]/80">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#c084fc]" />
                      {item.baseHoursFirstTime} hrs de desarrollo base
                    </span>
                    <span className="text-[#F6DBC0]/60 capitalize">
                      Área: {item.category}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('bleed')}
              className="px-6 py-3 rounded-2xl bg-[#c084fc] hover:bg-[#d8b4fe] text-[#160B1A] font-extrabold text-sm flex items-center gap-2 shadow-xl cursor-pointer transition-transform active:scale-95"
            >
              <span>Continuar al Diagnóstico de Pérdidas</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: DIAGNÓSTICO DE FUGA FINANCIERA */}
      {activeTab === 'bleed' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Banner flotante de privacidad */}
          <div className="p-4 rounded-2xl bg-[rgba(16,185,129,0.12)] backdrop-blur-md border border-[rgba(16,185,129,0.3)] shadow-lg flex items-center gap-3">
            <Lock className="w-5 h-5 text-[#10B981] shrink-0" />
            <div className="text-xs text-[#F8F4E9]">
              <strong className="text-[#10B981] block">Privacidad Garantizada (Zero-Data Stored):</strong>
              Esta herramienta calcula todo en tu propio navegador. Ningún dato de ventas, nómina o clientes se envía a servidores externos.
            </div>
          </div>

          <div className="px-1">
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Diagnóstico de Ineficiencias & Fuga de Dinero
            </h3>
            <p className="text-xs sm:text-sm text-[#F6DBC0]/80 mt-0.5">
              Ajusta los valores con la barra o escribe directamente el número en cada campo con tu teclado en {currency}.
            </p>
          </div>

          {/* 6 Tarjetas Flotantes de Entrada Dual */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Horas perdidas */}
            <div className="p-5 rounded-2xl bg-[rgba(26,14,30,0.6)] backdrop-blur-md border border-[rgba(147,80,115,0.3)] shadow-lg space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-white text-sm font-semibold flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#c084fc]" /> Horas en tareas repetitivas:
                </span>
                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <input
                    type="number"
                    min="0"
                    max="168"
                    value={bleedInputs.lostHoursPerWeek}
                    onChange={(e) =>
                      setBleedInputs({ ...bleedInputs, lostHoursPerWeek: Math.max(0, Number(e.target.value) || 0) })
                    }
                    className="w-20 px-2.5 py-1 rounded-lg bg-[rgba(15,8,18,0.95)] border border-[rgba(192,132,252,0.4)] text-right font-mono text-white text-sm font-bold focus:outline-none focus:border-[#c084fc] shadow-inner"
                  />
                  <span className="font-mono text-xs text-[#d8b4fe]">hrs/sem</span>
                </div>
              </div>
              <input
                type="range"
                min="1"
                max={Math.max(60, bleedInputs.lostHoursPerWeek)}
                step="1"
                value={bleedInputs.lostHoursPerWeek}
                onChange={(e) =>
                  setBleedInputs({ ...bleedInputs, lostHoursPerWeek: Number(e.target.value) })
                }
                className="w-full accent-[#c084fc] cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-[#F6DBC0]/60 font-mono">
                <span>1 hr/sem</span>
                <span>30 hrs/sem</span>
                <span>{Math.max(60, bleedInputs.lostHoursPerWeek)} hrs/sem</span>
              </div>
            </div>

            {/* 2. Costo por hora */}
            <div className="p-5 rounded-2xl bg-[rgba(26,14,30,0.6)] backdrop-blur-md border border-[rgba(147,80,115,0.3)] shadow-lg space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-white text-sm font-semibold flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-[#c084fc]" /> Costo por hora operativa:
                </span>
                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <span className="font-mono text-xs text-[#d8b4fe]">$</span>
                  <input
                    type="number"
                    min="0"
                    value={bleedInputs.hourlyLaborCost}
                    onChange={(e) =>
                      setBleedInputs({ ...bleedInputs, hourlyLaborCost: Math.max(0, Number(e.target.value) || 0) })
                    }
                    className="w-24 px-2.5 py-1 rounded-lg bg-[rgba(15,8,18,0.95)] border border-[rgba(192,132,252,0.4)] text-right font-mono text-white text-sm font-bold focus:outline-none focus:border-[#c084fc] shadow-inner"
                  />
                  <span className="font-mono text-xs text-[#d8b4fe]">/ hr</span>
                </div>
              </div>
              <input
                type="range"
                min={laborMin}
                max={Math.max(laborMax, bleedInputs.hourlyLaborCost)}
                step={laborStep}
                value={bleedInputs.hourlyLaborCost}
                onChange={(e) =>
                  setBleedInputs({ ...bleedInputs, hourlyLaborCost: Number(e.target.value) })
                }
                className="w-full accent-[#c084fc] cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-[#F6DBC0]/60 font-mono">
                <span>{formatCurrency(laborMin, currency)}</span>
                <span>{formatCurrency(Math.round((laborMin + laborMax) / 2), currency)}</span>
                <span>{formatCurrency(Math.max(laborMax, bleedInputs.hourlyLaborCost), currency)}</span>
              </div>
            </div>

            {/* 3. Ticket promedio */}
            <div className="p-5 rounded-2xl bg-[rgba(26,14,30,0.6)] backdrop-blur-md border border-[rgba(147,80,115,0.3)] shadow-lg space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-white text-sm font-semibold flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-[#c084fc]" /> Ticket promedio por cliente:
                </span>
                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <span className="font-mono text-xs text-[#d8b4fe]">$</span>
                  <input
                    type="number"
                    min="0"
                    value={bleedInputs.averageTicketValue}
                    onChange={(e) =>
                      setBleedInputs({ ...bleedInputs, averageTicketValue: Math.max(0, Number(e.target.value) || 0) })
                    }
                    className="w-28 px-2.5 py-1 rounded-lg bg-[rgba(15,8,18,0.95)] border border-[rgba(192,132,252,0.4)] text-right font-mono text-white text-sm font-bold focus:outline-none focus:border-[#c084fc] shadow-inner"
                  />
                  <span className="font-mono text-xs text-[#d8b4fe]">{currency}</span>
                </div>
              </div>
              <input
                type="range"
                min={ticketMin}
                max={Math.max(ticketMax, bleedInputs.averageTicketValue)}
                step={ticketStep}
                value={bleedInputs.averageTicketValue}
                onChange={(e) =>
                  setBleedInputs({ ...bleedInputs, averageTicketValue: Number(e.target.value) })
                }
                className="w-full accent-[#c084fc] cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-[#F6DBC0]/60 font-mono">
                <span>{formatCurrency(ticketMin, currency)}</span>
                <span>{formatCurrency(Math.round(ticketMax / 2), currency)}</span>
                <span>{formatCurrency(Math.max(ticketMax, bleedInputs.averageTicketValue), currency)}</span>
              </div>
            </div>

            {/* 4. Clientes mensuales */}
            <div className="p-5 rounded-2xl bg-[rgba(26,14,30,0.6)] backdrop-blur-md border border-[rgba(147,80,115,0.3)] shadow-lg space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-white text-sm font-semibold flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-[#c084fc]" /> Clientes o consultas al mes:
                </span>
                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <input
                    type="number"
                    min="0"
                    value={bleedInputs.monthlyLeadsOrClients}
                    onChange={(e) =>
                      setBleedInputs({ ...bleedInputs, monthlyLeadsOrClients: Math.max(0, Number(e.target.value) || 0) })
                    }
                    className="w-24 px-2.5 py-1 rounded-lg bg-[rgba(15,8,18,0.95)] border border-[rgba(192,132,252,0.4)] text-right font-mono text-white text-sm font-bold focus:outline-none focus:border-[#c084fc] shadow-inner"
                  />
                  <span className="font-mono text-xs text-[#d8b4fe]">clientes</span>
                </div>
              </div>
              <input
                type="range"
                min="10"
                max={Math.max(2000, bleedInputs.monthlyLeadsOrClients)}
                step="10"
                value={bleedInputs.monthlyLeadsOrClients}
                onChange={(e) =>
                  setBleedInputs({ ...bleedInputs, monthlyLeadsOrClients: Number(e.target.value) })
                }
                className="w-full accent-[#c084fc] cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-[#F6DBC0]/60 font-mono">
                <span>10</span>
                <span>1,000</span>
                <span>{Math.max(2000, bleedInputs.monthlyLeadsOrClients).toLocaleString('es-MX')} clientes</span>
              </div>
            </div>

            {/* 5. % Pérdida por lentitud */}
            <div className="p-5 rounded-2xl bg-[rgba(26,14,30,0.6)] backdrop-blur-md border border-[rgba(147,80,115,0.3)] shadow-lg space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-white text-sm font-semibold flex items-center gap-1.5">
                  <BadgeAlert className="w-4 h-4 text-[#c084fc]" /> Clientes perdidos por tardanza:
                </span>
                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={bleedInputs.lostClientsPercentage}
                    onChange={(e) =>
                      setBleedInputs({ ...bleedInputs, lostClientsPercentage: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })
                    }
                    className="w-20 px-2.5 py-1 rounded-lg bg-[rgba(15,8,18,0.95)] border border-[rgba(255,128,128,0.4)] text-right font-mono text-[#ff8080] text-sm font-bold focus:outline-none focus:border-[#ff8080] shadow-inner"
                  />
                  <span className="font-mono text-xs text-[#ff8080]">% de fuga</span>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                step="1"
                value={bleedInputs.lostClientsPercentage}
                onChange={(e) =>
                  setBleedInputs({ ...bleedInputs, lostClientsPercentage: Number(e.target.value) })
                }
                className="w-full accent-[#c084fc] cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-[#F6DBC0]/60 font-mono">
                <span>0% (Ninguno)</span>
                <span>15% (Promedio en WhatsApp)</span>
                <span>80% (Pérdida crítica)</span>
              </div>
            </div>

            {/* 6. Mermas o errores humanos mensuales */}
            <div className="p-5 rounded-2xl bg-[rgba(26,14,30,0.6)] backdrop-blur-md border border-[rgba(147,80,115,0.3)] shadow-lg space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-white text-sm font-semibold flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-[#c084fc]" /> Retrabajos y notas manuales:
                </span>
                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <span className="font-mono text-xs text-[#d8b4fe]">$</span>
                  <input
                    type="number"
                    min="0"
                    value={bleedInputs.humanErrorsMonthlyCost}
                    onChange={(e) =>
                      setBleedInputs({ ...bleedInputs, humanErrorsMonthlyCost: Math.max(0, Number(e.target.value) || 0) })
                    }
                    className="w-24 px-2.5 py-1 rounded-lg bg-[rgba(15,8,18,0.95)] border border-[rgba(192,132,252,0.4)] text-right font-mono text-white text-sm font-bold focus:outline-none focus:border-[#c084fc] shadow-inner"
                  />
                  <span className="font-mono text-xs text-[#d8b4fe]">/ mes</span>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max={Math.max(isMxn ? 15000 : 1000, bleedInputs.humanErrorsMonthlyCost)}
                step={isMxn ? 250 : 25}
                value={bleedInputs.humanErrorsMonthlyCost}
                onChange={(e) =>
                  setBleedInputs({ ...bleedInputs, humanErrorsMonthlyCost: Number(e.target.value) })
                }
                className="w-full accent-[#c084fc] cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-[#F6DBC0]/60 font-mono">
                <span>$0</span>
                <span>{formatCurrency(isMxn ? 7500 : 500, currency)}</span>
                <span>{formatCurrency(Math.max(isMxn ? 15000 : 1000, bleedInputs.humanErrorsMonthlyCost), currency)}</span>
              </div>
            </div>
          </div>

          {/* Resumen del Dolor Flotante */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[rgba(255,80,80,0.12)] backdrop-blur-md border border-[rgba(255,100,100,0.35)] shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-xs uppercase font-mono font-bold tracking-wider text-[#ff8080]">
                Pérdida Financiera Acumulada Anual Sin Automatizar
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                {formatCurrency(result.totalAnnualBleed, currency)} <span className="text-sm font-normal text-[#F6DBC0]">/ año</span>
              </div>
              <p className="text-xs text-[#F6DBC0]">
                Fuga mensual: {formatCurrency(result.totalMonthlyBleed, currency)}/mes ({formatCurrency(result.monthlyTimeLossCost, currency)} en tiempo perdido + {formatCurrency(result.monthlySalesLossCost, currency)} en ventas que se escapan).
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('roi')}
              className="px-6 py-3 rounded-2xl bg-[#c084fc] hover:bg-[#d8b4fe] text-[#160B1A] font-extrabold text-sm flex items-center gap-2 shadow-xl cursor-pointer transition-transform active:scale-95 shrink-0"
            >
              <span>Ver Dictamen de ROI & Gráfica</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: DICTAMEN DE ROI & GRÁFICA */}
      {activeTab === 'roi' && (
        <div className="space-y-6 animate-fadeIn">
          {/* TARJETAS DE IMPACTO PRINCIPAL FLOTANTES */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Setup Price */}
            <div className="p-5 rounded-2xl bg-[rgba(26,14,30,0.6)] backdrop-blur-md border border-[rgba(147,80,115,0.3)] shadow-lg flex flex-col justify-between">
              <span className="text-xs font-mono text-[#d8b4fe] uppercase font-semibold">
                Implementación Inicial
              </span>
              <div className="text-xl sm:text-2xl font-extrabold text-white font-mono my-2">
                {formatCurrency(result.recommendedSetupPrice, currency)}
              </div>
              <span className="text-[11px] text-[#F6DBC0]/70">
                Pago único al validar prototipo funcional
              </span>
            </div>

            {/* 2. Monthly Retainer */}
            <div className="p-5 rounded-2xl bg-[rgba(26,14,30,0.6)] backdrop-blur-md border border-[rgba(147,80,115,0.3)] shadow-lg flex flex-col justify-between">
              <span className="text-xs font-mono text-[#d8b4fe] uppercase font-semibold">
                Mantenimiento & Servidor
              </span>
              <div className="text-xl sm:text-2xl font-extrabold text-white font-mono my-2">
                {formatCurrency(result.recommendedMonthlyRetainer, currency)}
              </div>
              <span className="text-[11px] text-[#F6DBC0]/70">
                Soporte, actualizaciones y servidores
              </span>
            </div>

            {/* 3. Net Savings */}
            <div className="p-5 rounded-2xl bg-[rgba(16,185,129,0.12)] backdrop-blur-md border border-[rgba(16,185,129,0.4)] shadow-lg flex flex-col justify-between">
              <span className="text-xs font-mono text-[#10B981] uppercase font-semibold">
                Beneficio Neto Año 1
              </span>
              <div className="text-xl sm:text-2xl font-extrabold text-[#10B981] font-mono my-2">
                {formatCurrency(result.yearOneNetSavings, currency)}
              </div>
              <span className="text-[11px] text-[#F8F4E9]/80">
                Dinero extra en el bolsillo del negocio
              </span>
            </div>

            {/* 4. ROI & Payback */}
            <div className="p-5 rounded-2xl bg-[rgba(192,132,252,0.15)] backdrop-blur-md border border-[#c084fc] shadow-[0_0_20px_rgba(192,132,252,0.2)] flex flex-col justify-between">
              <span className="text-xs font-mono text-[#d8b4fe] uppercase font-semibold">
                Retorno de Inversión (ROI)
              </span>
              <div className="text-xl sm:text-2xl font-extrabold text-[#d8b4fe] font-mono my-2">
                +{result.roiPercentage}%
              </div>
              <span className="text-[11px] text-white font-semibold">
                Se amortiza en ~{result.paybackMonths} meses ({result.paybackDays} días)
              </span>
            </div>
          </div>

          {/* HITOS CLAVE DE RETORNO FLOTANTES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Hito 1: Mes 1 */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[rgba(26,14,30,0.6)] backdrop-blur-md border border-[rgba(147,80,115,0.3)] shadow-lg flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#c084fc] font-bold">1. Puesta en Marcha</span>
                <span className="text-[#F6DBC0]/70">Mes 1</span>
              </div>
              <div className="my-2">
                <div className="text-base font-bold text-white font-mono">
                  {formatCurrency(result.monthlyBreakdown[0].cumulativeBenefitWithAutomation, currency)}
                </div>
                <p className="text-[11px] text-[#F6DBC0]/80 mt-0.5 leading-snug">
                  Se detienen las tareas manuales y se recuperan clientes que antes se iban por contestar tarde.
                </p>
              </div>
              <span className="text-[10px] font-mono text-[#d8b4fe]/70">Inicio de amortización</span>
            </div>

            {/* Hito 2: Breakeven */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[rgba(16,185,129,0.14)] backdrop-blur-md border border-[rgba(16,185,129,0.45)] shadow-[0_0_15px_rgba(16,185,129,0.15)] flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#10B981] font-bold">2. Punto de Equilibrio</span>
                <span className="text-white font-bold bg-[#10B981]/30 px-1.5 py-0.5 rounded">Mes {breakevenMonthObj.month}</span>
              </div>
              <div className="my-2">
                <div className="text-base font-bold text-[#10B981] font-mono">
                  Inversión 100% Recuperada
                </div>
                <p className="text-[11px] text-[#F8F4E9]/90 mt-0.5 leading-snug">
                  El sistema ya se pagó completamente solo. A partir de aquí todo es ganancia limpia para tu caja.
                </p>
              </div>
              <span className="text-[10px] font-mono text-[#10B981]">Amortización en ~{result.paybackMonths} meses</span>
            </div>

            {/* Hito 3: Mes 6 */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[rgba(26,14,30,0.6)] backdrop-blur-md border border-[rgba(147,80,115,0.3)] shadow-lg flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#c084fc] font-bold">3. Medio Año</span>
                <span className="text-[#F6DBC0]/70">Mes 6</span>
              </div>
              <div className="my-2">
                <div className="text-base font-bold text-white font-mono">
                  {formatCurrency(result.monthlyBreakdown[5].netProfit, currency)}
                </div>
                <p className="text-[11px] text-[#F6DBC0]/80 mt-0.5 leading-snug">
                  Ganancia neta acumulada en caja tras 6 meses operando en piloto automático.
                </p>
              </div>
              <span className="text-[10px] font-mono text-[#d8b4fe]/70">Operación continua estable</span>
            </div>

            {/* Hito 4: Mes 12 */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[rgba(192,132,252,0.15)] backdrop-blur-md border border-[#c084fc]/60 shadow-lg flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#d8b4fe] font-bold">4. Cierre Año 1</span>
                <span className="text-[#F6DBC0]/70">Mes 12</span>
              </div>
              <div className="my-2">
                <div className="text-base font-bold text-[#d8b4fe] font-mono">
                  {formatCurrency(result.yearOneNetSavings, currency)}
                </div>
                <p className="text-[11px] text-[#F6DBC0]/80 mt-0.5 leading-snug">
                  Dinero extra retenido en el negocio con un retorno de inversión de +{result.roiPercentage}%.
                </p>
              </div>
              <span className="text-[10px] font-mono text-[#c084fc]">Retorno neto anual garantizado</span>
            </div>
          </div>

          {/* GRÁFICA DE RETORNO Y PUNTO DE EQUILIBRIO FLOTANTE */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[rgba(26,14,30,0.6)] backdrop-blur-md border border-[rgba(147,80,115,0.3)] shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[rgba(147,80,115,0.25)] pb-3">
              <div>
                <h4 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#10B981]" />
                  Curva de Proyección a 12 Meses: Punto de Equilibrio (Breakeven)
                </h4>
                <p className="text-xs text-[#F6DBC0]/70 mt-0.5">
                  Comparativa entre la inacción (seguir perdiendo dinero) vs. la ganancia neta automatizada.
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-[#ff8080]">
                  <span className="w-3 h-0.5 bg-[#ff8080] inline-block"></span> Pérdida sin sistema
                </span>
                <span className="flex items-center gap-1.5 text-[#10B981]">
                  <span className="w-3 h-0.5 bg-[#10B981] inline-block"></span> Con sistema
                </span>
              </div>
            </div>

            {/* SVG Interactivo Estable */}
            <div className="w-full overflow-x-auto">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-auto min-w-[500px] select-none"
              >
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                  const y = padding.top + innerHeight * (1 - ratio);
                  const val = maxVal * ratio;
                  return (
                    <g key={idx}>
                      <line
                        x1={padding.left}
                        y1={y}
                        x2={chartWidth - padding.right}
                        y2={y}
                        stroke="rgba(147,80,115,0.2)"
                        strokeDasharray="4 4"
                      />
                      <text
                        x={padding.left - 8}
                        y={y + 4}
                        textAnchor="end"
                        fill="rgba(246,219,192,0.5)"
                        fontSize="10"
                        fontFamily="monospace"
                      >
                        {formatCurrency(val, currency)}
                      </text>
                    </g>
                  );
                })}

                {result.monthlyBreakdown.map((d) => {
                  const x = getX(d.month);
                  const isHovered = hoveredMonth === d.month;
                  return (
                    <g key={d.month}>
                      <line
                        x1={x}
                        y1={padding.top + innerHeight}
                        x2={x}
                        y2={padding.top + innerHeight + 5}
                        stroke="rgba(147,80,115,0.4)"
                      />
                      <text
                        x={x}
                        y={padding.top + innerHeight + 18}
                        textAnchor="middle"
                        fill={isHovered ? '#FFFFFF' : 'rgba(246,219,192,0.6)'}
                        fontSize="10"
                        fontFamily="monospace"
                        fontWeight={isHovered ? 'bold' : 'normal'}
                      >
                        M{d.month}
                      </text>
                    </g>
                  );
                })}

                <polyline
                  fill="none"
                  stroke="#ff6060"
                  strokeWidth="2.5"
                  strokeDasharray="5 3"
                  points={pointsLoss}
                />

                <polyline
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="3"
                  points={pointsBenefit}
                />

                <polyline
                  fill="none"
                  stroke="#c084fc"
                  strokeWidth="1.5"
                  points={pointsInvestment}
                />

                {breakevenMonthObj && (
                  <g>
                    <circle
                      cx={getX(breakevenMonthObj.month)}
                      cy={getY(breakevenMonthObj.cumulativeBenefitWithAutomation)}
                      r="8"
                      fill="#10B981"
                      fillOpacity="0.25"
                      stroke="#10B981"
                      strokeWidth="1.5"
                    />
                    <circle
                      cx={getX(breakevenMonthObj.month)}
                      cy={getY(breakevenMonthObj.cumulativeBenefitWithAutomation)}
                      r="4.5"
                      fill="#10B981"
                    />
                    <text
                      x={getX(breakevenMonthObj.month)}
                      y={getY(breakevenMonthObj.cumulativeBenefitWithAutomation) - 13}
                      textAnchor="middle"
                      fill="#10B981"
                      fontSize="11"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      Punto de Equilibrio (Mes {breakevenMonthObj.month})
                    </text>
                  </g>
                )}

                {result.monthlyBreakdown.map((d) => {
                  const x = getX(d.month);
                  return (
                    <rect
                      key={d.month}
                      x={x - innerWidth / 24}
                      y={padding.top}
                      width={innerWidth / 12}
                      height={innerHeight}
                      fill="transparent"
                      className="cursor-pointer hover:fill-white/5"
                      onMouseEnter={() => setHoveredMonth(d.month)}
                      onMouseLeave={() => setHoveredMonth(null)}
                    />
                  );
                })}
              </svg>
            </div>

            {/* Barra fija de inspección del mes */}
            <div className="min-h-[46px] p-2.5 rounded-xl bg-[rgba(32,15,38,0.7)] border border-[rgba(147,80,115,0.3)] text-xs font-mono flex items-center justify-between">
              {hoveredMonth !== null ? (
                <div className="w-full flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
                  <span className="text-[#FFFFFF] font-bold">Mes {hoveredMonth}:</span>
                  <span className="text-[#ff8080]">
                    Pérdida acumulada sin sistema: {formatCurrency(result.monthlyBreakdown[hoveredMonth - 1].cumulativeCostWithoutAutomation, currency)}
                  </span>
                  <span className="text-[#10B981] font-bold">
                    Beneficio acumulado: {formatCurrency(result.monthlyBreakdown[hoveredMonth - 1].cumulativeBenefitWithAutomation, currency)}
                  </span>
                  <span className="text-[#d8b4fe]">
                    Ganancia Neta: {formatCurrency(result.monthlyBreakdown[hoveredMonth - 1].netProfit, currency)}
                  </span>
                </div>
              ) : (
                <span className="text-[#F6DBC0]/60 text-[11px]">
                  💡 Pasa el cursor por cualquier mes en la gráfica para auditar el beneficio y ahorro neto proyectado.
                </span>
              )}
            </div>
          </div>

          {/* CARD DE CONTROL DE PRIVACIDAD / MODO CONFIDENCIAL FLOTANTE */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[rgba(32,15,38,0.7)] backdrop-blur-md border border-[rgba(147,80,115,0.3)] shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isConfidential ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-[rgba(192,132,252,0.2)] text-[#d8b4fe]'}`}>
                {isConfidential ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </div>
              <div>
                <span className="font-bold text-xs sm:text-sm text-white block">
                  Modo Confidencial al Compartir
                </span>
                <span className="text-[11px] text-[#F6DBC0]/70 block mt-0.5">
                  {isConfidential
                    ? '🛡️ Activado: Tus métricas de facturación y pérdidas NO se incluirán en el PDF ni en el mensaje de contacto.'
                    : '📊 Desactivado: Se incluirá el desglose completo de fuga financiera para revisar puntos de mejora.'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsConfidential(!isConfidential)}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 ${
                isConfidential
                  ? 'bg-[#10B981] text-[#160B1A] shadow-md'
                  : 'bg-[rgba(80,45,85,0.4)] text-[#F8F4E9] hover:bg-[rgba(80,45,85,0.7)] border border-[rgba(147,80,115,0.3)]'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{isConfidential ? 'Confidencial Activo' : 'Activar Modo Confidencial'}</span>
            </button>
          </div>

          {/* ACCIONES Y BOTONES DE CIERRE FLOTANTES */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[rgba(30,15,35,0.75)] backdrop-blur-md border border-[rgba(147,80,115,0.35)] shadow-xl space-y-4">
            <div>
              <h5 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#c084fc]" /> ¿Listo para implementar en tu negocio?
              </h5>
              <p className="text-xs text-[#F6DBC0]/75 mt-0.5">
                Descarga tu reporte oficial en PDF o contáctame directo para revisar un prototipo funcional sin compromiso.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-3 rounded-xl bg-[rgba(80,45,85,0.45)] hover:bg-[rgba(80,45,85,0.8)] border border-[rgba(147,80,115,0.5)] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-sm"
                title="Descargar o imprimir reporte ejecutivo en PDF"
              >
                <FileDown className="w-4 h-4 text-[#10B981]" />
                <span>Descargar Reporte en PDF</span>
              </button>

              <button
                type="button"
                onClick={handleWhatsAppClick}
                className="px-4 py-3 rounded-xl bg-[rgba(16,185,129,0.2)] hover:bg-[rgba(16,185,129,0.35)] border border-[rgba(16,185,129,0.5)] text-[#A7F3D0] hover:text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-sm"
                title="Enviar cotización por WhatsApp a Erick"
              >
                <MessageSquare className="w-4 h-4 text-[#10B981]" />
                <span>Mandar por WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleEmailClick}
                className="px-4 py-3 rounded-xl bg-[rgba(80,45,85,0.3)] hover:bg-[rgba(80,45,85,0.6)] border border-[rgba(147,80,115,0.4)] text-[#F8F4E9] font-medium text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                title="Enviar propuesta por correo electrónico"
              >
                <Mail className="w-4 h-4 text-[#ffafd5]" />
                <span>Enviar por Correo</span>
              </button>

              <button
                type="button"
                onClick={handleBookingClick}
                className="px-4 py-3 rounded-xl bg-[#c084fc] hover:bg-[#d8b4fe] text-[#160B1A] font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all active:scale-95"
                title="Agendar videollamada para revisar el prototipo navegable"
              >
                <Video className="w-4 h-4" />
                <span>Agendar Videollamada</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-2.5 border-t border-[rgba(147,80,115,0.2)] text-[11px] text-[#F6DBC0]/70">
              <button
                type="button"
                onClick={handleCopyProposal}
                className="hover:text-white flex items-center gap-1.5 font-mono cursor-pointer transition-colors"
              >
                <Copy className="w-3.5 h-3.5 text-[#d8b4fe]" />
                <span>{copied ? '¡Copiado al portapapeles!' : 'Copiar texto de cotización'}</span>
              </button>
              <span className="font-mono">Garantía: Liquidación tras validar prototipo</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // 4. REPORTE EJECUTIVO IMPRIMIBLE (SOLO VISIBLE AL IMPRIMIR / DESCARGAR PDF)
  const renderPrintableReport = () => (
    <div className="hidden print:block roi-printable-report text-[#111827] bg-white p-8 max-w-4xl mx-auto font-sans">
      <div className="border-b-2 border-purple-900 pb-4 mb-6 flex justify-between items-start">
        <div>
          <div className="text-2xl font-black tracking-tight text-purple-950 font-mono">
            DAARICK // SISTEMAS DE IA & AUTOMATIZACIÓN
          </div>
          <div className="text-sm font-semibold text-gray-700 mt-1">
            Dictamen de Cotización y Retorno de Inversión (ROI) para Negocios
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            Ingeniería de Software & Arquitectura Determinista • Erick Daniel García
          </div>
        </div>
        <div className="text-right text-xs font-mono text-gray-600">
          <div><strong>Folio:</strong> #COT-202610-{result.technicalFloorCost}</div>
          <div><strong>Fecha:</strong> {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
          <div><strong>Moneda:</strong> {currency}</div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-purple-900 border-b border-gray-200 pb-1 mb-2 font-mono">
          1. Alcance de Soluciones Seleccionadas ({selectedIds.length} Módulos)
        </h3>
        <div className="space-y-2">
          {AUTOMATION_CATALOG.filter((i) => selectedIds.includes(i.id)).map((item) => (
            <div key={item.id} className="p-2 rounded border border-gray-200 bg-gray-50 flex justify-between items-start text-xs">
              <div>
                <div className="font-bold text-gray-900">{item.name}</div>
                <div className="text-gray-600 mt-0.5">{item.description}</div>
              </div>
              <span className="font-mono text-gray-500 shrink-0 ml-4 font-semibold uppercase">{item.category}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-purple-900 border-b border-gray-200 pb-1 mb-2 font-mono">
          2. Diagnóstico de Ineficiencias & Fuga Financiera
        </h3>
        {isConfidential ? (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600 italic">
            🛡️ Modo Confidencial: Los detalles específicos de nómina y clientes han sido resguardados a solicitud del cliente.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="p-2.5 bg-gray-50 rounded border border-gray-200">
              <span className="text-gray-500 block">Horas manuales / semana</span>
              <span className="font-bold font-mono text-gray-900 text-sm">{bleedInputs.lostHoursPerWeek} hrs/sem</span>
            </div>
            <div className="p-2.5 bg-gray-50 rounded border border-gray-200">
              <span className="text-gray-500 block">Ticket Promedio</span>
              <span className="font-bold font-mono text-gray-900 text-sm">{formatCurrency(bleedInputs.averageTicketValue, currency)}</span>
            </div>
            <div className="p-2.5 bg-gray-50 rounded border border-gray-200">
              <span className="text-gray-500 block">Fuga Mensual Estimada</span>
              <span className="font-bold font-mono text-red-700 text-sm">{formatCurrency(result.totalMonthlyBleed, currency)}/mes</span>
            </div>
            <div className="col-span-3 p-2.5 bg-red-50 rounded border border-red-200 flex justify-between items-center">
              <span className="text-red-900 font-semibold">Pérdida Anual Acumulada por Falta de Automatización:</span>
              <span className="font-bold font-mono text-red-900 text-base">{formatCurrency(result.totalAnnualBleed, currency)} / año</span>
            </div>
          </div>
        )}
      </div>

      <div className="mb-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-purple-900 border-b border-gray-200 pb-1 mb-2 font-mono">
          3. Dictamen de Inversión & Retorno Proyectado (Value-Based Pricing)
        </h3>
        <div className="grid grid-cols-4 gap-3 text-xs mb-3">
          <div className="p-3 bg-purple-50 rounded border border-purple-200">
            <span className="text-purple-800 font-semibold block">Implementación (Setup)</span>
            <span className="font-bold font-mono text-purple-950 text-base mt-1 block">{formatCurrency(result.recommendedSetupPrice, currency)}</span>
            <span className="text-[10px] text-gray-500">Pago único</span>
          </div>
          <div className="p-3 bg-purple-50 rounded border border-purple-200">
            <span className="text-purple-800 font-semibold block">Mantenimiento Mensual</span>
            <span className="font-bold font-mono text-purple-950 text-base mt-1 block">{formatCurrency(result.recommendedMonthlyRetainer, currency)}</span>
            <span className="text-[10px] text-gray-500">Servidores & SLA</span>
          </div>
          <div className="p-3 bg-emerald-50 rounded border border-emerald-200">
            <span className="text-emerald-800 font-semibold block">Beneficio Neto Año 1</span>
            <span className="font-bold font-mono text-emerald-900 text-base mt-1 block">{formatCurrency(result.yearOneNetSavings, currency)}</span>
            <span className="text-[10px] text-emerald-700">Ahorro libre de caja</span>
          </div>
          <div className="p-3 bg-emerald-50 rounded border border-emerald-200">
            <span className="text-emerald-800 font-semibold block">Retorno de Inversión</span>
            <span className="font-bold font-mono text-emerald-900 text-base mt-1 block">+{result.roiPercentage}%</span>
            <span className="text-[10px] text-emerald-700">Amortizado en ~{result.paybackMonths} meses</span>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-purple-900 border-b border-gray-200 pb-1 mb-2 font-mono">
          4. Hitos de Amortización Proyectada a 12 Meses
        </h3>
        <table className="w-full text-xs border border-gray-200">
          <thead className="bg-gray-100 text-gray-700 font-mono">
            <tr>
              <th className="p-2 text-left border-b">Mes</th>
              <th className="p-2 text-right border-b">Sin Sistema (Pérdida)</th>
              <th className="p-2 text-right border-b">Inversión Acumulada</th>
              <th className="p-2 text-right border-b">Beneficio Recuperado</th>
              <th className="p-2 text-right border-b font-bold">Ganancia Neta en Caja</th>
            </tr>
          </thead>
          <tbody>
            {[1, 3, breakevenMonthObj.month, 6, 9, 12]
              .filter((v, idx, arr) => arr.indexOf(v) === idx)
              .sort((a, b) => a - b)
              .map((m) => {
                const row = result.monthlyBreakdown[m - 1];
                const isBreakeven = m === breakevenMonthObj.month;
                return (
                  <tr key={m} className={isBreakeven ? 'bg-emerald-50 font-semibold' : 'border-b border-gray-100'}>
                    <td className="p-2 text-left font-mono">
                      Mes {m} {isBreakeven && <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1 py-0.5 rounded ml-1 font-sans">★ Breakeven</span>}
                    </td>
                    <td className="p-2 text-right font-mono text-red-700">{formatCurrency(row.cumulativeCostWithoutAutomation, currency)}</td>
                    <td className="p-2 text-right font-mono text-purple-900">{formatCurrency(row.cumulativeInvestmentWithAutomation, currency)}</td>
                    <td className="p-2 text-right font-mono text-emerald-800">{formatCurrency(row.cumulativeBenefitWithAutomation, currency)}</td>
                    <td className="p-2 text-right font-mono font-bold text-gray-900">{formatCurrency(row.netProfit, currency)}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      <div className="border-t-2 border-gray-200 pt-4 flex justify-between items-start text-xs text-gray-600">
        <div className="space-y-1">
          <div className="font-bold text-gray-900">Garantía de Satisfacción Técnica:</div>
          <div>• Pago del setup condicionado a validación de prototipo navegable funcional.</div>
          <div>• Código limpio, sin ataduras a plataformas propietarias cerradas.</div>
        </div>
        <div className="text-right space-y-0.5 font-mono">
          <div className="font-bold text-gray-900">Erick Daniel García // Daarick</div>
          <div>WhatsApp: +52 55 7866 6313</div>
          <div>Correo: e.danielgrz10@gmail.com</div>
          <div>Web: https://daarick.dev</div>
        </div>
      </div>
    </div>
  );

  // VISTA EN MODO PÁGINA: SIN CONTENEDOR ENVOLVENTE GIGANTE (TARJETAS FLOTANTES SOBRE EL FONDO)
  if (isPage) {
    return (
      <div className="w-full space-y-8 roi-calculator-page-view">
        {renderFloatingToolbar()}
        {renderAdminPanel()}
        {renderTabContent()}
        {renderPrintableReport()}
      </div>
    );
  }

  // VISTA EN MODO MODAL (SOLO CUANDO SE DISPARA COMO DIÁLOGO EMERGENTE)
  return (
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center p-2.5 sm:p-6 bg-[rgba(10,5,15,0.88)] backdrop-blur-md animate-fadeIn roi-calculator-modal-backdrop"
      role="dialog"
      aria-label="Calculadora de Cotización y Retorno de Inversión"
    >
      <div className="relative w-full max-w-5xl h-[94vh] max-h-[890px] overflow-y-auto p-4 sm:p-6 bg-[#160B1A]/95 backdrop-blur-xl border border-[rgba(147,80,115,0.45)] rounded-2xl shadow-2xl scrollbar-thin scrollbar-thumb-[rgba(147,80,115,0.4)] roi-calculator-container space-y-6">
        {renderFloatingToolbar()}
        {renderAdminPanel()}
        {renderTabContent()}
        {renderPrintableReport()}
      </div>
    </div>
  );
};
