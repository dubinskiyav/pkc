import React from 'react';
import { Form, Input, InputNumber } from 'antd';
import { FORM_ITEMS_LAYOUT } from "../../lib/Const";
import DataLookup from '../../lib/DataLookup';
import { userProps } from '../../lib/LoginForm';
import { intFlagFromCheckboxEvent } from '../../lib/Utils';
import Checkbox from 'antd/lib/checkbox/Checkbox';
import { REQUEST_APPROVAL, REQUEST_DRAFT } from '../../lib/tentoriumConst';

const RequestPosForm = (props) => {
    const firstInputRef = React.useRef(null);
    const secondInputRef = React.useRef(null);
    const requestType = props.requestType;
    const sgoodDisabled = requestType !== REQUEST_DRAFT && props.initialValues["requestPosId"];

    React.useEffect(() => {
        setTimeout(() => {
            if (!sgoodDisabled) {
                if (firstInputRef.current) {
                    firstInputRef.current.focus({
                        cursor: 'end',
                    })
                }
            } else if (secondInputRef.current) {
                secondInputRef.current.focus({
                    cursor: 'end',
                })
            }
        }, 100);
    });

    const onChange = React.useCallback(() => {
        const sgood = props.form.getFieldValue("sgood");
        const requestPosRemains = props.form.getFieldValue("requestPosRemains");
        props.form.setFieldsValue({
            requestPosRemains: sgood && sgood.additional ? sgood.additional.requestPosRemains ?? requestPosRemains : null,
        })

        if (props.onFieldsChange) {
            props.onFieldsChange();
        }
    }, [props])

    return <Form
        {...FORM_ITEMS_LAYOUT}
        form={props.form}
        layout="horizontal"
        name="formRequestPos"
        onFieldsChange={onChange}
        initialValues={props.initialValues}>
        <Form.Item
            name='requestPosNumber'
            hidden={true}>
            <Input />
        </Form.Item>
        <Form.Item
            name='requestPlanPosCount'
            hidden={true}>
            <Input />
        </Form.Item>
        <Form.Item
            name='originalPos'
            hidden={true}>
            <Input />
        </Form.Item>
        <Form.Item
            name='sgood'
            label='Товар'
            rules={[
                { required: true },
                ({ getFieldValue }) => ({
                    validator(_, value) {
                        if (!value || !value.value) {
                            return Promise.reject(new Error("Необходимо определить 'Товар'"));
                        }
                        return Promise.resolve();
                    },
                }),
            ]}
            labelCol={{ span: 4 }}
            wrapperCol={{ span: 20 }}>
            <DataLookup.SGoodPrice
                params={{
                    priceType: 6,
                    priceTypeForPoints: 9,
                    dateForPrice: props.dateForPrice,
                    subjectId: props.isProvider ? userProps.subject.subjectId : userProps.parent.subjectId,
                }}
                ref={firstInputRef}
                disabled={sgoodDisabled}
                allowClear={true} />
        </Form.Item>
        <Form.Item
            name='requestPosRemains'
            label='Остаток на складе'
            labelCol={{ span: 4 }}
            wrapperCol={{ span: 20 }}>
            <InputNumber disabled={true} parser={s => parseInt(s)} />
        </Form.Item>
        <Form.Item
            name='requestPosCount'
            label='Количество'
            rules={[
                { required: true },
                ({ getFieldValue }) => ({
                    validator(_, value) {
                        const sgood = props.form.getFieldValue("sgood");
                        if (value && sgood && sgood.additional.sgoodFasFlag && (value % sgood.additional.packageQuantity !== 0)) {
                            return Promise.reject(new Error("Указанное количество не кратно " + sgood.additional.packageQuantity));
                        }
                        return Promise.resolve();
                    },
                }),
            ]}
            labelCol={{ span: 4 }}
            wrapperCol={{ span: 20 }}>
            <InputNumber ref={secondInputRef} parser={s => parseInt(s)} />
        </Form.Item>
        <Form.Item
            name='requestPosOrder'
            label='Под заказ'
            valuePropName='checked'
            getValueFromEvent={intFlagFromCheckboxEvent}
            labelCol={{ span: 4 }}
            wrapperCol={{ span: 20 }}
            hidden={requestType !== REQUEST_APPROVAL}>
            <Checkbox />
        </Form.Item>
    </Form>
}

export default RequestPosForm;