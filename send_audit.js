const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

async function sendAuditReport() {
  const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'smtp_config.json'), 'utf8'));
  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass }
  });

  const auditPath = path.join(__dirname, 'reporte_auditoria_validacion_ia.xlsx');
  const info = await transporter.sendMail({
    from: '"Auditoría IA TMO" <' + cfg.user + '>',
    to: 'andrescassiani46@gmail.com',
    subject: '[ALERTA OPERATIVA & AUDITORÍA IA] Reporte de Validación de Reglas TMO (85 gestiones)',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
        <div style="background-color: #065f46; color: white; padding: 18px 24px;">
          <h2 style="margin: 0; font-size: 18px;">Auditoría Operativa de TMO y Asistente IA</h2>
          <p style="margin: 4px 0 0; font-size: 12px; color: #a7f3d0;">Flujo 2: Reglas de Negocio + OpenAI Coaching</p>
        </div>
        <div style="padding: 20px;">
          <p style="font-size: 14px; color: #334155;">Hola Andrés,</p>
          <p style="font-size: 13px; color: #475569;">Se ha auditado el reporte consolidado contra el límite de <strong>20.0 segundos</strong>:</p>
          <ul>
            <li><strong>Aprobados (&le; 20s):</strong> 5 asesores (62.5%)</li>
            <li><strong>Requieren Revisión (&gt; 20s):</strong> 3 asesores (37.5%)</li>
          </ul>
          <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; border-radius: 4px; margin: 15px 0;">
            <strong style="color: #991b1b; font-size: 12px;">Asesores con Desvío:</strong>
            <p style="margin: 4px 0 0; font-size: 12px; color: #b91c1c;">Felipe Herrera (23.82s), Valentina Gómez (21.75s), Mateo Cárdenas (21.18s).</p>
          </div>
          <div style="background-color: #f5f3ff; border-left: 4px solid #8b5cf6; padding: 12px; border-radius: 4px; margin: 15px 0;">
            <strong style="color: #6d28d9; font-size: 12px;">Plan de Coaching Sugerido por la IA:</strong>
            <p style="margin: 4px 0 0; font-size: 12px; color: #5b21b6;">Revisar tiempos de espera (Hold) y tipificación post-llamada en soporte técnico; calibrar tiempos con sesiones de shadowing.</p>
          </div>
          <p style="font-size: 12px; color: #64748b;">Adjunto encontrarás el libro Excel de auditoría con la hoja de validación oficial.</p>
        </div>
      </div>
    `,
    attachments: [
      {
        filename: 'reporte_auditoria_validacion_ia.xlsx',
        path: auditPath
      }
    ]
  });

  console.log('AUDIT_EMAIL_SENT_ID:', info.messageId);
}

sendAuditReport().catch(console.error);
