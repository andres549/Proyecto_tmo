# PRESENTACIÓN EJECUTIVA: SISTEMA INTELIGENTE DE CÁLCULO Y VALIDACIÓN DE TMO CON N8N, SUPABASE E INTELIGENCIA ARTIFICIAL

> **Instrucciones para Gamma.app:**
> 1. Ingresa a [https://gamma.app](https://gamma.app) e inicia sesión.
> 2. Haz clic en **"Crear nuevo con IA"** (Create new) > **"Pegar texto"** (Paste in text).
> 3. Pega todo el contenido de este documento.
> 4. Selecciona el formato **"Presentación" (16:9)** y el estilo visual preferido (recomendado: *Tech / Emerald / Midnight*).
> 5. Haz clic en **"Generar"** para obtener las diapositivas interactivas listas para exponer.

---

# Diapositiva 1: Portada
## Sistema Inteligente de Cálculo, Looping y Validación de TMO con n8n, Supabase e IA
### Automatización Integral de Métricas Operativas BPO para Centros de Contacto

* **Autor / Expositor:** Equipo de Automatización & Operaciones BPO
* **Tecnologías:** n8n Workflow Automation • PostgreSQL / Supabase • OpenAI GPT-4o • Node.js • Nodemailer
* **Objetivo:** Eliminar el cálculo manual de TMO en hojas de cálculo y automatizar la ingesta, deduplicación, consolidación visual en Excel de 4 hojas, auditoría con IA y despacho automático multicanal.

---

# Diapositiva 2: La Problemática Operativa Actual
## Los Desafíos del Proceso Manual en Contact Centers

* **Dependencia Manual Crítica:** Un analista de operaciones debe esperar correos con archivos Excel dispersos, abrir cada archivo y calcular el TMO manualmente con fórmulas propensas a error humano.
* **Procesamiento Lento e Ineficiente:** El tiempo de consolidación toma entre 45 y 90 minutos por turno, impidiendo la toma de decisiones ágiles sobre asesores que superan los tiempos objetivo.
* **Archivos Duplicados y Métricas Sesgadas:** Sin un control criptográfico de duplicados, los mismos archivos se procesan varias veces, alterando las métricas de rendimiento y comisiones.
* **Falta de Auditoría Cualitativa:** Las fórmulas estándar solo devuelven números fríos, sin planes de acción ni diagnósticos de coaching para los supervisores en piso.

---

# Diapositiva 3: Objetivo del Proyecto
## Transformación Digital del Ciclo de Vida del TMO

* **Automatización Extremo a Extremo:** Automatizar el 100% de la recepción, validación, cálculo y notificación sin requerir intervención humana para abrir hojas de cálculo.
* **Consolidación Profesional y Gráfica:** Generar automáticamente un libro Excel reglamentario de 4 hojas (*Resumen TMO, Datos originales, Dashboard con Gráficos de Barras y Donas, y Validación*).
* **Validación Independiente y Paralela:** Desacoplar el cálculo numérico de la auditoría cualitativa mediante dos flujos independientes en n8n conectados por eventos de correo e IMAP.
* **Asistente de IA Táctico:** Analizar anomalías y generar planes de coaching individualizados para los supervisores operativos sin alucinar clasificaciones matemáticas.

---

# Diapositiva 4: Arquitectura Tecnológica Integrada
## Ecosistema Robusto, Escalable y Modular

| Componente | Rol en la Solución | Tecnología Empleada |
| :--- | :--- | :--- |
| **Plataforma Web** | Cronómetro en vivo (Talk/Hold/Wrap-up), carga de archivos masivos, KPIs en tiempo real y selector de envío. | HTML5, Tailwind CSS, Chart.js, SheetJS |
| **Motor de Automatización** | Orquestación por eventos, deduplicación SHA-256, Looping over items, ejecución de lógica y branching condicional. | n8n Engine v2.41+ |
| **Capa de Persistencia** | Almacenamiento relacional de configuraciones dinámicas, auditoría de ejecuciones, registros crudos y logs de correo. | Supabase (PostgreSQL 15 con RLS) |
| **Generador de Reportes** | Construcción programática de libros Excel oficiales con formateo condicional y gráficos nativos. | Node.js con ExcelJS & Chart-to-Image |
| **Inteligencia Artificial** | Auditoría operativa, detección de desviaciones y generación de recomendaciones tácticas. | OpenAI GPT-4o-mini / LangChain Node |
| **Motor de Correo** | Despacho SMTP autenticado con adjuntos pesados y disparadores IMAP automáticos. | Nodemailer / Google Workspace SMTP |

---

# Diapositiva 5: Los Dos Flujos Independientes en n8n
## Arquitectura Desacoplada y Concurrente

### Flujo 1: Cálculo, Consolidación y Envío del Reporte
1. **Trigger Webhook / Carga:** Recibe el dataset crudo o archivo Excel desde la web.
2. **Control de Duplicados (Hash SHA-256):** Verifica contra Supabase si el contenido ya fue procesado previamente para evitar duplicidad de métricas.
3. **Loop Over Items & Cálculo:** Itera los registros válidos ($\ge 50$ filas), suma los tiempos y calcula el TMO promedio por agente.
4. **Construcción del Excel Consolidado:** Genera las 4 hojas con gráficos de barras (límite horizontal) y donas (% aprobados).
5. **Persistencia & Despacho SMTP:** Guarda la ejecución en `tmo_runs` y envía el correo con el Excel consolidado adjunto.

### Flujo 2: Validación Independiente y Asistente de IA
1. **Email Trigger (IMAP):** Detecta automáticamente la llegada del correo con el asunto `[REPORTE TMO CONSOLIDADO]`.
2. **Consulta de Reglas de Negocio:** Lee el umbral dinámico desde `app_settings` en Supabase (ej: 20.0s).
3. **Clasificación Estricta:** Clasifica en `APROBADO` ($\le 20\text{s}$), `REQUIERE REVISIÓN` ($> 20\text{s}$) o `ERROR DE DATOS`.
4. **Agente de IA (OpenAI):** Examina los casos atípicos y formula planes de coaching tácticos para el supervisor.
5. **Enrutamiento Condicional de Alertas:** Envía correos diferenciados según los resultados encontrados.

---

# Diapositiva 6: Funcionamiento Paso a Paso
## Recorrido del Dato desde la Llamada hasta la Acción Operativa

```
[Llamada / Archivo Excel] 
          ↓
[Deduplicación SHA-256] → (Si ya existe: Omite y alerta)
          ↓
[Looping & Agrupación por Agente]
          ↓
[Cálculo de TMO Promedio y % del Límite]
          ↓
[Generación de Excel 4 Hojas con Gráficas]
          ↓
[Envío Correo Consolidado a Supervisor]
          ↓
[Disparo de Flujo 2 por IMAP]
          ↓
[Evaluación de Reglas + Auditoría Asistente IA]
          ↓
[Despacho de Alertas Verde / Roja y Registro en Supabase]
```

* **Fórmula Oficial de Desempeño:**
  $$\text{TMO Promedio} = \frac{\sum \text{Tiempos Válidos}}{\text{Total Gestiones Válidas}}$$
  $$\text{Porcentaje del Límite} = \left(\frac{\text{TMO Promedio}}{\text{Límite Objetivo}}\right) \times 100$$

---

# Diapositiva 7: El Dashboard y los Reportes Visuales
## Excel Consolidado Oficial de 4 Hojas

1. **Hoja 1: Resumen TMO**
   * Tabla consolidada por agente: total de gestiones, suma en segundos, TMO promedio, % frente al límite y clasificación operativa.
2. **Hoja 2: Datos Originales**
   * Trazabilidad completa fila por fila de los registros procesados con su estado de validación individual.
3. **Hoja 3: Dashboard Visual**
   * **Gráfico 1 (Barras):** TMO por agente con barras verdes ($\le 20\text{s}$), rojas ($> 20\text{s}$) y línea de umbral en 20s.
   * **Gráfico 2 (Dona):** Distribución porcentual entre agentes aprobados y agentes en revisión.
4. **Hoja 4: Validación y Auditoría**
   * Parámetros aplicados, fecha de corte, bitácora de ejecución y diagnóstico táctico del Asistente IA.

---

# Diapositiva 8: Valor y Beneficios de la Automatización
## Impacto Medible en la Operación BPO

* **Reducción del 95% en Tiempo de Procesamiento:** De 60 minutos de manipulación manual en Excel a menos de 4 segundos por ejecución automática.
* **100% de Confiabilidad y Cero Errores:** Erradicación total de fórmulas rotas, celdas mal copiadas o registros duplicados gracias al hash SHA-256.
* **Visibilidad en Tiempo Real:** Supervisores y coordinadores reciben el reporte en su correo antes de que termine el turno operativo.
* **Coaching Enfocado y Oportuno:** La IA señala de inmediato en qué fase (Talk, Hold o Wrap-up) se están desviando los agentes fuera de meta.

---

# Diapositiva 9: Demostración y Datos de Prueba Reales
## Ejecución Exitosa con Dataset de Producción

* **Dataset de Entrada:** 85 gestiones reales de contact center con 8 agentes evaluados en 4 canales de atención.
* **Límite Configurado:** 20.0 segundos.
* **Resultados Obtenidos:**
  * **TMO Global Promedio:** 19.55 segundos (En meta).
  * **Tasa de Aprobación:** 62.5% (5 asesores aprobados / 3 en revisión).
  * **Agentes Aprobados:** Carlos Mendoza (15.55s), Laura Restrepo (17.36s), Daniela Salazar (17.55s), Camila Torres (18.67s), Andrés Morales (19.82s).
  * **Agentes Requieren Revisión:** Mateo Cárdenas (21.18s), Valentina Gómez (21.75s), Felipe Herrera (23.82s).
* **Diagnóstico de IA Emitido:** Priorizar coaching en tiempos de Wrap-up y retención en línea para el canal de soporte técnico.

---

# Diapositiva 10: Evidencias de Conectividad y Despacho
## Integración Validada al 100% en Entorno Real

* **Autenticación SMTP Google Workspace:** Conexión verificada en puerto 465 SSL/TLS con cuenta corporativa.
* **Correos Despachados y Verificados:**
  1. *Notificación de Enlace SMTP:* Mensaje de prueba recibido con ID de confirmación.
  2. *Reporte Consolidado:* Envío exitoso con el libro `reporte_consolidado_tmo.xlsx` adjunto.
  3. *Alerta de Auditoría IA:* Envío de alertas con tabla comparativa y `reporte_auditoria_validacion_ia.xlsx` adjunto.
* **Persistencia Relacional:** Tablas `app_settings`, `tmo_runs` y `email_logs` sincronizadas en PostgreSQL.

---

# Diapositiva 11: Conclusiones y Futuras Mejoras
## Una Plataforma Lista para Producción Continua

* **Conclusión Principal:** El sistema cumple a cabalidad con la eliminación de fricción operativa, demostrando cómo n8n, Supabase y modelos de lenguaje resuelven un problema clásico de operaciones BPO.
* **Siguientes Pasos y Escalabilidad:**
  * Conexión directa a PBX en la nube (Twilio, Asterisk, Genesys Cloud) mediante webhooks de evento de llamada.
  * Notificaciones instantáneas vía Slack / Microsoft Teams además de correo electrónico.
  * Dashboard histórico con predicción de carga operativa y staffing automatizado.
