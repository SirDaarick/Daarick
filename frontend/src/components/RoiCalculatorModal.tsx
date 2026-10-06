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

  // Gráfico SVG sobrio
  const chartWidth = 600;
  const chartHeight = 200;
  const padding = { top: 20, right: 20, bottom: 30, left: 55 };
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

  const breakevenMonthObj =
    result.monthlyBreakdown.find(
      (d) => d.cumulativeBenefitWithAutomation >= d.cumulativeInvestmentWithAutomation
    ) || result.monthlyBreakdown[result.monthlyBreakdown.length - 1];

  // 1. NAVEGACIÓN MINIMALISTA DE PASOS (ESTILO SUIZO)
  const renderMinimalNavbar = () => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4 print:hidden">
      <nav className="flex items-center gap-6 text-sm font-medium">
        <button
          type="button"
          onClick={() => setActiveTab('catalog')}
          className={`pb-1 transition-all cursor-pointer relative ${
            activeTab === 'catalog'
              ? 'text-white font-semibold'
              : 'text-[#F6DBC0]/50 hover:text-white'
          }`}
        >
          01 Soluciones <span className="text-xs text-[#c084fc]">({selectedIds.length})</span>
          {activeTab === 'catalog' && (
            <span className="absolute -bottom-[17px] left-0 right-0 h-[2px] bg-[#c084fc]" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bleed')}
          className={`pb-1 transition-all cursor-pointer relative ${
            activeTab === 'bleed'
              ? 'text-white font-semibold'
              : 'text-[#F6DBC0]/50 hover:text-white'
          }`}
        >
          02 Diagnóstico
          {activeTab === 'bleed' && (
            <span className="absolute -bottom-[17px] left-0 right-0 h-[2px] bg-[#c084fc]" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('roi')}
          className={`pb-1 transition-all cursor-pointer relative ${
            activeTab === 'roi'
              ? 'text-white font-semibold'
              : 'text-[#F6DBC0]/50 hover:text-white'
          }`}
        >
          03 Dictamen
          {activeTab === 'roi' && (
            <span className="absolute -bottom-[17px] left-0 right-0 h-[2px] bg-[#c084fc]" />
          )}
        </button>
      </nav>

      <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
        {/* Toggle de divisa ultra-compacto */}
        <div className="flex items-center text-xs font-mono bg-white/[0.04] p-0.5 rounded-lg border border-white/10">
          <button
            type="button"
            onClick={() => handleCurrencySwitch('MXN')}
            className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              currency === 'MXN'
                ? 'bg-[#c084fc] text-[#160B1A] font-bold'
                : 'text-[#F8F4E9]/60 hover:text-white'
            }`}
          >
            MXN
          </button>
          <button
            type="button"
            onClick={() => handleCurrencySwitch('USD')}
            className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              currency === 'USD'
                ? 'bg-[#c084fc] text-[#160B1A] font-bold'
                : 'text-[#F8F4E9]/60 hover:text-white'
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
              ? 'text-[#c084fc] bg-[#c084fc]/10'
              : 'text-white/40 hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4" />
        </button>

        {!isPage && (
          <button
            type="button"
            onClick={closeModal}
            className="p-1.5 text-white/50 hover:text-white transition-colors cursor-pointer"
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
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3 print:hidden text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2 text-[#d8b4fe]">
            <ShieldCheck className="w-4 h-4 text-[#c084fc]" />
            <span className="font-mono font-semibold text-white uppercase tracking-wider">
              Parámetros de Costo Técnico
            </span>
          </div>
          <button
            type="button"
            onClick={() => setDevConfig(DEFAULT_DEVELOPER_CONFIG)}
            className="text-[11px] text-[#c084fc] hover:underline flex items-center gap-1 cursor-pointer font-mono"
          >
            <RotateCcw className="w-3 h-3" /> Restaurar defaults
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-[#F6DBC0]/70 mb-1 font-mono">Tarifa Base ($ USD/hr):</label>
            <input
              type="number"
              value={devConfig.erickHourlyRateUSD}
              onChange={(e) =>
                setDevConfig({ ...devConfig, erickHourlyRateUSD: Number(e.target.value) || 0 })
              }
              className="w-full bg-[#160B1A] border border-white/20 rounded p-1.5 text-white font-mono"
            />
          </div>
          <div>
            <label className="block text-[#F6DBC0]/70 mb-1 font-mono">Tipo de Cambio (MXN/USD):</label>
            <input
              type="number"
              step="0.1"
              value={devConfig.exchangeRateUsdToMxn}
              onChange={(e) =>
                setDevConfig({ ...devConfig, exchangeRateUsdToMxn: Number(e.target.value) || 18.5 })
              }
              className="w-full bg-[#160B1A] border border-white/20 rounded p-1.5 text-white font-mono"
            />
          </div>
          <div>
            <label className="block text-[#F6DBC0]/70 mb-1 font-mono">Plataforma & QA (hrs):</label>
            <input
              type="number"
              value={devConfig.platformDevelopmentHours}
              onChange={(e) =>
                setDevConfig({ ...devConfig, platformDevelopmentHours: Number(e.target.value) || 0 })
              }
              className="w-full bg-[#160B1A] border border-white/20 rounded p-1.5 text-white font-mono"
            />
          </div>
          <div>
            <label className="block text-[#F6DBC0]/70 mb-1 font-mono">Captura de Valor (%):</label>
            <input
              type="number"
              value={devConfig.valueCapturePercentage}
              onChange={(e) =>
                setDevConfig({ ...devConfig, valueCapturePercentage: Number(e.target.value) || 0 })
              }
              className="w-full bg-[#160B1A] border border-white/20 rounded p-1.5 text-white font-mono"
            />
          </div>
        </div>
      </div>
    );
  };

  // 3. CONTENIDO DE LAS PESTAÑAS
  const renderTabContent = () => (
    <div className="space-y-6">
      {/* PASO 1: CATÁLOGO ESBELTO DE SOLUCIONES */}
      {activeTab === 'catalog' && (
        <div className="space-y-6 animate-fadeIn">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              ¿Qué procesos deseas automatizar?
            </h2>
            <p className="text-sm text-[#F6DBC0]/70 mt-1">
              Selecciona los módulos donde tu negocio pierde más tiempo o ventas.
            </p>
          </div>

          <div className="divide-y divide-white/10 border-y border-white/10">
            {AUTOMATION_CATALOG.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => toggleAutomation(item.id)}
                  className={`py-4 px-3 sm:px-4 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-4 select-none ${
                    isSelected
                      ? 'bg-white/[0.04] text-white'
                      : 'hover:bg-white/[0.02] text-white/80'
                  }`}
                >
                  <div className="flex items-center gap-3.5 flex-1">
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-[#c084fc] text-[#160B1A]'
                          : 'border border-white/30 text-transparent'
                      }`}
                    >
                      <Check className={`w-3.5 h-3.5 stroke-[3] ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm sm:text-base text-white">
                          {item.name}
                        </span>
                        {item.popular && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            Más pedido
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-[#F6DBC0]/65 mt-0.5 leading-relaxed">
                        {item.tagline}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 hidden sm:block">
                    <span className="text-xs font-mono text-[#F6DBC0]/40 capitalize">
                      {item.category}
                    </span>
                    {showAdminMode && (
                      <span className="block text-[10px] font-mono text-[#c084fc]">
                        {item.baseHoursFirstTime} hrs
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs font-mono text-[#F6DBC0]/60">
              {selectedIds.length} {selectedIds.length === 1 ? 'módulo seleccionado' : 'módulos seleccionados'}
            </span>

            <button
              type="button"
              onClick={() => setActiveTab('bleed')}
              className="px-6 py-2.5 rounded-xl bg-[#c084fc] hover:bg-[#d8b4fe] text-[#160B1A] font-bold text-sm flex items-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <span>Continuar al diagnóstico</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* PASO 2: DIAGNÓSTICO ESENCIAL + PROGRESSIVE DISCLOSURE */}
      {activeTab === 'bleed' && (
        <div className="space-y-6 animate-fadeIn">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Diagnóstico de Ineficiencias & Pérdidas
            </h2>
            <p className="text-sm text-[#F6DBC0]/70 mt-1">
              Ajusta las variables de tu negocio. Puedes mover la barra o teclear el número directamente.
            </p>
          </div>

          {/* 4 Entradas Esenciales del Negocio */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Horas perdidas */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-medium text-white flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#c084fc]" /> Horas manuales por semana:
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
                    className="w-16 px-2 py-0.5 rounded bg-black/40 border border-white/20 text-right font-bold text-white"
                  />
                  <span className="text-[#F6DBC0]/60">hrs</span>
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
              <div className="flex justify-between text-[10px] font-mono text-[#F6DBC0]/40">
                <span>1 hr/sem</span>
                <span>{Math.max(60, bleedInputs.lostHoursPerWeek)} hrs/sem</span>
              </div>
            </div>

            {/* 2. Costo por hora */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-medium text-white flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-[#c084fc]" /> Costo por hora operativa:
                </span>
                <div className="flex items-center gap-1 font-mono text-xs">
                  <span className="text-[#F6DBC0]/60">$</span>
                  <input
                    type="number"
                    min="0"
                    value={bleedInputs.hourlyLaborCost}
                    onChange={(e) =>
                      setBleedInputs({ ...bleedInputs, hourlyLaborCost: Math.max(0, Number(e.target.value) || 0) })
                    }
                    className="w-20 px-2 py-0.5 rounded bg-black/40 border border-white/20 text-right font-bold text-white"
                  />
                  <span className="text-[#F6DBC0]/60">/hr</span>
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
              <div className="flex justify-between text-[10px] font-mono text-[#F6DBC0]/40">
                <span>{formatCurrency(laborMin, currency)}</span>
                <span>{formatCurrency(Math.max(laborMax, bleedInputs.hourlyLaborCost), currency)}</span>
              </div>
            </div>

            {/* 3. Ticket promedio */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-medium text-white flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-[#c084fc]" /> Ticket promedio por venta:
                </span>
                <div className="flex items-center gap-1 font-mono text-xs">
                  <span className="text-[#F6DBC0]/60">$</span>
                  <input
                    type="number"
                    min="0"
                    value={bleedInputs.averageTicketValue}
                    onChange={(e) =>
                      setBleedInputs({ ...bleedInputs, averageTicketValue: Math.max(0, Number(e.target.value) || 0) })
                    }
                    className="w-24 px-2 py-0.5 rounded bg-black/40 border border-white/20 text-right font-bold text-white"
                  />
                  <span className="text-[#F6DBC0]/60">{currency}</span>
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
              <div className="flex justify-between text-[10px] font-mono text-[#F6DBC0]/40">
                <span>{formatCurrency(ticketMin, currency)}</span>
                <span>{formatCurrency(Math.max(ticketMax, bleedInputs.averageTicketValue), currency)}</span>
              </div>
            </div>

            {/* 4. Clientes al mes */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-medium text-white flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-[#c084fc]" /> Clientes o consultas al mes:
                </span>
                <div className="flex items-center gap-1 font-mono text-xs">
                  <input
                    type="number"
                    min="0"
                    value={bleedInputs.monthlyLeadsOrClients}
                    onChange={(e) =>
                      setBleedInputs({ ...bleedInputs, monthlyLeadsOrClients: Math.max(0, Number(e.target.value) || 0) })
                    }
                    className="w-20 px-2 py-0.5 rounded bg-black/40 border border-white/20 text-right font-bold text-white"
                  />
                  <span className="text-[#F6DBC0]/60">cli</span>
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
              <div className="flex justify-between text-[10px] font-mono text-[#F6DBC0]/40">
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
              className="text-xs font-mono text-[#c084fc] hover:underline flex items-center gap-1.5 cursor-pointer"
            >
              {showAdvancedBleed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              <span>{showAdvancedBleed ? 'Ocultar variables secundarias' : '+ Ajustar variables secundarias de fuga (% fuga WhatsApp, retrabajos)'}</span>
            </button>

            {showAdvancedBleed && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 pt-3 border-t border-white/10 animate-fadeIn">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/80">Clientes perdidos por tardanza (%):</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={bleedInputs.lostClientsPercentage}
                      onChange={(e) =>
                        setBleedInputs({ ...bleedInputs, lostClientsPercentage: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })
                      }
                      className="w-16 px-1.5 py-0.5 rounded bg-black/40 border border-white/20 text-right font-mono font-bold text-white text-xs"
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
                    className="w-full accent-[#c084fc] cursor-pointer"
                  />
                </div>

                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/80">Mermas y errores manuales ($/mes):</span>
                    <input
                      type="number"
                      min="0"
                      value={bleedInputs.humanErrorsMonthlyCost}
                      onChange={(e) =>
                        setBleedInputs({ ...bleedInputs, humanErrorsMonthlyCost: Math.max(0, Number(e.target.value) || 0) })
                      }
                      className="w-20 px-1.5 py-0.5 rounded bg-black/40 border border-white/20 text-right font-mono font-bold text-white text-xs"
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
                    className="w-full accent-[#c084fc] cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Resumen del Dolor Austero */}
          <div className="p-6 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-rose-400 block">
                Fuga Financiera Estimada Sin Automatización
              </span>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-white mt-1">
                {formatCurrency(result.totalAnnualBleed, currency)}{' '}
                <span className="text-sm font-normal text-[#F6DBC0]/60">/ año</span>
              </div>
              <p className="text-xs text-[#F6DBC0]/70 mt-1">
                Representa {formatCurrency(result.totalMonthlyBleed, currency)} cada mes en tareas manuales y oportunidades no atendidas.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('roi')}
              className="px-6 py-2.5 rounded-xl bg-[#c084fc] hover:bg-[#d8b4fe] text-[#160B1A] font-bold text-sm flex items-center gap-2 transition-all cursor-pointer shrink-0 shadow-md"
            >
              <span>Ver Dictamen & ROI</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="text-center text-[11px] text-[#F6DBC0]/50 font-mono">
            🔒 Privacidad garantizada: Este análisis se calcula de forma 100% privada en tu navegador.
          </div>
        </div>
      )}

      {/* PASO 3: DICTAMEN DE ROI & UN SOLO HÉROE VISUAL */}
      {activeTab === 'roi' && (
        <div className="space-y-6 animate-fadeIn">
          {/* EL HÉROE VISUAL: INVERSIÓN VS RETORNO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 sm:p-8 rounded-2xl bg-white/[0.04] border border-white/10">
            {/* Columna Izquierda: Inversión */}
            <div className="space-y-4">
              <span className="text-xs font-mono uppercase tracking-wider text-[#d8b4fe] block">
                Inversión Requerida
              </span>

              <div className="space-y-3">
                <div>
                  <span className="text-xs text-[#F6DBC0]/60 block">Implementación Inicial (Setup único)</span>
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-white mt-0.5">
                    {formatCurrency(result.recommendedSetupPrice, currency)}
                  </div>
                  <span className="text-[11px] text-[#F6DBC0]/50">Liquidación al validar prototipo funcional</span>
                </div>

                <div className="pt-2 border-t border-white/10">
                  <span className="text-xs text-[#F6DBC0]/60 block">Mantenimiento mensual & servidores</span>
                  <div className="text-lg font-bold font-mono text-white/90 mt-0.5">
                    {formatCurrency(result.recommendedMonthlyRetainer, currency)}{' '}
                    <span className="text-xs text-[#F6DBC0]/50 font-normal">/ mes</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Beneficio */}
            <div className="space-y-4 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
              <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 block">
                Impacto Financiero Proyectado
              </span>

              <div className="space-y-3">
                <div>
                  <span className="text-xs text-[#F6DBC0]/60 block">Beneficio Neto Año 1 (Ahorro libre)</span>
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400 mt-0.5">
                    {formatCurrency(result.yearOneNetSavings, currency)}
                  </div>
                  <span className="text-[11px] text-[#F6DBC0]/50">Dinero adicional retenido en tu negocio</span>
                </div>

                <div className="pt-2 border-t border-white/10">
                  <span className="text-xs text-[#F6DBC0]/60 block">Retorno de Inversión (ROI)</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-lg font-bold font-mono text-white">
                      +{result.roiPercentage}%
                    </span>
                    <span className="text-xs text-emerald-400/90 font-mono">
                      (Recuperado en ~{result.paybackMonths} meses)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Gráfica de Breakeven Sobria y Limpia */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="font-semibold text-sm sm:text-base text-white">
                  Curva de Proyección a 12 Meses: Punto de Equilibrio
                </h4>
                <p className="text-xs text-[#F6DBC0]/60 mt-0.5">
                  El sistema se paga por sí mismo en el mes {breakevenMonthObj.month}.
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-rose-400">
                  <span className="w-3 h-0.5 bg-rose-400 inline-block"></span> Pérdida sin sistema
                </span>
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-3 h-0.5 bg-emerald-400 inline-block"></span> Beneficio recuperado
                </span>
              </div>
            </div>

            <div className="w-full overflow-x-auto pt-2">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-auto min-w-[500px] select-none"
              >
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
                        stroke="rgba(255,255,255,0.08)"
                        strokeDasharray="3 3"
                      />
                      <text
                        x={padding.left - 8}
                        y={y + 3}
                        textAnchor="end"
                        fill="rgba(246,219,192,0.4)"
                        fontSize="9"
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
                      <text
                        x={x}
                        y={padding.top + innerHeight + 16}
                        textAnchor="middle"
                        fill={isHovered ? '#FFFFFF' : 'rgba(246,219,192,0.4)'}
                        fontSize="9"
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
                  stroke="#fb7185"
                  strokeWidth="2"
                  strokeDasharray="4 3"
                  points={pointsLoss}
                />

                <polyline
                  fill="none"
                  stroke="#34d399"
                  strokeWidth="2.5"
                  points={pointsBenefit}
                />

                {breakevenMonthObj && (
                  <g>
                    <circle
                      cx={getX(breakevenMonthObj.month)}
                      cy={getY(breakevenMonthObj.cumulativeBenefitWithAutomation)}
                      r="4"
                      fill="#34d399"
                    />
                    <text
                      x={getX(breakevenMonthObj.month)}
                      y={getY(breakevenMonthObj.cumulativeBenefitWithAutomation) - 10}
                      textAnchor="middle"
                      fill="#34d399"
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      Punto de Equilibrio (M{breakevenMonthObj.month})
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

            {/* Inspección interactiva sutil */}
            {hoveredMonth !== null && (
              <div className="p-2 rounded bg-black/30 border border-white/10 text-xs font-mono flex items-center justify-between text-white/80 animate-fadeIn">
                <span className="font-bold text-white">Mes {hoveredMonth}:</span>
                <span className="text-rose-400">
                  Sin sistema: {formatCurrency(result.monthlyBreakdown[hoveredMonth - 1].cumulativeCostWithoutAutomation, currency)}
                </span>
                <span className="text-emerald-400">
                  Recuperado: {formatCurrency(result.monthlyBreakdown[hoveredMonth - 1].cumulativeBenefitWithAutomation, currency)}
                </span>
                <span className="text-white font-semibold">
                  Ganancia Neta: {formatCurrency(result.monthlyBreakdown[hoveredMonth - 1].netProfit, currency)}
                </span>
              </div>
            )}
          </div>

          {/* BLOQUE DE ACCIONES CON JERARQUÍA CLARA (OPCIÓN A) */}
          <div className="p-6 rounded-2xl bg-white/[0.04] border border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h5 className="font-semibold text-white text-base">
                  ¿Listo para implementar en tu negocio?
                </h5>
                <p className="text-xs text-[#F6DBC0]/70 mt-0.5">
                  Revisemos un prototipo funcional adaptado a tus flujos actuales sin costo inicial.
                </p>
              </div>

              {/* Toggle de Modo Confidencial discreto */}
              <button
                type="button"
                onClick={() => setIsConfidential(!isConfidential)}
                className={`text-xs font-mono flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors cursor-pointer shrink-0 ${
                  isConfidential
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-white/5 border-white/10 text-[#F6DBC0]/60 hover:text-white'
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
                className="flex-1 px-6 py-3 rounded-xl bg-[#c084fc] hover:bg-[#d8b4fe] text-[#160B1A] font-extrabold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-98"
                title="Agendar videollamada para revisar el prototipo navegable"
              >
                <Video className="w-4 h-4" />
                <span>Agendar Videollamada de Demostración</span>
              </button>

              {/* Secundario: Descargar PDF */}
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                title="Descargar reporte en PDF"
              >
                <FileDown className="w-4 h-4 text-emerald-400" />
                <span>Descargar PDF</span>
              </button>

              {/* Secundario: WhatsApp */}
              <button
                type="button"
                onClick={handleWhatsAppClick}
                className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                title="Consultar por WhatsApp"
              >
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>WhatsApp</span>
              </button>

              {/* Secundario: Correo */}
              <button
                type="button"
                onClick={handleEmailClick}
                className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white/80 hover:text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                title="Enviar por correo"
              >
                <Mail className="w-4 h-4" />
                <span>Correo</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs text-[#F6DBC0]/60">
              <button
                type="button"
                onClick={handleCopyProposal}
                className="hover:text-white flex items-center gap-1.5 font-mono cursor-pointer transition-colors"
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

  // VISTA EN MODO PÁGINA: DISEÑO MINIMALISTA DESPEJADO
  if (isPage) {
    return (
      <div className="w-full space-y-8 roi-calculator-page-view">
        {renderMinimalNavbar()}
        {renderAdminPanel()}
        {renderTabContent()}
        {renderPrintableReport()}
      </div>
    );
  }

  // VISTA EN MODO MODAL (CUANDO SE ABRE DESDE EL NAVBAR O CHATBOT)
  return (
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-label="Calculadora de Cotización y Retorno de Inversión"
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto p-6 sm:p-8 bg-[#160B1A] border border-white/10 rounded-2xl shadow-2xl scrollbar-thin scrollbar-thumb-white/10 space-y-6">
        {renderMinimalNavbar()}
        {renderAdminPanel()}
        {renderTabContent()}
        {renderPrintableReport()}
      </div>
    </div>
  );
};
