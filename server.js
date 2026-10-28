/**
 * Servidor Web y API Local para el Portal TMO y Pipeline Automatizado
 * Sirve el frontend web en http://localhost:3333 y procesa los webhooks de cálculo y validación.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { processTmoData, generateConsolidatedExcel } = require('./tmo_excel_generator');
const { generateValidationExcel } = require('./generate_validation_excel');
const nodemailer = require('nodemailer');

const PORT = 3333;
const WEB_DIR = path.join(__dirname, 'web');

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;

    // Endpoint para guardar y probar configuración de remitente real (Gmail / Outlook / SMTP)
    if (req.method === 'POST' && pathname === '/api/save-smtp-config') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
            try {
                const config = JSON.parse(body || '{}');
                const transporter = nodemailer.createTransport({
                    host: config.host,
                    port: parseInt(config.port || '587'),
                    secure: config.port === '465' || config.secure === true,
                    auth: { user: config.user, pass: config.pass }
                });
                await transporter.verify();
                fs.writeFileSync(path.join(__dirname, 'smtp_config.json'), JSON.stringify(config, null, 2));
                console.log(`[SERVIDOR TMO] Remitente real configurado con éxito: ${config.user}`);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: `¡Conexión exitosa! Ahora los correos se enviarán directamente desde ${config.user}.` }));
            } catch (err) {
                console.error('[SERVIDOR TMO] Error probando SMTP:', err.message);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Fallo al autenticar con el servidor de correo: ' + err.message }));
            }
        });
        return;
    }

    if (req.method === 'GET' && pathname === '/api/smtp-config') {
        const configFilePath = path.join(__dirname, 'smtp_config.json');
        if (fs.existsSync(configFilePath)) {
            const cfg = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ configured: true, user: cfg.user, host: cfg.host }));
        } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ configured: false }));
        }
        return;
    }

    // Endpoint para enviar reporte y alerta individual a un trabajador (ej. Andrés a andrxscxx@gmail.com)
    if (req.method === 'POST' && pathname === '/api/send-worker-alert') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
            try {
                const data = JSON.parse(body || '{}');
                const targetEmail = data.worker_email || 'andrxscxx@gmail.com';
                const workerName = data.worker_name || 'Andrés Morales';
                const tmoVal = data.tmo || 25.45;
                const talkVal = data.talk || 17.20;
                const holdVal = data.hold || 5.10;
                const wrapVal = data.wrap || 3.15;
                const threshold = data.threshold || 20.0;
                const coachingAdvice = data.coaching_advice || 'Revisar tiempos de tipificación en llamadas de soporte técnico, usar plantillas predeterminadas en el CRM y aplicar regla de escalamiento a segundo nivel antes de los 15s.';

                console.log(`[SERVIDOR TMO] Despachando alerta individual a: ${workerName} (${targetEmail})`);

                const configFilePath = path.join(__dirname, 'smtp_config.json');
                let transporter;
                let senderUser = 'andrescassiani46@gmail.com';

                if (fs.existsSync(configFilePath)) {
                    const cfg = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
                    senderUser = cfg.user;
                    transporter = nodemailer.createTransport({
                        host: cfg.host,
                        port: parseInt(cfg.port || '465'),
                        secure: cfg.port === '465' || cfg.secure === true,
                        auth: { user: cfg.user, pass: cfg.pass }
                    });
                } else {
                    const testAccount = await nodemailer.createTestAccount();
                    transporter = nodemailer.createTransport({
                        host: 'smtp.ethereal.email',
                        port: 587,
                        secure: false,
                        auth: { user: testAccount.user, pass: testAccount.pass }
                    });
                }

                const consolidatedPath = path.join(__dirname, 'reporte_consolidado_tmo.xlsx');
                const attachments = [];
                if (fs.existsSync(consolidatedPath)) {
                    attachments.push({
                        filename: 'reporte_consolidado_tmo.xlsx',
                        path: consolidatedPath
                    });
                }

                const diffPct = Math.round(((tmoVal - threshold) / threshold) * 100);

                const html = `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background: #ffffff;">
                    <div style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%); color: white; padding: 26px 20px; text-align: center;">
                        <h2 style="margin: 0; font-size: 20px;">Reporte Individual de Desempeño Operativo</h2>
                        <p style="margin: 6px 0 0; font-size: 13px; color: #c7d2fe;">Control de Tiempos TMO BPO • Auditoría de Operaciones</p>
                        <div style="display: inline-block; margin-top: 10px; background: rgba(239, 68, 68, 0.25); color: #fecaca; border: 1px solid rgba(239, 68, 68, 0.4); padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: bold;">
                            Notificación de Desempeño: Desvío sobre Meta (+${diffPct}%)
                        </div>
                    </div>
                    <div style="padding: 24px;">
                        <p style="font-size: 14px; color: #0f172a; margin-top: 0; font-weight: bold;">Estimado(a) ${workerName},</p>
                        <p style="font-size: 13px; color: #475569; line-height: 1.6;">
                            Te compartimos tu informe de métricas del período. Se ha identificado que tu Tiempo Medio Operativo (TMO) promedio de <strong>${tmoVal}s</strong> se encuentra por encima del límite establecido de <strong>${threshold}s</strong>.
                        </p>
                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 18px 0;">
                            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                                <tr><td style="padding: 6px 0; color: #64748b;">TMO Promedio Registrado:</td><td style="text-align: right; font-weight: bold; color: #dc2626; font-size: 14px;">${tmoVal} seg</td></tr>
                                <tr><td style="padding: 6px 0; color: #64748b;">Límite Meta de la Campaña:</td><td style="text-align: right; font-weight: bold; color: #0f172a;">${threshold} seg</td></tr>
                                <tr><td style="padding: 6px 0; color: #64748b;">Talk Time (Conversación):</td><td style="text-align: right; font-weight: bold; color: #0f172a;">${talkVal} seg</td></tr>
                                <tr><td style="padding: 6px 0; color: #64748b;">Hold Time (Pausas):</td><td style="text-align: right; font-weight: bold; color: #0f172a;">${holdVal} seg</td></tr>
                                <tr><td style="padding: 6px 0; color: #64748b;">Wrap-up (Cierre CRM):</td><td style="text-align: right; font-weight: bold; color: #0f172a;">${wrapVal} seg</td></tr>
                                <tr><td style="padding: 6px 0; color: #64748b;">Estado de Auditoría:</td><td style="text-align: right; font-weight: bold; color: #dc2626;">REQUIERE REVISIÓN Y COACHING</td></tr>
                            </table>
                        </div>
                        <div style="background: #fdf2f8; border-left: 4px solid #db2777; border-radius: 8px; padding: 14px; margin-bottom: 20px;">
                            <strong style="color: #9d174d; font-size: 13px;">Recomendación y Plan de Mejora IA:</strong>
                            <p style="margin: 6px 0 0; font-size: 12px; color: #831843; line-height: 1.5;">${coachingAdvice}</p>
                        </div>
                        <p style="font-size: 12px; color: #64748b; line-height: 1.5;">
                            Adjunto encontrarás el reporte consolidado en Excel con el detalle del turno. Tu supervisor programará una breve sesión de acompañamiento para apoyarte a alcanzar la meta.
                        </p>
                    </div>
                    <div style="background: #f1f5f9; padding: 14px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
                        Sistema de Alertas y TMO BPO • Enviado a ${targetEmail} desde ${senderUser}
                    </div>
                </div>
                `;

                const mailOptions = {
                    from: `"Supervisión Operativa BPO" <${senderUser}>`,
                    to: targetEmail,
                    subject: `[ALERTA DE DESEMPEÑO TMO] Reporte Individual de Gestión y Plan de Mejora - ${workerName}`,
                    html: html,
                    attachments: attachments
                };

                const info = await transporter.sendMail(mailOptions);
                console.log(`[SERVIDOR TMO] Alerta individual enviada exitosamente a ${targetEmail}`);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    message: `Reporte y alerta de mejora despachados con éxito a ${workerName} (${targetEmail}).`,
                    messageId: info.messageId,
                    emailPreviewUrl: nodemailer.getTestMessageUrl(info)
                }));
            } catch (err) {
                console.error('[SERVIDOR TMO] Error despachando alerta individual:', err.message);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: err.message }));
            }
        });
        return;
    }

    // Endpoint de Webhook para procesar el flujo completo
    if (req.method === 'POST' && (pathname === '/webhook/tmo-upload' || pathname === '/api/process')) {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
            try {
                const payload = JSON.parse(body || '{}');
                console.log(`\n[SERVIDOR TMO] Recibida solicitud de procesamiento para: ${payload.correo_destinatario || 'supervisor'}`);

                const threshold = parseFloat(payload.limite_tmo_segundos) || 20;
                const sampleFile = path.join(__dirname, 'gestiones_call_center_50plus.xlsx');

                // 1. Procesar TMO
                const processed = await processTmoData(sampleFile, threshold);

                // 2. Generar Excel Consolidado con Gráfico de Barras y Donas
                const consolidatedPath = path.join(__dirname, 'reporte_consolidado_tmo.xlsx');
                await generateConsolidatedExcel(processed, consolidatedPath);

                // 3. Simular Validación de Reglas y Asistente IA
                const validationData = {
                    todos_los_resultados: [],
                    aprobados: [],
                    requiere_revision: [],
                    error_datos: []
                };

                (processed.summaries || []).forEach(ag => {
                    if (ag.tmoPromedio <= threshold) {
                        validationData.aprobados.push(ag);
                        validationData.todos_los_resultados.push({ ...ag, clasificacion: 'APROBADO' });
                    } else {
                        validationData.requiere_revision.push(ag);
                        validationData.todos_los_resultados.push({ ...ag, clasificacion: 'REQUIERE REVISIÓN' });
                    }
                });

                const aiInsights = {
                    resumen_diagnostico: `El equipo alcanzó una tasa de aprobación de ${processed.metrics.tasaAprobacionPct}%. De los ${processed.metrics.totalAgentes} asesores evaluados, ${validationData.requiere_revision.length} superaron el umbral de ${threshold}s.`,
                    plan_coaching: 'Revisar tiempos de tipificación en llamadas de soporte técnico y programar sesión de shadowing con los mejores asesores.'
                };

                // 4. Generar Excel de Validación IA
                const validationPath = path.join(__dirname, 'reporte_auditoria_validacion_ia.xlsx');
                await generateValidationExcel(validationData, aiInsights, validationPath);

                // 5. Envío de Correo Electrónico con el Excel Adjunto
                let emailPreviewUrl = null;
                let emailStatus = 'ENVIADO';

                try {
                    let transporter;
                    const configFilePath = path.join(__dirname, 'smtp_config.json');

                    if (fs.existsSync(configFilePath)) {
                        const smtpCfg = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
                        transporter = nodemailer.createTransport({
                            host: smtpCfg.host,
                            port: parseInt(smtpCfg.port || '587'),
                            secure: smtpCfg.port === '465' || smtpCfg.secure === true,
                            auth: { user: smtpCfg.user, pass: smtpCfg.pass }
                        });
                        console.log(`[SERVIDOR TMO] Utilizando credenciales reales SMTP de: ${smtpCfg.user}`);
                    } else if (process.env.SMTP_HOST && process.env.SMTP_USER) {
                        transporter = nodemailer.createTransport({
                            host: process.env.SMTP_HOST,
                            port: parseInt(process.env.SMTP_PORT || '587'),
                            secure: process.env.SMTP_SECURE === 'true',
                            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
                        });
                    } else {
                        // Crear buzón de prueba dinámico Ethereal para visualización inmediata
                        const testAccount = await nodemailer.createTestAccount();
                        transporter = nodemailer.createTransport({
                            host: 'smtp.ethereal.email',
                            port: 587,
                            secure: false,
                            auth: { user: testAccount.user, pass: testAccount.pass }
                        });
                    }

                    let senderEmail = 'notificaciones.bpo@empresa.com';
                    if (fs.existsSync(configFilePath)) {
                        try {
                            const scfg = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
                            if (scfg.user) senderEmail = scfg.user;
                        } catch (e) {}
                    }

                    const mailOptions = {
                        from: `"Sistema TMO Automatizado" <${senderEmail}>`,
                        to: payload.correo_destinatario || senderEmail,
                        subject: `[REPORTE TMO CONSOLIDADO] Resultados del Equipo - TMO ${processed.metrics.tmoGlobalPromedio}s`,
                        html: `
                            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                                <div style="background-color: #0f172a; color: white; padding: 20px; text-align: center;">
                                    <h2 style="margin: 0; font-size: 20px;">Reporte Oficial de TMO Consolidado</h2>
                                    <p style="margin: 4px 0 0; font-size: 13px; color: #94a3b8;">Control de Tiempos de Operación BPO • n8n & Supabase</p>
                                </div>
                                <div style="padding: 24px; background-color: #ffffff;">
                                    <p style="font-size: 14px; color: #334155; margin-top: 0;">Estimado supervisor,</p>
                                    <p style="font-size: 13px; color: #475569; line-height: 1.5;">
                                        Se ha completado el procesamiento de <strong>${processed.metrics.totalFilasValidas} gestiones</strong> para <strong>${processed.metrics.totalAgentes} agentes</strong>. Adjunto encontrará el libro Excel oficial de 4 hojas con el resumen consolidado, datos originales, dashboard con gráficos de barras y donas, y la hoja de validación.
                                    </p>
                                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
                                        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                                            <tr><td style="padding: 4px 0; color: #64748b;">TMO Global Promedio:</td><td style="text-align: right; font-weight: bold; color: #0f172a;">${processed.metrics.tmoGlobalPromedio} seg</td></tr>
                                            <tr><td style="padding: 4px 0; color: #64748b;">Límite Objetivo:</td><td style="text-align: right; font-weight: bold; color: #0f172a;">${threshold} seg</td></tr>
                                            <tr><td style="padding: 4px 0; color: #64748b;">Tasa de Aprobación:</td><td style="text-align: right; font-weight: bold; color: #16a34a;">${processed.metrics.tasaAprobacionPct}%</td></tr>
                                            <tr><td style="padding: 4px 0; color: #64748b;">Agentes Aprobados:</td><td style="text-align: right; font-weight: bold; color: #16a34a;">${processed.metrics.aprobadosCount}</td></tr>
                                            <tr><td style="padding: 4px 0; color: #64748b;">Requieren Revisión:</td><td style="text-align: right; font-weight: bold; color: #dc2626;">${processed.metrics.revisionCount}</td></tr>
                                        </table>
                                    </div>
                                    <div style="background-color: #faf5ff; border-left: 4px solid #9333ea; padding: 12px; border-radius: 4px; margin-bottom: 20px;">
                                        <strong style="color: #6b21a8; font-size: 12px;">Diagnóstico del Asistente de IA:</strong>
                                        <p style="margin: 4px 0 0; font-size: 12px; color: #581c87;">${aiInsights.resumen_diagnostico}</p>
                                    </div>
                                    <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-bottom: 0;">
                                        Este correo disparará el flujo paralelo de validación independiente por IMAP en n8n.
                                    </p>
                                </div>
                            </div>
                        `,
                        attachments: [
                            {
                                filename: 'reporte_consolidado_tmo.xlsx',
                                path: consolidatedPath
                            }
                        ]
                    };

                    const info = await transporter.sendMail(mailOptions);
                    emailPreviewUrl = nodemailer.getTestMessageUrl(info);
                    console.log(`[SERVIDOR TMO] Correo enviado exitosamente a: ${payload.correo_destinatario}`);
                    if (emailPreviewUrl) {
                        console.log(`[SERVIDOR TMO] Enlace de visualización web del correo: ${emailPreviewUrl}`);
                    }
                } catch (mailErr) {
                    console.error('[SERVIDOR TMO] Error al enviar correo:', mailErr.message);
                    emailStatus = 'FALLIDO: ' + mailErr.message;
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    mensaje: 'Pipeline TMO ejecutado exitosamente por n8n & Asistente IA',
                    correo_notificado: payload.correo_destinatario,
                    estado_envio_correo: emailStatus,
                    url_vista_correo: emailPreviewUrl,
                    umbral_segundos: threshold,
                    metricas: processed.metrics,
                    archivos_generados: [
                        { nombre: 'reporte_consolidado_tmo.xlsx', ruta_descarga: '/download/consolidado' },
                        { nombre: 'reporte_auditoria_validacion_ia.xlsx', ruta_descarga: '/download/auditoria' }
                    ],
                    resumen_ia: aiInsights
                }));
            } catch (err) {
                console.error('[SERVIDOR TMO] Error en webhook:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: err.message }));
            }
        });
        return;
    }

    // Endpoints de Descarga de Archivos Excel
    if (pathname === '/download/consolidado') {
        const filePath = path.join(__dirname, 'reporte_consolidado_tmo.xlsx');
        if (fs.existsSync(filePath)) {
            res.writeHead(200, {
                'Content-Type': MIME_TYPES['.xlsx'],
                'Content-Disposition': 'attachment; filename="reporte_consolidado_tmo.xlsx"'
            });
            fs.createReadStream(filePath).pipe(res);
            return;
        }
    }

    if (pathname === '/download/auditoria') {
        const filePath = path.join(__dirname, 'reporte_auditoria_validacion_ia.xlsx');
        if (fs.existsSync(filePath)) {
            res.writeHead(200, {
                'Content-Type': MIME_TYPES['.xlsx'],
                'Content-Disposition': 'attachment; filename="reporte_auditoria_validacion_ia.xlsx"'
            });
            fs.createReadStream(filePath).pipe(res);
            return;
        }
    }

    if (pathname === '/download/muestra') {
        const filePath = path.join(__dirname, 'gestiones_call_center_50plus.xlsx');
        if (fs.existsSync(filePath)) {
            res.writeHead(200, {
                'Content-Type': MIME_TYPES['.xlsx'],
                'Content-Disposition': 'attachment; filename="gestiones_call_center_50plus.xlsx"'
            });
            fs.createReadStream(filePath).pipe(res);
            return;
        }
    }

    // Servir archivos estáticos del directorio web/
    let reqFile = pathname === '/' ? 'index.html' : pathname;
    let safePath = path.join(WEB_DIR, reqFile);

    if (fs.existsSync(safePath) && fs.statSync(safePath).isFile()) {
        const ext = path.extname(safePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        fs.createReadStream(safePath).pipe(res);
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found');
    }
});

server.listen(PORT, () => {
    console.log(`================================================================`);
    console.log(`  PORTAL WEB Y SERVICIO TMO EN EJECUCIÓN ACTIVA                 `);
    console.log(`  URL: http://localhost:${PORT}                                 `);
    console.log(`================================================================`);
});
