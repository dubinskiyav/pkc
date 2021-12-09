import React from 'react';
import { Form, Input, Checkbox, InputNumber, Radio, Row, Col } from 'antd';
import { CasheTypes, FORM_ITEMS_LAYOUT } from "../../lib/Const";
import { CONTOUR_ADMIN, MODULE_CREDENTIAL } from '../../lib/ModuleConst';
import MultiDataSelect from '../../lib/MultiDataSelect';
import { buildURL } from "../../lib/Utils";
import { CirclePicker } from 'react-color';

const DocumentTransitForm = (props) => {
    const firstInputRef = React.useRef(null);
    const allStatuses = props.allStatuses.data
        .filter(value => value.documentTransitId != props.initialValues.documentTransitId);

    React.useEffect(() => {
        setTimeout(() => {
            firstInputRef.current.focus({
                cursor: 'end',
            })
        }, 100);
    });

    return <Form
        {...FORM_ITEMS_LAYOUT}
        form={props.form}
        layout="horizontal"
        name="formDocumentTransit"
        onFieldsChange={props.onFieldsChange}
        initialValues={props.initialValues}>
        <Form.Item
            name='documentTransitColor'
            label='Значок'
            rules={[
                { required: true }
            ]}
            getValueFromEvent={event => (event.rgb.r << 16) + (event.rgb.g << 8) + (event.rgb.b)}>
            <CirclePicker
                color={{
                    r: (props.initialValues["documentTransitColor"] & 0xff0000) >> 16,
                    g: (props.initialValues["documentTransitColor"] & 0x00ff00) >> 8,
                    b: (props.initialValues["documentTransitColor"] & 0x0000ff)
                }}
                colors={["#f44336", "#e91e63", "#9c27b0", "#673ab7", "#3f51b5",
                    "#2196f3", "#03a9f4", "#00bcd4", "#009688", "#4caf50",
                    "#8bc34a", "#cddc39", "#ffeb3b", "#ffc107", "#ff9800", "#ff5722"]}
                width="340px"
                triangle="hide" />
        </Form.Item>
        <Row key="lineOne">
            <Col span={16} key="colNumber">
                <Form.Item
                    name='documentTransitNumber'
                    label='Номер'
                    rules={[
                        { required: true },
                        ({ getFieldValue }) => ({
                            validator(_, value) {
                                if (value && allStatuses.filter(el => el["documentTransitNumber"] === value).length > 0) {
                                    return Promise.reject(new Error("Статус с таким номером уже существует"));
                                }
                                return Promise.resolve();
                            },
                        }),
                    ]}
                    labelCol={{ span: 12 }}>
                    <InputNumber ref={firstInputRef} parser={s => parseInt(s)} />
                </Form.Item>
            </Col>
            <Col span={8} key="colLevel">
                <Form.Item
                    name='documentTransitLevel'
                    label='Уровень'
                    rules={[
                        { required: true }
                    ]}
                    labelCol={{ span: 10 }}>
                    <InputNumber parser={s => parseInt(s)} />
                </Form.Item>
            </Col>
        </Row>
        <Form.Item
            name='documentTransitName'
            label='Наименование'
            rules={[
                { required: true },
                { max: 50 }
            ]}>
            <Input />
        </Form.Item>
        <Row key="lineSecond">
            <Col span={16} key="colFirst">
                <Form.Item
                    name='documentTransitCanedit'
                    label='Возможность изменения документа'
                    valuePropName="checked"
                    getValueFromEvent={(event) => {
                        return event.target.checked ? 1 : 0;
                    }}
                    labelCol={{ span: 12 }}>
                    <Checkbox />
                </Form.Item>
                <Form.Item
                    name='documentTransitCandelete'
                    label='Возможность удаления документа'
                    valuePropName="checked"
                    getValueFromEvent={(event) => {
                        return event.target.checked ? 1 : 0;
                    }}
                    labelCol={{ span: 12 }}>
                    <Checkbox />
                </Form.Item>
                <Form.Item
                    name='documentTransitAgreeedit'
                    label='Возможность изменения листа согласования'
                    valuePropName="checked"
                    getValueFromEvent={(event) => {
                        return event.target.checked ? 1 : 0;
                    }}
                    labelCol={{ span: 12 }}>
                    <Checkbox />
                </Form.Item>
            </Col>
            <Col span={8} key="colSecond">
                <Form.Item
                    name='documentTransitUseadmin'
                    label='Администрирование'
                    valuePropName="checked"
                    getValueFromEvent={(event) => {
                        return event.target.checked ? 1 : 0;
                    }}
                    labelCol={{ span: 20 }}>
                    <Checkbox />
                </Form.Item>
                <Form.Item
                    name='documentTransitTwicecheck'
                    label='Запрет повторения'
                    valuePropName="checked"
                    getValueFromEvent={(event) => {
                        return event.target.checked ? 1 : 0;
                    }}
                    labelCol={{ span: 20 }}>
                    <Checkbox />
                </Form.Item>
                <Form.Item
                    name='documentTransitFlaghistory'
                    label='Вести историю изменений'
                    valuePropName="checked"
                    getValueFromEvent={(event) => {
                        return event.target.checked ? 1 : 0;
                    }}
                    labelCol={{ span: 20 }}>
                    <Checkbox />
                </Form.Item>
            </Col>
        </Row>
        <Form.Item
            name='documentTransitLocksubj'
            label='Блокировка ОАУ'>
            <Radio.Group>
                <Radio value={0}>Не управлять блокировкой</Radio>
                <Radio value={1}>Разблокировать ОАУ</Radio>
                <Radio value={2}>Блокировать ОАУ</Radio>
            </Radio.Group>
        </Form.Item>
        <Form.Item
            name='transitChildIds'
            label='Предыдущие статусы'>
            <MultiDataSelect key="transitChildIds"
                // необязательный, используется, например, в кэше
                componentName={"transitChild"}
                data={allStatuses}
                valueName="documentTransitId"
                displayValueName="documentTransitName"
                style={{ width: "100%" }}
                allowClear={true} />
        </Form.Item>
        <Form.Item
            name='accessRoleIds'
            label='Роли, уполномоченные устанавливать статус'>
            <MultiDataSelect key="accessRoleId"
                // необязательный, используется, например, в кэше
                componentName={"accessRole"}
                uri={buildURL(CONTOUR_ADMIN, MODULE_CREDENTIAL, "AccessRole") + "/getlist"}
                params={{
                    "pagination": {
                        "current": 1,
                        "pageSize": -1
                    },
                    "sort": [
                        {
                            "field": "accessRoleName",
                            "order": "ascend"
                        }
                    ]
                }}
                valueName="accessRoleId"
                displayValueName="accessRoleName"
                cacheType={CasheTypes.LocalStorage}
                style={{ width: "100%" }}
                allowClear={true} />
        </Form.Item>
    </Form>
}

export default DocumentTransitForm;
