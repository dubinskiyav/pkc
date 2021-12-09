import React from 'react';
import { Button, Form } from 'antd';
import DataTable from "../../lib/DataTable";
import ModuleHeader from "../../lib/ModuleHeader";
import { BUTTON_REFRESH_LABEL, DEFAULT_TABLE_CONTEXT, FORM_ITEMS_LAYOUT } from "../../lib/Const";
import { drawDate, drawFloat } from '../../lib/Utils';

// Сущность (в CamelCase)
const ENTITY = "RequestSaldo";
const ID_NAME = ENTITY.charAt(0).toLowerCase() + ENTITY.slice(1) + "Id"
// URI для использования формой со списком (текущей) и формой добавления/изменения
const URI_FOR_GET_LIST = "tentorium/documents/requestsaldo/saldo/getlist";

// автоматическое обновление при монтировании компонента
const AUTO_REFRESH = true;

// колонки в таблице
const COLUMNS = [
    {
        title: 'Договор',
        dataIndex: 'contractName',
        ellipsis: true,
    },
    {
        title: 'Дата',
        dataIndex: 'requestSaldoDate',
        sorter: true,
        defaultSortOrder: 'descend',
        width: "100px",
        render: drawDate,
    },
    {
        title: 'Сумма',
        dataIndex: 'requestSaldoSumma',
        width: "100px",
        render: drawFloat,
    },
]

export const Saldo = (props) => {
    const [tableInterface] = React.useState(Object.assign({}, DEFAULT_TABLE_CONTEXT));
    const [, forceUpdate] = React.useReducer(x => x + 1, 0);
    const [updateRecords, setUpdateRecords] = React.useState([]);

    // тут формируются кнопки
    const buttons = [
        <Button key="refresh" onClick={() => tableInterface.refreshData()}>{BUTTON_REFRESH_LABEL}</Button>
    ];

    return <Form
        {...FORM_ITEMS_LAYOUT}
        form={props.form}
        layout="horizontal"
        name="formSaldo"
        onFieldsChange={props.onFieldsChange}
        initialValues={props.initialValues}>
        <ModuleHeader
            title={""}
            showBackButton={false}
            showButtonsInMobile={true}
            onSearch={value => {
                tableInterface.requestParams.search = value;
                tableInterface.refreshData();
            }}
            buttons={buttons}
        />
        <DataTable className="mod-main-table"
            uri={{
                forSelect: URI_FOR_GET_LIST
            }}
            columns={COLUMNS}
            autoRefresh={AUTO_REFRESH}
            interface={tableInterface}
            onSelectedChange={() => forceUpdate()}
            onAfterRefresh={() => setUpdateRecords([])}
            updateRecords={updateRecords}
            editable={false}
            idName={ID_NAME}
        />
    </Form>
}