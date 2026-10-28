/**
 * Generador y procesador de cálculo de TMO con reporte Excel de 4 hojas estructuradas:
 *  1. 'Resumen TMO': agente, total de gestiones válidas, suma de tiempos, TMO promedio y porcentaje frente al límite.
 *  2. 'Datos originales': registros recibidos y estado de validación de cada fila.
 *  3. 'Dashboard': gráficas de barras (verde/rojo con línea de 20s) y dona, indicadores generales y distribución porcentual.
 *  4. 'Validación': límite aplicado, clasificación, observaciones y fecha de procesamiento.
 */

const ExcelJS = require('exceljs');
const ChartJsImage = require('chartjs-to-image');
const path = require('path');
const fs = require('fs');

/**
 * Procesa datos del Excel crudo, valida fila por fila y calcula sumas y promedios por agente.
 */
async function processTmoData(inputExcelPathOrBuffer, tmoThresholdSecs = 20) {
    const workbook = new ExcelJS.Workbook();
    if (typeof inputExcelPathOrBuffer === 'string') {
        await workbook.xlsx.readFile(inputExcelPathOrBuffer);
    } else {
        await workbook.xlsx.load(inputExcelPathOrBuffer);
    }

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
        throw new Error('El archivo Excel no contiene ninguna hoja de datos válida.');
    }

    // Identificar columnas en la fila 1
    let colTicketIdx = -1;
    let colFechaIdx = -1;
    let colAgenteIdx = -1;
    let colCanalIdx = -1;
    let colTiempoIdx = -1;

    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell, colNumber) => {
        const val = String(cell.value || '').trim().toLowerCase();
        if (val.includes('ticket') || val.includes('id')) colTicketIdx = colNumber;
        if (val.includes('fecha') || val.includes('hora')) colFechaIdx = colNumber;
        if (val.includes('agente') || val.includes('nombre') || val.includes('asesor') || val.includes('operador')) colAgenteIdx = colNumber;
        if (val.includes('canal') || val.includes('medio')) colCanalIdx = colNumber;
        if (val.includes('tiempo') || val.includes('duracion') || val.includes('segundo') || val.includes('tmo')) colTiempoIdx = colNumber;
    });

    if (colTicketIdx === -1) colTicketIdx = 1;
    if (colFechaIdx === -1) colFechaIdx = 2;
    if (colAgenteIdx === -1) colAgenteIdx = 3;
    if (colCanalIdx === -1) colCanalIdx = 4;
    if (colTiempoIdx === -1) colTiempoIdx = 6;

    const rawRecords = [];
    const agentMap = new Map();
    let totalFilasLeidas = 0;
    let totalFilasValidas = 0;
    let totalFilasInvalidas = 0;

    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Saltear encabezado
        totalFilasLeidas++;

        const ticketRaw = row.getCell(colTicketIdx).value;
        const fechaRaw = row.getCell(colFechaIdx).value;
        const agenteRaw = row.getCell(colAgenteIdx).value;
        const canalRaw = row.getCell(colCanalIdx).value;
        const tiempoRaw = row.getCell(colTiempoIdx).value;

        const ticket = ticketRaw ? String(ticketRaw).trim() : `TCK-${1000 + rowNumber}`;
        const fecha = fechaRaw ? String(fechaRaw).trim() : new Date().toISOString().substring(0, 19).replace('T', ' ');
        const agente = agenteRaw ? String(agenteRaw).trim() : '';
        const canal = canalRaw ? String(canalRaw).trim() : 'Llamada Telefónica';

        let tiempoSecs = NaN;
        if (typeof tiempoRaw === 'number') {
            tiempoSecs = tiempoRaw;
        } else if (typeof tiempoRaw === 'string') {
            tiempoSecs = parseFloat(tiempoRaw.replace(',', '.'));
        }

        let esValido = true;
        let motivoInvalido = '';

        if (!agente) {
            esValido = false;
            motivoInvalido = 'Nombre de agente vacío';
        } else if (isNaN(tiempoSecs)) {
            esValido = false;
            motivoInvalido = 'Tiempo no numérico';
        } else if (tiempoSecs < 0) {
            esValido = false;
            motivoInvalido = 'Tiempo de gestión negativo';
        }

        if (esValido) {
            totalFilasValidas++;
            if (!agentMap.has(agente)) {
                agentMap.set(agente, {
                    nombre: agente,
                    gestionesValidas: 0,
                    sumaTiempos: 0
                });
            }
            const ag = agentMap.get(agente);
            ag.gestionesValidas += 1;
            ag.sumaTiempos += tiempoSecs;
        } else {
            totalFilasInvalidas++;
        }

        rawRecords.push({
            ticket,
            fecha,
            agente: agente || 'DESCONOCIDO',
            canal,
            tiempo: isNaN(tiempoSecs) ? 0 : tiempoSecs,
            esValido,
            estadoValidacion: esValido ? 'VÁLIDO' : `INVÁLIDO: ${motivoInvalido}`
        });
    });

    // Calcular resúmenes y porcentaje frente al límite
    // Fórmula oficial: Porcentaje del límite = (TMO promedio / Límite) * 100
    const summaries = [];
    let aprobadosCount = 0;
    let revisionCount = 0;
    let sumaTmoTotal = 0;

    for (const [nombre, d] of agentMap.entries()) {
        const tmoPromedio = Math.round((d.sumaTiempos / d.gestionesValidas) * 100) / 100;
        const porcentajeLimite = Math.round((tmoPromedio / tmoThresholdSecs) * 10000) / 100;
        const clasificacion = tmoPromedio <= tmoThresholdSecs ? 'APROBADO' : 'REQUIERE REVISIÓN';

        if (clasificacion === 'APROBADO') {
            aprobadosCount++;
        } else {
            revisionCount++;
        }
        sumaTmoTotal += tmoPromedio;

        summaries.push({
            agente: nombre,
            gestionesValidas: d.gestionesValidas,
            sumaTiempos: Math.round(d.sumaTiempos * 100) / 100,
            tmoPromedio: tmoPromedio,
            limite: tmoThresholdSecs,
            porcentajeLimite: porcentajeLimite,
            clasificacion: clasificacion,
            observaciones: clasificacion === 'APROBADO' 
                ? `Utiliza el ${porcentajeLimite}% del límite permitido (Cumple objetivo)` 
                : `Excede el límite en ${Math.round((porcentajeLimite - 100) * 100) / 100}% (Requiere intervención)`
        });
    }

    // Ordenar de mayor a menor TMO para visibilidad ejecutiva
    summaries.sort((a, b) => b.tmoPromedio - a.tmoPromedio);

    const totalAgentes = summaries.length;
    const tmoGlobalPromedio = totalAgentes > 0 ? Math.round((sumaTmoTotal / totalAgentes) * 100) / 100 : 0;
    const tasaAprobacionPct = totalAgentes > 0 ? Math.round((aprobadosCount / totalAgentes) * 10000) / 100 : 0;
    const tasaRevisionPct = Math.round((100 - tasaAprobacionPct) * 100) / 100;

    return {
        summaries,
        rawRecords,
        metrics: {
            totalFilasLeidas,
            totalFilasValidas,
            totalFilasInvalidas,
            totalAgentes,
            aprobadosCount,
            revisionCount,
            tmoGlobalPromedio,
            tasaAprobacionPct,
            tasaRevisionPct,
            umbralAplicado: tmoThresholdSecs
        }
    };
}

/**
 * Renderiza los gráficos con ChartJsImage incluyendo línea horizontal de umbral y colores.
 */
async function generateCharts(summaries, metrics) {
    const barLabels = summaries.map(s => s.agente);
    const barValues = summaries.map(s => s.tmoPromedio);
    // Verde (#10B981) para cumple, Rojo (#EF4444) para supera límite
    const barColors = summaries.map(s => s.tmoPromedio <= metrics.umbralAplicado ? 'rgba(16, 185, 129, 0.85)' : 'rgba(239, 68, 68, 0.85)');
    const barBorders = summaries.map(s => s.tmoPromedio <= metrics.umbralAplicado ? '#059669' : '#DC2626');

    // 1. Gráfica de Barras con línea de umbral
    const barChart = new ChartJsImage();
    barChart.setWidth(720);
    barChart.setHeight(380);
    barChart.setBackgroundColor('#ffffff');
    barChart.setConfig({
        type: 'bar',
        data: {
            labels: barLabels,
            datasets: [
                {
                    type: 'bar',
                    label: 'TMO Promedio por Agente (s)',
                    data: barValues,
                    backgroundColor: barColors,
                    borderColor: barBorders,
                    borderWidth: 1.5,
                    borderRadius: 4
                },
                {
                    type: 'line',
                    label: `Límite Objetivo (${metrics.umbralAplicado}s)`,
                    data: Array(barLabels.length).fill(metrics.umbralAplicado),
                    borderColor: '#1E293B',
                    borderWidth: 2,
                    borderDash: [6, 4],
                    pointRadius: 0,
                    fill: false
                }
            ]
        },
        options: {
            responsive: false,
            plugins: {
                title: {
                    display: true,
                    text: `TMO por Agente vs Límite (${metrics.umbralAplicado}s)`,
                    font: { size: 15, weight: 'bold', family: 'Segoe UI' },
                    color: '#0F172A'
                },
                legend: { position: 'top', labels: { font: { family: 'Segoe UI', size: 11 } } }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Segundos', font: { family: 'Segoe UI', weight: 'bold' } },
                    grid: { color: '#E2E8F0' }
                },
                x: {
                    ticks: { maxRotation: 30, minRotation: 15, font: { family: 'Segoe UI', size: 10 } },
                    grid: { display: false }
                }
            }
        }
    });

    // 2. Gráfica de Donas para Distribución Aprobados vs Revisión
    const donutChart = new ChartJsImage();
    donutChart.setWidth(520);
    donutChart.setHeight(380);
    donutChart.setBackgroundColor('#ffffff');
    donutChart.setConfig({
        type: 'doughnut',
        data: {
            labels: [
                `Aprobados (${metrics.tasaAprobacionPct}%): ${metrics.aprobadosCount}`,
                `Requieren Revisión (${metrics.tasaRevisionPct}%): ${metrics.revisionCount}`
            ],
            datasets: [{
                data: [metrics.aprobadosCount, metrics.revisionCount],
                backgroundColor: ['#10B981', '#EF4444'],
                hoverBackgroundColor: ['#059669', '#DC2626'],
                borderColor: '#FFFFFF',
                borderWidth: 2
            }]
        },
        options: {
            responsive: false,
            cutout: '58%',
            plugins: {
                title: {
                    display: true,
                    text: 'Distribución Porcentual de Resultados',
                    font: { size: 15, weight: 'bold', family: 'Segoe UI' },
                    color: '#0F172A'
                },
                legend: { position: 'bottom', labels: { font: { family: 'Segoe UI', size: 11 }, padding: 14 } }
            }
        }
    });

    const [barBuffer, donutBuffer] = await Promise.all([
        barChart.toBinary(),
        donutChart.toBinary()
    ]);

    return { barBuffer, donutBuffer };
}

/**
 * Genera el archivo Excel de 4 hojas oficial.
 */
async function generateConsolidatedExcel(processedData, outputPath) {
    const { summaries, rawRecords, metrics } = processedData;
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema Automatizado TMO';
    workbook.created = new Date();

    // --------------------------------------------------------------------------
    // HOJA 1: Resumen TMO
    // --------------------------------------------------------------------------
    const sheetResumen = workbook.addWorksheet('Resumen TMO', { views: [{ showGridLines: true }] });
    sheetResumen.columns = [
        { header: 'Agente', key: 'agente', width: 28 },
        { header: 'Total de Gestiones Válidas', key: 'gestionesValidas', width: 26 },
        { header: 'Suma de Tiempos (s)', key: 'sumaTiempos', width: 22 },
        { header: 'TMO Promedio (s)', key: 'tmoPromedio', width: 22 },
        { header: 'Límite (s)', key: 'limite', width: 14 },
        { header: 'Porcentaje del Límite (%)', key: 'porcentajeLimite', width: 24 },
        { header: 'Clasificación', key: 'clasificacion', width: 22 }
    ];

    sheetResumen.getRow(1).height = 28;
    sheetResumen.getRow(1).eachCell(cell => {
        cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    summaries.forEach((s, idx) => {
        const row = sheetResumen.addRow({
            agente: s.agente,
            gestionesValidas: s.gestionesValidas,
            sumaTiempos: s.sumaTiempos,
            tmoPromedio: s.tmoPromedio,
            limite: s.limite,
            porcentajeLimite: `${s.porcentajeLimite}%`,
            clasificacion: s.clasificacion
        });
        row.height = 22;
        const isApp = s.clasificacion === 'APROBADO';

        row.eachCell((cell, colNum) => {
            cell.font = { name: 'Segoe UI', size: 10 };
            cell.alignment = { vertical: 'middle', horizontal: colNum === 1 ? 'left' : 'center' };
            cell.border = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } } };

            if (idx % 2 === 0) {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
            }

            if (colNum === 4) cell.font = { name: 'Segoe UI', size: 10, bold: true };

            if (colNum === 7) {
                cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: isApp ? 'FF065F46' : 'FF991B1B' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isApp ? 'FFD1FAE5' : 'FFFEE2E2' } };
            }
        });
    });

    // --------------------------------------------------------------------------
    // HOJA 2: Datos originales
    // --------------------------------------------------------------------------
    const sheetDatos = workbook.addWorksheet('Datos originales', { views: [{ showGridLines: true }] });
    sheetDatos.columns = [
        { header: 'ID_Ticket', key: 'ticket', width: 16 },
        { header: 'Fecha y Hora', key: 'fecha', width: 22 },
        { header: 'Agente', key: 'agente', width: 26 },
        { header: 'Canal', key: 'canal', width: 20 },
        { header: 'Tiempo de Gestión (s)', key: 'tiempo', width: 22 },
        { header: 'Estado Fila', key: 'estadoValidacion', width: 24 }
    ];

    sheetDatos.getRow(1).height = 28;
    sheetDatos.getRow(1).eachCell(cell => {
        cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    rawRecords.forEach(r => {
        const row = sheetDatos.addRow(r);
        row.height = 20;
        row.eachCell((cell, colNum) => {
            cell.font = { name: 'Segoe UI', size: 10 };
            cell.alignment = { vertical: 'middle', horizontal: colNum === 5 ? 'right' : 'left' };
            cell.border = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } } };

            if (colNum === 6) {
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
                cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: r.esValido ? 'FF059669' : 'FFDC2626' } };
            }
        });
    });

    // --------------------------------------------------------------------------
    // HOJA 3: Dashboard
    // --------------------------------------------------------------------------
    const sheetDash = workbook.addWorksheet('Dashboard', { views: [{ showGridLines: true }] });

    sheetDash.mergeCells('B2:M2');
    const headerCell = sheetDash.getCell('B2');
    headerCell.value = 'DASHBOARD EJECUTIVO DE TMO (Cálculo y Análisis Visual)';
    headerCell.font = { name: 'Segoe UI', size: 15, bold: true, color: { argb: 'FFFFFFFF' } };
    headerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
    headerCell.alignment = { vertical: 'middle', horizontal: 'center' };
    sheetDash.getRow(2).height = 36;

    // Tarjetas KPI (Filas 4 y 5)
    const kpiCards = [
        { label: 'Agentes Evaluados', val: metrics.totalAgentes, colS: 'B', colE: 'D', bg: 'FFEFF6FF', text: 'FF1D4ED8' },
        { label: 'TMO Límite', val: `${metrics.umbralAplicado} s`, colS: 'E', colE: 'G', bg: 'FFF1F5F9', text: 'FF334155' },
        { label: 'Aprobados', val: `${metrics.tasaAprobacionPct}%`, colS: 'H', colE: 'J', bg: 'FFF0FDF4', text: 'FF15803D' },
        { label: 'Requieren Revisión', val: `${metrics.tasaRevisionPct}%`, colS: 'K', colE: 'M', bg: 'FFFDF2F8', text: 'FFBE185D' }
    ];

    kpiCards.forEach(card => {
        sheetDash.mergeCells(`${card.colS}4:${card.colE}4`);
        const lCell = sheetDash.getCell(`${card.colS}4`);
        lCell.value = card.label;
        lCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF64748B' } };
        lCell.alignment = { vertical: 'middle', horizontal: 'center' };
        lCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: card.bg } };

        sheetDash.mergeCells(`${card.colS}5:${card.colE}5`);
        const vCell = sheetDash.getCell(`${card.colS}5`);
        vCell.value = card.val;
        vCell.font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: card.text } };
        vCell.alignment = { vertical: 'middle', horizontal: 'center' };
        vCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: card.bg } };
    });

    const { barBuffer, donutBuffer } = await generateCharts(summaries, metrics);

    const barImageId = workbook.addImage({ buffer: barBuffer, extension: 'png' });
    sheetDash.addImage(barImageId, { tl: { col: 1, row: 7 }, ext: { width: 680, height: 360 } });

    const donutImageId = workbook.addImage({ buffer: donutBuffer, extension: 'png' });
    sheetDash.addImage(donutImageId, { tl: { col: 13, row: 7 }, ext: { width: 500, height: 360 } });

    // --------------------------------------------------------------------------
    // HOJA 4: Validación
    // --------------------------------------------------------------------------
    const sheetValid = workbook.addWorksheet('Validación', { views: [{ showGridLines: true }] });
    sheetValid.columns = [
        { header: 'Agente', key: 'agente', width: 28 },
        { header: 'TMO Calculado (s)', key: 'tmoPromedio', width: 20 },
        { header: 'Límite Aplicado (s)', key: 'limite', width: 18 },
        { header: 'Clasificación', key: 'clasificacion', width: 22 },
        { header: 'Observaciones Operativas', key: 'observaciones', width: 45 },
        { header: 'Fecha de Procesamiento', key: 'fechaProceso', width: 22 }
    ];

    sheetValid.getRow(1).height = 28;
    sheetValid.getRow(1).eachCell(cell => {
        cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    const nowStr = new Date().toISOString().substring(0, 19).replace('T', ' ');
    summaries.forEach(s => {
        const row = sheetValid.addRow({
            agente: s.agente,
            tmoPromedio: s.tmoPromedio,
            limite: s.limite,
            clasificacion: s.clasificacion,
            observaciones: s.observaciones,
            fechaProceso: nowStr
        });
        row.height = 22;
        const isApp = s.clasificacion === 'APROBADO';

        row.eachCell((cell, colNum) => {
            cell.font = { name: 'Segoe UI', size: 10 };
            cell.alignment = { vertical: 'middle', horizontal: colNum === 5 ? 'left' : 'center' };
            cell.border = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } } };

            if (colNum === 4) {
                cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: isApp ? 'FF065F46' : 'FF991B1B' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isApp ? 'FFD1FAE5' : 'FFFEE2E2' } };
            }
        });
    });

    if (outputPath) {
        await workbook.xlsx.writeFile(outputPath);
    }
    const buffer = await workbook.xlsx.writeBuffer();
    return { buffer, workbook, summaries, rawRecords, metrics };
}

module.exports = {
    processTmoData,
    generateCharts,
    generateConsolidatedExcel
};
