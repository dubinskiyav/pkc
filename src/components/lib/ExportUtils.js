import { Workbook } from 'exceljs';
import FileSaver from 'file-saver';


export const downloadDataAs = (fname, data) => {
    var link = document.createElement("a");
    link.href = data;
    link.download = fname;
    link.click();
}

export const exportJsonToCVS = (json, columns, fname) => {
    const replacer = (key, value) => value === null ? '' : value
    const header = columns
        .filter(c => !c.serv)
        .map(c => c.title)
    let fields = columns.map(c => c.dataIndex)
    const csv = [
        header.join(','), // header row first
        ...json.map(row => fields.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
    ].join('\r\n')
    downloadDataAs(fname + ".csv", encodeURI("data:text/csv;charset=utf-8," + csv));
}

export const exportJsonToExcel = (json, columns, fname) => {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet("Export Data");
    const header = columns
        .filter(c => !c.serv)
        .map(c => c.title)
    worksheet.addRow(header);
    // строим индекс по полям
    let fields = columns.map(c => c.dataIndex)
    // цикл по записям
    json.map(r => {
        return worksheet.addRow(fields.map(f => r[f]))
    })
    workbook.xlsx.writeBuffer().then((data) => {
        let blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        FileSaver.saveAs(blob, fname);
    });
}