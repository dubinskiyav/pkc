import React from 'react';
import {
    Menu, Modal, Form, Checkbox, Input, notification,
    InputNumber, Select
} from 'antd';
import { PrinterOutlined, RetweetOutlined } from '@ant-design/icons'
import DataTable from "../DataTable";
import { DateInput, DateInputRange } from "../DateInput";
import DataSelect from "../DataSelect";
import { FORM_ITEMS_LAYOUT_FOR_PRINT, MSG_REQUEST_ERROR, MSG_REPORT_RUNNING, CasheTypes } from "../Const";
import requestToAPI from "../Request";
import DataLookup from '../DataLookup';
import { isMobile } from '../Responsive'

const { Option } = Select;

let lastPrintForm = {};
const setLastPrintForm = (pf, config, record) => {
    if (!record) {
        lastPrintForm.module = pf;
    } else {
        lastPrintForm.entity = pf;
    }
    if (config.forceUpdateModule) {
        config.forceUpdateModule();
    }
}


export const buildPrintMenu = (moduleCode, config) =>
    <React.Fragment>
        <Menu.Item key="print" icon={<PrinterOutlined />} onClick={(ev) => handlePrintMenu(ev, moduleCode, config)}>Печать...</Menu.Item>
        {lastPrintForm.module ? <Menu.Item key="lastprint" icon={<RetweetOutlined />} onClick={(ev) => {
            process(lastPrintForm.module, config);
            if (ev.domEvent) {
                ev.domEvent.stopPropagation();
            }
        }}>Повторить печать ...</Menu.Item> : ""}
    </React.Fragment>

const handlePrintMenu = (ev, moduleCode, config) => {
    chooseReport({ moduleCode }, (okFlag, selectValueObject) => {
        if (okFlag) {
            process(selectValueObject, config);
        }
    });
}


export const buildEntityPrintMenu = (entityCode, record, config) => {
    return <React.Fragment>
        <Menu.Item key="print" shorthotkey={{ keyCode: 80, ctrlKey: true }} icon={<PrinterOutlined />}
            onClick={(ev) => handleEntityPrintMenu(ev, entityCode, record, config)}>Печать документа...</Menu.Item>
        {lastPrintForm.entity ? <Menu.Item key="lastprint" shorthotkey={{ keyCode: 80, ctrlKey: true, shiftKey: true }}
            icon={<RetweetOutlined />} onClick={(ev) => {
                process(lastPrintForm.entity, config, record);
                if (ev.domEvent) {
                    ev.domEvent.stopPropagation();
                }
            }}>Повторить печать ...</Menu.Item> : ""}
    </React.Fragment>
}


const handleEntityPrintMenu = (ev, entityCode, record, config) => {
    if (ev.domEvent) {
        ev.domEvent.stopPropagation(); // чтобы предовратить запуск окна редактирования
    }
    chooseReport({ entityCode, moduleCode:config.moduleCode }, (okFlag, selectValueObject) => {
        if (okFlag) {
            process(selectValueObject, config, record);
        }
    });
}

const tableInterface = { isLoading: () => false, getSelectedRows: () => [], SetRows: (value) => [] };


const chooseReport = (code, finalyCB) => {

    const checkInput = (closeFunc) => {
        if (tableInterface.getSelectedRows().length > 0) {
            const rec = tableInterface.getSelectedRecords()[0];
            finalyCB(true, rec);
            closeFunc();
            return;
        }
        notification.error({
            message: "Необходимо выбрать форму"
        })
    }

    Modal.confirm({
        centered: true,
        title: 'Выбор печатной формы',
        width: isMobile() ? undefined : "50%",
        content: (
            <div>
                <DataTable className="mod-main-table"
                    pagination={{ pageSize: 5 }}
                    selectType="radio"
                    editable={false}
                    uri={{
                        forSelect: "reports/getlist"
                    }}
                    onBeforeRefresh={(params) => {
                        params.filters.module = code.moduleCode;
                        params.filters.entity = code.entityCode;
                        return true;
                    }}
                    autoRefresh={true}
                    onAfterRefresh={()  => {
                        if (lastPrintForm.module)
                            tableInterface.SetRows([lastPrintForm.module.code]);                   
                    }}                    
     
                    columns={[
                        {
                            title: 'Наименование',
                            dataIndex: 'name',
                            ellipsis: true,
                            defaultSortOrder: 'ascend',
                        },
                        {
                            title: 'Код',
                            dataIndex: 'code',
                            ellipsis: true,
                            width: "80px"
                        }
                    ]}
                    interface={tableInterface}
                    idName={"code"}
                    defaultSelectRows={true}
                />
            </div>
        ),
        onOk: (closeFunc) => checkInput(closeFunc),
        onCancel: () => finalyCB(false),
        okText: "Выбрать"
    });

}

const process = (pf, config, record) => {
    setLastPrintForm(pf, config, record);
    console.log("print form ", pf);
    if (record) {
        console.log("--- for record ", record);
        if (!config.idName)
            throw new Error("Record menu config.idName is undefined");
    }


    const handleOk = (closeFunc) => {
        config.form.validateFields()
            .then((values) => {
                requestToServer(values, closeFunc);
            })
    }

    const requestToServer = (paramValues, closeFunc) => {
        if (record) {
            paramValues[config.idName] = record[config.idName];
        }
        runReport(pf, paramValues);
        closeFunc();
    }

    if (Object.keys(pf.params).length > 0) {
        Modal.confirm({
            centered: true,
            title: 'Выбор значений параметров: ' + pf.name,
            width: isMobile() ? undefined : "50%",
            content: (
                <Form
                    {...FORM_ITEMS_LAYOUT_FOR_PRINT}
                    form={config.form}
                    layout="horizontal"
                    name="formPrintParams"
                    initialValues={genInitValues(pf.params)}>
                    {pf.paramsOrder.map(k => genFormItem(pf.params[k]))}
                </Form>
            ),
            onOk: handleOk,
            onCancel: () => { },
            okText: "Выбрать"
        });
        config.form.resetFields();
    } else {
        let paramValues = {};
        if (record) {
            paramValues[config.idName] = record[config.idName];
        }
        runReport(pf, paramValues);
    }

}

const openTabForFile = (stream, fileName) => {
    const url = window.URL.createObjectURL(stream);
    const win = window.open(url, '_blank');
    //встроенный блокировщик всплывающих окон
    if (win === null) {
        notification.warning({
            message: "Включен блокировщик всплывающих окон",
            description: "Чтобы увидеть результат отключите блокировщик всплывающих окон"
        });
    }
}

const runReport = (pf, paramValues) => {
    console.log("print form", pf);
    console.log("paramValues", paramValues);

    Object.keys(paramValues).forEach(k => {
        const parValue = paramValues[k];
        const paramDesc = pf.params[k];
        if (paramDesc && parValue) {
            switch (paramDesc.type) {
                case "Date":
                    paramValues[k] = parValue.toDate().getTime();
                    break;
                case "DateRange":
                    paramValues[k] = [
                        parValue[0].toDate().getTime(),
                        parValue[1].toDate().getTime()
                    ]
                    break;
                case "Integer":
                    if (typeof parValue == "string") {
                        paramValues[k] = parseInt(parValue);
                    }
                    break;
                case "Boolean":
                    if (typeof parValue == "number") {
                        paramValues[k] = parValue != 0;
                    } else
                        if (typeof parValue == "string") {
                            paramValues[k] = JSON.parse(parValue.toLowerCase());
                        }
                    break;
                default:
                    throw new Error("Неизвестный тип");
            }

        }
    })
    notification.success({
        message: MSG_REPORT_RUNNING,
        description: "После подготовки формы на сервере она откроется в отдельной вкладке или появится в виде скачанного файла"
    })

    requestToAPI.post("reports/run", { code: pf.code, params: paramValues })
        .then(response => {
            const pfResult = response;
            //console.log("run response = ",pfResult);
            requestToAPI.post(response.url, {}, { extResponse: true })
                .then(response => response.blob())
                .then(blob => {
                    openTabForFile(blob, pfResult.nameResult);
                })
                .catch(error => {
                    notification.error({
                        message: MSG_REQUEST_ERROR,
                        description: error.message
                    })
                })
        })
        .catch(error => {
            notification.error({
                message: MSG_REQUEST_ERROR,
                description: error.message
            })
        })
}

const genFormItem = (paramDesc) => {
    return <Form.Item
        key={paramDesc.name}
        name={paramDesc.name}
        label={paramDesc.label}
        valuePropName={paramDesc.type == "Boolean" ? "checked" : undefined}
        rules={[{
            required: paramDesc.options ? !paramDesc.options.nulleable : false,
            message: "Поле обязательно для ввода"
        }
        ]}>
        {genInputComponent(paramDesc)}
    </Form.Item>
}

const SelectWrapper = React.forwardRef((props, ref) => {
    const { children, value, ...otherprops } = props;
    return <Select labelInValue
        ref={ref}
        defaultValue={{ value: '' + props.value }}
        {...otherprops}>{children}</Select>
})

const CapCodeSelectWrapper = React.forwardRef((props, ref) => {
    const { value = {}, ...otherprops } = props;
    return <DataSelect.CapCodeSelect
        ref={ref}
        value={value.value}
        displayValue={value.displayText}
        {...otherprops} />;
})

const DataSelectWrapper = React.forwardRef((props, ref) => {
    const { value = {}, ...otherprops } = props;
    return <DataSelect
        ref={ref}
        value={value.value}
        displayValue={value.displayText}
        {...otherprops} />;
})

const genInputComponent = (paramDesc) => {
    switch (paramDesc.type) {
        case "Integer":
            switch (paramDesc.subType) {
                case "CapCode":
                    return <CapCodeSelectWrapper
                        capCodeType={paramDesc.options.capCodeTypeId}
                        allowClear={paramDesc.options.nulleable}
                        casheType={paramDesc.options.cashable ? CasheTypes.LocalStorage : CasheTypes.None} />;
                case "Select":
                    if (paramDesc.options.uri) {
                        return <DataSelectWrapper
                            uri={paramDesc.options.uri}
                            params={paramDesc.options.dataForPost ? JSON.parse(paramDesc.options.dataForPost) : undefined}
                            valueName={paramDesc.options.valueName}
                            displayValueName={paramDesc.options.displayValueName}
                            allowClear={paramDesc.options.nulleable}
                            casheType={paramDesc.options.cashable ? CasheTypes.LocalStorage : CasheTypes.None} />;
                    } else {
                        // простой select с values
                        const options = paramDesc.options.values.map(v =>
                            <Option key={v.value}>{v.displayText}</Option>);
                        return <SelectWrapper
                            allowClear={paramDesc.options.nulleable}
                        >
                            {options}
                        </SelectWrapper>

                    }
                case "Subject":
                    return <DataLookup.Subject />
                //TODO
                case "SGood":
                    //TODO
                    break;
                case "Lookup":
                    //TODO
                    break;
                default:
                    return <InputNumber />;
            };
            return;
        case "Boolean":
            return <Checkbox />;
        case "String":
            return <Input />;
        case "Date":
            return <DateInput />;
        case "DateRange":
            return <DateInputRange />;
        default:
            return;
    }
}

const genInitValues = (params) => {
    let values = {};
    Object.keys(params)
        .filter(k => params[k].initValue != null)
        .map(k => values[k] = params[k].initValue.value);
    return values;
}
