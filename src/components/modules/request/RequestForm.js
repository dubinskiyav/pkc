import React from 'react';
import { Form, Checkbox, Input, Col, Row, Button, Popover } from 'antd';
import { BUTTON_ADD_LABEL, BUTTON_DEL_LABEL, DEFAULT_TABLE_CONTEXT, FORM_ITEMS_LAYOUT, MIN_INT } from "../../lib/Const";
import { drawBoolIcon, drawFloat, drawInt, getScalarSumField, intFlagFromCheckboxEvent } from "../../lib/Utils";
import Numbering from "../../lib/Numbering";
import DataLookup from '../../lib/DataLookup';
import { DateInput } from '../../lib/DateInput';
import DataSelect from '../../lib/DataSelect';
import { isMobile, responsiveMobileColumn } from '../../lib/Responsive';
import { FilterButton } from '../../lib/FilterButton';
import ModuleHeader from '../../lib/ModuleHeader';
import MemoryDataTable from '../../lib/MemoryDataTable';
import EditForm, { ShowModal } from '../../lib/EditForm';
import RequestPosForm from './RequestPosForm';
import moment from 'moment';
import { userProps } from '../../lib/LoginForm';
import {
    branchOfServiceCenter, REQUEST_ACCEPTED, REQUEST_APPROVAL, REQUEST_DRAFT,
    STATUS_ACCEPTED,
    STATUS_APPROVAL, STATUS_CANCELED, STATUS_DRAFT, STATUS_RESERVE
} from '../../lib/tentoriumConst';
import RequestPosReceiveForm from './RequestPosReceiveForm';
import { MemoryDataSet } from '../../lib/MemoryDataSet';
import { confirm } from '../../lib/Dialogs';
import { format } from 'react-string-format';
import DataSelectObj from '../../lib/DataSelectObj';
import { Saldo } from './Saldo';

// Сущность (в CamelCase)
const ENTITY = "RequestPos";
const ID_NAME = ENTITY.charAt(0).toLowerCase() + ENTITY.slice(1) + "Id"

// Конвертация значений, приходящих и уходящих через API
const CONVERTORS = {
    date: []
}

// Уникальный идентификатор формы редактировавания
const EDIT_FORM_ID = ENTITY.toLowerCase() + "-frm";
const EDIT_FORM_RECEIVE_ID = ENTITY.toLowerCase() + "-receive-frm";
// Форма для редактирования
const buildForm = (form, allData, dateForPrice, status, isProvider, requestType) => {
    return <RequestPosForm
        form={form}
        initialValues={{}}
        allData={allData}
        dateForPrice={dateForPrice}
        status={status}
        isProvider={isProvider}
        requestType={requestType} />
}
const buildReceiveForm = (form, allData, dateForPrice, status, isProvider, requestType, editDate) => {
    return <RequestPosReceiveForm
        form={form}
        initialValues={{}}
        allData={allData}
        dateForPrice={dateForPrice}
        status={status}
        isProvider={isProvider}
        requestType={requestType}
        editDate={editDate} />
}
// размер формы, -1 - по умолчанию, FORM_MAX_WIDTH - максимальная ширина
const FORM_WIDTH = 800;

// Создание компонент для фильтров
// key это уникальное имя фильтра, попадает в REST API
const buildFilters = () => {
    return <React.Fragment>

    </React.Fragment>
}
// начальное значение фильтров
// если значение фильра не объект, а простое значение,
// то значение имени свойства компонента принимается как defaultValue компонента
const initFilters = {
}

const transformValuesForLoad = values => {
    values["sgood"].additional.price = values["requestPosPrice"];
    values["sgood"].additional.points = values["requestPosPoints"];
    values["sgood"].additional.characterId = values["characterId"];
    values["sgood"].additional.characterCode = values["characterCode"];
    values["requestPosBoxcount"] = +values["sgood"].additional.packageQuantity;
    values["requestPosWeight"] = +values["sgood"].additional.weight;
    if (values["accepts"] && values["accepts"].data) {
        values["accepts"].data = values["accepts"].data.map(value => {
            value["requestAcceptDate"] = moment(value["requestAcceptDate"]);
            return value;
        })
        values["requestPosCountAccept"] = 0;
        values["accepts"].data.forEach(value => values["requestPosCountAccept"] += value["requestAcceptPosCount"]);
    }
    if (values["accepts"] && values["accepts"].delta) {
        values["accepts"].delta = values["accepts"].delta.map(value => {
            if (value.oldRecord) {
                value.oldRecord["requestAcceptDate"] = moment(value.oldRecord["requestAcceptDate"]);
            }
            value.record["requestAcceptDate"] = moment(value.record["requestAcceptDate"]);
            return value;
        })
    }
    return values;
}

const RequestForm = (props) => {
    const firstInputRef = React.useRef(null);
    const secondInputRef = React.useRef(null);
    let [modeAdd] = React.useState(false);
    modeAdd = props.initialValues["requestId"] === null;
    const [topLayer, setTopLayer] = React.useState([]);

    React.useEffect(() => {
        setTimeout(() => {
            if (firstInputRef.current && modeAdd) {
                firstInputRef.current.focus({
                    cursor: 'end',
                })
            } else if (secondInputRef.current) {
                secondInputRef.current.focus({
                    cursor: 'end',
                })
            }
        }, 100);
    }, [modeAdd, props.initialValues]);

    let [formVisible, setFormVisible] = React.useState(false);
    let [formReceiveVisible, setFormReceiveVisible] = React.useState(false);
    let [editorContext] = React.useState({});
    const [tableInterface] = React.useState(Object.assign({}, DEFAULT_TABLE_CONTEXT));
    const [form] = Form.useForm();
    const [, forceUpdate] = React.useReducer(x => x + 1, 0);
    const [updateRecords, setUpdateRecords] = React.useState([]);

    const setFilters = React.useCallback((config) => {
        tableInterface.requestParams.filters = config;
        tableInterface.refreshData();
    }, [tableInterface])

    const [pickupFlag, setPickupFlag] = React.useState(props.initialValues["requestPickupflag"] === 1);
    const initialPickupFlag = props.initialValues["requestPickupflag"] === 1;
    React.useEffect(() => {
        setPickupFlag(initialPickupFlag);
    }, [initialPickupFlag]);

    const isCustomer = props.initialValues["customerId"] == userProps.subject.subjectId;
    const isProvider = props.initialValues["providerId"] == userProps.subject.subjectId;
    const fieldDisabled = !modeAdd
        && !(isCustomer && [STATUS_DRAFT, STATUS_CANCELED].indexOf(props.initialValues["documentRealStatus"]) !== -1)
        && !(isProvider && [STATUS_APPROVAL, STATUS_RESERVE].indexOf(props.initialValues["documentRealStatus"]) !== -1);
    const [status] = React.useState({});
    const requestType = (modeAdd || [STATUS_DRAFT, STATUS_CANCELED].indexOf(props.initialValues["documentRealStatus"]) !== -1) ? REQUEST_DRAFT
        : [STATUS_APPROVAL, STATUS_RESERVE].indexOf(props.initialValues["documentRealStatus"]) !== -1 ? REQUEST_APPROVAL
            : REQUEST_ACCEPTED;

    const callForm = React.useCallback((id, record) => {
        if (((requestType === REQUEST_ACCEPTED) && isProvider)
            || ((requestType === REQUEST_APPROVAL) && isCustomer)
            || ((requestType === REQUEST_DRAFT) && isProvider)) {
            return;
        }
        editorContext.id = id;
        editorContext.record = record;
        if (requestType !== REQUEST_ACCEPTED) {
            setFormVisible(true);
        } else {
            setFormReceiveVisible(true);
        }
    }, [editorContext, requestType, isProvider, isCustomer])

    const [editDate] = React.useState(moment());

    const acceptPositions = React.useCallback(() => {
        confirm(format("Принять выбранные {0} позиций?", tableInterface.getSelectedRows().length), () => {
            tableInterface.getSelectedRecords().forEach(el => {
                const record = el.record;
                // Принимаем разницу между согласованным и текщим принятым количествами
                if (record["requestPosCount"] - record["requestPosCountAccept"] > 0) {
                    const memoryDataSet = Object.create(MemoryDataSet);
                    if (!record["accepts"]) record["accepts"] = { data: [], delta: [] };
                    memoryDataSet.setOriginalData(record["accepts"].data, record["accepts"].delta);

                    const values = {
                        requestAgreePosId: record["requestPosId"],
                        requestPosNumber: record["requestPosNumber"],
                        requestAcceptDate: editDate,
                        requestAcceptPosCount: record["requestPosCount"] - record["requestPosCountAccept"],
                        requestAcceptPosNote: ""
                    };
                    // Сгенерируем случайное id для новых записей
                    values["requestAcceptPosId"] = Math.ceil(Math.random() * MIN_INT);
                    // Запишем новую запись в датасет
                    memoryDataSet.insert(values);

                    record["accepts"] = { data: memoryDataSet.data.map(value => value.record), delta: memoryDataSet.delta };
                }
            });
            forceUpdate();
            tableInterface.setSelectedRows([]);
        })
    }, [tableInterface, editDate])

    // тут формируются кнопки
    const buttons = [
        <Button key="del" onClick={() => tableInterface.deleteData()} hidden={requestType === REQUEST_ACCEPTED}
            disabled={tableInterface.isLoading() || tableInterface.getSelectedRows().length == 0 || fieldDisabled}>{BUTTON_DEL_LABEL}</Button>,
        <Button key="add" onClick={() => callForm(undefined, { sgood: { value: null }, requestPosCount: null, requestPosOrder: 1 })} type="primary"
            disabled={fieldDisabled} hidden={requestType === REQUEST_ACCEPTED}>{BUTTON_ADD_LABEL}</Button>,
        <Button key="accept" onClick={() => acceptPositions()} type="primary"
            hidden={requestType !== REQUEST_ACCEPTED || isProvider || props.initialValues["documentRealStatus"] === STATUS_ACCEPTED}
            disabled={tableInterface.isLoading() || tableInterface.getSelectedRows().length == 0}>Принять</Button>
    ];

    if (isMobile()) {
        const filters = buildFilters();
        buttons.push(<FilterButton key="filter" filters={filters}
            onChange={(fc) => setFilters(fc)}
            initValues={initFilters} />);
    }

    const transformValues = React.useCallback(values => {
        values["requestPosPrice"] = values["sgood"].additional.price;
        values["requestPosPoints"] = values["sgood"].additional.points;
        values["requestPosBoxcount"] = +values["sgood"].additional.packageQuantity;
        values["requestPosWeight"] = +values["sgood"].additional.weight;
        values["characterId"] = values["sgood"].additional.characterId;
        values["characterCode"] = values["sgood"].additional.characterCode;
        if (values["sgood"].title.indexOf(values["characterCode"]) === 0) {
            values["sgood"].title = values["sgood"].title.substring(values["characterCode"].toString().length + 1);
        }
        if (!values[ID_NAME]) {
            values["requestPosNumber"] = tableInterface.getNextInField("requestPosNumber");
        }
        return values;
    }, [tableInterface]);

    const afterEdit = React.useCallback((values) => {
        values = transformValues(values);
        tableInterface.updateRecord(values);
        setUpdateRecords([...updateRecords, values])
    }, [tableInterface, updateRecords, transformValues])

    const afterAdd = React.useCallback((values) => {
        values = transformValues(values);
        tableInterface.insFirstRecord(values);
        setUpdateRecords([...updateRecords, values])
    }, [tableInterface, updateRecords, transformValues])

    const onChange = React.useCallback(() => {
        if (tableInterface.getScalarSumField) {
            props.form.setFieldsValue({
                sum: drawFloat(tableInterface.getScalarSumField("requestPosPrice", "requestPosCount")),
                points: drawInt(tableInterface.getScalarSumField("requestPosPoints", "requestPosCount")),
                weight: drawFloat(tableInterface.getScalarSumField("requestPosWeight", "requestPosCount"), undefined, undefined, 3),
            })
        }

        if (props.onFieldsChange) {
            props.onFieldsChange();
        }

        forceUpdate();
    }, [tableInterface, props])

    let initialValues = props.initialValues;
    if (!initialValues.positions) {
        initialValues.positions = { data: [], delta: [] };
    }
    initialValues.positions.data = initialValues.positions.data.map(value => transformValuesForLoad(value));

    let originalPositionData = props.initialValues && props.initialValues.requestOriginal
        && props.initialValues.requestOriginal.positions ? props.initialValues.requestOriginal.positions.data ?? [] : [];
    originalPositionData = originalPositionData.map(value => transformValuesForLoad(value));

    React.useEffect(() => {
        if (modeAdd || (props.initialValues["documentRealStatus"] === STATUS_DRAFT && isCustomer)) {
            if (props.additionalButtons.length === 0) {
                props.additionalButtons.push(
                    <Button id="save-and-send-btn" key="4" onClick={(ev) => {
                        props.form.setFieldsValue({ statusSend: true });
                        if (props.events) {
                            props.events.handleOk(ev, false);
                        }
                        setTimeout(() => { props.form.setFieldsValue({ statusSend: false }) }, 0);
                    }}>
                        Сохранить и отправить
                    </Button>
                );
            }
        } else if ((props.initialValues["documentRealStatus"] === STATUS_APPROVAL
            || props.initialValues["documentRealStatus"] === STATUS_RESERVE) && isProvider) {
            if (props.additionalButtons.length === 0) {
                if (props.initialValues["documentRealStatus"] !== STATUS_RESERVE) {
                    props.additionalButtons.push(
                        <Button id="reserve-btn" key="5" onClick={(ev) => {
                            props.form.setFieldsValue({ statusReserve: true });
                            if (props.events) {
                                props.events.handleOk(ev, false);
                            }
                            setTimeout(() => { props.form.setFieldsValue({ statusReserve: false }) }, 0);
                        }}>
                            Резервировать
                        </Button>
                    );
                }
                props.additionalButtons.push(
                    <Button id="shipment-btn" key="6" onClick={(ev) => {
                        props.form.setFieldsValue({ statusShipment: true });
                        if (props.events) {
                            props.events.handleOk(ev, false);
                        }
                        setTimeout(() => { props.form.setFieldsValue({ statusShipment: false }) }, 0);
                    }}>
                        Отгрузить
                    </Button>
                );
            }
        } else {
            props.additionalButtons.splice(0, props.additionalButtons.length);
        }
        if (props.events) {
            props.events.forceUpdate();
        }
    }, [props.additionalButtons, props.events, props.initialValues, modeAdd, props.form, isCustomer, isProvider])

    const getColumns = () => {
        // колонки в таблице
        let COLUMNS = [
            {
                title: '№',
                dataIndex: 'requestPosNumber',
                sorter: (a, b) => a.documentTransitNumber - b.documentTransitNumber,
                defaultSortOrder: "ascend",
                width: "45px",
                responsive: responsiveMobileColumn()
            },
            {
                title: 'Хар-ка',
                dataIndex: 'characterCode',
                width: "70px",
                responsive: responsiveMobileColumn()
            },
            {
                title: 'Товар',
                dataIndex: 'sgood',
                sorter: (a, b) => a.documentTransitName > b.documentTransitName ? 1 : a.documentTransitName < b.documentTransitName ? -1 : 0,
                render: value => {
                    return (
                        <Popover content={value.title
                            + (value.additional.edizmNotation ? ", Ед. изм. " + value.additional.edizmNotation : "")
                            + (value.additional.weight ? ", Вес " + drawFloat(value.additional.weight, undefined, undefined, 3) : "")}>
                            <div>{value.title}</div>
                        </Popover>
                    )
                },
                ellipsis: true,
            },
            {
                title: 'Остаток на складе',
                dataIndex: 'requestPosRemains',
                width: "70px",
                responsive: responsiveMobileColumn()
            },
            {
                title: 'Кол-во',
                dataIndex: 'requestPosCount',
                render: (value, record) => {
                    switch (requestType) {
                        case REQUEST_APPROVAL:
                            if (value === record["requestPlanPosCount"] || !record["requestPlanPosCount"]) {
                                return drawInt(value, record);
                            } else {
                                return (
                                    <Popover content={"План: " + drawInt(record["requestPlanPosCount"]) + ", Согласовано: " + drawInt(value)}>
                                        <div style={{ color: "red" }}>{drawInt(value, record)}</div>
                                    </Popover>
                                )
                            }
                        default: // REQUEST_DRAFT и REQUEST_ACCEPTED
                            return drawInt(value, record);
                    }
                },
                width: "70px"
            },
            {
                title: 'Принято',
                dataIndex: 'requestPosCountAccept',
                render: drawInt,
                width: "80px"
            },
            {
                title: 'Под заказ',
                dataIndex: 'requestPosOrder',
                render: drawBoolIcon,
                width: "80px"
            },
            {
                title: 'Цена',
                dataIndex: 'requestPosPrice',
                render: drawFloat,
                width: "90px",
            },
            {
                title: 'Сумма',
                render: (_, record) => {
                    switch (requestType) {
                        case REQUEST_APPROVAL:
                            if (record["requestPosCount"] === record["requestPlanPosCount"] || !record["requestPlanPosCount"]) {
                                return drawFloat(record["requestPosCount"] * record["requestPosPrice"], record);
                            } else {
                                return (
                                    <Popover content={"План: " + drawFloat(record["requestPlanPosCount"] * record["requestPosPrice"])
                                        + ", Согласовано: " + drawFloat(record["requestPosCount"] * record["requestPosPrice"])}>
                                        <div style={{ color: "red" }}>{drawFloat(record["requestPosCount"] * record["requestPosPrice"], record)}</div>
                                    </Popover>
                                )
                            }
                        default: // REQUEST_DRAFT и REQUEST_ACCEPTED
                            return drawFloat(record["requestPosCount"] * record["requestPosPrice"], record);
                    }
                },
                width: "100px",
            },
            {
                title: 'Баллы',
                dataIndex: 'requestPosPoints',
                render: drawInt,
                width: "60px",
            },
            {
                title: 'Сумма баллов',
                render: (_, record) => {
                    switch (requestType) {
                        case REQUEST_APPROVAL:
                            if (record["requestPosCount"] === record["requestPlanPosCount"] || !record["requestPlanPosCount"]) {
                                return drawInt(record["requestPosCount"] * record["requestPosPoints"], record);
                            } else {
                                return (
                                    <Popover content={"План: " + drawInt(record["requestPlanPosCount"] * record["requestPosPoints"])
                                        + ", Согласовано: " + drawInt(record["requestPosCount"] * record["requestPosPoints"])}>
                                        <div style={{ color: "red" }}>{drawInt(record["requestPosCount"] * record["requestPosPoints"], record)}</div>
                                    </Popover>
                                )
                            }
                        default: // REQUEST_DRAFT и REQUEST_ACCEPTED
                            return drawInt(record["requestPosCount"] * record["requestPosPoints"], record);
                    }
                },
                width: "65px",
            },
            {
                title: 'Кол-во в коробке',
                dataIndex: 'requestPosBoxcount',
                render: drawInt,
                width: "80px",
            },
            {
                title: 'Вес общий (кг)',
                render: (_, record) => {
                    switch (requestType) {
                        case REQUEST_APPROVAL:
                            if (record["requestPosCount"] === record["requestPlanPosCount"] || !record["requestPlanPosCount"]) {
                                return drawFloat(record["requestPosCount"] * record["requestPosWeight"], record, undefined, 3);
                            } else {
                                return (
                                    <Popover content={"План: " + drawFloat(record["requestPlanPosCount"] * record["requestPosWeight"], undefined, undefined, 3)
                                        + ", Согласовано: " + drawFloat(record["requestPosCount"] * record["requestPosWeight"], undefined, undefined, 3)}>
                                        <div style={{ color: "red" }}>{drawFloat(record["requestPosCount"] * record["requestPosWeight"], record, undefined, 3)}</div>
                                    </Popover>
                                )
                            }
                        default: // REQUEST_DRAFT и REQUEST_ACCEPTED
                            return drawFloat(record["requestPosCount"] * record["requestPosWeight"], record, undefined, 3);
                    }
                },
                width: "80px",
            },
        ]

        if (requestType !== REQUEST_APPROVAL) {
            COLUMNS = COLUMNS.filter(value => (value.dataIndex !== "requestPosOrder"));
        }
        if (requestType !== REQUEST_ACCEPTED) {
            COLUMNS = COLUMNS.filter(value => (value.dataIndex !== "requestPosCountAccept"));
        }
        return COLUMNS;
    }

    const sumText =
        requestType === REQUEST_APPROVAL && props.form.getFieldValue("sumPlan") !== props.form.getFieldValue("sum")
            ? "План: " + props.form.getFieldValue("sumPlan") + ", Согласовано: " + props.form.getFieldValue("sum")
            : "";
    const pointsText =
        requestType === REQUEST_APPROVAL && props.form.getFieldValue("pointsPlan") !== props.form.getFieldValue("points")
            ? "План: " + props.form.getFieldValue("pointsPlan") + ", Согласовано: " + props.form.getFieldValue("points")
            : "";
    const weightText =
        requestType === REQUEST_APPROVAL && props.form.getFieldValue("weightPlan") !== props.form.getFieldValue("weight")
            ? "План: " + props.form.getFieldValue("weightPlan") + ", Согласовано: " + props.form.getFieldValue("weight")
            : "";

    const deliverykindName = React.useRef(null);
    const deliverykindText =
        requestType === REQUEST_APPROVAL && props.initialValues.requestOriginal
            && props.form.getFieldValue("deliverykindId") !== props.initialValues.requestOriginal.deliverykindId
            ? "План: " + props.initialValues.requestOriginal.deliverykindName + ", Согласовано: " + deliverykindName.current
            : "";
    const formpaymentName = React.useRef(null);
    const formpaymentText =
        requestType === REQUEST_APPROVAL && props.initialValues.requestOriginal
            && props.form.getFieldValue("formpaymentId") !== props.initialValues.requestOriginal.formpaymentId
            ? "План: " + props.initialValues.requestOriginal.formpaymentName + ", Согласовано: " + formpaymentName.current
            : "";
    const addressText =
        requestType === REQUEST_APPROVAL && props.form.getFieldValue("address") && props.initialValues.requestOriginal
            && props.initialValues.requestOriginal.address
            && (props.form.getFieldValue("address").value ?? -1) !== (props.initialValues.requestOriginal.address.value ?? -1)
            ? "План: " + (props.initialValues.requestOriginal.address.title ?? "не указано")
            + ", Согласовано: " + (props.form.getFieldValue("address").title ?? "не указано")
            : "";
    const consigneeText =
        requestType === REQUEST_APPROVAL && props.form.getFieldValue("consignee") && props.initialValues.requestOriginal
            && (props.form.getFieldValue("consignee").value ?? -1) !== (props.initialValues.requestOriginal.consignee.value ?? -1)
            ? "План: " + (props.initialValues.requestOriginal.consignee.title ?? "не указано")
            + ", Согласовано: " + (props.form.getFieldValue("consignee").title ?? "не указано")
            : "";
    const transporterText =
        requestType === REQUEST_APPROVAL && props.form.getFieldValue("transporter") && props.initialValues.requestOriginal
            && (props.form.getFieldValue("transporter").value ?? -1) !== (props.initialValues.requestOriginal.transporter.value ?? -1)
            ? "План: " + (props.initialValues.requestOriginal.transporter.title ?? "не указано")
            + ", Согласовано: " + (props.form.getFieldValue("transporter").title ?? "не указано")
            : "";
    const requestPickupflagText =
        requestType === REQUEST_APPROVAL && props.initialValues.requestOriginal
            && props.form.getFieldValue("requestPickupflag") !== props.initialValues.requestOriginal.requestPickupflag
            ? "План: " + (props.initialValues.requestOriginal.requestPickupflag ? "да" : "нет")
            + ", Согласовано: " + (props.form.getFieldValue("requestPickupflag") ? "да" : "нет")
            : "";
    const requestLoadoperflagText =
        requestType === REQUEST_APPROVAL && props.initialValues.requestOriginal
            && props.form.getFieldValue("requestLoadoperflag") !== props.initialValues.requestOriginal.requestLoadoperflag
            ? "План: " + (props.initialValues.requestOriginal.requestLoadoperflag ? "да" : "нет")
            + ", Согласовано: " + (props.form.getFieldValue("requestLoadoperflag") ? "да" : "нет")
            : "";
    const requestTempregflagText =
        requestType === REQUEST_APPROVAL && props.initialValues.requestOriginal
            && props.form.getFieldValue("requestTempregflag") !== props.initialValues.requestOriginal.requestTempregflag
            ? "План: " + (props.initialValues.requestOriginal.requestTempregflag ? "да" : "нет")
            + ", Согласовано: " + (props.form.getFieldValue("requestTempregflag") ? "да" : "нет")
            : "";

    React.useEffect(() => {
        deliverykindName.current = props.initialValues["deliverykindName"];
        formpaymentName.current = props.initialValues["formpaymentName"];
    }, [props.initialValues])

    const showSaldo = () => {
        const config = {
            topLayer,
            setTopLayer,
            form,
            destroyDialog: (dlgId) => {
                setTopLayer([...topLayer.filter(c => c.props.id != dlgId)]);
            },
            editorContext: {}
        };
        // формируем диалог
        const dialog = ShowModal({
            ...config,
            title: "Расшифровка по доступному остатку",
            content: <Saldo />,
        });
        // вставляем Modal в top layer
        config.setTopLayer([...config.topLayer, dialog]);
    }

    return <Form
        {...FORM_ITEMS_LAYOUT}
        form={props.form}
        layout="horizontal"
        name="formRequest"
        onFieldsChange={onChange}
        initialValues={Object.assign(initialValues, {
            sum: drawFloat(getScalarSumField(initialValues.positions.data, "requestPosPrice", "requestPosCount")),
            points: drawInt(getScalarSumField(initialValues.positions.data, "requestPosPoints", "requestPosCount")),
            weight: drawFloat(getScalarSumField(initialValues.positions.data, "requestPosWeight", "requestPosCount"), undefined, undefined, 3),
            sumPlan: drawFloat(getScalarSumField(originalPositionData, "requestPosPrice", "requestPosCount")),
            pointsPlan: drawInt(getScalarSumField(originalPositionData, "requestPosPoints", "requestPosCount")),
            weightPlan: drawFloat(getScalarSumField(originalPositionData, "requestPosWeight", "requestPosCount"), undefined, undefined, 3),
            statusSend: false,
            statusReserve: false,
            statusShipment: false,
            partnerSaldoText: typeof (initialValues.partnerSaldo) === "number" ? drawFloat(initialValues.partnerSaldo) : initialValues.partnerSaldo,
        })}>
        <Form.Item
            name='statusSend'
            valuePropName='checked'
            getValueFromEvent={intFlagFromCheckboxEvent}
            hidden={true}>
            <Checkbox />
        </Form.Item>
        <Form.Item
            name='statusReserve'
            valuePropName='checked'
            getValueFromEvent={intFlagFromCheckboxEvent}
            hidden={true}>
            <Checkbox />
        </Form.Item>
        <Form.Item
            name='statusShipment'
            valuePropName='checked'
            getValueFromEvent={intFlagFromCheckboxEvent}
            hidden={true}>
            <Checkbox />
        </Form.Item>
        <Row>
            <Col span={8}>
                <Form.Item
                    name='documentRealDate'
                    label='Дата и время'
                    rules={[
                        { required: true }
                    ]}>
                    <DateInput format="DD.MM.YYYY HH:mm" showTime={true} disabled={true} />
                </Form.Item>
            </Col>
            <Col span={8}>
                <Form.Item
                    name='documentRealNumber'
                    label='Номер'
                    rules={[
                        { required: true }
                    ]}
                    labelCol={{ flex: "3 3 0" }}
                    wrapperCol={{ flex: "7 7 0" }}>
                    <Numbering
                        docEntityName="request"
                        params={{
                            year: props.form.getFieldValue("documentRealDate") ? props.form.getFieldValue("documentRealDate").year() : moment().year(),
                            sc: userProps.userKind !== branchOfServiceCenter ? userProps.subject.subjectCode : userProps.parent.subjectCode,
                            fsc: userProps.userKind === branchOfServiceCenter ? userProps.subject.subjectCode : undefined
                        }}
                        style={{ width: "100%" }}
                        disabled={!modeAdd}
                        ref={firstInputRef} />
                </Form.Item>
            </Col>
            <Col span={8}>
                <Popover content={"Расшифровка по доступному остатку"} mouseEnterDelay={1}>
                    <Form.Item
                        name='partnerSaldoText'
                        // eslint-disable-next-line
                        label={<a href="#" onClick={() => false}>Доступный остаток</a>}
                        onClick={(ev) => {
                            ev.preventDefault();
                            showSaldo();
                            return false;
                        }}>
                        <Input disabled />
                    </Form.Item>
                </Popover>
            </Col>
        </Row>
        <Row>
            <Col span={12}>
                <Popover content={addressText} visible={addressText ? undefined : false} mouseEnterDelay={1}>
                    <Form.Item
                        name='address'
                        label='Адрес доставки'
                        rules={[
                            { required: !pickupFlag },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!pickupFlag && value && !value.value) {
                                        return Promise.reject(new Error("Необходимо определить 'Адрес доставки'"));
                                    }
                                    return Promise.resolve();
                                },
                            }),
                        ]}
                        labelCol={{ flex: "2 2 0" }}
                        wrapperCol={{ flex: "7 7 0" }}
                        className={addressText ? "another-value" : ""}>
                        <DataLookup.Address
                            disabled={fieldDisabled}
                            allowClear={pickupFlag}
                            className={addressText ? "dataLookup-another-value" : ""}
                            ref={secondInputRef} />
                    </Form.Item>
                </Popover>
            </Col>
            <Col span={4}>
                <Popover content={requestPickupflagText} visible={requestPickupflagText ? undefined : false} mouseEnterDelay={1}>
                    <Form.Item
                        name='requestPickupflag'
                        label='Самовывоз'
                        valuePropName='checked'
                        getValueFromEvent={intFlagFromCheckboxEvent}
                        rules={[
                            { required: true }
                        ]}
                        labelCol={{ span: 16 }}
                        className={requestPickupflagText ? "another-value" : ""} >
                        <Checkbox onChange={() => {
                            setPickupFlag(props.form.getFieldValue("requestPickupflag") === 1);
                        }} disabled={fieldDisabled} />
                    </Form.Item>
                </Popover>
            </Col>
            <Col span={8}>
                <Popover content={deliverykindText} visible={deliverykindText ? undefined : false} mouseEnterDelay={1}>
                    <Form.Item
                        name='deliverykindId'
                        label='Вид доставки'
                        rules={[
                            { required: true }
                        ]}
                        className={deliverykindText ? "another-value" : ""}>
                        <DataSelect.CapClassSelect
                            capClassType={138}
                            displayValue={props.initialValues["deliverykindName"]}
                            style={{ width: "100%", color: deliverykindText ? "red" : "inherit" }}
                            SelectProps={{ disabled: fieldDisabled }}
                            onChange={(_, display) => deliverykindName.current = display} />
                    </Form.Item>
                </Popover>
            </Col>
        </Row>
        <Row>
            <Col span={12}>
                <Popover content={consigneeText} visible={consigneeText ? undefined : false} mouseEnterDelay={1}>
                    <Form.Item
                        name='consignee'
                        label='Грузополучатель'
                        rules={[
                        ]}
                        labelCol={{ flex: "2 2 0" }}
                        wrapperCol={{ flex: "7 7 0" }}
                        className={consigneeText ? "another-value" : ""}>
                        <DataLookup.Company
                            disabled={fieldDisabled}
                            allowClear={true}
                            className={consigneeText ? "dataLookup-another-value" : ""} />
                    </Form.Item>
                </Popover>
            </Col>
            <Col span={12}>
                <Popover content={formpaymentText} visible={formpaymentText ? undefined : false} mouseEnterDelay={1}>
                    <Form.Item
                        name='formpaymentId'
                        label='Форма оплаты транспортных услуг'
                        rules={[
                            { required: true }
                        ]}
                        labelCol={{ flex: "5 5 0" }}
                        wrapperCol={{ flex: "4 4 0" }}
                        className={formpaymentText ? "another-value" : ""}>
                        <DataSelect.CapClassSelect
                            capClassType={137}
                            displayValue={props.initialValues["formpaymentName"]}
                            style={{ width: "100%", color: formpaymentText ? "red" : "inherit" }}
                            SelectProps={{ disabled: fieldDisabled }}
                            onChange={(_, display) => formpaymentName.current = display} />
                    </Form.Item>
                </Popover>
            </Col>
        </Row>
        <Row>
            <Col span={12}>
                <Popover content={transporterText} visible={transporterText ? undefined : false} mouseEnterDelay={1}>
                    <Form.Item
                        name='transporter'
                        label='Грузоперевозчик'
                        rules={[
                            { required: !pickupFlag },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!pickupFlag && value && !value.value) {
                                        return Promise.reject(new Error("Необходимо определить 'Грузоперевозчик'"));
                                    }
                                    return Promise.resolve();
                                },
                            }),
                        ]}
                        labelCol={{ flex: "2 2 0" }}
                        wrapperCol={{ flex: "7 7 0" }}
                        className={transporterText ? "another-value" : ""}>
                        <DataSelectObj
                            uri={"refbooks/company/company/getlist"}
                            params={{ filters: { attributeId: 8046 } }}
                            valueName="companyId"
                            displayValueName="companyName"
                            style={{ width: "100%" }}
                            allowClear={pickupFlag}
                            SelectProps={{
                                disabled: fieldDisabled,
                                className: transporterText ? "dataLookup-another-value" : ""
                            }} />
                    </Form.Item>
                </Popover>
            </Col>
            <Col span={7}>
                <Popover content={requestLoadoperflagText} visible={requestLoadoperflagText ? undefined : false} mouseEnterDelay={1}>
                    <Form.Item
                        name='requestLoadoperflag'
                        label='Погрузо-разгрузочные работы'
                        valuePropName='checked'
                        getValueFromEvent={intFlagFromCheckboxEvent}
                        rules={[
                            { required: true }
                        ]}
                        labelCol={{ span: 20 }}
                        className={requestLoadoperflagText ? "another-value" : ""}>
                        <Checkbox disabled={fieldDisabled} />
                    </Form.Item>
                </Popover>
            </Col>
            <Col span={5}>
                <Popover content={requestTempregflagText} visible={requestTempregflagText ? undefined : false} mouseEnterDelay={1}>
                    <Form.Item
                        name='requestTempregflag'
                        label='Температурный режим'
                        valuePropName='checked'
                        getValueFromEvent={intFlagFromCheckboxEvent}
                        rules={[
                            { required: true }
                        ]}
                        labelCol={{ span: 20 }}
                        className={requestTempregflagText ? "another-value" : ""}>
                        <Checkbox disabled={fieldDisabled} />
                    </Form.Item>
                </Popover>
            </Col>
        </Row>

        <ModuleHeader
            title={"Позиции"}
            showBackButton={false}
            showButtonsInMobile={true}
            search={false}
            buttons={buttons}
        >
            <Row style={{ width: "640px" }}>
                <Col span={8}>
                    {sumText ? (
                        <Popover content={sumText}>
                            <Form.Item
                                name='sum'
                                label='Итого сумма'
                                labelCol={{ span: 12 }}
                                wrapperCol={{ span: 12 }}>
                                <Input className="inputSummary" disabled={true} />
                            </Form.Item>
                        </Popover>
                    ) : (
                        <Form.Item
                            name='sum'
                            label='Итого сумма'
                            labelCol={{ span: 12 }}
                            wrapperCol={{ span: 12 }}>
                            <Input className="inputSummary" disabled={true} />
                        </Form.Item>
                    )}
                </Col>
                <Col span={8}>
                    {pointsText ? (
                        <Popover content={pointsText}>
                            <Form.Item
                                name='points'
                                label='Итого баллы'
                                labelCol={{ span: 12 }}
                                wrapperCol={{ span: 12 }}>
                                <Input className="inputSummary" disabled={true} />
                            </Form.Item>
                        </Popover>
                    ) : (
                        <Form.Item
                            name='points'
                            label='Итого баллы'
                            labelCol={{ span: 12 }}
                            wrapperCol={{ span: 12 }}>
                            <Input className="inputSummary" disabled={true} />
                        </Form.Item>
                    )}
                </Col>
                <Col span={8}>
                    {weightText ? (
                        <Popover content={weightText}>
                            <Form.Item
                                name='weight'
                                label='Итого вес (кг)'
                                labelCol={{ span: 12 }}
                                wrapperCol={{ span: 12 }}>
                                <Input className="inputSummary" disabled={true} />
                            </Form.Item>
                        </Popover>
                    ) : (
                        <Form.Item
                            name='weight'
                            label='Итого вес (кг)'
                            labelCol={{ span: 12 }}
                            wrapperCol={{ span: 12 }}>
                            <Input className="inputSummary" disabled={true} />
                        </Form.Item>
                    )}
                </Col>
            </Row>
        </ModuleHeader>
        <Form.Item
            name='positions'
            wrapperCol={{ offset: 0 }}>
            <MemoryDataTable className="mod-main-table"
                columns={getColumns()}
                editCallBack={(record) => callForm(record[ID_NAME], record)}
                interface={tableInterface}
                onSelectedChange={() => forceUpdate()}
                onAfterRefresh={() => setUpdateRecords([])}
                updateRecords={updateRecords}
                idName={ID_NAME}
                onAfterDelete={() => forceUpdate()}
                rowClassName={(record) => (requestType === REQUEST_APPROVAL && record["requestPlanPosCount"] === undefined) ? "newRecord" : ""}
            />
        </Form.Item>
        <EditForm
            id={EDIT_FORM_ID}
            copyButtonFlag={true}
            visible={formVisible}
            form={form}
            width={FORM_WIDTH}
            editorContext={editorContext}
            afterSave={(response) => {
                setFormVisible(false);
                if (response) {
                    if (!editorContext.id) {
                        afterAdd(response)
                    } else {
                        afterEdit(response)
                    }
                }
            }}
            afterCopy={afterAdd}
            afterCancel={() => {
                setFormVisible(false);
            }}
            idName={ID_NAME}
            convertors={CONVERTORS}
            status={status}>
            {buildForm(form, props.form.getFieldValue("positions"),
                moment(props.form.getFieldValue("documentRealDate"))
                    ? moment(props.form.getFieldValue("documentRealDate")).valueOf()
                    : null, status, isProvider, requestType)}
        </EditForm>
        <EditForm
            id={EDIT_FORM_RECEIVE_ID}
            copyButtonFlag={false}
            visible={formReceiveVisible}
            form={form}
            width={FORM_WIDTH}
            editorContext={editorContext}
            afterSave={(response) => {
                setFormReceiveVisible(false);
                if (response) {
                    if (!editorContext.id) {
                        afterAdd(response)
                    } else {
                        afterEdit(response)
                    }
                }
            }}
            afterCopy={afterAdd}
            afterCancel={() => {
                setFormReceiveVisible(false);
            }}
            idName={ID_NAME}
            convertors={CONVERTORS}
            status={status}>
            {buildReceiveForm(form, props.form.getFieldValue("positions"),
                moment(props.form.getFieldValue("documentRealDate"))
                    ? moment(props.form.getFieldValue("documentRealDate")).valueOf()
                    : null, status, isProvider, requestType, editDate)}
        </EditForm>
        {topLayer.map(item => item)}
    </Form>
}

export default RequestForm;