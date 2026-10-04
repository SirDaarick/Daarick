# Base de Conocimiento de Proyectos y Capacidades para el Agente Wiki
# Formato: Markdown estructurado fácil de leer y editar.
# Puedes añadir nuevos proyectos, detalles técnicos, casos de éxito o reglas en este archivo.

## 1. PAIDEA (Plataforma y Asistente de Consulta de Datos e Inventarios)
- **¿Qué problema resolvió?**: Los profesores y directivos universitarios en ESCOM-IPN pasaban incontables horas atendiendo dudas repetitivas sobre trámites, materias, criterios de rúbricas y consultando la situación de alumnos a mano.
- **¿Qué automatización se aplicó?**: 
  - Un agente conversacional inteligente ("TecnoBurro") que responde preguntas en lenguaje natural consultando una base de datos de alumnos, profesores, materias, trámites y calificaciones.
  - El usuario puede preguntar cosas como: "¿Qué alumnos deben entregar la práctica 2?", "¿Cuáles son los requisitos de titulación?" o consultar calificaciones directamente sin tener que buscar en hojas de cálculo ni sistemas lentos.
  - Utiliza recuperación de información (RAG) sobre reglamentos oficiales y herramientas multi-agente que consultan datos en tiempo real de forma segura.
- **¿Cómo se aplica a otros negocios?**: Si un cliente busca **gestión de inventarios**, consultar bases de datos de existencias, catálogos extensos de productos, o permitir que sus clientes o alumnos resuelvan dudas sobre sus datos personales, historial o trámites, PAIDEA es el caso de éxito ideal. (NO lo uses para ventas generales o agendado de citas de negocios cotidianos; para eso se utiliza el asistente Wiki).

---

## 2. Extractor de Facturas, Tickets y Documentos a Excel
- **¿Qué problema resuelve?**: Los negocios y equipos administrativos pierden horas pasando a mano tickets de compras, facturas en PDF y comprobantes fiscales a Excel o su software contable, provocando errores en las cuentas.
- **¿Qué automatización se aplica?**: 
  - Una demo interactiva en el portafolio que permite subir un PDF o foto de factura/ticket.
  - Lee el documento de manera visual, extrae los montos, emisor, RFC, fechas e impuestos, y valida matemáticamente que los subtotales e IVA cuadren antes de guardarlos.
  - Está en proceso de integrarse a una aplicación completa de gestión financiera y control de gastos para negocios.
- **¿Cómo se aplica a otros negocios?**: Para cualquier empresa que reciba notas de compra, facturas de proveedores o comprobantes y quiera tener un control financiero automático sin captura manual.

---

## 3. Tetring (Optimizador de Horarios y Turnos sin Empalmes)
- **¿Qué problema resolvió?**: Los alumnos y coordinadores tardaban horas en armar calendarios y horarios entre decenas de grupos posibles, sufriendo empalmes de clases y huecos muertos.
- **¿Qué automatización se aplicó?**: 
  - Un motor matemático especializado que evalúa más de 14,000 combinaciones en milisegundos (42 ms) para encontrar el horario perfecto con cero empalmes y respetando las preferencias del usuario.
- **¿Cómo se aplica a otros negocios?**: Para empresas con turnos de personal (restaurantes, clínicas, guardias), asignación de salas, cuadrantes de trabajo o rutas de entrega donde se necesita organizar horarios sin choques humanos.

---

## 4. Graphito (Auditoría y Comparación Inteligente de Código)
- **¿Qué problema resolvió?**: Los profesores no podían detectar copias en tareas de programación cuando los alumnos cambiaban nombres de variables o alteraban bucles.
- **¿Qué automatización se aplica?**: Analiza la lógica real y el flujo de los programas (árboles de sintaxis) para comparar similitudes reales más allá de las palabras usadas.
- **¿Cómo se aplica a otros negocios?**: Para auditoría de documentos técnicos, validación de tareas o comparación de contenidos donde comparar solo texto simple no es suficiente.

---

## 5. Paralel (Toma de Decisiones de Alta Velocidad)
- **¿Qué problema resolvió?**: Demostrar cómo procesar cálculos complejos y tomar decisiones en menos de 12 milisegundos dividiendo el trabajo en múltiples núcleos.
- **¿Cómo se aplica a otros negocios?**: Para procesos industriales, simulaciones o alertas en tiempo real donde la velocidad inmediata es crítica.

---

## 6. Stampy (Auditor Financiero & Gestor de Gastos Dual-Scope vía Telegram)
- **¿Qué problema resuelve?**: Los dueños de negocio, profesionistas y freelancers mezclan rutinariamente compras personales con gastos corporativos, perdiendo deducciones fiscales clave y enfrentando horas de estrés clasificando tickets al cierre de mes.
- **¿Qué automatización se aplica?**: 
  - Un bot inteligente en Telegram con arquitectura *Dual-Scope* que permite registrar gastos y tickets en menos de 3 segundos por mensaje de texto, foto o voz.
  - El sistema detecta automáticamente la categoría del gasto, el proveedor y el monto, y calcula el IVA acreditable en tiempo real.
  - Permite alternar instantáneamente entre **Modo Negocio (`BUSINESS`)** y **Modo Personal (`PERSONAL`)**, aislando las cuentas fiscales y sellando cada transacción en un ledger con interfaz industrial táctil.
  - Cuenta con demo interactiva en vivo desplegada en https://stampy.vercel.app/ con base de datos autónoma en cliente y repositorio público en https://github.com/SirDaarick/Stampy.
- **¿Cómo se aplica a otros negocios?**: Ideal para cualquier empresa, consultor o comercio que busque automatizar el control de caja chica, viáticos de empleados o gestión tributaria sin obligar al equipo a aprender sistemas contables complejos.

---

## 7. Wiki Assistant (Motor de Consultoría, Ventas y Agendado de Citas en Vivo)
- **¿Qué problema resuelve?**: Los dueños de negocios (peluquerías, salones, talleres, consultorios, tiendas y despachos) pierden ventas y horas respondiendo los mismos mensajes en WhatsApp y coordinando citas a mano. Los chatbots tradicionales son rígidos, torpes y frustran a los clientes sin cerrar ventas.
- **¿Qué automatización se aplica?**: 
  - Es el asistente que el usuario está viendo e interactuando en este preciso momento en el portafolio de Erick.
  - Diseñado para guiar con empatía y sencillez a clientes que no tienen conocimientos técnicos.
  - Conversa en lenguaje cotidiano, diagnostica la necesidad real sin tecnicismos, presenta 3 alternativas a la medida y agenda videollamadas en Google Calendar.
  - Opera con reglas de servidor 100% deterministas en 4 pasos (*Descubrir → Opciones → Propuesta → Cierre*) para garantizar la mejor experiencia al cliente, sin citas apresuradas ni respuestas robóticas.
- **¿Cómo se aplica a otros negocios?**: Si un cliente busca **atención a clientes, ventas por chat/WhatsApp o gestión de citas**, la respuesta debe ser: *"Sería como este mismo asistente con el que estás hablando ahora en tu pantalla, adaptado a los horarios, servicios y catálogo de tu negocio"*. Usa siempre `project_ref: "wiki"`.

