import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  DollarSign,
  TrendingUp,
  UserCheck,
  Check,
  Copy,
  Settings,
  ShieldCheck,
  Shield,
  ArrowRight,
  RotateCcw,
  Eye,
  EyeOff,
  FileDown,
  Mail,
  MessageSquare,
  Video,
  ChevronDown,
  ChevronUp
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
  type ClientBleedInputs,
  type DeveloperConfig
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
  const [currency, setCurrency] = useState<'USD' | 'MXN'>('MXN');
  const [isConfidential, setIsConfidential] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAdminMode, setShowAdminMode] = useState(false);
  const [showAdvancedBleed, setShowAdvancedBleed] = useState(false);
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

  // Estados de cálculo
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
    if (selectedIds.includes(id)) {
      if (selectedIds.length > 1) {
        setSelectedIds(selectedIds.filter((item) => item !== id));
      }
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Cálculo reactivo puro
  const result = calculateRoi(
    selectedIds,
    bleedInputs,
    devConfig,
    currency
  );

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

  if (mode === 'modal' && isCalculadoraRoute) {
    return null;
  }

  if (mode === 'modal' && !isOpen) {
    return null;
  }

  const isMxn = currency === 'MXN';
  const laborMin = isMxn ? 50 : 5;
  const laborMax = isMxn ? 2000 : 150;
  const laborStep = isMxn ? 25 : 1;

  const ticketMin = isMxn ? 100 : 10;
  const ticketMax = isMxn ? 20000 : 1500;
  const ticketStep = isMxn ? 100 : 10;

  // Gráfico SVG sobrio con escalas y dimensiones ajustadas
  const chartWidth = 640;
  const chartHeight = 240;
  const padding = { top: 35, right: 30, bottom: 45, left: 75 };
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

  const pointsLoss = result.monthlyBreakdown
    .map((d) => `${getX(d.month)},${getY(d.cumulativeCostWithoutAutomation)}`)
    .join(' ');
  const pointsBenefit = result.monthlyBreakdown
    .map((d) => `${getX(d.month)},${getY(d.cumulativeBenefitWithAutomation)}`)
    .join(' ');
  const pointsInvestment = result.monthlyBreakdown
    .map((d) => `${getX(d.month)},${getY(d.cumulativeInvestmentWithAutomation)}`)
    .join(' ');

  const breakevenMonthObj =
    result.monthlyBreakdown.find(
      (d) => d.cumulativeBenefitWithAutomation >= d.cumulativeInvestmentWithAutomation
    ) || result.monthlyBreakdown[result.monthlyBreakdown.length - 1];

  // Mes activo para auditoría (Cero brincos: si no hay hover, muestra por defecto el breakeven)
  const activeInspectMonth = hoveredMonth !== null ? hoveredMonth : breakevenMonthObj.month;
  const activeInspectRow = result.monthlyBreakdown[activeInspectMonth - 1] || result.monthlyBreakdown[0];
  const isBreakevenActive = activeInspectMonth === breakevenMonthObj.month;

  // 1. NAVEGACIÓN MINIMALISTA DE PESTAÑAS (SIN NÚMEROS INNECESARIOS)
  const renderMinimalNavbar = () => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-4 print:hidden">
      <nav className="flex items-center gap-6 text-sm font-medium">
        <button
          type="button"
          onClick={() => setActiveTab('catalog')}
          className={`pb-1 transition-all cursor-pointer relative ${
            activeTab === 'catalog'
              ? 'text-[#7e22ce] dark:text-white font-semibold'
              : 'text-slate-500 dark:text-[#F6DBC0]/50 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Soluciones <span className="text-xs font-mono text-[#7e22ce] dark:text-[#c084fc]">({selectedIds.length})</span>
          {activeTab === 'catalog' && (
            <span className="absolute -bottom-[17px] left-0 right-0 h-[2px] bg-[#7e22ce] dark:bg-[#c084fc]" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bleed')}
          className={`pb-1 transition-all cursor-pointer relative ${
            activeTab === 'bleed'
              ? 'text-[#7e22ce] dark:text-white font-semibold'
              : 'text-slate-500 dark:text-[#F6DBC0]/50 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Diagnóstico de Fuga
          {activeTab === 'bleed' && (
            <span className="absolute -bottom-[17px] left-0 right-0 h-[2px] bg-[#7e22ce] dark:bg-[#c084fc]" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('roi')}
          className={`pb-1 transition-all cursor-pointer relative ${
            activeTab === 'roi'
              ? 'text-[#7e22ce] dark:text-white font-semibold'
              : 'text-slate-500 dark:text-[#F6DBC0]/50 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Dictamen & Retorno
          {activeTab === 'roi' && (
            <span className="absolute -bottom-[17px] left-0 right-0 h-[2px] bg-[#7e22ce] dark:bg-[#c084fc]" />
          )}
        </button>
      </nav>

      <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
        {/* Toggle de divisa adaptable a modo claro y oscuro */}
        <div className="flex items-center text-xs font-mono bg-slate-200/70 dark:bg-white/[0.05] p-0.5 rounded-lg border border-slate-300 dark:border-white/10">
          <button
            type="button"
            onClick={() => handleCurrencySwitch('MXN')}
            className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              currency === 'MXN'
                ? 'bg-[#7e22ce] text-white dark:bg-[#c084fc] dark:text-[#160B1A] font-bold shadow-sm'
                : 'text-slate-600 dark:text-[#F8F4E9]/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            MXN
          </button>
          <button
            type="button"
            onClick={() => handleCurrencySwitch('USD')}
            className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              currency === 'USD'
                ? 'bg-[#7e22ce] text-white dark:bg-[#c084fc] dark:text-[#160B1A] font-bold shadow-sm'
                : 'text-slate-600 dark:text-[#F8F4E9]/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            USD
          </button>
        </div>

        {/* Modo Ingeniero */}
        <button
          type="button"
          onClick={() => setShowAdminMode(!showAdminMode)}
          title="Modo Ingeniero (Tarifas y horas base)"
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            showAdminMode
              ? 'text-[#7e22ce] bg-purple-100 dark:text-[#c084fc] dark:bg-[#c084fc]/15'
              : 'text-slate-400 dark:text-white/40 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4" />
        </button>

        {!isPage && (
          <button
            type="button"
            onClick={closeModal}
            className="p-1.5 text-slate-400 dark:text-white/50 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );

  // 2. PANEL ADMINISTRADOR
  const renderAdminPanel = () => {
    if (!showAdminMode) return null;
    return (
      <div className="p-4 rounded-xl bg-slate-100/90 dark:bg-white/[0.03] border border-slate-300 dark:border-white/10 space-y-3 print:hidden text-xs text-slate-800 dark:text-white">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2 text-[#7e22ce] dark:text-[#d8b4fe]">
            <ShieldCheck className="w-4 h-4 text-[#7e22ce] dark:text-[#c084fc]" />
            <span className="font-mono font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
              Parámetros de Costo Técnico
            </span>
          </div>
          <button
            type="button"
            onClick={() => setDevConfig(DEFAULT_DEVELOPER_CONFIG)}
            className="text-[11px] text-[#7e22ce] dark:text-[#c084fc] hover:underline flex items-center gap-1 cursor-pointer font-mono"
          >
            <RotateCcw className="w-3 h-3" /> Restaurar defaults
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-slate-600 dark:text-[#F6DBC0]/70 mb-1 font-mono">Tarifa Base ($ USD/hr):</label>
            <input
              type="number"
              value={devConfig.erickHourlyRateUSD}
              onChange={(e) =>
                setDevConfig({ ...devConfig, erickHourlyRateUSD: Number(e.target.value) || 0 })
              }
              className="w-full bg-white dark:bg-[#160B1A] border border-slate-300 dark:border-white/20 rounded p-1.5 font-mono text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-slate-600 dark:text-[#F6DBC0]/70 mb-1 font-mono">Tipo de Cambio (MXN/USD):</label>
            <input
              type="number"
              step="0.1"
              value={devConfig.exchangeRateUsdToMxn}
              onChange={(e) =>
                setDevConfig({ ...devConfig, exchangeRateUsdToMxn: Number(e.target.value) || 18.5 })
              }
              className="w-full bg-white dark:bg-[#160B1A] border border-slate-300 dark:border-white/20 rounded p-1.5 font-mono text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-slate-600 dark:text-[#F6DBC0]/70 mb-1 font-mono">Plataforma & QA (hrs):</label>
            <input
              type="number"
              value={devConfig.platformDevelopmentHours}
              onChange={(e) =>
                setDevConfig({ ...devConfig, platformDevelopmentHours: Number(e.target.value) || 0 })
              }
              className="w-full bg-white dark:bg-[#160B1A] border border-slate-300 dark:border-white/20 rounded p-1.5 font-mono text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-slate-600 dark:text-[#F6DBC0]/70 mb-1 font-mono">Captura de Valor (%):</label>
            <input
              type="number"
              value={devConfig.valueCapturePercentage}
              onChange={(e) =>
                setDevConfig({ ...devConfig, valueCapturePercentage: Number(e.target.value) || 0 })
              }
              className="w-full bg-white dark:bg-[#160B1A] border border-slate-300 dark:border-white/20 rounded p-1.5 font-mono text-slate-900 dark:text-white"
            />
          </div>
        </div>
      </div>
    );
  };

  // 3. CONTENIDO DE LAS PESTAÑAS (COMPLETAMENTE ADAPTABLE AL TEMA CLARO Y OSCURO)
  const renderTabContent = () => (
    <div className="space-y-6">
      {/* PESTAÑA: SOLUCIONES */}
      {activeTab === 'catalog' && (
        <div className="space-y-6 animate-fadeIn">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              ¿Qué procesos deseas automatizar?
            </h2>
            <p className="text-sm text-slate-600 dark:text-[#F6DBC0]/70 mt-1">
              Selecciona los módulos donde tu negocio pierde más tiempo o ventas.
            </p>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-white/10 border-y border-slate-200 dark:border-white/10">
            {AUTOMATION_CATALOG.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => toggleAutomation(item.id)}
                  className={`py-4 px-3 sm:px-4 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-4 select-none ${
                    isSelected
                      ? 'bg-purple-500/10 dark:bg-white/[0.04] text-slate-900 dark:text-white'
                      : 'hover:bg-slate-100/60 dark:hover:bg-white/[0.02] text-slate-700 dark:text-white/80'
                  }`}
                >
                  <div className="flex items-center gap-3.5 flex-1">
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-[#7e22ce] text-white dark:bg-[#c084fc] dark:text-[#160B1A]'
                          : 'border border-slate-300 dark:border-white/30 text-transparent'
                      }`}
                    >
                      <Check className={`w-3.5 h-3.5 stroke-[3] ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm sm:text-base text-slate-900 dark:text-white">
                          {item.name}
                        </span>
                        {item.popular && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-semibold">
                            Más pedido
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-[#F6DBC0]/65 mt-0.5 leading-relaxed">
                        {item.tagline}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 hidden sm:block">
                    <span className="text-xs font-mono text-slate-500 dark:text-[#F6DBC0]/40 capitalize">
                      {item.category}
                    </span>
                    {showAdminMode && (
                      <span className="block text-[10px] font-mono text-[#7e22ce] dark:text-[#c084fc]">
                        {item.baseHoursFirstTime} hrs
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs font-mono text-slate-500 dark:text-[#F6DBC0]/60">
              {selectedIds.length} {selectedIds.length === 1 ? 'módulo seleccionado' : 'módulos seleccionados'}
            </span>

            <button
              type="button"
              onClick={() => setActiveTab('bleed')}
              className="px-6 py-2.5 rounded-xl bg-[#7e22ce] hover:bg-[#6b1cb0] text-white dark:bg-[#c084fc] dark:hover:bg-[#d8b4fe] dark:text-[#160B1A] font-bold text-sm flex items-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <span>Continuar al diagnóstico</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* PESTAÑA: DIAGNÓSTICO DE FUGA */}
      {activeTab === 'bleed' && (
        <div className="space-y-6 animate-fadeIn">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Diagnóstico de Ineficiencias & Pérdidas
            </h2>
            <p className="text-sm text-slate-600 dark:text-[#F6DBC0]/70 mt-1">
              Ajusta las variables de tu negocio. Puedes mover la barra o teclear el número directamente.
            </p>
          </div>

          {/* 4 Entradas Esenciales del Negocio */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Horas perdidas */}
            <div className="p-4 rounded-xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#7e22ce] dark:text-[#c084fc]" /> Horas manuales por semana:
                </span>
                <div className="flex items-center gap-1 font-mono text-xs">
                  <input
                    type="number"
                    min="0"
                    max="168"
                    value={bleedInputs.lostHoursPerWeek}
                    onChange={(e) =>
                      setBleedInputs({ ...bleedInputs, lostHoursPerWeek: Math.max(0, Number(e.target.value) || 0) })
                    }
                    className="w-16 px-2 py-0.5 rounded bg-slate-50 dark:bg-black/40 border border-slate-300 dark:border-white/20 text-right font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#7e22ce] dark:focus:border-[#c084fc]"
                  />
                  <span className="text-slate-500 dark:text-[#F6DBC0]/60">hrs</span>
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
                className="w-full accent-[#7e22ce] dark:accent-[#c084fc] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-400 dark:text-[#F6DBC0]/40">
                <span>1 hr/sem</span>
                <span>{Math.max(60, bleedInputs.lostHoursPerWeek)} hrs/sem</span>
              </div>
            </div>

            {/* 2. Costo por hora */}
            <div className="p-4 rounded-xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-[#7e22ce] dark:text-[#c084fc]" /> Costo por hora operativa:
                </span>
                <div className="flex items-center gap-1 font-mono text-xs">
                  <span className="text-slate-500 dark:text-[#F6DBC0]/60">$</span>
                  <input
                    type="number"
                    min="0"
                    value={bleedInputs.hourlyLaborCost}
                    onChange={(e) =>
                      setBleedInputs({ ...bleedInputs, hourlyLaborCost: Math.max(0, Number(e.target.value) || 0) })
                    }
                    className="w-20 px-2 py-0.5 rounded bg-slate-50 dark:bg-black/40 border border-slate-300 dark:border-white/20 text-right font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#7e22ce] dark:focus:border-[#c084fc]"
                  />
                  <span className="text-slate-500 dark:text-[#F6DBC0]/60">/hr</span>
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
                className="w-full accent-[#7e22ce] dark:accent-[#c084fc] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-400 dark:text-[#F6DBC0]/40">
                <span>{formatCurrency(laborMin, currency)}</span>
                <span>{formatCurrency(Math.max(laborMax, bleedInputs.hourlyLaborCost), currency)}</span>
              </div>
            </div>

            {/* 3. Ticket promedio */}
            <div className="p-4 rounded-xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-[#7e22ce] dark:text-[#c084fc]" /> Ticket promedio por venta:
                </span>
                <div className="flex items-center gap-1 font-mono text-xs">
                  <span className="text-slate-500 dark:text-[#F6DBC0]/60">$</span>
                  <input
                    type="number"
                    min="0"
                    value={bleedInputs.averageTicketValue}
                    onChange={(e) =>
                      setBleedInputs({ ...bleedInputs, averageTicketValue: Math.max(0, Number(e.target.value) || 0) })
                    }
                    className="w-24 px-2 py-0.5 rounded bg-slate-50 dark:bg-black/40 border border-slate-300 dark:border-white/20 text-right font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#7e22ce] dark:focus:border-[#c084fc]"
                  />
                  <span className="text-slate-500 dark:text-[#F6DBC0]/60">{currency}</span>
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
                className="w-full accent-[#7e22ce] dark:accent-[#c084fc] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-400 dark:text-[#F6DBC0]/40">
                <span>{formatCurrency(ticketMin, currency)}</span>
                <span>{formatCurrency(Math.max(ticketMax, bleedInputs.averageTicketValue), currency)}</span>
              </div>
            </div>

            {/* 4. Clientes al mes */}
            <div className="p-4 rounded-xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-[#7e22ce] dark:text-[#c084fc]" /> Clientes o consultas al mes:
                </span>
                <div className="flex items-center gap-1 font-mono text-xs">
                  <input
                    type="number"
                    min="0"
                    value={bleedInputs.monthlyLeadsOrClients}
                    onChange={(e) =>
                      setBleedInputs({ ...bleedInputs, monthlyLeadsOrClients: Math.max(0, Number(e.target.value) || 0) })
                    }
                    className="w-20 px-2 py-0.5 rounded bg-slate-50 dark:bg-black/40 border border-slate-300 dark:border-white/20 text-right font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#7e22ce] dark:focus:border-[#c084fc]"
                  />
                  <span className="text-slate-500 dark:text-[#F6DBC0]/60">cli</span>
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
                className="w-full accent-[#7e22ce] dark:accent-[#c084fc] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-400 dark:text-[#F6DBC0]/40">
                <span>10</span>
                <span>{Math.max(2000, bleedInputs.monthlyLeadsOrClients).toLocaleString('es-MX')} clientes</span>
              </div>
            </div>
          </div>

          {/* Acordeón de Progressive Disclosure: Variables Avanzadas */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowAdvancedBleed(!showAdvancedBleed)}
              className="text-xs font-mono text-[#7e22ce] dark:text-[#c084fc] hover:underline flex items-center gap-1.5 cursor-pointer"
            >
              {showAdvancedBleed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              <span>{showAdvancedBleed ? 'Ocultar variables secundarias' : '+ Ajustar variables secundarias de fuga (% fuga WhatsApp, retrabajos)'}</span>
            </button>

            {showAdvancedBleed && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-200 dark:border-white/10 animate-fadeIn">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 dark:text-white/80">Clientes perdidos por tardanza (%):</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={bleedInputs.lostClientsPercentage}
                      onChange={(e) =>
                        setBleedInputs({ ...bleedInputs, lostClientsPercentage: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })
                      }
                      className="w-16 px-1.5 py-0.5 rounded bg-white dark:bg-black/40 border border-slate-300 dark:border-white/20 text-right font-mono font-bold text-slate-900 dark:text-white text-xs"
                    />
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
                    className="w-full accent-[#7e22ce] dark:accent-[#c084fc] cursor-pointer"
                  />
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 dark:text-white/80">Mermas y errores manuales ($/mes):</span>
                    <input
                      type="number"
                      min="0"
                      value={bleedInputs.humanErrorsMonthlyCost}
                      onChange={(e) =>
                        setBleedInputs({ ...bleedInputs, humanErrorsMonthlyCost: Math.max(0, Number(e.target.value) || 0) })
                      }
                      className="w-20 px-1.5 py-0.5 rounded bg-white dark:bg-black/40 border border-slate-300 dark:border-white/20 text-right font-mono font-bold text-slate-900 dark:text-white text-xs"
                    />
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
                    className="w-full accent-[#7e22ce] dark:accent-[#c084fc] cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Resumen del Dolor Austero */}
          <div className="p-6 rounded-2xl bg-rose-50/70 dark:bg-white/[0.04] border border-rose-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-rose-600 dark:text-rose-400 block font-bold">
                Fuga Financiera Estimada Sin Automatización
              </span>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                {formatCurrency(result.totalAnnualBleed, currency)}{' '}
                <span className="text-sm font-normal text-slate-500 dark:text-[#F6DBC0]/60">/ año</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-[#F6DBC0]/70 mt-1">
                Representa {formatCurrency(result.totalMonthlyBleed, currency)} cada mes en tareas manuales y oportunidades no atendidas.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('roi')}
              className="px-6 py-2.5 rounded-xl bg-[#7e22ce] hover:bg-[#6b1cb0] text-white dark:bg-[#c084fc] dark:hover:bg-[#d8b4fe] dark:text-[#160B1A] font-bold text-sm flex items-center gap-2 transition-all cursor-pointer shrink-0 shadow-md"
            >
              <span>Ver Dictamen & Retorno</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="text-center text-[11px] text-slate-500 dark:text-[#F6DBC0]/50 font-mono">
            🔒 Privacidad garantizada: Este análisis se calcula de forma 100% privada en tu navegador.
          </div>
        </div>
      )}

      {/* PESTAÑA: DICTAMEN DE ROI & GRÁFICA DIDÁCTICA ESTABLE */}
      {activeTab === 'roi' && (
        <div className="space-y-6 animate-fadeIn">
          {/* EL HÉROE VISUAL: INVERSIÓN VS RETORNO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 sm:p-8 rounded-2xl bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none">
            {/* Columna Izquierda: Inversión */}
            <div className="space-y-4">
              <span className="text-xs font-mono uppercase tracking-wider text-[#7e22ce] dark:text-[#d8b4fe] block font-bold">
                Inversión Requerida
              </span>

              <div className="space-y-3">
                <div>
                  <span className="text-xs text-slate-500 dark:text-[#F6DBC0]/60 block">Implementación Inicial (Setup único)</span>
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                    {formatCurrency(result.recommendedSetupPrice, currency)}
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-[#F6DBC0]/50">Liquidación al validar prototipo funcional</span>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-white/10">
                  <span className="text-xs text-slate-500 dark:text-[#F6DBC0]/60 block">Mantenimiento mensual & servidores</span>
                  <div className="text-lg font-bold font-mono text-slate-800 dark:text-white/90 mt-0.5">
                    {formatCurrency(result.recommendedMonthlyRetainer, currency)}{' '}
                    <span className="text-xs text-slate-500 dark:text-[#F6DBC0]/50 font-normal">/ mes</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Beneficio */}
            <div className="space-y-4 border-t md:border-t-0 md:border-l border-slate-200 dark:border-white/10 pt-4 md:pt-0 md:pl-6">
              <span className="text-xs font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block font-bold">
                Impacto Financiero Proyectado
              </span>

              <div className="space-y-3">
                <div>
                  <span className="text-xs text-slate-500 dark:text-[#F6DBC0]/60 block">Beneficio Neto Año 1 (Ahorro libre)</span>
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {formatCurrency(result.yearOneNetSavings, currency)}
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-[#F6DBC0]/50">Dinero adicional retenido en tu negocio</span>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-white/10">
                  <span className="text-xs text-slate-500 dark:text-[#F6DBC0]/60 block">Retorno de Inversión (ROI)</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                      +{result.roiPercentage}%
                    </span>
                    <span className="text-xs text-emerald-700 dark:text-emerald-400 font-mono font-semibold">
                      (Recuperado en ~{result.paybackMonths} meses)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* GRÁFICA DIDÁCTICA Y ESTABLE: CERO BRINCOS & EJES EXPLICADOS */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="font-semibold text-sm sm:text-base text-slate-900 dark:text-white">
                  Curva de Amortización a 12 Meses: Punto de Equilibrio
                </h4>
                <p className="text-xs text-slate-600 dark:text-[#F6DBC0]/60 mt-0.5">
                  El sistema se amortiza completamente en el <strong>Mes {breakevenMonthObj.month}</strong>.
                </p>
              </div>

              {/* Leyenda clara y comprensible */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                  <span className="w-3 h-0.5 bg-rose-500 inline-block"></span> Pérdida sin sistema
                </span>
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <span className="w-3 h-0.5 bg-emerald-500 inline-block"></span> Beneficio con sistema
                </span>
                <span className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
                  <span className="w-3 h-0.5 bg-purple-500 inline-block"></span> Costo acumulado
                </span>
              </div>
            </div>

            {/* SVG Didáctico con Ejes Rótulados */}
            <div className="w-full overflow-x-auto pt-1 select-none">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-auto min-w-[540px]"
              >
                {/* Rótulo Eje Vertical Y */}
                <text
                  x={padding.left}
                  y={18}
                  fill="currentColor"
                  className="text-[10px] font-mono font-semibold fill-slate-500 dark:fill-white/60"
                >
                  ↑ Dinero Acumulado ({currency})
                </text>

                {/* Rótulo Eje Horizontal X */}
                <text
                  x={padding.left + innerWidth / 2}
                  y={chartHeight - 6}
                  textAnchor="middle"
                  fill="currentColor"
                  className="text-[10px] font-mono font-semibold fill-slate-500 dark:fill-white/60"
                >
                  → Meses de Operación Transcurridos
                </text>

                {/* Líneas horizontales de escala en Y */}
                {[0, 0.5, 1].map((ratio, idx) => {
                  const y = padding.top + innerHeight * (1 - ratio);
                  const val = maxVal * ratio;
                  return (
                    <g key={idx}>
                      <line
                        x1={padding.left}
                        y1={y}
                        x2={chartWidth - padding.right}
                        y2={y}
                        stroke="currentColor"
                        className="stroke-slate-200 dark:stroke-white/10"
                        strokeDasharray="3 3"
                      />
                      <text
                        x={padding.left - 8}
                        y={y + 3}
                        textAnchor="end"
                        fill="currentColor"
                        className="text-[9px] font-mono fill-slate-400 dark:fill-[#F6DBC0]/40"
                      >
                        {formatCurrency(val, currency)}
                      </text>
                    </g>
                  );
                })}

                {/* Líneas verticales y etiquetas de meses en Eje X */}
                {result.monthlyBreakdown.map((d) => {
                  const x = getX(d.month);
                  const isHovered = activeInspectMonth === d.month;
                  return (
                    <g key={d.month}>
                      <line
                        x1={x}
                        y1={padding.top + innerHeight}
                        x2={x}
                        y2={padding.top + innerHeight + 4}
                        stroke="currentColor"
                        className="stroke-slate-300 dark:stroke-white/20"
                      />
                      <text
                        x={x}
                        y={padding.top + innerHeight + 16}
                        textAnchor="middle"
                        fill="currentColor"
                        className={`text-[9px] font-mono transition-colors ${
                          isHovered
                            ? 'font-bold fill-[#7e22ce] dark:fill-white text-[10px]'
                            : 'fill-slate-500 dark:fill-[#F6DBC0]/50'
                        }`}
                      >
                        M{d.month}
                      </text>
                    </g>
                  );
                })}

                {/* Curva 1: Pérdida sin sistema (Fuga) */}
                <polyline
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="2"
                  strokeDasharray="4 3"
                  points={pointsLoss}
                />

                {/* Curva 2: Inversión acumulada */}
                <polyline
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth="1.5"
                  opacity="0.8"
                  points={pointsInvestment}
                />

                {/* Curva 3: Beneficio con sistema */}
                <polyline
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  points={pointsBenefit}
                />

                {/* Línea vertical y Pin del Punto de Equilibrio (Breakeven) */}
                {breakevenMonthObj && (
                  <g>
                    <line
                      x1={getX(breakevenMonthObj.month)}
                      y1={padding.top}
                      x2={getX(breakevenMonthObj.month)}
                      y2={padding.top + innerHeight}
                      stroke="#10b981"
                      strokeWidth="1.5"
                      strokeDasharray="2 2"
                      opacity="0.75"
                    />
                    <circle
                      cx={getX(breakevenMonthObj.month)}
                      cy={getY(breakevenMonthObj.cumulativeBenefitWithAutomation)}
                      r="4.5"
                      fill="#10b981"
                    />
                    <text
                      x={getX(breakevenMonthObj.month)}
                      y={getY(breakevenMonthObj.cumulativeBenefitWithAutomation) - 9}
                      textAnchor="middle"
                      fill="#10b981"
                      fontSize="9.5"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      ★ Breakeven (M{breakevenMonthObj.month})
                    </text>
                  </g>
                )}

                {/* Columnas invisibles de detección de cursor para cada mes */}
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
                      className="cursor-pointer hover:fill-purple-500/10 dark:hover:fill-white/5 transition-colors"
                      onMouseEnter={() => setHoveredMonth(d.month)}
                    />
                  );
                })}
              </svg>
            </div>

            {/* PANEL DE AUDITORÍA MENSUAL FIJO (CERO BRINCOS: ALTURA PERMANENTE DE 52PX) */}
            <div className="h-13 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-black/30 border border-slate-200 dark:border-white/10 text-xs font-mono flex items-center justify-between text-slate-800 dark:text-white/80">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  Mes {activeInspectMonth}:
                </span>
                {isBreakevenActive && (
                  <span className="text-[10px] font-sans px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-500/30">
                    ★ Inversión 100% Recuperada
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-right">
                <span className="text-rose-600 dark:text-rose-400">
                  Sin sistema: {formatCurrency(activeInspectRow.cumulativeCostWithoutAutomation, currency)}
                </span>
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                  Recuperado: {formatCurrency(activeInspectRow.cumulativeBenefitWithAutomation, currency)}
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  Ganancia Neta: +{formatCurrency(activeInspectRow.netProfit, currency)}
                </span>
              </div>
            </div>
          </div>

          {/* BLOQUE DE ACCIONES CON JERARQUÍA CLARA */}
          <div className="p-6 rounded-2xl bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h5 className="font-semibold text-slate-900 dark:text-white text-base">
                  ¿Listo para implementar en tu negocio?
                </h5>
                <p className="text-xs text-slate-600 dark:text-[#F6DBC0]/70 mt-0.5">
                  Revisemos un prototipo funcional adaptado a tus flujos actuales sin costo inicial.
                </p>
              </div>

              {/* Toggle de Modo Confidencial discreto */}
              <button
                type="button"
                onClick={() => setIsConfidential(!isConfidential)}
                className={`text-xs font-mono flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors cursor-pointer shrink-0 ${
                  isConfidential
                    ? 'bg-emerald-100 dark:bg-emerald-500/15 border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 font-semibold'
                    : 'bg-slate-100 dark:bg-white/5 border-slate-300 dark:border-white/10 text-slate-600 dark:text-[#F6DBC0]/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {isConfidential ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{isConfidential ? 'Modo confidencial activo' : 'Modo confidencial'}</span>
              </button>
            </div>

            {/* Fila de Acciones: 1 Botón Protagonista + Secundarios Elegantes */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
              {/* Botón Principal (Protagonista) */}
              <button
                type="button"
                onClick={handleBookingClick}
                className="flex-1 px-6 py-3 rounded-xl bg-[#7e22ce] hover:bg-[#6b1cb0] text-white dark:bg-[#c084fc] dark:hover:bg-[#d8b4fe] dark:text-[#160B1A] font-extrabold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-98"
                title="Agendar videollamada para revisar el prototipo navegable"
              >
                <Video className="w-4 h-4" />
                <span>Agendar Videollamada de Demostración</span>
              </button>

              {/* Secundario: Descargar PDF */}
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/15 dark:text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 shadow-sm dark:shadow-none"
                title="Descargar reporte en PDF"
              >
                <FileDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Descargar PDF</span>
              </button>

              {/* Secundario: WhatsApp */}
              <button
                type="button"
                onClick={handleWhatsAppClick}
                className="px-4 py-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/15 dark:text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 shadow-sm dark:shadow-none"
                title="Consultar por WhatsApp"
              >
                <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>WhatsApp</span>
              </button>

              {/* Secundario: Correo */}
              <button
                type="button"
                onClick={handleEmailClick}
                className="px-4 py-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 hover:text-slate-900 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/15 dark:text-white/80 dark:hover:text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 shadow-sm dark:shadow-none"
                title="Enviar por correo"
              >
                <Mail className="w-4 h-4" />
                <span>Correo</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-white/10 text-xs text-slate-500 dark:text-[#F6DBC0]/60">
              <button
                type="button"
                onClick={handleCopyProposal}
                className="hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 font-mono cursor-pointer transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? '¡Propuesta copiada!' : 'Copiar texto de cotización'}</span>
              </button>
              <span className="font-mono text-[11px]">Garantía: Liquidación tras validar prototipo</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // 4. REPORTE EJECUTIVO IMPRIMIBLE EN TABLAS (SOLO VISIBLE AL IMPRIMIR / DESCARGAR PDF - 1 SOLA PÁGINA)
  const renderPrintableReport = () => (
    <div className="hidden print:block roi-printable-report text-[#0f172a] bg-white p-4 max-w-4xl mx-auto font-sans leading-tight">
      {/* CABECERA OFICIAL CON DATOS DE LA CONSULTORÍA */}
      <div className="border-b-2 border-purple-950 pb-2 mb-2.5 flex justify-between items-start">
        <div>
          <div className="text-lg font-black tracking-tight text-purple-950 font-mono">
            DAARICK // SISTEMAS DE IA & AUTOMATIZACIÓN
          </div>
          <div className="text-[11px] font-semibold text-gray-800 mt-0.5">
            Dictamen Técnico de Cotización y Retorno de Inversión (ROI)
          </div>
          <div className="text-[9px] text-gray-600 mt-0.5">
            Ingeniería de Software & Arquitectura Determinista • Erick Daniel García
          </div>
        </div>
        <div className="text-right text-[9px] font-mono text-gray-700 leading-tight">
          <div><strong>Folio:</strong> #COT-202610-{result.technicalFloorCost}</div>
          <div><strong>Fecha:</strong> {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
          <div><strong>Moneda:</strong> {currency}</div>
          <div className="text-purple-900 font-semibold mt-0.5">e.danielgrz10@gmail.com • +52 55 7866 6313</div>
        </div>
      </div>

      {/* TABLA 1: ALCANCE DE SOLUCIONES COTIZADAS */}
      <div className="mb-2.5">
        <div className="text-[10px] font-bold uppercase tracking-wider text-purple-950 mb-1 font-mono">
          1. Alcance de Soluciones Cotizadas ({selectedIds.length} Módulos)
        </div>
        <table className="w-full text-[9.5px] border-collapse border border-gray-300">
          <thead className="bg-gray-100 text-gray-800 font-mono uppercase text-[8.5px]">
            <tr>
              <th className="p-1 text-center border border-gray-300 w-6">#</th>
              <th className="p-1 text-left border border-gray-300 w-44">Módulo / Solución</th>
              <th className="p-1 text-left border border-gray-300">Beneficio Operativo Tangible</th>
              <th className="p-1 text-center border border-gray-300 w-24">Área</th>
            </tr>
          </thead>
          <tbody>
            {AUTOMATION_CATALOG.filter((i) => selectedIds.includes(i.id)).map((item, idx) => (
              <tr key={item.id} className="border-b border-gray-200 odd:bg-white even:bg-gray-50/50">
                <td className="p-1 text-center font-mono text-gray-500 border border-gray-300">{idx + 1}</td>
                <td className="p-1 font-bold text-gray-900 border border-gray-300">{item.name}</td>
                <td className="p-1 text-gray-700 border border-gray-300">{item.tagline}</td>
                <td className="p-1 text-center font-mono text-gray-600 capitalize border border-gray-300">{item.category}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* TABLA 2: DIAGNÓSTICO OPERATIVO & FUGA FINANCIERA */}
      <div className="mb-2.5">
        <div className="text-[10px] font-bold uppercase tracking-wider text-purple-950 mb-1 font-mono">
          2. Diagnóstico Operativo & Fuga Financiera Anual
        </div>
        {isConfidential ? (
          <div className="p-1.5 bg-gray-50 border border-gray-300 rounded text-[9px] text-gray-600 italic">
            🛡️ Modo Confidencial Activado: Las variables específicas de nómina y facturación han sido resguardadas a solicitud del cliente.
          </div>
        ) : (
          <table className="w-full text-[9.5px] border-collapse border border-gray-300">
            <thead className="bg-gray-100 text-gray-800 font-mono uppercase text-[8.5px]">
              <tr>
                <th className="p-1 text-left border border-gray-300">Variable Auditada</th>
                <th className="p-1 text-center border border-gray-300 w-36">Parámetro del Negocio</th>
                <th className="p-1 text-right border border-gray-300 w-40">Impacto Económico Estimado</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="p-1 text-gray-900 border border-gray-300">Tareas manuales repetitivas en el equipo</td>
                <td className="p-1 text-center font-mono border border-gray-300">{bleedInputs.lostHoursPerWeek} hrs / semana</td>
                <td className="p-1 text-right font-mono text-gray-900 border border-gray-300">{formatCurrency(result.monthlyTimeLossCost, currency)} / mes</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="p-1 text-gray-900 border border-gray-300">Costo horario operativo de personal involucrado</td>
                <td className="p-1 text-center font-mono border border-gray-300">{formatCurrency(bleedInputs.hourlyLaborCost, currency)} / hora</td>
                <td className="p-1 text-right font-mono text-gray-600 border border-gray-300">Nómina operativa absorbida</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="p-1 text-gray-900 border border-gray-300">Ticket promedio & volumen mensual</td>
                <td className="p-1 text-center font-mono border border-gray-300">{formatCurrency(bleedInputs.averageTicketValue, currency)} ({bleedInputs.monthlyLeadsOrClients} clientes)</td>
                <td className="p-1 text-right font-mono text-gray-600 border border-gray-300">Base mensual de operaciones</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="p-1 text-gray-900 border border-gray-300">Ventas caídas por tardanza en responder</td>
                <td className="p-1 text-center font-mono border border-gray-300">{bleedInputs.lostClientsPercentage}% de prospectos no atendidos</td>
                <td className="p-1 text-right font-mono text-gray-900 border border-gray-300">{formatCurrency(result.monthlySalesLossCost, currency)} / mes</td>
              </tr>
              <tr className="bg-red-50/70 font-semibold border-t border-red-200">
                <td className="p-1 text-red-950 border border-gray-300">Pérdida Financiera Acumulada Sin Sistema (Inacción):</td>
                <td className="p-1 text-center font-mono text-red-900 border border-gray-300">{formatCurrency(result.totalMonthlyBleed, currency)} / mes</td>
                <td className="p-1 text-right font-mono text-red-950 font-bold border border-gray-300">{formatCurrency(result.totalAnnualBleed, currency)} / año</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>

      {/* TABLA 3: DICTAMEN DE INVERSIÓN & RETORNO PROYECTADO */}
      <div className="mb-2.5">
        <div className="text-[10px] font-bold uppercase tracking-wider text-purple-950 mb-1 font-mono">
          3. Dictamen de Inversión & Retorno Proyectado (Value-Based Pricing)
        </div>
        <table className="w-full text-[9.5px] border-collapse border border-gray-300">
          <thead className="bg-gray-100 text-gray-800 font-mono uppercase text-[8.5px]">
            <tr>
              <th className="p-1 text-left border border-gray-300">Concepto</th>
              <th className="p-1 text-right border border-gray-300 w-36">Monto ({currency})</th>
              <th className="p-1 text-left border border-gray-300">Términos de Entrega & Garantía</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-200">
              <td className="p-1 font-bold text-purple-950 border border-gray-300">Implementación Inicial (Setup)</td>
              <td className="p-1 text-right font-mono font-bold text-purple-950 border border-gray-300 text-[10.5px]">{formatCurrency(result.recommendedSetupPrice, currency)}</td>
              <td className="p-1 text-gray-700 border border-gray-300">Pago único (Liquidación condicionada a validación de prototipo funcional)</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="p-1 font-bold text-purple-950 border border-gray-300">Mantenimiento Mensual (Retainer)</td>
              <td className="p-1 text-right font-mono font-bold text-purple-950 border border-gray-300 text-[10.5px]">{formatCurrency(result.recommendedMonthlyRetainer, currency)} / mes</td>
              <td className="p-1 text-gray-700 border border-gray-300">Servidores, soporte técnico, monitoreo proactivo y mejoras continuas</td>
            </tr>
            <tr className="border-b border-gray-200 bg-emerald-50/60">
              <td className="p-1 font-bold text-emerald-950 border border-gray-300">Beneficio Neto Año 1</td>
              <td className="p-1 text-right font-mono font-bold text-emerald-950 border border-gray-300 text-[10.5px]">+{formatCurrency(result.yearOneNetSavings, currency)}</td>
              <td className="p-1 text-emerald-900 border border-gray-300">Ahorro libre de caja en el primer año (descontando setup y retainers)</td>
            </tr>
            <tr className="bg-emerald-50/60 font-semibold">
              <td className="p-1 font-bold text-emerald-950 border border-gray-300">Retorno de Inversión (ROI)</td>
              <td className="p-1 text-right font-mono font-bold text-emerald-950 border border-gray-300 text-[10.5px]">+{result.roiPercentage}%</td>
              <td className="p-1 text-emerald-900 border border-gray-300">Amortización total de inversión en ~{result.paybackMonths} meses ({result.paybackDays} días)</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* TABLA 4: HITOS DE AMORTIZACIÓN PROYECTADA A 12 MESES */}
      <div className="mb-2.5">
        <div className="text-[10px] font-bold uppercase tracking-wider text-purple-950 mb-1 font-mono">
          4. Hitos de Amortización Proyectada a 12 Meses (Flujo Acumulado)
        </div>
        <table className="w-full text-[9.5px] border-collapse border border-gray-300">
          <thead className="bg-gray-100 text-gray-800 font-mono uppercase text-[8.5px]">
            <tr>
              <th className="p-1 text-left border border-gray-300 w-24">Mes</th>
              <th className="p-1 text-right border border-gray-300">Sin Sistema (Pérdida)</th>
              <th className="p-1 text-right border border-gray-300">Inversión Acumulada</th>
              <th className="p-1 text-right border border-gray-300">Beneficio Recuperado</th>
              <th className="p-1 text-right border border-gray-300 font-bold">Ganancia Neta en Caja</th>
            </tr>
          </thead>
          <tbody>
            {[1, 3, breakevenMonthObj.month, 6, 12]
              .filter((v, idx, arr) => arr.indexOf(v) === idx)
              .sort((a, b) => a - b)
              .map((m) => {
                const row = result.monthlyBreakdown[m - 1];
                const isBreakeven = m === breakevenMonthObj.month;
                return (
                  <tr key={m} className={isBreakeven ? 'bg-emerald-100/70 font-semibold' : 'border-b border-gray-200'}>
                    <td className="p-1 text-left font-mono border border-gray-300">
                      Mes {m} {isBreakeven && <span className="text-[8px] bg-emerald-700 text-white px-1 py-0.2 rounded font-sans ml-1">★ Breakeven</span>}
                    </td>
                    <td className="p-1 text-right font-mono text-red-700 border border-gray-300">{formatCurrency(row.cumulativeCostWithoutAutomation, currency)}</td>
                    <td className="p-1 text-right font-mono text-purple-950 border border-gray-300">{formatCurrency(row.cumulativeInvestmentWithAutomation, currency)}</td>
                    <td className="p-1 text-right font-mono text-emerald-800 border border-gray-300">{formatCurrency(row.cumulativeBenefitWithAutomation, currency)}</td>
                    <td className="p-1 text-right font-mono font-bold text-gray-900 border border-gray-300">{formatCurrency(row.netProfit, currency)}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* PIE DE PÁGINA CON GARANTÍA Y FIRMAS */}
      <div className="pt-2 border-t-2 border-gray-300 flex justify-between items-end text-[9px] text-gray-700">
        <div className="space-y-0.5 max-w-sm">
          <div className="font-bold text-gray-900 font-mono uppercase text-[8.5px]">Garantía de Satisfacción Técnica:</div>
          <div>• Liquidación del setup condicionada a validación de prototipo navegable.</div>
          <div>• Código limpio y arquitectura determinista sin ataduras a plataformas propietarias.</div>
          <div className="pt-1 text-gray-500 font-mono text-[8.5px]">
            Daarick // Erick Daniel García • https://daarick.dev • WhatsApp: +52 55 7866 6313
          </div>
        </div>

        <div className="flex gap-6 text-center font-mono text-[8.5px]">
          <div className="w-32 pt-5 border-t border-gray-400">
            Aprobación del Cliente
          </div>
          <div className="w-32 pt-5 border-t border-gray-400">
            Erick Daniel García (Ingeniero)
          </div>
        </div>
      </div>
    </div>
  );

  // VISTA EN MODO PÁGINA: DISEÑO MINIMALISTA DESPEJADO
  if (isPage) {
    return (
      <div className="w-full roi-calculator-page-view">
        {/* Contenedor interactivo (Oculto al imprimir para que solo aparezca el reporte en tablas) */}
        <div className="roi-calculator-interactive roi-interactive-view print:hidden space-y-8">
          {renderMinimalNavbar()}
          {renderAdminPanel()}
          {renderTabContent()}
        </div>
        {renderPrintableReport()}
      </div>
    );
  }

  // VISTA EN MODO MODAL (CUANDO SE ABRE DESDE EL NAVBAR O CHATBOT)
  return (
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center p-3 sm:p-6 bg-slate-900/40 dark:bg-black/70 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-label="Calculadora de Cotización y Retorno de Inversión"
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto p-6 sm:p-8 bg-[#FAF7F2] dark:bg-[#160B1A] text-slate-900 dark:text-[#F8F4E9] border border-slate-300 dark:border-white/10 rounded-2xl shadow-2xl scrollbar-thin space-y-6">
        {/* Contenedor interactivo (Oculto al imprimir) */}
        <div className="roi-calculator-interactive roi-interactive-view print:hidden space-y-6">
          {renderMinimalNavbar()}
          {renderAdminPanel()}
          {renderTabContent()}
        </div>
        {renderPrintableReport()}
      </div>
    </div>
  );
};
