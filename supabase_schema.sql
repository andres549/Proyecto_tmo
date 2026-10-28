-- ==============================================================================
-- SISTEMA INTELIGENTE DE CÁLCULO Y VALIDACIÓN DEL TMO
-- MOTOR DE BASE DE DATOS: SUPABASE (POSTGRESQL)
-- ESTRUCTURA OFICIAL DE TABLAS, AUDITORÍA Y TRAZABILIDAD
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLA: app_settings (Configuración dinámica global del sistema)
-- Almacena umbrales, destinatarios y preferencias de envío
CREATE TABLE IF NOT EXISTS public.app_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clave VARCHAR(100) UNIQUE NOT NULL,
    valor_numerico NUMERIC(10, 2),
    valor_texto TEXT,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inserción de configuración base
INSERT INTO public.app_settings (clave, valor_numerico, valor_texto, descripcion)
VALUES 
    ('tmo_limite_segundos', 20.00, NULL, 'Límite máximo de TMO en segundos para clasificar APROBADO o REQUIERE REVISIÓN'),
    ('correo_destinatario_defecto', NULL, 'andrescassiani46@gmail.com', 'Correo de notificación consolidado por defecto'),
    ('correo_alertas_revision', NULL, 'andrescassiani46@gmail.com', 'Correo donde se envían alertas de agentes fuera de meta'),
    ('modo_envio', NULL, 'AUTOMATICO', 'Modo de despacho: AUTOMATICO (al terminar cálculo) o REVISION_MANUAL'),
    ('minimo_filas_esperadas', 50.00, NULL, 'Cantidad mínima de registros válidos por archivo Excel')
ON CONFLICT (clave) DO UPDATE 
SET valor_numerico = EXCLUDED.valor_numerico,
    valor_texto = EXCLUDED.valor_texto,
    actualizado_en = CURRENT_TIMESTAMP;


-- 2. TABLA: agents (Directorio y metadatos de los asesores/operadores)
CREATE TABLE IF NOT EXISTS public.agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_agente VARCHAR(50) UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    email VARCHAR(150),
    celula VARCHAR(50) DEFAULT 'Célula General',
    rol VARCHAR(50) DEFAULT 'Agente BPO',
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_agents_nombre ON public.agents(nombre);


-- 3. TABLA: tmo_runs (Ejecuciones del flujo n8n y control de duplicados SHA-256)
CREATE TABLE IF NOT EXISTS public.tmo_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hash_sha256 VARCHAR(64) UNIQUE NOT NULL, -- Evita procesar repetidamente el mismo archivo
    nombre_archivo VARCHAR(255) NOT NULL,
    origen VARCHAR(50) DEFAULT 'WEB_PAGE', -- 'WEB_PAGE', 'EMAIL_TRIGGER', 'WEBHOOK'
    total_filas_leidas INTEGER DEFAULT 0,
    total_filas_validas INTEGER DEFAULT 0,
    total_filas_invalidas INTEGER DEFAULT 0,
    total_agentes_evaluados INTEGER DEFAULT 0,
    tmo_global_promedio NUMERIC(10, 2) DEFAULT 0.00,
    limite_aplicado NUMERIC(10, 2) DEFAULT 20.00,
    agentes_aprobados INTEGER DEFAULT 0,
    agentes_requiere_revision INTEGER DEFAULT 0,
    agentes_error_datos INTEGER DEFAULT 0,
    estado VARCHAR(50) DEFAULT 'EN_PROCESO', -- 'EN_PROCESO', 'EXITOSO', 'ERROR', 'DUPLICADO'
    destinatario_correo VARCHAR(255),
    estado_envio_correo VARCHAR(50) DEFAULT 'PENDIENTE', -- 'ENVIADO', 'PENDIENTE', 'FALLIDO'
    ruta_almacenamiento_excel TEXT, -- Ubicación en Supabase Storage o local
    resumen_ejecutivo_ia TEXT, -- Síntesis del Asistente de IA
    fecha_inicio TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_fin TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_tmo_runs_hash ON public.tmo_runs(hash_sha256);
CREATE INDEX IF NOT EXISTS idx_tmo_runs_fecha ON public.tmo_runs(fecha_inicio DESC);


-- 4. TABLA: tmo_records (Gestiones originales recibidas y estado de cada fila)
CREATE TABLE IF NOT EXISTS public.tmo_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id UUID REFERENCES public.tmo_runs(id) ON DELETE CASCADE,
    ticket_id VARCHAR(100),
    agente_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
    nombre_agente_raw VARCHAR(150) NOT NULL,
    canal VARCHAR(50) DEFAULT 'Llamada Telefónica',
    tiempo_gestion_segundos NUMERIC(10, 2) NOT NULL,
    es_valido BOOLEAN DEFAULT TRUE,
    motivo_invalido TEXT,
    fecha_gestion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_records_run ON public.tmo_records(run_id);
CREATE INDEX IF NOT EXISTS idx_records_agente ON public.tmo_records(nombre_agente_raw);


-- 5. TABLA: tmo_summaries (Suma, cantidad de gestiones y promedio por agente)
CREATE TABLE IF NOT EXISTS public.tmo_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id UUID REFERENCES public.tmo_runs(id) ON DELETE CASCADE,
    agente_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
    nombre_agente VARCHAR(150) NOT NULL,
    gestiones_validas INTEGER NOT NULL DEFAULT 0,
    suma_tiempos_segundos NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    tmo_promedio_segundos NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    porcentaje_frente_al_limite NUMERIC(6, 2) NOT NULL DEFAULT 0.00, -- (TMO / Límite) * 100
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_summaries_run ON public.tmo_summaries(run_id);


-- 6. TABLA: tmo_validations (Límite aplicado, clasificación y observaciones)
CREATE TABLE IF NOT EXISTS public.tmo_validations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id UUID REFERENCES public.tmo_runs(id) ON DELETE CASCADE,
    summary_id UUID REFERENCES public.tmo_summaries(id) ON DELETE CASCADE,
    nombre_agente VARCHAR(150) NOT NULL,
    tmo_calculado NUMERIC(10, 2),
    limite_aplicado NUMERIC(10, 2) NOT NULL,
    clasificacion VARCHAR(50) NOT NULL, -- 'APROBADO', 'REQUIERE REVISION', 'ERROR DE DATOS'
    desviacion_porcentaje NUMERIC(6, 2),
    observaciones_operativas TEXT,
    plan_coaching_ia TEXT, -- Diagnóstico específico del Asistente IA
    validado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_validations_run ON public.tmo_validations(run_id);
CREATE INDEX IF NOT EXISTS idx_validations_clasif ON public.tmo_validations(clasificacion);


-- 7. TABLA: email_logs (Destinatario, fecha, estado del envío y errores)
CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id UUID REFERENCES public.tmo_runs(id) ON DELETE SET NULL,
    tipo_notificacion VARCHAR(100) NOT NULL, -- 'REPORTE_CONSOLIDADO', 'ALERTA_REVISION', 'ERROR_DATOS'
    destinatario VARCHAR(255) NOT NULL,
    asunto TEXT NOT NULL,
    estado_envio VARCHAR(50) DEFAULT 'ENVIADO', -- 'ENVIADO', 'FALLIDO'
    mensaje_error TEXT,
    enviado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_logs_run ON public.email_logs(run_id);


-- ==============================================================================
-- 8. VISTAS SQL PARA DASHBOARD Y CONSULTAS RÁPIDAS
-- ==============================================================================

-- Vista del último reporte consolidado
CREATE OR REPLACE VIEW public.v_ultimo_resumen_tmo AS
SELECT 
    s.id,
    s.run_id,
    r.fecha_inicio AS fecha_ejecucion,
    s.nombre_agente,
    s.gestiones_validas,
    s.suma_tiempos_segundos,
    s.tmo_promedio_segundos,
    s.porcentaje_frente_al_limite,
    v.clasificacion,
    v.observaciones_operativas,
    v.plan_coaching_ia
FROM public.tmo_summaries s
JOIN public.tmo_runs r ON s.run_id = r.id
LEFT JOIN public.tmo_validations v ON s.id = v.summary_id
WHERE r.id = (SELECT id FROM public.tmo_runs WHERE estado = 'EXITOSO' ORDER BY fecha_inicio DESC LIMIT 1)
ORDER BY s.tmo_promedio_segundos DESC;


-- ==============================================================================
-- 9. POLÍTICAS ROW LEVEL SECURITY (RLS) - SUPABASE
-- ==============================================================================
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tmo_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tmo_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tmo_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tmo_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso completo para n8n y plataforma
CREATE POLICY "Acceso n8n app_settings" ON public.app_settings FOR ALL USING (true);
CREATE POLICY "Acceso n8n agents" ON public.agents FOR ALL USING (true);
CREATE POLICY "Acceso n8n tmo_runs" ON public.tmo_runs FOR ALL USING (true);
CREATE POLICY "Acceso n8n tmo_records" ON public.tmo_records FOR ALL USING (true);
CREATE POLICY "Acceso n8n tmo_summaries" ON public.tmo_summaries FOR ALL USING (true);
CREATE POLICY "Acceso n8n tmo_validations" ON public.tmo_validations FOR ALL USING (true);
CREATE POLICY "Acceso n8n email_logs" ON public.email_logs FOR ALL USING (true);
