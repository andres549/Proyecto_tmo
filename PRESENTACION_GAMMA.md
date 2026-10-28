# PRESENTACIÓN EJECUTIVA: TMO CONTROL ENTERPRISE SUITE (BPO & ASISTENTE IA)

> **Instrucciones para Gamma.app / Canva / PowerPoint:**
> 1. Ingresa a [https://gamma.app](https://gamma.app) e inicia sesión (o en tu software de presentaciones favorito).
> 2. Haz clic en **"Crear nuevo con IA"** (Create new) > **"Pegar texto"** (Paste in text).
> 3. Pega todo el contenido de este documento.
> 4. Selecciona el formato **"Presentación" (16:9)** y el estilo visual preferido (recomendado: *Tech / Midnight / Emerald*).
> 5. Haz clic en **"Generar"** para obtener las diapositivas interactivas listas para exponer.
> *Nota: También puedes ver la versión interactiva nativa ejecutando el servidor local en [http://localhost:3333/slides.html](http://localhost:3333/slides.html).*

---

# Diapositiva 1: Portada
## TMO Control Enterprise Suite
### Automatización Integral de Métricas Operativas BPO, Arquitectura SPA y Copilot IA

* **Autor / Expositor:** Andrés Morales • Equipo de Operaciones & Automatización BPO
* **Tecnologías:** n8n Workflow Engine • PostgreSQL (Supabase) • OpenAI GPT-4o / Claude • Node.js • Tailwind CSS • Nodemailer
* **Repositorio Oficial:** [github.com/andres549/Proyecto_tmo](https://github.com/andres549/Proyecto_tmo)
* **Objetivo:** Eliminar el cálculo manual de TMO en hojas de cálculo y automatizar la ingesta, deduplicación, consolidación visual en Excel de 4 hojas, auditoría con IA y despacho automático multicanal.

---

# Diapositiva 2: La Problemática Operativa Actual
## Los Desafíos del Proceso Manual en Centros de Contacto

* **Pérdida Crítica de Tiempo:** Un analista de operaciones dedica entre 45 y 90 minutos por turno a consolidar archivos Excel dispersos enviados por correo.
* **Vulnerabilidad a Errores y Duplicidad:** La manipulación manual de fórmulas altera métricas y, sin control criptográfico de duplicados, los mismos archivos se procesan varias veces afectando bonificaciones.
* **Fórmulas Frías sin Diagnóstico:** Las hojas de cálculo tradicionales devuelven números sin explicar el porqué del desvío ni ofrecer planes de coaching al supervisor.
* **Notificaciones Tardías:** Los asesores que superan la meta se enteran días después en auditorías semanales, cuando el daño en el SLA contractual ya es irreversible.

---

# Diapositiva 3: Objetivo del Proyecto & Solución Integral
## Transformación Digital del Ciclo de Vida del TMO

* **Automatización del 100%:** Ingesta automática mediante correos IMAP o portal web SPA, deduplicación SHA-256 y cálculo en menos de 3.2 segundos.
* **Consolidación Profesional y Gráfica:** Generación automática de libros Excel oficiales de 4 hojas (*Resumen Consolidado, Datos Originales, Dashboard con Gráficos de Barras y Donas, y Hoja de Validación IA*).
* **Validación Independiente y Desacoplada:** Dos flujos paralelos en n8n conectados por eventos de correo para separar el cálculo matemático de la auditoría cualitativa.
* **Copilot de IA y Alertas Inmediatas:** Detección de asesores en riesgo ($TMO > 20\text{s}$) y despacho automático de planes de coaching individualizados por correo.

---

# Diapositiva 4: Arquitectura Tecnológica Integrada
## Ecosistema Robusto, Escalable y Desacoplado

| Componente | Rol en la Solución | Tecnología Empleada |
| :--- | :--- | :--- |
| **Portal Web SPA** | Cockpit en vivo (Talk/Hold/Wrap-up), 6 vistas aisladas, modo oscuro/claro y ecualizador sonoro. | HTML5, Tailwind CSS, Chart.js, Web Audio API |
| **Motor de Automatización** | Orquestación por eventos, deduplicación SHA-256, loops condicionales y branching de alertas. | n8n Engine v2.41+ |
| **Capa de Persistencia** | Almacenamiento relacional de configuraciones dinámicas, auditoría de ejecuciones y trazabilidad. | Supabase (PostgreSQL 15 con RLS) |
| **Generador de Reportes** | Construcción programática de libros Excel oficiales con formato corporativo y gráficos nativos. | Node.js con ExcelJS & Chart-to-Image |
| **Copilot de IA (NLU)** | Comprensión de lenguaje natural en español, diagnóstico de cuellos de botella y planes de mejora. | OpenAI GPT-4o-mini / LangChain |
| **Motor de Alertas** | Despacho SMTP autenticado con adjuntos de libros Excel a bandejas personales y corporativas. | Nodemailer / Google Workspace SMTP |

---

# Diapositiva 5: Portal Web SPA & Cockpit de Medición en Vivo
## Experiencia de Usuario de Clase Mundial (UI/UX 2.0)

* **6 Vistas Únicas e Independientes:** Dashboard General, Cronómetro en Vivo, Operadores & Células, Auditoría IA, Historial y Alertas & n8n. Cero solapamiento de scroll entre secciones.
* **Temporizador Cockpit con Ecualizador:** Medición precisa en tiempo real con barras de audio reactivas y síntesis sonora nativa con Web Audio API.
* **Fases Reglamentarias BPO:** Control exacto de *Talk Time* (conversación), *Hold Time* (espera) y *Wrap-up* (tipificación y cierre en CRM).
* **Diseño Moderno:** Tema Oscuro profundo y Modo Claro, tarjetas KPI con barras de progreso y notificaciones Toast flotantes no intrusivas.

---

# Diapositiva 6: Copilot de IA con Comprensión de Lenguaje Natural (NLU)
## Asistente Táctico Conversacional para el Supervisor

* **Lenguaje Cotidiano en Español:** El supervisor interactúa fluidamente sin comandos rígidos:
  * *"¿Cómo le fue a Andrés hoy?"*
  * *"¿Quiénes tuvieron bajo desempeño?"*
  * *"¿Qué canal presenta más demoras?"*
  * *"Plan de coaching para la próxima semana"*
* **Cálculos Matemáticos en Tiempo Real:** La IA analiza las métricas en memoria para ofrecer respuestas estadísticamente exactas sin alucinaciones.
* **Acciones Directas en el Chat:** Respuestas enriquecidas con botones integrados para despachar alertas y planes de mejora con un clic.
* **Guardrails Operativos:** Reglas que mantienen a la IA estrictamente enfocada en el desempeño del centro de contacto.

---

# Diapositiva 7: Módulo de Alertas Individuales a Trabajadores
## Notificaciones Proactivas y Cierre de Brechas

* **Detección Automática de Desvíos:** Identificación inmediata de operadores que superan el umbral objetivo de 20.00 segundos.
* **Caso de Éxito Validado: Andrés Morales (`andrxscxx@gmail.com`):**
  * TMO Registrado: 25.45s (+27.3% sobre la meta).
  * Desglose: Talk: 17.2s | Hold: 5.1s | Wrap: 3.15s.
  * Plan Táctico: Escalamiento temprano a 2do nivel antes de 15s y uso de plantillas rápidas en CRM.
* **Adjunto Oficial:** Cada alerta despachada incluye el archivo Excel consolidado de la jornada para máxima transparencia.

---

# Diapositiva 8: Resultados de la Auditoría Operativa
## Hallazgos de la Medición en la Muestra de Prueba (85 Gestiones)

* **TMO Global del Equipo:** **19.55 segundos** (Cumpliendo el objetivo general de $\le 20\text{s}$).
* **Tasa de Aprobación Global:** **62.5%** (5 de 8 asesores evaluados se encuentran dentro de meta).
* **Operador Más Destacado:** Laura Restrepo con un TMO promedio de **12.64s** (uso óptimo de tipificación en paralelo).
* **Operadores en Revisión:** Felipe Herrera (30.00s), Andrés Morales (25.45s) y Mateo Cárdenas (24.50s) — Todos pertenecientes a la Célula F3 (Soporte Técnico).
* **Canal Más Rápido:** Chat en Vivo (**16.2s**) | **Canal Crítico:** Soporte Técnico (**26.5s**).

---

# Diapositiva 9: Impacto en el Negocio & Retorno de Inversión (ROI)

* **-96% en Tiempo Operativo:** Reducción drástica del tiempo de consolidación de 45-90 minutos manuales a solo 3.2 segundos automatizados.
* **100% de Integridad de Datos:** Eliminación total de duplicados mediante hashes SHA-256 en Supabase y fórmulas matemáticas estandarizadas.
* **Acción Inmediata 24/7:** Intervención proactiva en el mismo turno antes de que se generen penalizaciones contractuales en los acuerdos de nivel de servicio (SLA).
* **Escalabilidad Empresarial:** Soporta múltiples células de trabajo, campañas y clientes simultáneos con umbrales configurables en base de datos.

---

# Diapositiva 10: Conclusiones y Demostración en Vivo
## Solución Desplegada y Lista para Producción

* **Ecosistema Completo Publicado:** Código fuente, flujos n8n y esquemas SQL disponibles en GitHub:
  🔗 **[github.com/andres549/Proyecto_tmo](https://github.com/andres549/Proyecto_tmo)**
* **Portal Web Interactivo en Ejecución:** Accesible localmente en `http://localhost:3333`
* **Diapositivas Web en Pantalla Completa:** Accesibles en `http://localhost:3333/slides.html`
* **¡Muchas gracias!** Quedamos atentos a sus preguntas y listos para la demostración en vivo.
