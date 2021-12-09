import React from 'react';
import { Form, Input, Checkbox, Tabs, Select } from 'antd';
import { FORM_ITEMS_LAYOUT } from "../../lib/Const";
import { DateInput } from "../../lib/DateInput";
import DataTransfer from "../../lib/DataTransfer";
import DataSelect from "../../lib/DataSelect";
import DataTreeSelect from '../../lib/DataTreeSelect';
import { buildURL, genDefParamsForGetAllList } from "../../lib/Utils";
import { CONTOUR_ADMIN, MODULE_CREDENTIAL, MODULE_CONFIG } from '../../lib/ModuleConst';
import { RESOURCE_ATTRIBUTE, RESOURCE_CONSTANT, RESOURCE_NUMBERING, RESOURCE_PRINTFORM } from '../../lib/CapResourceType';

const { TabPane } = Tabs;
const { TextArea } = Input;
const { Option } = Select;

const CapResourceForm = (props) => {
    const firstInputRef = React.useRef(null);
    const resourceTypeId = props.initialValues.resourceTypeId;
    const readyForm = Object.keys(props.initialValues).length > 0;
    const [attributeCapClassTypeDisabled, setAttributeCapClassTypeDisabled] = React.useState(false);
    const [attributeSubjectDisabled, setAttributeSubjectDisabled] = React.useState(false);

    React.useEffect(() => {
        setTimeout(() => {
            firstInputRef.current.focus({
                cursor: 'end',
            })
        }, 100);
    });

    React.useEffect(() => {
        if (readyForm) {
            setAttributeCapClassTypeDisabled(props.initialValues["attributeTypeId"] != 411);
            setAttributeSubjectDisabled(props.initialValues["attributeTypeId"] != 408);
        }
    }, [readyForm, props.initialValues, props.form, resourceTypeId]);

    return <Form
        {...FORM_ITEMS_LAYOUT}
        form={props.form}
        layout="horizontal"
        name="formCapResource"
        onFieldsChange={props.onFieldsChange}
        initialValues={props.initialValues}>

        <Form.Item
            name='resourceTypeId'
            hidden={true}>
            <Input />
        </Form.Item>

        <Tabs defaultActiveKey="1">
            <TabPane tab="Общие" key="1">
                <Form.Item
                    name='artifactCode'
                    label='Код'
                    rules={[
                        { max: 15 }
                    ]}>
                    <Input disabled={(resourceTypeId == RESOURCE_PRINTFORM) || (resourceTypeId == RESOURCE_NUMBERING)} ref={firstInputRef} />
                </Form.Item>
                <Form.Item
                    name='artifactName'
                    label='Наименование'
                    rules={[
                        { required: true },
                        { max: 128 }
                    ]}>
                    <Input />
                </Form.Item>
                <Form.Item
                    name="artifactVisibleFlag"
                    label="Блокировка"
                    valuePropName="checked"
                    getValueFromEvent={(event) => {
                        return event.target.checked ? 1 : 0;
                    }}>
                    <Checkbox />
                </Form.Item>
                <Form.Item
                    name='constantGroupId'
                    label='Группа'
                    normalize={(value) => parseInt(value)}
                    rules={[
                        { required: resourceTypeId == RESOURCE_CONSTANT }
                    ]}
                    hidden={resourceTypeId != RESOURCE_CONSTANT}>
                    <DataSelect.CapClassSelect capClassType={21} displayValue={props.initialValues["constantGroupName"]} style={{ width: "100%" }} />
                </Form.Item>
                <Form.Item
                    name='constantTypeId'
                    label='Тип'
                    normalize={(value) => parseInt(value)}
                    rules={[
                        { required: resourceTypeId == RESOURCE_CONSTANT }
                    ]}
                    hidden={resourceTypeId != RESOURCE_CONSTANT}>
                    <Select key="constantTypeId" style={{ width: "100%" }} disabled={props.initialValues.artifactId !== null}>
                        <Option key={1} value={1}>Целый</Option>
                        <Option key={2} value={2}>Логический</Option>
                        <Option key={3} value={3}>Текст</Option>
                        <Option key={4} value={4}>Дата</Option>
                        <Option key={5} value={5}>Вещественный</Option>
                        <Option key={6} value={6}>Денежная сумма</Option>
                    </Select>
                </Form.Item>
                <Form.Item
                    name='attributeGroupId'
                    label='Группа'
                    normalize={(value) => parseInt(value)}
                    rules={[
                        { required: resourceTypeId == RESOURCE_ATTRIBUTE }
                    ]}
                    hidden={resourceTypeId != RESOURCE_ATTRIBUTE}>
                    <DataSelect.CapClassSelect capClassType={20} displayValue={props.initialValues["attributegroupName"]} style={{ width: "100%" }} />
                </Form.Item>
                <Form.Item
                    name='attributeTypeId'
                    label='Тип'
                    normalize={(value) => parseInt(value)}
                    rules={[
                        { required: resourceTypeId == RESOURCE_ATTRIBUTE }
                    ]}
                    hidden={resourceTypeId != RESOURCE_ATTRIBUTE}>
                    <Select key="attributeTypeId" style={{ width: "100%" }}
                        onChange={(value) => {
                            setAttributeCapClassTypeDisabled(props.form.getFieldValue("attributeTypeId") != 411)
                            setAttributeSubjectDisabled(props.form.getFieldValue("attributeTypeId") != 408)
                        }}
                        disabled={props.initialValues.artifactId !== null}>
                        <Option key={400} value={400}>Не указан</Option>
                        <Option key={401} value={401}>Вещественный</Option>
                        <Option key={402} value={402}>Целый</Option>
                        <Option key={403} value={403}>Дата</Option>
                        <Option key={404} value={404}>Строка</Option>
                        <Option key={409} value={409}>Дата и время</Option>
                        <Option key={411} value={411}>Справочник</Option>
                        <Option key={408} value={408}>ОАУ</Option>
                    </Select>
                </Form.Item>
                <Form.Item
                    name='attributeCapClassTypeId'
                    label='Справочник'
                    normalize={(value) => parseInt(value)}
                    rules={[
                        { required: resourceTypeId == RESOURCE_ATTRIBUTE && !attributeCapClassTypeDisabled }
                    ]}
                    hidden={resourceTypeId != RESOURCE_ATTRIBUTE}>
                    <DataSelect
                        uri={"system/capclasstype/getlist"}
                        valueName="capClassTypeId"
                        displayValueName="capClassTypeName"
                        displayValue={props.initialValues["attributeCapclasstypeName"]}
                        style={{ width: "100%" }}
                        SelectProps={{ disabled: attributeCapClassTypeDisabled }} />
                </Form.Item>
                <Form.Item
                    name='attributeSubject'
                    label='Уровень ОАУ'
                    rules={[
                        { required: resourceTypeId == RESOURCE_ATTRIBUTE && !attributeSubjectDisabled }
                    ]}
                    hidden={resourceTypeId != RESOURCE_ATTRIBUTE}>
                    <DataTreeSelect.Subject disabled={attributeSubjectDisabled} />
                </Form.Item>
                <Form.Item
                    name="attributeHistoricityFlag"
                    label="Исторический"
                    valuePropName="checked"
                    getValueFromEvent={(event) => {
                        return event.target.checked ? 1 : 0;
                    }}
                    hidden={resourceTypeId != RESOURCE_ATTRIBUTE}>
                    <Checkbox />
                </Form.Item>
            </TabPane>
            <TabPane tab="Описание" key="2">
                <Form.Item
                    name='artifactAutor'
                    label='Автор'
                    rules={[
                        { max: 50 }
                    ]}>
                    <Input />
                </Form.Item>
                <Form.Item
                    name='artifactDate'
                    label='Дата создания'
                    rules={[

                    ]}>
                    <DateInput />
                </Form.Item>
                <Form.Item
                    name='artifactRemark'
                    label='Описание'
                    rules={[

                    ]}>
                    <TextArea rows={8} style={{ width: "100%" }} />
                </Form.Item>
            </TabPane>
            <TabPane tab={"Документы"} disabled={resourceTypeId == RESOURCE_CONSTANT} key="3">
                <Form.Item
                    name="artifactDocumentIds"
                    valuePropName="targetKeys">
                    <DataTransfer
                        uri={buildURL(CONTOUR_ADMIN, MODULE_CONFIG, "Document") + "/getlist"}
                        params={genDefParamsForGetAllList("documentName")}
                        onRender={item => item.documentName}
                        ready={readyForm}
                        disabled={(resourceTypeId == RESOURCE_PRINTFORM) || (resourceTypeId == RESOURCE_NUMBERING)}
                    />
                </Form.Item>
            </TabPane>
            <TabPane tab={"Модули"} key="4">
                <Form.Item
                    name="artifactApplicationIds"
                    valuePropName="targetKeys">
                    <DataTransfer
                        uri={buildURL(CONTOUR_ADMIN, MODULE_CREDENTIAL, "Application") + "/getlist"}
                        params={genDefParamsForGetAllList("applicationName")}
                        onRender={item => item.applicationName}
                        ready={readyForm}
                        disabled={(resourceTypeId == RESOURCE_PRINTFORM) || (resourceTypeId == RESOURCE_NUMBERING)}
                    />
                </Form.Item>
            </TabPane>
        </Tabs>
    </Form>
}

export default CapResourceForm;