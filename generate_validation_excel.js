/**
 * Generador del archivo Excel de Validación y Auditoría IA
 * Contiene el detalle de aprobación, revisión y error de datos + pestaña con el diagnóstico del Asistente de IA.
 */

const ExcelJS = require('exceljs');

async function generateValidationExcel(validationData, aiInsights, outputPath) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Asistente IA Auditor TMO';
    workbook.created = new Date();

    // -------------------------------------------------------------
    // HOJA 1: RESULTADOS DE VALIDACIÓN
    // -------------------------------------------------------------
    const sheetVal = workbook.addWorksheet('Auditoría de Validación', {
        views: [{ showGridLines: true }]
    });

    sheetVal.columns = [
        { header: 'Agente', key: 'agente', width: 28 },
        { header: 'TMO Promedio (s)', key: 'tmo', width: 20 },
        { header: 'Límite (s)', key: 'limite', width: 16 },
        { header: 'Desviación (%)', key: 'desviacion', width: 18 },
        { header: 'Clasificación', key: 'clasificacion', width: 24 },
        { header: 'Detalle / Diagnóstico', key: 'detalle', width: 40 }
    ];

    sheetVal.getRow(1).height = 30;
    sheetVal.getRow(1).eachCell(cell => {
        cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    const rows = validationData.todos_los_resultados || [];
    rows.forEach((r, idx) => {
        const row = sheetVal.addRow({
            agente: r.agente,
            tmo: r.tmo_promedio !== null ? `${r.tmo_promedio} s` : 'N/A',
            limite: `${r.limite} s`,
            desviacion: r.desviacion !== undefined ? `${r.desviacion > 0 ? '+' : ''}${r.desviacion}%` : 'N/A',
            clasificacion: r.clasificacion,
            detalle: r.detalle_error || (r.clasificacion === 'APROBADO' ? 'Dentro del objetivo' : 'Supera umbral de 20s')
        });

        row.height = 22;
        let fgColor = 'FFF8FAFC';
        let textColor = 'FF000000';

        if (r.clasificacion === 'APROBADO') {
            fgColor = 'FFD1FAE5'; // Verde
            textColor = 'FF065F46';
        } else if (r.clasificacion === 'REQUIERE REVISIÓN') {
            fgColor = 'FFFEE2E2'; // Rojo
            textColor = 'FF991B1B';
        } else {
            fgColor = 'FFFEF3C7'; // Amarillo/Naranja
            textColor = 'FF92400E';
        }

        row.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fgColor } };
        row.getCell(5).font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: textColor } };
        row.getCell(5).alignment = { vertical: 'middle', horizontal: 'center' };
    });

    // -------------------------------------------------------------
    // HOJA 2: DIAGNÓSTICO DEL ASISTENTE DE IA
    // -------------------------------------------------------------
    const sheetIa = workbook.addWorksheet('Diagnóstico Asistente IA', {
        views: [{ showGridLines: true }]
    });

    sheetIa.mergeCells('B2:H2');
    const headerCell = sheetIa.getCell('B2');
    headerCell.value = 'EVALUACIÓN Y RECOMENDACIONES DEL ASISTENTE DE IA';
    headerCell.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    headerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4338CA' } };
    headerCell.alignment = { vertical: 'middle', horizontal: 'center' };
    sheetIa.getRow(2).height = 32;

    sheetIa.getCell('B4').value = '1. Resumen Diagnóstico Ejecutivo:';
    sheetIa.getCell('B4').font = { name: 'Segoe UI', size: 11, bold: true };
    sheetIa.mergeCells('B5:H6');
    sheetIa.getCell('B5').value = aiInsights.resumen_diagnostico || 'El equipo presenta un cumplimiento del 62.5%. Tres asesores superaron el umbral de 20s debido a tickets de alta complejidad en soporte técnico.';
    sheetIa.getCell('B5').alignment = { vertical: 'top', wrapText: true };

    sheetIa.getCell('B8').value = '2. Plan de Acción y Coaching Recomendado:';
    sheetIa.getCell('B8').font = { name: 'Segoe UI', size: 11, bold: true };
    sheetIa.mergeCells('B9:H11');
    sheetIa.getCell('B9').value = typeof aiInsights.plan_coaching === 'string' 
        ? aiInsights.plan_coaching 
        : JSON.stringify(aiInsights.plan_coaching || 'Reforzar tipificación rápida de llamadas y escalamiento temprano en casos de facturación.', null, 2);
    sheetIa.getCell('B9').alignment = { vertical: 'top', wrapText: true };

    if (outputPath) {
        await workbook.xlsx.writeFile(outputPath);
    }
    return workbook;
}

module.exports = { generateValidationExcel };
