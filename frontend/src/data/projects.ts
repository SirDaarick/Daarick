export interface ProjectMetric {
  label: string;
  val: string;
  color: string;
}

export interface ProjectLog {
  text: string;
  cls: string;
}

export interface ProjectData {
  id: string;
  key: string;
  code: string;
  title: string;
  shortDesc: string;
  status: string;
  tags: string[];
  filename: string;
  problem: string;
  solution: string;
  demoUrl: string;
  sparklineColor: string;
  metricLabel: string;
  metricValue: string;
  metricDelta: string;
  metrics: ProjectMetric[];
  logs: ProjectLog[];
  payload: string;
  time: string;
  accuracy: string;
  tokens: string;
  category: string;
  priority: string;
  actions: string[];
}

export const PROJECTS: ProjectData[] = [
  {
    id: 'PRJ-01',
    key: 'A',
    code: '01',
    title: 'Triaje Inteligente de Solicitudes',
    shortDesc: 'Clasifica, prioriza y enruta tickets de soporte y pedidos en 1.2 segundos sin intervención humana, reduciendo escalados en un 78%.',
    status: 'DEMO DISPONIBLE',
    tags: ['FastAPI', 'Agentes IA', 'Celery'],
    filename: 'triage-agent.worker',
    problem: 'Antes de este sistema, el equipo de soporte recibía más de 800 correos diarios. Los operadores tardaban de 20 a 40 minutos en contrastar datos de clientes, conocer discrepancias de facturación y crear incidencias manualmente en el ERP, lo que provocaba retrasos críticos y un 18% de errores en asignaciones.',
    solution: 'El agente autónomo en FastAPI procesa el payload entrante en 1.1s, consulta la base de datos de contratos y ejecuta la resolución sin intervención humana con un 98.4% de precisión auditada.',
    demoUrl: '#',
    sparklineColor: '#ddb8ff',
    metricLabel: 'Resolución Directa',
    metricValue: '91.4%',
    metricDelta: '↑ +38%',
    metrics: [
      { label: 'Reducción de Tiempo', val: '35m → 1.1s', color: 'text-emerald-400' },
      { label: 'Precisión Clasificación', val: '98.4%', color: 'text-[#F8F4E9]' },
      { label: 'Errores Humanos', val: '0 Fallos', color: 'text-emerald-400' },
      { label: 'Capacidad Procesamiento', val: '+400%', color: 'text-purple-300' },
    ],
    logs: [
      { text: '[08:14:03.00] ⚡ Webhook recibido: post_primary_in_ticket.empresa_es', cls: 'text-[#F8F4E9]' },
      { text: '[08:14:03.42] 🔍 Extracción de entidades clave: cuenta: 1892 | tramitador: 0174 | urgencia: ALTA', cls: 'text-purple-300' },
      { text: '[08:14:03.85] 🛡 Validación contra base de contratos: descuento de 15% validado en albarán.', cls: 'text-amber-300' },
      { text: '[08:14:04.10] ✓ TICKET 0718492 CREADO EN ERP CON ASIGNACIÓN DE GRUPO EN 1.12s. Notificación despachada.', cls: 'text-emerald-400' },
    ],
    payload: `{\n  "remitente": "compras@distribuciones-norte.es",\n  "asunto": "URGENTE: Descuento no aplicado en factura F-2026/894",\n  "cuerpo": "Estimados, en el último envío de 400 unidades SKU-A88 nos facturaron tarifa general cuando tenemos pactado 15% por volumen. Rogamos corrección inmediata.",\n  "cliente_id": "ES-8492023",\n  "canal": "email_inbound"\n}`,
    time: '1.12s',
    accuracy: '98.4%',
    tokens: '420',
    category: 'SOPORTE_FINANCIERO / FACTURACIÓN_DISCREPANCIA',
    priority: 'P1 - ALTA / ACCIÓN INMEDIATA',
    actions: [
      '✓ Identificada discrepancia de 15% contractual en base de datos PostgreSQL.',
      '✓ Ticket creado en ERP con categoría FINANZAS_CORRECTIVA_AUTO.',
      '✓ Respuesta borrador generada y enviada a revisión con abono propuesto de 420.00 €.',
    ],
  },
  {
    id: 'PRJ-02',
    key: 'B',
    code: '02',
    title: 'Extractor Documental & Facturas',
    shortDesc: 'Parsea albaranes y facturas PDF desestructuradas sincronizando con ERP con validación contable y reglas antifraude en menos de 2 segundos.',
    status: 'DEMO OPERATIVA',
    tags: ['Python', 'OCR Multimodal', 'PostgreSQL'],
    filename: 'invoice-parser.service',
    problem: 'La recepción de cientos de facturas en PDF y fotos arrugadas generaba semanas de retraso contable y extravío de documentos tributarios en compras corporativas.',
    solution: 'Pipeline multimodal con OCR asistido por LLMs locales que extrae líneas de albarán, CIF/NIF, bases imponibles y realiza conciliación cruzada con órdenes de compra.',
    demoUrl: '/demo/invoicing',
    sparklineColor: '#ffafd5',
    metricLabel: 'Extracción Sin Error',
    metricValue: '99.8%',
    metricDelta: 'OCR-v2',
    metrics: [
      { label: 'Tiempo por Factura', val: '< 2 seg', color: 'text-emerald-400' },
      { label: 'Ahorro Administrativo', val: '35h / mes', color: 'text-[#F8F4E9]' },
      { label: 'Extracción NIF/CIF', val: '100%', color: 'text-purple-300' },
      { label: 'Validación Antifraude', val: 'Activa', color: 'text-emerald-400' },
    ],
    logs: [
      { text: '[11:20:00.12] 📄 Carga de documento PDF: factura_proveedor_acme_8924.pdf', cls: 'text-[#F8F4E9]' },
      { text: '[11:20:00.65] 👁 OCR Multimodal ejecutado: 4 bloques tabulares identificados.', cls: 'text-purple-300' },
      { text: '[11:20:01.10] 💶 Base imponible: 3.719,01 € | IVA 21%: 780,99 € | Total: 4.500,00 €', cls: 'text-amber-300' },
      { text: '[11:20:01.45] ✓ Coincidencia 100% con Orden de Compra #OC-2026-901. Validada.', cls: 'text-emerald-400' },
    ],
    payload: `{\n  "archivo": "factura_proveedor_acme_8924.pdf",\n  "tamano_kb": 348,\n  "tipo_documento": "FACTURA_COMERCIAL_PROVEEDOR",\n  "proveedor_nif": "B-84920394",\n  "requiere_conciliacion_oc": true\n}`,
    time: '1.45s',
    accuracy: '99.8%',
    tokens: '680',
    category: 'CONTABILIDAD / EXTRACCIÓN_FISCAL',
    priority: 'P2 - PRIORIDAD ESTÁNDAR',
    actions: [
      '✓ NIF emisor B-84920394 verificado en registro mercantil.',
      '✓ Importe total de 4.500,00 € cuadrado al céntimo con desglose de impuestos.',
      '✓ Asiento pre-contable generado y enviado a cola de sincronización ERP.',
    ],
  },
  {
    id: 'PRJ-03',
    key: 'C',
    code: '03',
    title: 'Agente Conciliador de Inventario',
    shortDesc: 'Detecta discrepancias entre órdenes de compra y stock físico en tiempo real emitiendo alertas preventivas antes de rupturas de almacén.',
    status: 'EN PRODUCCIÓN',
    tags: ['FastAPI', 'Redis Streams', 'Webhooks'],
    filename: 'stock-conciliator.worker',
    problem: 'Desfase crítico de 4 a 6 horas entre las ventas de la plataforma e-commerce y los recuentos físicos del centro logístico, provocando roturas de stock y penalizaciones.',
    solution: 'Microservicio reactivo con Redis Streams que recalcula la demanda proyectada por SKU cada 30 segundos y dispara órdenes de compra anticipadas cuando el stock cae bajo umbral.',
    demoUrl: '#',
    sparklineColor: '#10B981',
    metricLabel: 'Alineación de Stock',
    metricValue: '100%',
    metricDelta: 'Sin desajustes',
    metrics: [
      { label: 'Retraso de Stock', val: '4h → 0.4s', color: 'text-emerald-400' },
      { label: 'Rupturas Evitadas', val: '100%', color: 'text-[#F8F4E9]' },
      { label: 'SKUs Auditados', val: '1.250 SKUs', color: 'text-purple-300' },
      { label: 'Uptime Sistema', val: '99.98%', color: 'text-emerald-400' },
    ],
    logs: [
      { text: '[08:00:01.00] ⚡ Escucha de webhook de marketplace activa.', cls: 'text-[#F8F4E9]' },
      { text: '[08:00:01.20] 📊 1.250 SKUs evaluados contra series temporales.', cls: 'text-purple-300' },
      { text: '[08:00:01.35] 🚨 Alerta preventiva: SKU MAD-01 con 36h de cobertura restante.', cls: 'text-amber-300' },
      { text: '[08:00:01.42] ✓ Despachada orden automática de reposición vía Webhook al proveedor.', cls: 'text-emerald-400' },
    ],
    payload: `{\n  "canal": "api_marketplace",\n  "evento": "AUDITORIA_STOCK_PERIODICA",\n  "almacenes": ["MAD-01", "BCN-02", "VLC-01"],\n  "skus_evaluados": 1250,\n  "umbral_seguridad": "5_dias_demanda_historica"\n}`,
    time: '0.42s',
    accuracy: '100%',
    tokens: '185',
    category: 'LOGÍSTICA / GESTIÓN_PREVENTIVA_ROTURA',
    priority: 'P3 - OPERATIVO ESTÁNDAR',
    actions: [
      '✓ 1.250 SKUs recalculados con modelo de predicción estacional.',
      '✓ 3 productos en MAD-01 con riesgo de rotura identificados en 36h.',
      '✓ Orden de reposición automática despachada al proveedor primario vía Webhook.',
    ],
  },
];
