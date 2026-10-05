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
  EyeOff
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

export const RoiCalculatorModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'catalog' | 'bleed' | 'roi'>('catalog');
  const [currency, setCurrency] = useState<'USD' | 'MXN'>('MXN'); // Default en Pesos Mexicanos (MXN)
  const [isConfidential, setIsConfidential] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAdminMode, setShowAdminMode] = useState(false);
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

  // Estados de cálculo (por defecto en MXN)
  const [selectedIds, setSelectedIds] = useState<string[]>([
    'ai-sales-bot',
    'calendar-sync'
  ]);
  const [bleedInputs, setBleedInputs] = useState<ClientBleedInputs>(DEFAULT_CLIENT_INPUTS_MXN);
  const [devConfig, setDevConfig] = useState<DeveloperConfig>(DEFAULT_DEVELOPER_CONFIG);

  // Auto-apertura si se visita la ruta /calculadora directamente
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.pathname.includes('/calculadora')) {
      setIsOpen(true);
    }
  }, []);

  // Escuchar evento global para abrir modal (desde Navbar, Hero o Chatbot)
  useEffect(() => {
    const handleOpen = (e: Event) => {
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
      setIsOpen(true);
      document.body.style.overflow = 'hidden';
    };

    window.addEventListener('open-roi-calculator', handleOpen);
    return () => window.removeEventListener('open-roi-calculator', handleOpen);
  }, []);

  const closeModal = () => {
    setIsOpen(false);
    document.body.style.overflow = '';
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleCurrencySwitch = (newCurrency: 'USD' | 'MXN') => {
    if (newCurrency === currency) return;
    setCurrency(newCurrency);
    // Adaptar los valores por defecto a la escala de la divisa
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

  // Resultado reactivo
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

  const handleBookWithQuote = () => {
    const whatsappMsg = buildWhatsAppMessage(
      selectedIds,
      result,
      currency,
      isConfidential
    );
    const whatsappUrl = `https://wa.me/525578666313?text=${encodeURIComponent(whatsappMsg)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (!isOpen) return null;

  // Parámetros y límites de sliders según divisa
  const isMxn = currency === 'MXN';
  const laborMin = isMxn ? 50 : 5;
  const laborMax = isMxn ? 1500 : 150;
  const laborStep = isMxn ? 25 : 1;

  const ticketMin = isMxn ? 200 : 20;
  const ticketMax = isMxn ? 40000 : 2500;
  const ticketStep = isMxn ? 250 : 10;

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

  return (
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center p-2.5 sm:p-6 bg-[rgba(10,5,15,0.88)] backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-label="Calculadora de Cotización y Retorno de Inversión"
    >
      <div className="relative w-full max-w-5xl h-[94vh] max-h-[890px] bg-[#160B1A] border border-[rgba(147,80,115,0.45)] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* ENCABEZADO */}
        <div className="px-4 sm:px-6 py-3.5 bg-[rgba(30,15,35,0.98)] border-b border-[rgba(147,80,115,0.35)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgba(192,132,252,0.15)] border border-[#c084fc]/40 flex items-center justify-center text-[#c084fc] shadow-sm">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[#FFFFFF] font-sans">
                  Calculadora de Cotización & Retorno de Inversión (ROI)
                </h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#c084fc]/20 text-[#d8b4fe] border border-[#c084fc]/30">
                  Value-Based Pricing
                </span>
              </div>
              <p className="text-xs sm:text-[13px] text-[#F6DBC0]/80">
                Calcula la inversión de implementar sistemas de IA y el dinero que recupera tu negocio.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Selector de Moneda */}
            <div className="flex items-center bg-[rgba(80,45,85,0.4)] p-0.5 rounded-lg border border-[rgba(147,80,115,0.4)] text-xs font-mono">
              <button
                type="button"
                onClick={() => handleCurrencySwitch('MXN')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
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
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  currency === 'USD'
                    ? 'bg-[#c084fc] text-[#160B1A] font-bold shadow'
                    : 'text-[#F8F4E9]/70 hover:text-white'
                }`}
              >
                USD ($)
              </button>
            </div>

            {/* Toggle Modo Administrador / Ingeniero */}
            <button
              type="button"
              onClick={() => setShowAdminMode(!showAdminMode)}
              title="Modo Ingeniero (Ajuste de Tarifas y Parámetros Técnicos)"
              className={`p-2 rounded-lg border transition-all cursor-pointer ${
                showAdminMode
                  ? 'bg-[#c084fc]/20 border-[#c084fc] text-[#d8b4fe]'
                  : 'bg-[rgba(80,45,85,0.3)] border-[rgba(147,80,115,0.3)] text-[#F6DBC0]/70 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Botón Cerrar */}
            <button
              type="button"
              onClick={closeModal}
              className="p-2 rounded-lg bg-[rgba(80,45,85,0.3)] hover:bg-[rgba(80,45,85,0.6)] text-[#F8F4E9] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PESTAÑAS NAVEGADORAS */}
        <div className="px-4 sm:px-6 bg-[rgba(24,12,28,0.9)] border-b border-[rgba(147,80,115,0.25)] flex items-center justify-between shrink-0 overflow-x-auto">
          <div className="flex gap-2 py-2">
            <button
              type="button"
              onClick={() => setActiveTab('catalog')}
              className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'catalog'
                  ? 'bg-[#521f61] text-[#FFFFFF] border border-[#c084fc]/50 shadow-sm'
                  : 'text-[#F6DBC0]/70 hover:text-white hover:bg-[rgba(80,45,85,0.25)]'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-[#c084fc]/20 flex items-center justify-center text-[11px] font-mono text-[#d8b4fe]">
                1
              </span>
              <span>Servicios & Módulos ({selectedIds.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('bleed')}
              className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'bleed'
                  ? 'bg-[#521f61] text-[#FFFFFF] border border-[#c084fc]/50 shadow-sm'
                  : 'text-[#F6DBC0]/70 hover:text-white hover:bg-[rgba(80,45,85,0.25)]'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-[#c084fc]/20 flex items-center justify-center text-[11px] font-mono text-[#d8b4fe]">
                2
              </span>
              <span>Diagnóstico de Fuga Financiera</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('roi')}
              className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'roi'
                  ? 'bg-[#c084fc] text-[#160B1A] font-bold shadow-md'
                  : 'text-[#F6DBC0]/70 hover:text-white hover:bg-[rgba(80,45,85,0.25)]'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-[#160B1A]/20 flex items-center justify-center text-[11px] font-mono font-bold">
                3
              </span>
              <span>Dictamen de Inversión & ROI</span>
            </button>
          </div>

          {/* Insignia de Privacidad Local en el Header */}
          <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-[#10B981] bg-[rgba(16,185,129,0.1)] px-3 py-1 rounded-full border border-[rgba(16,185,129,0.25)]">
            <Lock className="w-3.5 h-3.5" />
            <span>Cálculo local y privado en tu navegador</span>
          </div>
        </div>

        {/* CUERPO PRINCIPAL CON SCROLL */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin scrollbar-thumb-[rgba(147,80,115,0.4)]">
          {/* MODO ADMINISTRADOR DESPLEGABLE */}
          {showAdminMode && (
            <div className="p-4 rounded-xl bg-[rgba(38,16,46,0.95)] border border-[#c084fc] shadow-xl animate-fadeIn space-y-3">
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
                  className="text-xs text-[#c084fc] hover:underline flex items-center gap-1 cursor-pointer"
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
                  <span className="text-[11px] text-[#d8b4fe]/70">
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
                  <span className="text-[11px] text-[#d8b4fe]/70">Paridad para cálculo en pesos</span>
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
                  <span className="text-[11px] text-[#d8b4fe]/70">
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
                  <span className="text-[11px] text-[#d8b4fe]/70">
                    {(devConfig.valueCapturePercentage * 100).toFixed(0)}% del año 1
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: CATÁLOGO DE AUTOMATIZACIONES */}
          {activeTab === 'catalog' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[rgba(147,80,115,0.25)] pb-3">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    Catálogo de Módulos & Automatizaciones
                  </h3>
                  <p className="text-xs sm:text-sm text-[#F6DBC0]/80">
                    Selecciona las soluciones que requiere tu negocio para calcular el costo base y los beneficios.
                  </p>
                </div>
                <div className="text-xs font-mono px-3 py-1.5 rounded-lg bg-[rgba(80,45,85,0.3)] border border-[rgba(147,80,115,0.3)] text-[#d8b4fe]">
                  Horas Técnicas Estimadas: <strong className="text-white">{result.totalProjectHours} hrs</strong>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {AUTOMATION_CATALOG.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleAutomation(item.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between gap-3 ${
                        isSelected
                          ? 'bg-[rgba(82,31,97,0.85)] border-[#c084fc] shadow-[0_0_15px_rgba(192,132,252,0.2)]'
                          : 'bg-[rgba(26,14,30,0.65)] hover:bg-[rgba(48,22,58,0.7)] border-[rgba(147,80,115,0.3)]'
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
                                Popular
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#F6DBC0] mt-1 leading-relaxed">
                            {item.tagline}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[rgba(147,80,115,0.2)] text-[11px] font-mono text-[#d8b4fe]/80">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#c084fc]" />
                          {item.baseHoursFirstTime} hrs de desarrollo base
                        </span>
                        <span className="text-[#F6DBC0]/60 capitalize">
                          Categoría: {item.category}
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
                  className="px-5 py-2.5 rounded-xl bg-[#c084fc] hover:bg-[#d8b4fe] text-[#160B1A] font-bold text-sm flex items-center gap-2 shadow-md cursor-pointer transition-transform active:scale-95"
                >
                  <span>Continuar al Diagnóstico de Pérdidas</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: DIAGNÓSTICO DE FUGA FINANCIERA */}
          {activeTab === 'bleed' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Banner de Confidencialidad y Privacidad In-Browser */}
              <div className="p-3.5 rounded-xl bg-[rgba(16,185,129,0.12)] border border-[rgba(16,185,129,0.35)] flex items-center gap-3">
                <Lock className="w-5 h-5 text-[#10B981] shrink-0" />
                <div className="text-xs text-[#F8F4E9]">
                  <strong className="text-[#10B981] block">Privacidad Garantizada (Zero-Data Stored):</strong>
                  Esta herramienta calcula todo en tu propio navegador. Ningún dato de facturación, clientes o pérdidas se transmite a servidores ni queda almacenado.
                </div>
              </div>

              <div className="border-b border-[rgba(147,80,115,0.25)] pb-3">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Diagnóstico de Ineficiencias & Fuga Financiera
                </h3>
                <p className="text-xs sm:text-sm text-[#F6DBC0]/80">
                  Indica con sinceridad tus métricas actuales en {currency}. Esto medirá cuánto dinero deja de entrar al mes por falta de automatización.
                </p>
              </div>

              {/* Controles deslizantes interactivos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 1. Horas perdidas */}
                <div className="p-4 rounded-xl bg-[rgba(26,14,30,0.7)] border border-[rgba(147,80,115,0.3)] space-y-2">
                  <div className="flex justify-between items-center text-sm font-semibold">
                    <span className="text-white flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-[#c084fc]" /> Horas dedicadas a tareas repetitivas:
                    </span>
                    <span className="font-mono text-[#d8b4fe] text-base font-bold">
                      {bleedInputs.lostHoursPerWeek} hrs / sem
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="60"
                    step="1"
                    value={bleedInputs.lostHoursPerWeek}
                    onChange={(e) =>
                      setBleedInputs({ ...bleedInputs, lostHoursPerWeek: Number(e.target.value) })
                    }
                    className="w-full accent-[#c084fc] cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-[#F6DBC0]/60">
                    <span>1 hr/sem</span>
                    <span>30 hrs/sem</span>
                    <span>60 hrs/sem</span>
                  </div>
                </div>

                {/* 2. Costo por hora */}
                <div className="p-4 rounded-xl bg-[rgba(26,14,30,0.7)] border border-[rgba(147,80,115,0.3)] space-y-2">
                  <div className="flex justify-between items-center text-sm font-semibold">
                    <span className="text-white flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-[#c084fc]" /> Costo por hora operativa del equipo:
                    </span>
                    <span className="font-mono text-[#d8b4fe] text-base font-bold">
                      {formatCurrency(bleedInputs.hourlyLaborCost, currency)} / hr
                    </span>
                  </div>
                  <input
                    type="range"
                    min={laborMin}
                    max={laborMax}
                    step={laborStep}
                    value={bleedInputs.hourlyLaborCost}
                    onChange={(e) =>
                      setBleedInputs({ ...bleedInputs, hourlyLaborCost: Number(e.target.value) })
                    }
                    className="w-full accent-[#c084fc] cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-[#F6DBC0]/60">
                    <span>{formatCurrency(laborMin, currency)}</span>
                    <span>{formatCurrency(Math.round((laborMin + laborMax) / 2), currency)}</span>
                    <span>{formatCurrency(laborMax, currency)}</span>
                  </div>
                </div>

                {/* 3. Ticket promedio */}
                <div className="p-4 rounded-xl bg-[rgba(26,14,30,0.7)] border border-[rgba(147,80,115,0.3)] space-y-2">
                  <div className="flex justify-between items-center text-sm font-semibold">
                    <span className="text-white flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-[#c084fc]" /> Ticket promedio o suscripción mensual:
                    </span>
                    <span className="font-mono text-[#d8b4fe] text-base font-bold">
                      {formatCurrency(bleedInputs.averageTicketValue, currency)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={ticketMin}
                    max={ticketMax}
                    step={ticketStep}
                    value={bleedInputs.averageTicketValue}
                    onChange={(e) =>
                      setBleedInputs({ ...bleedInputs, averageTicketValue: Number(e.target.value) })
                    }
                    className="w-full accent-[#c084fc] cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-[#F6DBC0]/60">
                    <span>{formatCurrency(ticketMin, currency)}</span>
                    <span>{formatCurrency(Math.round((ticketMin + ticketMax) / 2), currency)}</span>
                    <span>{formatCurrency(ticketMax, currency)}</span>
                  </div>
                </div>

                {/* 4. Clientes mensuales */}
                <div className="p-4 rounded-xl bg-[rgba(26,14,30,0.7)] border border-[rgba(147,80,115,0.3)] space-y-2">
                  <div className="flex justify-between items-center text-sm font-semibold">
                    <span className="text-white flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-[#c084fc]" /> Clientes o prospectos / mes:
                    </span>
                    <span className="font-mono text-[#d8b4fe] text-base font-bold">
                      {bleedInputs.monthlyLeadsOrClients} clientes
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="300"
                    step="5"
                    value={bleedInputs.monthlyLeadsOrClients}
                    onChange={(e) =>
                      setBleedInputs({ ...bleedInputs, monthlyLeadsOrClients: Number(e.target.value) })
                    }
                    className="w-full accent-[#c084fc] cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-[#F6DBC0]/60">
                    <span>5</span>
                    <span>150</span>
                    <span>300</span>
                  </div>
                </div>

                {/* 5. % Pérdida por lentitud */}
                <div className="p-4 rounded-xl bg-[rgba(26,14,30,0.7)] border border-[rgba(147,80,115,0.3)] space-y-2 md:col-span-2">
                  <div className="flex justify-between items-center text-sm font-semibold">
                    <span className="text-white flex items-center gap-1.5">
                      <BadgeAlert className="w-4 h-4 text-[#c084fc]" /> Clientes perdidos por no responder a tiempo o falta de seguimiento:
                    </span>
                    <span className="font-mono text-[#ff8080] text-base font-bold">
                      {bleedInputs.lostClientsPercentage}% de fuga
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    step="1"
                    value={bleedInputs.lostClientsPercentage}
                    onChange={(e) =>
                      setBleedInputs({ ...bleedInputs, lostClientsPercentage: Number(e.target.value) })
                    }
                    className="w-full accent-[#c084fc] cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-[#F6DBC0]/60">
                    <span>0% (Ninguno)</span>
                    <span>20% (Promedio en WhatsApp)</span>
                    <span>60% (Alta saturación)</span>
                  </div>
                </div>
              </div>

              {/* Resumen del Dolor (Alerta de Fuga) */}
              <div className="p-4 rounded-xl bg-[rgba(255,80,80,0.12)] border border-[rgba(255,100,100,0.35)] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <span className="text-xs uppercase font-mono font-bold tracking-wider text-[#ff8080]">
                    Pérdida Financiera Acumulada Anual
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                    {formatCurrency(result.totalAnnualBleed, currency)} <span className="text-sm font-normal text-[#F6DBC0]">/ año</span>
                  </div>
                  <p className="text-xs text-[#F6DBC0]">
                    Fuga mensual: {formatCurrency(result.totalMonthlyBleed, currency)}/mes ({formatCurrency(result.monthlyTimeLossCost, currency)} en tiempo + {formatCurrency(result.monthlySalesLossCost, currency)} en ventas perdidas).
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('roi')}
                  className="px-5 py-2.5 rounded-xl bg-[#c084fc] hover:bg-[#d8b4fe] text-[#160B1A] font-bold text-sm flex items-center gap-2 shadow-md cursor-pointer transition-transform active:scale-95 shrink-0"
                >
                  <span>Ver Dictamen de ROI & Gráfica</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: DICTAMEN DE ROI & GRÁFICA */}
          {activeTab === 'roi' && (
            <div className="space-y-5 animate-fadeIn">
              {/* TARJETAS DE IMPACTO PRINCIPAL */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* 1. Setup Price */}
                <div className="p-4 rounded-xl bg-[rgba(30,15,35,0.7)] border border-[rgba(147,80,115,0.4)] flex flex-col justify-between">
                  <span className="text-xs font-mono text-[#d8b4fe] uppercase font-semibold">
                    Implementación Inicial
                  </span>
                  <div className="text-xl sm:text-2xl font-extrabold text-white font-mono my-1">
                    {formatCurrency(result.recommendedSetupPrice, currency)}
                  </div>
                  <span className="text-[11px] text-[#F6DBC0]/70">
                    Pago único al validar prototipo
                  </span>
                </div>

                {/* 2. Monthly Retainer */}
                <div className="p-4 rounded-xl bg-[rgba(30,15,35,0.7)] border border-[rgba(147,80,115,0.4)] flex flex-col justify-between">
                  <span className="text-xs font-mono text-[#d8b4fe] uppercase font-semibold">
                    Mantenimiento & Servidor
                  </span>
                  <div className="text-xl sm:text-2xl font-extrabold text-white font-mono my-1">
                    {formatCurrency(result.recommendedMonthlyRetainer, currency)}
                  </div>
                  <span className="text-[11px] text-[#F6DBC0]/70">
                    Soporte, optimización continua y SLA
                  </span>
                </div>

                {/* 3. Net Savings */}
                <div className="p-4 rounded-xl bg-[rgba(16,185,129,0.12)] border border-[rgba(16,185,129,0.4)] flex flex-col justify-between">
                  <span className="text-xs font-mono text-[#10B981] uppercase font-semibold">
                    Beneficio Neto Año 1
                  </span>
                  <div className="text-xl sm:text-2xl font-extrabold text-[#10B981] font-mono my-1">
                    {formatCurrency(result.yearOneNetSavings, currency)}
                  </div>
                  <span className="text-[11px] text-[#F8F4E9]/80">
                    Dinero extra en el bolsillo del negocio
                  </span>
                </div>

                {/* 4. ROI & Payback */}
                <div className="p-4 rounded-xl bg-[rgba(192,132,252,0.15)] border border-[#c084fc] flex flex-col justify-between shadow-[0_0_15px_rgba(192,132,252,0.2)]">
                  <span className="text-xs font-mono text-[#d8b4fe] uppercase font-semibold">
                    Retorno de Inversión (ROI)
                  </span>
                  <div className="text-xl sm:text-2xl font-extrabold text-[#d8b4fe] font-mono my-1">
                    +{result.roiPercentage}%
                  </div>
                  <span className="text-[11px] text-white font-semibold">
                    Se amortiza en ~{result.paybackMonths} meses ({result.paybackDays} días)
                  </span>
                </div>
              </div>

              {/* GRÁFICA DE RETORNO Y PUNTO DE EQUILIBRIO (SVG NATIVO) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[rgba(24,12,28,0.95)] border border-[rgba(147,80,115,0.4)] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[rgba(147,80,115,0.25)] pb-2.5">
                  <div>
                    <h4 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#10B981]" />
                      Curva de Proyección a 12 Meses: Punto de Equilibrio (Breakeven)
                    </h4>
                    <p className="text-xs text-[#F6DBC0]/70">
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

                {/* SVG Interactivo */}
                <div className="w-full overflow-x-auto">
                  <svg
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    className="w-full h-auto min-w-[500px] select-none"
                  >
                    {/* Guías horizontales */}
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

                    {/* Ejes X (Meses) */}
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

                    {/* Línea A: Pérdida sin automatizar (Roja punteada) */}
                    <polyline
                      fill="none"
                      stroke="#ff6060"
                      strokeWidth="2.5"
                      strokeDasharray="5 3"
                      points={pointsLoss}
                    />

                    {/* Línea B: Beneficio acumulado con automatización (Verde sólida) */}
                    <polyline
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="3"
                      points={pointsBenefit}
                    />

                    {/* Línea C: Inversión acumulada */}
                    <polyline
                      fill="none"
                      stroke="#c084fc"
                      strokeWidth="1.5"
                      points={pointsInvestment}
                    />

                    {/* Punto de Equilibrio (Breakeven) */}
                    {breakevenMonthObj && (
                      <g>
                        <circle
                          cx={getX(breakevenMonthObj.month)}
                          cy={getY(breakevenMonthObj.cumulativeBenefitWithAutomation)}
                          r="6"
                          fill="#10B981"
                          stroke="#160B1A"
                          strokeWidth="2"
                        />
                        <circle
                          cx={getX(breakevenMonthObj.month)}
                          cy={getY(breakevenMonthObj.cumulativeBenefitWithAutomation)}
                          r="12"
                          fill="none"
                          stroke="#10B981"
                          strokeWidth="1.5"
                          opacity="0.5"
                          className="animate-ping"
                        />
                        <text
                          x={getX(breakevenMonthObj.month)}
                          y={getY(breakevenMonthObj.cumulativeBenefitWithAutomation) - 14}
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

                    {/* Zonas interactivas hover para cada mes */}
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

                {/* Tooltip de Datos del Mes Seleccionado */}
                {hoveredMonth !== null && (
                  <div className="p-3 rounded-lg bg-[rgba(42,18,50,0.95)] border border-[#c084fc] text-xs font-mono flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
                    <span className="text-[#FFFFFF] font-bold">Mes {hoveredMonth}:</span>
                    <span className="text-[#ff8080]">
                      Pérdida sin sistema: {formatCurrency(result.monthlyBreakdown[hoveredMonth - 1].cumulativeCostWithoutAutomation, currency)}
                    </span>
                    <span className="text-[#10B981] font-bold">
                      Beneficio con sistema: {formatCurrency(result.monthlyBreakdown[hoveredMonth - 1].cumulativeBenefitWithAutomation, currency)}
                    </span>
                    <span className="text-[#d8b4fe]">
                      Ganancia Neta: {formatCurrency(result.monthlyBreakdown[hoveredMonth - 1].netProfit, currency)}
                    </span>
                  </div>
                )}
              </div>

              {/* CARD DE CONTROL DE PRIVACIDAD / MODO CONFIDENCIAL */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-[rgba(32,15,38,0.9)] border border-[rgba(147,80,115,0.4)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isConfidential ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-[rgba(192,132,252,0.2)] text-[#d8b4fe]'}`}>
                    {isConfidential ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="font-bold text-xs sm:text-sm text-white block">
                      Modo Confidencial al Contactar
                    </span>
                    <span className="text-[11px] text-[#F6DBC0]/70 block">
                      {isConfidential
                        ? '🛡️ Activado: Tus métricas de facturación y pérdidas NO se incluirán en el mensaje de WhatsApp ni propuesta.'
                        : '📊 Desactivado: Se incluirá el desglose completo de fuga financiera para que Erick prepare la reunión.'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsConfidential(!isConfidential)}
                  className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 ${
                    isConfidential
                      ? 'bg-[#10B981] text-[#160B1A] shadow-md'
                      : 'bg-[rgba(80,45,85,0.4)] text-[#F8F4E9] hover:bg-[rgba(80,45,85,0.7)] border border-[rgba(147,80,115,0.3)]'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>{isConfidential ? 'Confidencial Activo' : 'Activar Modo Confidencial'}</span>
                </button>
              </div>

              {/* ACCIONES Y BOTONES DE CIERRE */}
              <div className="p-4 rounded-xl bg-[rgba(30,15,35,0.85)] border border-[rgba(147,80,115,0.3)] flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleCopyProposal}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[rgba(80,45,85,0.4)] hover:bg-[rgba(80,45,85,0.7)] border border-[rgba(147,80,115,0.4)] text-[#F8F4E9] font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  <Copy className="w-4 h-4 text-[#d8b4fe]" />
                  <span>{copied ? '¡Copiado al Portapapeles!' : isConfidential ? 'Copiar Propuesta Confidencial' : 'Copiar Propuesta Completa'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleBookWithQuote}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#c084fc] hover:bg-[#d8b4fe] text-[#160B1A] font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all active:scale-95"
                >
                  <span>{isConfidential ? 'Agendar con Cotización Confidencial' : 'Agendar Videollamada con esta Cotización'}</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
