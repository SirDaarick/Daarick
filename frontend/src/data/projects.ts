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
  githubUrl: string;
  gifUrl: string;
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
    title: 'Graphito',
    shortDesc: 'Detección inteligente de plagio y copias en código de programación, identificando similitudes reales aunque se alteren variables.',
    status: 'DEMO EN VIVO',
    tags: ['GraphCodeBERT', 'LoRA', 'Tree-sitter', 'FastAPI', 'PyTorch'],
    filename: 'graphito.analyzer.engine',
    problem: 'Los detectores de plagio tradicionales basados en tokens (JPlag, Moss) son vulnerables cuando los estudiantes renombran variables, reorganizan funciones o cambian estructuras de control sin alterar la semántica computacional.',
    solution: 'Pipeline de deep learning que combina GraphCodeBERT con adaptadores LoRA, grafos de flujo de datos (DFG) extraídos con Tree-sitter y estilometría de caracteres (CharCNN), alcanzando un 96.8% de precisión en código ofuscado.',
    demoUrl: 'https://graphito-escom.vercel.app/',
    githubUrl: 'https://github.com/SirDaarick/Graphito',
    gifUrl: '/demos/graphito.gif',
    sparklineColor: '#c084fc',
    metricLabel: 'Precisión F1 en DFG',
    metricValue: '96.8%',
    metricDelta: 'LoRA-v2',
    metrics: [
      { label: 'Detección Ofuscación', val: '96.8%', color: 'text-emerald-400' },
      { label: 'Tiempo Inferencia', val: '180ms', color: 'text-purple-300' },
      { label: 'Gramática AST', val: 'C/C++ Tree-sitter', color: 'text-[#F8F4E9]' },
      { label: 'Falsos Positivos', val: '-84%', color: 'text-emerald-400' },
    ],
    logs: [
      { text: '[09:12:01.10] ⚡ Carga de fuentes C++: submission_student_a.cpp vs solution_b.cpp', cls: 'text-[#F8F4E9]' },
      { text: '[09:12:01.35] 🌳 Construcción de Data Flow Graph (DFG) con gramática Tree-sitter finalizada (84 nodos).', cls: 'text-purple-300' },
      { text: '[09:12:01.62] 🧠 Embeddings extraídos con GraphCodeBERT + Adaptadores LoRA.', cls: 'text-amber-300' },
      { text: '[09:12:01.88] 🚨 Similitud semántica: 94.7% | Estilometría CharCNN: 89.2% -> Veredicto: PLAGIO DETECTADO.', cls: 'text-emerald-400' },
    ],
    payload: `{\n  "source_code_a": "int f(int a, int b) { int s = 0; for(int i=0; i<a; ++i) s += b; return s; }",\n  "source_code_b": "int multiply(int x, int y) { int res = 0; int j = 0; while(j < x) { res = res + y; j++; } return res; }",\n  "language": "cpp",\n  "extract_dfg": true,\n  "stylometry_engine": "char_cnn"\n}`,
    time: '180ms',
    accuracy: '96.8%',
    tokens: '412',
    category: 'INTEGRIDAD_ACADÉMICA / DEEP_LEARNING_CODE',
    priority: 'ALTA_COINCIDENCIA (94.7%)',
    actions: [
      '✓ Generado Data Flow Graph (DFG) con 84 aristas de dependencia semántica.',
      '✓ Similitud estructural detectada a pesar de renombrado de variables y cambio de for a while.',
      '✓ Reporte de auditoría generado con mapa de calor de tensores de atención.',
    ],
  },
  {
    id: 'PRJ-02',
    key: 'B',
    code: '02',
    title: 'Tetring',
    shortDesc: 'Generador y organizador automático de horarios universitarios, resolviendo la mejor combinación de materias sin empalmes en segundos.',
    status: 'DEMO EN VIVO',
    tags: ['Algoritmos Combinatorios', 'SAES IPN', 'TypeScript', 'React'],
    filename: 'tetring.scheduler.optimizer',
    problem: 'La inscripción de materias en el sistema SAES exige que los estudiantes contrasten manualmente decenas de grupos y profesores, causando empalmes involuntarios, huecos de 4 horas y pérdida de cupos por demoras.',
    solution: 'Motor de satisfacción de restricciones (CSP) que evalúa miles de combinaciones viables en tiempo real, priorizando profesores mejor calificados, eliminando horas muertas y asegurando 0 empalmes.',
    demoUrl: 'https://tetring.vercel.app/',
    githubUrl: 'https://github.com/SirDaarick/Tetring',
    gifUrl: '/demos/tetring.gif',
    sparklineColor: '#38bdf8',
    metricLabel: 'Tiempo de Optimización',
    metricValue: '42ms',
    metricDelta: '0 Empalmes',
    metrics: [
      { label: 'Combinaciones / seg', val: '14,200/s', color: 'text-emerald-400' },
      { label: 'Empalmes Permitidos', val: '0', color: 'text-emerald-400' },
      { label: 'Minimización Huecos', val: '92%', color: 'text-purple-300' },
      { label: 'Integración SAES', val: '100% Compatible', color: 'text-[#F8F4E9]' },
    ],
    logs: [
      { text: '[14:00:00.05] 📅 Importación de oferta académica: 6 materias seleccionadas (24 grupos disponibles).', cls: 'text-[#F8F4E9]' },
      { text: '[14:00:00.12] ⚙️ Aplicando restricciones duras: exclusión de horarios antes de las 08:00 hrs.', cls: 'text-purple-300' },
      { text: '[14:00:00.22] 🔄 Búsqueda combinatoria con poda branch-and-bound completada en 42ms.', cls: 'text-amber-300' },
      { text: '[14:00:00.35] ✓ 18 combinaciones válidas generadas. Horario óptimo seleccionado con balance de 5 días.', cls: 'text-emerald-400' },
    ],
    payload: `{\n  "materias": ["Compiladores", "Redes Neuronales", "Sistemas Distribuidos", "Criptografía"],\n  "restricciones_duras": ["no_empalmes", "max_horas_continuas_4"],\n  "preferencias": {\n    "evitar_huecos_mayores_a": "1_hora",\n    "hora_minima_entrada": "08:00",\n    "hora_maxima_salida": "17:00"\n  }\n}`,
    time: '42ms',
    accuracy: '100%',
    tokens: '0 (Motor CSP)',
    category: 'OPTIMIZACIÓN_COMBINATORIA / PLANIFICACIÓN_ACADÉMICA',
    priority: 'HORARIO_ÓPTIMO_GENERADO',
    actions: [
      '✓ Evaluadas 14,200 combinaciones posibles sin superposición horaria.',
      '✓ Asignación de 5 materias distribuidas de lunes a viernes sin huecos de más de 60m.',
      '✓ Exportación de horario lista para descarga en PDF y calendario iCal.',
    ],
  },
  {
    id: 'PRJ-03',
    key: 'C',
    code: '03',
    title: 'PAIDEA',
    shortDesc: 'Plataforma educativa con inteligencia artificial para universidades, asistiendo a profesores y resolviendo dudas de alumnos 24/7.',
    status: 'DEMO EN VIVO',
    tags: ['Multi-Agentes', 'FastAPI', 'RAG', 'ChromaDB', 'LangChain'],
    filename: 'paidea.agent.tecno_burro',
    problem: 'Los docentes universitarios invierten decenas de horas respondiendo dudas repetitivas sobre rúbricas, mientras que los alumnos carecen de retroalimentación inmediata sobre sus entregas académicas fuera de clase.',
    solution: 'Arquitectura de agentes coordinados (TecnoBurro) con herramientas especializadas (alumno_tools, profesor_tools) y memoria contextual sobre ChromaDB que asiste en tutorías y validación de criterios.',
    demoUrl: 'https://paidea-reloaded-xi.vercel.app/',
    githubUrl: 'https://github.com/SirDaarick/paidea-reloaded',
    gifUrl: '/demos/paidea.gif',
    sparklineColor: '#f59e0b',
    metricLabel: 'Resolución Agéntica',
    metricValue: '94.1%',
    metricDelta: 'Multi-Tool RAG',
    metrics: [
      { label: 'Tiempo de Respuesta', val: '1.2s', color: 'text-purple-300' },
      { label: 'Precisión RAG', val: '95.4%', color: 'text-emerald-400' },
      { label: 'Herramientas Conectadas', val: '8 Tools', color: 'text-[#F8F4E9]' },
      { label: 'Ventana de Contexto', val: '32k tokens', color: 'text-emerald-400' },
    ],
    logs: [
      { text: '[16:45:10.12] 🤖 Agente orquestador TecnoBurro inicializado. Rol activo: ALUMNO.', cls: 'text-[#F8F4E9]' },
      { text: '[16:45:10.45] 📚 Vector Search en ChromaDB: recuperados 3 fragmentos de la rúbrica de Compiladores.', cls: 'text-purple-300' },
      { text: '[16:45:10.88] 🛠 Disparo de herramienta alumno_tools.validar_requisitos_entrega con éxito.', cls: 'text-amber-300' },
      { text: '[16:45:11.30] ✓ Respuesta sintetizada: rúbrica explicada con desglose de entregables y fechas límite.', cls: 'text-emerald-400' },
    ],
    payload: `{\n  "agente": "tecno_burro",\n  "rol": "alumno",\n  "consulta": "¿Cuáles son los requisitos de entrega y criterios de evaluación de la Práctica 3?",\n  "asignatura": "Compiladores",\n  "use_rag": true,\n  "tools": ["alumno_tools", "rubric_evaluator"]\n}`,
    time: '1.22s',
    accuracy: '95.4%',
    tokens: '580',
    category: 'SISTEMA_MULTI_AGENTE / ASISTENCIA_PEDAGÓGICA',
    priority: 'CONSULTA_RESUELTA_CON_ÉXITO',
    actions: [
      '✓ Búsqueda vectorial semántica ejecutada en ChromaDB (k=3 fragmentos relevantes).',
      '✓ Invocada herramienta alumno_tools para contrastar formato de entrega ZIP.',
      '✓ Generada respuesta estructurada con desglose de puntos por sección de la rúbrica.',
    ],
  },
  {
    id: 'PRJ-04',
    key: 'D',
    code: '04',
    title: 'Paralel',
    shortDesc: 'Inteligencia artificial de alta velocidad para juegos de lógica y toma de decisiones en tiempo real usando procesamiento en paralelo.',
    status: 'DEMO EN VIVO',
    tags: ['C++', 'Computación Paralela', 'OpenMP', 'Heurísticas', 'IA'],
    filename: 'paralel.tetris.engine',
    problem: 'Los algoritmos de búsqueda para juegos de decisión rápida como Tetris sufren una explosión combinatoria al evaluar jugadas futuras con lookahead profundo, colapsando el tiempo de respuesta en un solo hilo.',
    solution: 'Motor multihilo desarrollado en C++ y paralelizado con OpenMP/multiprocessing que evalúa decenas de miles de ramas de tablero por segundo mediante heurísticas optimizadas de altura, huecos y rugosidad.',
    demoUrl: 'https://paralel-iota.vercel.app/',
    githubUrl: 'https://github.com/SirDaarick/Paralel',
    gifUrl: '/demos/paralel.gif',
    sparklineColor: '#10b981',
    metricLabel: 'Throughput Evaluado',
    metricValue: '68,000/s',
    metricDelta: '↑ 7.4x Speedup',
    metrics: [
      { label: 'Speedup Paralelo', val: '7.4x (8 Cores)', color: 'text-emerald-400' },
      { label: 'Nodos por Segundo', val: '68,000/s', color: 'text-purple-300' },
      { label: 'Líneas Promedio', val: '15,000+', color: 'text-emerald-400' },
      { label: 'Latencia Decisión', val: '< 12ms', color: 'text-[#F8F4E9]' },
    ],
    logs: [
      { text: '[20:10:00.02] 🎮 Inicializando tablero de Tetris (10x20) y cola de piezas (Bag-7).', cls: 'text-[#F8F4E9]' },
      { text: '[20:10:00.08] ⚡ OpenMP: 8 hilos worker despachados para evaluación de árbol con poda alfa-beta.', cls: 'text-purple-300' },
      { text: '[20:10:00.14] 📊 Heurística calculada: Altura = 4, Huecos = 0, Rugosidad = 2, Líneas potenciales = 2.', cls: 'text-amber-300' },
      { text: '[20:10:00.20] ✓ Jugada óptima encontrada: Rotación 2, Columna 4 (Score proyectado: 9,840 pts) en 8.4ms.', cls: 'text-emerald-400' },
    ],
    payload: `{\n  "pieza_actual": "T",\n  "pieza_siguiente": "I",\n  "profundidad_lookahead": 2,\n  "hilos_paralelos": 8,\n  "pesos_heuristicos": {\n    "altura_agregada": -0.51,\n    "lineas_completas": 0.76,\n    "huecos": -0.36,\n    "rugosidad": -0.18\n  }\n}`,
    time: '8.4ms',
    accuracy: '99.2%',
    tokens: '0 (Native Parallel C++)',
    category: 'COMPUTACIÓN_PARALELA / IA_HEURÍSTICA',
    priority: 'DECISIÓN_ÓPTIMA_EJECUTADA',
    actions: [
      '✓ Repartición de 8 rotaciones posibles en 8 núcleos de CPU vía OpenMP.',
      '✓ Poda de ramas con pérdida de juego garantizada en profundidad 2.',
      '✓ Movimiento óptimo ejecutado con latencia menor a 10 milisegundos.',
    ],
  },
];
