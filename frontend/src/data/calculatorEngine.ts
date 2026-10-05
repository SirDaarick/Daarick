/**
 * Motor Matemático Puro y Determinista de Cotización y Retorno de Inversión (ROI).
 * Diseñado bajo principios de Arquitectura Limpia: funciones puras, cero dependencias DOM,
 * soporte nativo para Pesos Mexicanos (MXN) y Dólares (USD), y modos de privacidad confidencial.
 */

export interface AutomationItem {
  id: string;
  name: string;
  tagline: string;
  category: 'atencion' | 'extraccion' | 'gestion' | 'operacion';
  baseHoursFirstTime: number; // Horas estimadas para programar desde cero
  reusableDiscountHours: number; // Horas ahorradas al reutilizar módulos probados
  description: string;
  iconName: string;
  popular?: boolean;
}

export interface ClientBleedInputs {
  lostHoursPerWeek: number; // Horas semanales en tareas manuales/repetitivas
  hourlyLaborCost: number; // Costo por hora de quien hace la tarea en la moneda seleccionada ($)
  averageTicketValue: number; // Ticket promedio de venta o cuota mensual por cliente ($)
  monthlyLeadsOrClients: number; // Prospectos o clientes atendidos al mes
  lostClientsPercentage: number; // % estimado de clientes perdidos por lentitud o errores (0 - 100)
  humanErrorsMonthlyCost: number; // Fuga estimada mensual por retrabajos, cancelaciones o morosidad ($)
}

export interface DeveloperConfig {
  erickHourlyRateUSD: number; // Tarifa base por hora de desarrollo de Erick ($ USD)
  platformBaseHours: number; // Horas de arquitectura, seguridad, despliegue y servidores
  meetingsAndPmHours: number; // Horas de reuniones de avance, diseño UX y QA determinista
  valueCapturePercentage: number; // Fracción del beneficio del año 1 capturada (ej: 0.15 = 15%)
  minMonthlyRetainerUSD: number; // Retainer mensual mínimo para soporte/hosting ($ USD)
  exchangeRateUsdToMxn: number; // Tipo de cambio USD a MXN (ej: 18.5)
}

export interface RoiMonthProjection {
  month: number;
  cumulativeCostWithoutAutomation: number; // Pérdida acumulada si no implementa el sistema
  cumulativeInvestmentWithAutomation: number; // Inversión acumulada (Setup + cuotas mensuales)
  cumulativeBenefitWithAutomation: number; // Dinero ahorrado o recuperado acumulado
  netProfit: number; // Beneficio neto acumulado (Beneficio - Inversión)
}

export interface CalculationResult {
  // Módulo 1: Costo Técnico Piso
  selectedAutomationCount: number;
  totalAutomationHours: number;
  platformAndPmHours: number;
  totalProjectHours: number;
  technicalFloorCost: number; // Costo mínimo aceptable en la moneda seleccionada

  // Módulo 2: Diagnóstico de Fuga Financiera
  monthlyTimeLossCost: number;
  monthlySalesLossCost: number;
  totalMonthlyBleed: number;
  totalAnnualBleed: number;

  // Módulo 3: Precios Basados en Valor & Métricas de Retorno
  annualRecoveredBenefit: number; // Estimación conservadora (75% de la fuga recuperada)
  recommendedSetupPrice: number; // Inversión de implementación inicial
  recommendedMonthlyRetainer: number; // Cuota mensual de mantenimiento/optimización
  yearOneTotalInvestment: number; // Setup + 12 meses de soporte
  yearOneNetSavings: number; // Dinero neto extra en el bolsillo del cliente al año 1
  roiPercentage: number; // Retorno de inversión porcentual ((Ahorro / Inversión) * 100)
  paybackMonths: number; // Meses necesarios para amortizar la inversión
  paybackDays: number; // Días para recuperar el setup
  currency: 'USD' | 'MXN';
  monthlyBreakdown: RoiMonthProjection[];
}

export const AUTOMATION_CATALOG: AutomationItem[] = [
  {
    id: 'ai-sales-bot',
    name: 'Asistente de WhatsApp que Atiende y Vende 24/7',
    tagline: 'Responde precios, catálogo y dudas al instante para no perder clientes por tardar en contestar',
    category: 'atencion',
    baseHoursFirstTime: 24,
    reusableDiscountHours: 6,
    description: 'Atención automática amable por WhatsApp o tu web. Resuelve dudas frecuentes, filtra prospectos y toma pedidos sin que tengas que estar pegado al teléfono.',
    iconName: 'Bot',
    popular: true
  },
  {
    id: 'calendar-sync',
    name: 'Agendador Automático de Citas sin Cruces de Horario',
    tagline: 'Tus clientes eligen su hora libre y reciben recordatorio automático 2 horas antes para evitar inasistencias',
    category: 'gestion',
    baseHoursFirstTime: 16,
    reusableDiscountHours: 4,
    description: 'Conecta con tu calendario en vivo. Evita empalmes, elimina cancelaciones de última hora y confirma la asistencia de tus clientes automáticamente.',
    iconName: 'Calendar',
    popular: true
  },
  {
    id: 'doc-extractor-ocr',
    name: 'Lector Automático de Facturas, Recibos y Tickets a Excel',
    tagline: 'Pasa las fotos de tus comprobantes o facturas en PDF directo a tu Excel sin escribir nada a mano',
    category: 'extraccion',
    baseHoursFirstTime: 28,
    reusableDiscountHours: 8,
    description: 'Toma foto de cualquier ticket de compra o factura y el sistema extrae fechas, montos e impuestos directo a tu control de gastos sin errores humanos.',
    iconName: 'FileSpreadsheet'
  },
  {
    id: 'debtor-recovery',
    name: 'Recordatorio Amable de Cobranza y Cuentas Pendientes',
    tagline: 'Manda avisos educados por WhatsApp a clientes con pagos atrasados para recuperar tu dinero sin desgaste',
    category: 'operacion',
    baseHoursFirstTime: 18,
    reusableDiscountHours: 5,
    description: 'Acelera tus cobros pendientes con mensajes profesionales y automáticos, reduciendo la morosidad sin generar fricción con tus clientes.',
    iconName: 'BadgeAlert'
  },
  {
    id: 'crm-sheets-sync',
    name: 'Sincronizador de Pedidos y Ventas a tu Excel',
    tagline: 'Cada venta o pedido nuevo se anota solo en tu inventario o Excel sin errores de captura',
    category: 'operacion',
    baseHoursFirstTime: 14,
    reusableDiscountHours: 4,
    description: 'Conecta tu tienda, formularios o mensajes para que cada pedido se registre al instante en tu inventario o lista de control en tiempo real.',
    iconName: 'Workflow'
  },
  {
    id: 'support-ticket-bot',
    name: 'Asistente de Preguntas Frecuentes y Ayuda a Clientes',
    tagline: 'Resuelve las 10 preguntas que siempre te hacen sobre horarios, ubicación y envíos al momento',
    category: 'atencion',
    baseHoursFirstTime: 22,
    reusableDiscountHours: 6,
    description: 'Ahorra horas respondiendo las mismas dudas diarias y permite que tú o tu equipo solo intervengan cuando el cliente realmente requiera atención personalizada.',
    iconName: 'Headphones'
  },
  {
    id: 'churn-alert-system',
    name: 'Reactivador de Clientes que Dejaron de Comprar',
    tagline: 'Avisa a clientes que tienen semanas sin visitarte con una promoción especial para que vuelvan',
    category: 'gestion',
    baseHoursFirstTime: 20,
    reusableDiscountHours: 5,
    description: 'Detecta en tu historial a clientes inactivos y les envía promociones personalizadas para incentivar nuevas compras y fidelizarlos.',
    iconName: 'UserCheck'
  }
];

// Valores por defecto calibrados para negocios locales y pymes mexicanas (MXN)
export const DEFAULT_CLIENT_INPUTS_MXN: ClientBleedInputs = {
  lostHoursPerWeek: 10, // 10 horas a la semana contestando mensajes o en notas manuales
  hourlyLaborCost: 180, // $180 MXN/hr (salario de personal operativo común)
  averageTicketValue: 450, // $450 MXN ticket promedio realista de pyme local
  monthlyLeadsOrClients: 200, // 200 clientes o consultas al mes (≈ 7 a 10 diarios)
  lostClientsPercentage: 15, // 15% de clientes perdidos por tardar en responder
  humanErrorsMonthlyCost: 2000 // $2,000 MXN en retrabajos, cancelaciones o mermas
};

// Valores por defecto en USD
export const DEFAULT_CLIENT_INPUTS_USD: ClientBleedInputs = {
  lostHoursPerWeek: 10,
  hourlyLaborCost: 18,
  averageTicketValue: 35,
  monthlyLeadsOrClients: 200,
  lostClientsPercentage: 15,
  humanErrorsMonthlyCost: 150
};

export const DEFAULT_DEVELOPER_CONFIG: DeveloperConfig = {
  erickHourlyRateUSD: 13, // $13 USD/hr base (≈ $240 MXN/hr, +60% respecto a nómina)
  platformBaseHours: 6, // 6 hrs de arquitectura base y despliegue
  meetingsAndPmHours: 4, // 4 hrs de reuniones y pruebas QA
  valueCapturePercentage: 0.12, // 12% del valor anual creado (amigable para fase inicial)
  minMonthlyRetainerUSD: 46, // $46 USD/mes (≈ $850 MXN/mes para servidores, IA y monitoreo)
  exchangeRateUsdToMxn: 18.5
};

/**
 * Calcula todas las métricas de cotización, costo técnico y retorno de inversión de forma nativa en la divisa elegida.
 */
export function calculateRoi(
  selectedAutomationIds: string[],
  bleedInputs: ClientBleedInputs,
  devConfig: DeveloperConfig = DEFAULT_DEVELOPER_CONFIG,
  currency: 'USD' | 'MXN' = 'MXN'
): CalculationResult {
  // Factor de conversión para tarifas base técnicas
  const currencyRate = currency === 'MXN' ? devConfig.exchangeRateUsdToMxn : 1.0;
  const effectiveHourlyRate = devConfig.erickHourlyRateUSD * currencyRate;
  const effectiveMinRetainer = devConfig.minMonthlyRetainerUSD * currencyRate;

  // 1. MÓDULO 1: ALCANCE TÉCNICO Y COSTO PISO
  const selectedItems = AUTOMATION_CATALOG.filter((item) =>
    selectedAutomationIds.includes(item.id)
  );

  const totalAutomationHours = selectedItems.reduce(
    (acc, curr) => acc + curr.baseHoursFirstTime,
    0
  );

  const platformAndPmHours =
    selectedItems.length > 0
      ? devConfig.platformBaseHours + devConfig.meetingsAndPmHours
      : 0;

  const totalProjectHours = totalAutomationHours + platformAndPmHours;
  const technicalFloorCost = totalProjectHours * effectiveHourlyRate;

  // 2. MÓDULO 2: DIAGNÓSTICO DE FUGA FINANCIERA (NATIVO EN LA MONEDA)
  // Tiempo: Horas semanales * 4.33 semanas/mes * costo/hora
  const monthlyTimeLossCost =
    bleedInputs.lostHoursPerWeek * 4.333 * bleedInputs.hourlyLaborCost;

  // Ventas caídas: Clientes atendidos * Ticket promedio * (% pérdida / 100)
  const monthlySalesLossCost =
    bleedInputs.monthlyLeadsOrClients *
    bleedInputs.averageTicketValue *
    (Math.max(0, Math.min(100, bleedInputs.lostClientsPercentage)) / 100);

  // Fuga mensual y anualizada
  const totalMonthlyBleed =
    monthlyTimeLossCost +
    monthlySalesLossCost +
    bleedInputs.humanErrorsMonthlyCost;
  const totalAnnualBleed = totalMonthlyBleed * 12;

  // 3. MÓDULO 3: VALUE-BASED PRICING & RETORNO DE INVERSIÓN
  // Supuesto conservador: La automatización recupera el 75% de las ineficiencias
  const annualRecoveredBenefit = totalAnnualBleed * 0.75;
  const monthlyRecoveredBenefit = annualRecoveredBenefit / 12;

  // El precio de implementación es una captura de valor (15%), pero NUNCA menor al Costo Piso
  const valuePricedSetup =
    annualRecoveredBenefit * devConfig.valueCapturePercentage;
  const recommendedSetupPrice = Math.max(
    technicalFloorCost,
    valuePricedSetup
  );

  // Retainer mensual: 8% del setup o el mínimo establecido
  const calculatedRetainer = recommendedSetupPrice * 0.08;
  const recommendedMonthlyRetainer =
    selectedItems.length > 0
      ? Math.max(effectiveMinRetainer, calculatedRetainer)
      : 0;

  // Inversión año 1
  const yearOneTotalInvestment =
    recommendedSetupPrice + recommendedMonthlyRetainer * 12;
  const yearOneNetSavings = Math.max(
    0,
    annualRecoveredBenefit - yearOneTotalInvestment
  );

  // Retorno de inversión porcentual
  const roiPercentage =
    yearOneTotalInvestment > 0
      ? Math.round(
          ((annualRecoveredBenefit - yearOneTotalInvestment) /
            yearOneTotalInvestment) *
            100
        )
      : 0;

  // Tiempo de retorno de inversión (Payback Period)
  const netMonthlyGain =
    monthlyRecoveredBenefit - recommendedMonthlyRetainer;
  const paybackMonths =
    netMonthlyGain > 0
      ? Number((recommendedSetupPrice / netMonthlyGain).toFixed(1))
      : 12;
  const paybackDays = Math.max(1, Math.round(paybackMonths * 30.4));

  // Proyección mes a mes (12 meses)
  const monthlyBreakdown: RoiMonthProjection[] = [];
  let cumulativeLossWithout = 0;
  let cumulativeInvestment = recommendedSetupPrice;
  let cumulativeBenefit = 0;

  for (let m = 1; m <= 12; m++) {
    cumulativeLossWithout += totalMonthlyBleed;
    cumulativeInvestment += recommendedMonthlyRetainer;
    cumulativeBenefit += monthlyRecoveredBenefit;
    const netProfit = cumulativeBenefit - cumulativeInvestment;

    monthlyBreakdown.push({
      month: m,
      cumulativeCostWithoutAutomation: Math.round(cumulativeLossWithout),
      cumulativeInvestmentWithAutomation: Math.round(cumulativeInvestment),
      cumulativeBenefitWithAutomation: Math.round(cumulativeBenefit),
      netProfit: Math.round(netProfit)
    });
  }

  return {
    selectedAutomationCount: selectedItems.length,
    totalAutomationHours,
    platformAndPmHours,
    totalProjectHours,
    technicalFloorCost: Math.round(technicalFloorCost),
    monthlyTimeLossCost: Math.round(monthlyTimeLossCost),
    monthlySalesLossCost: Math.round(monthlySalesLossCost),
    totalMonthlyBleed: Math.round(totalMonthlyBleed),
    totalAnnualBleed: Math.round(totalAnnualBleed),
    annualRecoveredBenefit: Math.round(annualRecoveredBenefit),
    recommendedSetupPrice: Math.round(recommendedSetupPrice),
    recommendedMonthlyRetainer: Math.round(recommendedMonthlyRetainer),
    yearOneTotalInvestment: Math.round(yearOneTotalInvestment),
    yearOneNetSavings: Math.round(yearOneNetSavings),
    roiPercentage,
    paybackMonths,
    paybackDays,
    currency,
    monthlyBreakdown
  };
}

/**
 * Formateador de moneda accesible e internacionalizado.
 */
export function formatCurrency(
  amount: number,
  currency: 'USD' | 'MXN' = 'MXN'
): string {
  return new Intl.NumberFormat(currency === 'MXN' ? 'es-MX' : 'en-US', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Generador de propuesta Markdown respetando la bandera de confidencialidad.
 */
export function buildProposalMarkdown(
  selectedIds: string[],
  bleedInputs: ClientBleedInputs,
  result: CalculationResult,
  currency: 'USD' | 'MXN',
  isConfidential: boolean
): string {
  const selectedNames = AUTOMATION_CATALOG.filter((a) =>
    selectedIds.includes(a.id)
  )
    .map((a) => `• ${a.name}`)
    .join('\n');

  if (isConfidential) {
    return `# Cotización de Soluciones de IA & Automatización (Modo Confidencial)
**Moneda:** ${currency}

## 1. Alcance de Automatización Seleccionado
${selectedNames || 'Ninguna seleccionada'}

## 2. Propuesta de Implementación
• **Implementación Inicial (Setup):** ${formatCurrency(result.recommendedSetupPrice, currency)}
• **Mantenimiento & Servidores:** ${formatCurrency(result.recommendedMonthlyRetainer, currency)} / mes
• **Garantía Técnica:** Pago único liquidable tras validar prototipo funcional navegable.
• **Privacidad:** Datos operativos y financieros del negocio mantenidos bajo reserva confidencial.

---
*Generado deterministamente desde daarick.dev/calculadora*`;
  }

  return `# Cotización & Dictamen de Retorno de Inversión (ROI)
**Moneda:** ${currency}

## 1. Alcance de Automatización Seleccionado
${selectedNames || 'Ninguna seleccionada'}

## 2. Diagnóstico de Ineficiencia y Fuga Financiera
• Horas invertidas en tareas manuales: ${bleedInputs.lostHoursPerWeek} hrs/sem
• Costo por hora operativa: ${formatCurrency(bleedInputs.hourlyLaborCost, currency)}
• Ticket promedio de cliente: ${formatCurrency(bleedInputs.averageTicketValue, currency)}
• Clientes/prospectos mensuales: ${bleedInputs.monthlyLeadsOrClients}
• Pérdida mensual estimada por lentitud o errores: ${formatCurrency(result.totalMonthlyBleed, currency)}
• **Fuga anual acumulada sin automatizar:** ${formatCurrency(result.totalAnnualBleed, currency)}

## 3. Propuesta de Implementación Basada en Valor
• **Implementación Inicial (Setup):** ${formatCurrency(result.recommendedSetupPrice, currency)}
• **Mantenimiento & Servidores:** ${formatCurrency(result.recommendedMonthlyRetainer, currency)} / mes
• **Beneficio Neto Proyectado (Año 1):** ${formatCurrency(result.yearOneNetSavings, currency)}
• **Retorno de Inversión (ROI):** +${result.roiPercentage}%
• **Tiempo de Retorno (Payback):** ~${result.paybackMonths} meses (${result.paybackDays} días)

---
*Generado deterministamente desde daarick.dev/calculadora*`;
}

/**
 * Generador de mensaje para WhatsApp respetando la privacidad.
 */
export function buildWhatsAppMessage(
  selectedIds: string[],
  result: CalculationResult,
  currency: 'USD' | 'MXN',
  isConfidential: boolean
): string {
  const selectedNames = AUTOMATION_CATALOG.filter((a) =>
    selectedIds.includes(a.id)
  )
    .map((a) => a.name)
    .join(', ');

  if (isConfidential) {
    return (
      `Hola Erick 👋 Estuve revisando tu cotizador en tu web y me interesan las siguientes soluciones:\n\n` +
      `📋 *Módulos de interés:*\n${selectedNames || 'Solución a medida'}\n\n` +
      `💼 *Inversión estimada:* ${formatCurrency(result.recommendedSetupPrice, currency)} (Setup) + ${formatCurrency(result.recommendedMonthlyRetainer, currency)}/mes\n\n` +
      `🔒 *(He marcado la cotización en Modo Confidencial para revisar métricas de negocio en privado)*\n\n` +
      `Me gustaría agendar una llamada breve para revisar el prototipo navegable contigo.`
    );
  }

  return (
    `Hola Erick 👋 Hice una cotización completa en tu calculadora de ROI:\n\n` +
    `📋 *Soluciones seleccionadas:*\n${selectedNames || 'Solución a medida'}\n\n` +
    `💼 *Inversión estimada:* ${formatCurrency(result.recommendedSetupPrice, currency)} (Setup) + ${formatCurrency(result.recommendedMonthlyRetainer, currency)}/mes\n` +
    `📉 *Fuga anual detectada en mi negocio:* ${formatCurrency(result.totalAnnualBleed, currency)} / año\n` +
    `📈 *Retorno de Inversión (ROI) estimado:* +${result.roiPercentage}% (se paga solo en ~${result.paybackMonths} meses)\n\n` +
    `Me gustaría agendar una videollamada para revisar el prototipo navegable contigo.`
  );
}
