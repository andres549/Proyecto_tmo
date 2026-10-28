const nodemailer = require('nodemailer');

async function testGmail() {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: 'andrescassiani46@gmail.com',
      pass: 'qqmplvvdciorcdfe'
    }
  });

  try {
    console.log('Verificando conexión SMTP con Gmail...');
    await transporter.verify();
    console.log('¡CONEXION EXITOSA!');

    console.log('Enviando correo de prueba a andrescassiani46@gmail.com...');
    const info = await transporter.sendMail({
      from: '"Sistema TMO Automatizado" <andrescassiani46@gmail.com>',
      to: 'andrescassiani46@gmail.com',
      subject: '✅ Conexión Exitosa: Sistema TMO y Automatización n8n Conectados',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #10b981; border-radius: 8px;">
          <h2 style="color: #059669; margin-top: 0;">¡Conexión de Correo Exitosa!</h2>
          <p>Hola Andrés,</p>
          <p>Tu cuenta <strong>andrescassiani46@gmail.com</strong> ha sido vinculada correctamente al motor de automatización de <strong>TMO BPO</strong>.</p>
          <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 12px; margin: 15px 0;">
            <p style="margin: 0; color: #065f46; font-size: 14px;"><strong>Estado:</strong> Activo y listo para despachar reportes consolidados en Excel y alertas de validación.</p>
          </div>
          <p style="font-size: 13px; color: #6b7280;">Este mensaje confirma que tus credenciales SMTP son válidas y operativas al 100%.</p>
        </div>
      `
    });
    console.log('CORREO ENVIADO CON ÉXITO! ID:', info.messageId);
  } catch (err) {
    console.error('ERROR EN CONEXIÓN O ENVÍO:', err);
  }
}

testGmail();
