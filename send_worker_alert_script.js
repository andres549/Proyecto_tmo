/**
 * Script para despachar el reporte y mensaje de alerta al trabajador Andrés Morales
 * Correo de destino: andrxscxx@gmail.com
 */

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

async function sendWorkerAlert() {
    const targetEmail = 'andrxscxx@gmail.com';
    const workerName = 'Andrés Morales';
    
    console.log(`[ALERTA TRABAJADOR] Iniciando despacho de reporte para: ${workerName} -> ${targetEmail}`);

    const smtpConfigPath = path.join(__dirname, 'smtp_config.json');
    if (!fs.existsSync(smtpConfigPath)) {
        throw new Error('No se encontró el archivo de configuración SMTP');
    }

    const smtpConfig = JSON.parse(fs.readFileSync(smtpConfigPath, 'utf8'));
    const transporter = nodemailer.createTransport({
        host: smtpConfig.host,
        port: parseInt(smtpConfig.port || '465'),
        secure: smtpConfig.secure !== false,
        auth: {
            user: smtpConfig.user,
            pass: smtpConfig.pass
        }
    });

    await transporter.verify();
    console.log('[ALERTA TRABAJADOR] Conexión SMTP verificada.');

    const consolidatedPath = path.join(__dirname, 'reporte_consolidado_tmo.xlsx');
    const attachments = [];
    if (fs.existsSync(consolidatedPath)) {
        attachments.push({
            filename: 'reporte_consolidado_tmo.xlsx',
            path: consolidatedPath
        });
    }

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
            .card { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); }
            .header { background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%); color: #ffffff; padding: 28px 24px; text-align: center; }
            .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.02em; }
            .header p { margin: 6px 0 0; font-size: 13px; color: #c7d2fe; }
            .badge-alert { display: inline-block; margin-top: 10px; background: rgba(239, 68, 68, 0.2); color: #fecaca; border: 1px solid rgba(239, 68, 68, 0.4); padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
            .content { padding: 28px 24px; }
            .greeting { font-size: 15px; font-weight: 600; color: #0f172a; margin-bottom: 12px; }
            .intro-text { font-size: 13px; line-height: 1.6; color: #475569; margin-bottom: 20px; }
            .metrics-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 22px; }
            .metric-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #e2e8f0; font-size: 13px; }
            .metric-row:last-child { border-bottom: none; }
            .metric-label { color: #64748b; font-weight: 500; }
            .metric-val { font-weight: 700; font-family: monospace; color: #0f172a; }
            .metric-val.alert { color: #dc2626; font-size: 14px; }
            .coaching-card { background: #fdf2f8; border-left: 4px solid #db2777; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
            .coaching-title { font-size: 13px; font-weight: 700; color: #9d174d; margin-bottom: 8px; display: flex; align-items: center; }
            .coaching-list { margin: 0; padding-left: 18px; font-size: 12px; line-height: 1.6; color: #831843; }
            .footer { background: #f1f5f9; padding: 18px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
        </style>
    </head>
    <body>
        <div class="card">
            <div class="header">
                <h1>Reporte Individual de Desempeño Operativo</h1>
                <p>Centro de Control TMO • Célula F3 de Operaciones BPO</p>
                <div class="badge-alert">Atención Requerida: Desvío sobre Límite Objetivo</div>
            </div>
            <div class="content">
                <div class="greeting">Estimado(a) ${workerName},</div>
                <div class="intro-text">
                    Te compartimos el informe consolidado correspondiente a la última jornada de medición del Tiempo Medio Operativo (TMO). Hemos identificado que tus tiempos de atención superaron el umbral estándar de <strong>20.00 segundos</strong> establecido para la campaña. A continuación detallamos tu métrica registrada para implementar las acciones de coaching correspondientes:
                </div>

                <div class="metrics-box">
                    <div class="metric-row">
                        <span class="metric-label">Tu TMO Promedio Registrado:</span>
                        <span class="metric-val alert">25.45 segundos</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Meta Operativa de la Campaña:</span>
                        <span class="metric-val">20.00 segundos</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Desviación sobre la Meta:</span>
                        <span class="metric-val alert">+27.25% de exceso</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Talk Time (Conversación Activa):</span>
                        <span class="metric-val">17.20 segundos</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Hold Time (Pausas / Esperas):</span>
                        <span class="metric-val">5.10 segundos</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Wrap-up (Cierre y Tipificación CRM):</span>
                        <span class="metric-val">3.15 segundos</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Estado de la Auditoría IA:</span>
                        <span class="metric-val alert">REQUIERE REVISIÓN Y COACHING</span>
                    </div>
                </div>

                <div class="coaching-card">
                    <div class="coaching-title">🎯 Plan de Acción y Recomendaciones del Asistente de IA:</div>
                    <ul class="coaching-list">
                        <li><strong>Escalamiento temprano en casos complejos:</strong> Se detectó que las llamadas del canal <em>Soporte Técnico</em> concentran tu mayor demora. Aplica la regla de transferir a nivel 2 antes de los 15 segundos cuando el diagnóstico requiera validaciones de red.</li>
                        <li><strong>Optimización del Wrap-up:</strong> Utiliza los atajos de teclado y las plantillas predeterminadas en el CRM para cerrar la gestión en menos de 2.0 segundos.</li>
                        <li><strong>Sesión de Shadowing:</strong> Se ha programado una sesión de retroalimentación con Laura Restrepo (mejor TMO del equipo: 12.64s) para compartir buenas prácticas de tipificación en paralelo.</li>
                    </ul>
                </div>

                <div class="intro-text" style="margin-bottom: 0;">
                    Adjunto a este correo encontrarás el libro Excel consolidado con la auditoría completa del turno. Tu supervisor de operaciones se pondrá en contacto contigo para coordinar el plan de acompañamiento.
                </div>
            </div>
            <div class="footer">
                Sistema Automatizado de Notificaciones TMO • n8n & Asistente IA de Operaciones BPO<br>
                Generado para: ${targetEmail} | Remitente: ${smtpConfig.user}
            </div>
        </div>
    </body>
    </html>
    `;

    const mailOptions = {
        from: `"Supervisión Operativa BPO" <${smtpConfig.user}>`,
        to: targetEmail,
        subject: `[ALERTA DE DESEMPEÑO TMO] Reporte Individual de Gestión y Plan de Mejora - ${workerName}`,
        html: htmlContent,
        attachments: attachments
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[ALERTA TRABAJADOR] Correo despachado con éxito. ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId, to: targetEmail };
}

sendWorkerAlert()
    .then(r => console.log('RESULTADO:', JSON.stringify(r)))
    .catch(err => {
        console.error('ERROR AL ENVIAR:', err);
        process.exit(1);
    });
