/**
 * Generador de archivo Excel de prueba con más de 50 registros de gestiones de agentes.
 * Simula datos reales de un centro de contacto/atención.
 */
const ExcelJS = require('exceljs');
const path = require('path');

async function generateSampleExcel() {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema TMO Automatizado';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Gestiones_Diarias', {
        views: [{ showGridLines: true }]
    });

    // Columnas requeridas
    sheet.columns = [
        { header: 'ID_Ticket', key: 'id_ticket', width: 14 },
        { header: 'Fecha_Hora', key: 'fecha_hora', width: 20 },
        { header: 'Agente', key: 'agente', width: 25 },
        { header: 'Canal', key: 'canal', width: 15 },
        { header: 'Tipo_Solicitud', key: 'tipo_solicitud', width: 24 },
        { header: 'Tiempo_Gestion_Segundos', key: 'tiempo_segundos', width: 26 },
        { header: 'Estado_Resolucion', key: 'estado_resolucion', width: 18 }
    ];

    // Estilo encabezado
    sheet.getRow(1).eachCell((cell) => {
        cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1E293B' } // Slate 800
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    sheet.getRow(1).height = 28;

    // Lista de agentes para simular
    const agents = [
        { name: 'Carlos Mendoza', baseTime: 16, variance: 6 },  // TMO ~16s (APROBADO)
        { name: 'Laura Restrepo', baseTime: 14, variance: 5 },  // TMO ~14s (APROBADO)
        { name: 'Andrés Morales', baseTime: 26, variance: 8 },  // TMO ~26s (REQUIERE REVISIÓN)
        { name: 'Valentina Gomez', baseTime: 18, variance: 4 }, // TMO ~18s (APROBADO)
        { name: 'Felipe Herrera', baseTime: 29, variance: 10 }, // TMO ~29s (REQUIERE REVISIÓN)
        { name: 'Daniela Salazar', baseTime: 15, variance: 5 }, // TMO ~15s (APROBADO)
        { name: 'Mateo Cárdenas', baseTime: 23, variance: 7 },  // TMO ~23s (REQUIERE REVISIÓN)
        { name: 'Camila Torres', baseTime: 17, variance: 4 }   // TMO ~17s (APROBADO)
    ];

    const canals = ['Llamada', 'Chat Web', 'WhatsApp', 'Llamada'];
    const requestTypes = ['Soporte Técnico', 'Facturación', 'Cambio de Plan', 'Petición / Reclamo', 'Consulta General'];
    const resolutions = ['Resuelto', 'Escalado', 'Resuelto', 'Resuelto', 'Pendiente Cliente'];

    let ticketIndex = 1001;
    const baseDate = new Date(2026, 9, 14, 8, 0, 0); // Octubre 14, 2026

    // Generar al menos 80 registros (superando el requisito de 50)
    for (let i = 0; i < 85; i++) {
        const agent = agents[i % agents.length];
        
        // Simular tiempo de gestión con variación normal/aleatoria
        let timeSecs = Math.max(5, Math.round(agent.baseTime + (Math.random() * (agent.variance * 2) - agent.variance)));
        
        const timestamp = new Date(baseDate.getTime() + i * 7 * 60000);
        const canal = canals[Math.floor(Math.random() * canals.length)];
        const reqType = requestTypes[Math.floor(Math.random() * requestTypes.length)];
        const res = resolutions[Math.floor(Math.random() * resolutions.length)];

        sheet.addRow({
            id_ticket: `TCK-${ticketIndex++}`,
            fecha_hora: timestamp.toISOString().replace('T', ' ').substring(0, 19),
            agente: agent.name,
            canal: canal,
            tipo_solicitud: reqType,
            tiempo_segundos: timeSecs,
            estado_resolucion: res
        });
    }

    // Aplicar estilos a filas de datos
    for (let r = 2; r <= 86; r++) {
        const row = sheet.getRow(r);
        row.height = 20;
        row.eachCell((cell, colNumber) => {
            cell.font = { name: 'Segoe UI', size: 10 };
            cell.alignment = { vertical: 'middle', horizontal: colNumber === 6 ? 'right' : 'left' };
            cell.border = {
                bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } }
            };
            if (r % 2 === 0) {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFF8FAFC' }
                };
            }
        });
    }

    const outputPath = path.join(__dirname, 'gestiones_call_center_50plus.xlsx');
    await workbook.xlsx.writeFile(outputPath);
    console.log(`Archivo generado con éxito: ${outputPath} con ${85} registros.`);
}

generateSampleExcel().catch(console.error);
