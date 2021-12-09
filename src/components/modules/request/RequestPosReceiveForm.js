import React from 'react';
import { Button, Col, Form, Input, InputNumber, Row } from 'antd';
import { BUTTON_ADD_LABEL, BUTTON_DEL_LABEL, DEFAULT_TABLE_CONTEXT, FORM_ITEMS_LAYOUT } from "../../lib/Const";
import DataLookup from '../../lib/DataLookup';
import { drawDateAndTime, drawInt } from '../../lib/Utils';
import ModuleHeader from '../../lib/ModuleHeader';
import MemoryDataTable from '../../lib/MemoryDataTable';

const ID_NAME = "requestAcceptPosId";

// колонки в таблице
const COLUMNS = [
    {
        title: 'Дата и время',
        dataIndex: 'requestAcceptDate',
        sorter: true,
        defaultSortOrder: "descend",
        render: drawDateAndTime,
        editable: true,
        editComponentName: "DateInput",
        required: true,
        width: "170px",
    },
    {
        title: 'Принято',
        dataIndex: 'requestAcceptPosCount',
        render: drawInt,
        editable: true,
        editComponentName: "InputNumber",
        required: true,
        width: "106px",
    },
    {
        title: 'Примечание',
        dataIndex: 'requestAcceptPosNote',
        editable: true,
        editComponentName: "Input",
        required: false,
        render: (value) => value ? value : <span>&nbsp;</span>,
    },
]

const RequestPosReceiveForm = (props) => {
    const firstInputRef = React.useRef(null);

    React.useEffect(() => {
        setTimeout(() => {
            if (firstInputRef.current) {
                firstInputRef.current.focus({
                    cursor: 'end',
                })
            }
        }, 100);
    });

    const [tableInterface] = React.useState(Object.assign({}, DEFAULT_TABLE_CONTEXT));
    const [, forceUpdate] = React.useReducer(x => x + 1, 0);
    const [updateRecords, setUpdateRecords] = React.useState([]);

    // тут формируются кнопки
    const buttons = [
        <Button key="del" onClick={() => tableInterface.deleteData()}
            disabled={tableInterface.isLoading() || tableInterface.getSelectedRows().length == 0}>{BUTTON_DEL_LABEL}</Button>,
        <Button key="add" onClick={() => {
            const values = {
                requestAgreePosId: props.initialValues["requestPosId"],
                requestPosNumber: props.initialValues["requestPosNumber"],
                requestAcceptDate: props.editDate,
                requestAcceptPosCount: 0,
                requestAcceptPosNote: ""
            };
            tableInterface.insFirstRecord(values);
            setUpdateRecords([...updateRecords, values])
        }} type="primary" ref={firstInputRef}>{BUTTON_ADD_LABEL}</Button>
    ];

    const onChange = React.useCallback(() => {
        if (tableInterface.getSumField) {
            props.form.setFieldsValue({
                requestPosCountAccept: drawInt(tableInterface.getSumField("requestAcceptPosCount")),
            })
        }

        if (props.onFieldsChange) {
            props.onFieldsChange();
        }
    }, [tableInterface, props])

    return <Form
        {...FORM_ITEMS_LAYOUT}
        form={props.form}
        layout="horizontal"
        name="formRequestPosReceive"
        onFieldsChange={onChange}
        initialValues={props.initialValues}>
        <Form.Item
            name='requestPosNumber'
            hidden={true}>
            <Input />
        </Form.Item>
        <Form.Item
            name='sgood'
            label='Товар'
            labelCol={{ span: 6 }}
            wrapperCol={{ span: 18 }}>
            <DataLookup.SGoodPrice disabled={true} />
        </Form.Item>
        <Row>
            <Col span={12}>
                <Form.Item
                    name='requestPosCount'
                    label='Согласованное количество'
                    labelCol={{ span: 12 }}
                    wrapperCol={{ span: 12 }}>
                    <InputNumber parser={s => parseInt(s)} disabled={true} />
                </Form.Item>
            </Col>
            <Col span={12}>
                <Form.Item
                    name='requestPosCountAccept'
                    label='Принято'
                    labelCol={{ span: 18 }}
                    wrapperCol={{ span: 6 }}>
                    <InputNumber parser={s => parseInt(s)} disabled={true} style={{ width: "100%" }} />
                </Form.Item>
            </Col>
        </Row>
        <ModuleHeader
            title={"Приход товара"}
            showBackButton={false}
            showButtonsInMobile={true}
            search={false}
            buttons={buttons}>
        </ModuleHeader>
        <Form.Item
            name='accepts'
            wrapperCol={{ offset: 0 }}>
            <MemoryDataTable className="mod-main-table"
                columns={COLUMNS}
                editCallBack={() => { }}
                interface={tableInterface}
                onSelectedChange={() => forceUpdate()}
                onAfterRefresh={() => setUpdateRecords([])}
                updateRecords={updateRecords}
                idName={ID_NAME}
                onAfterDelete={() => forceUpdate()}
                editable={false}
            />
        </Form.Item>
    </Form>
}

export default RequestPosReceiveForm;