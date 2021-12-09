import React from 'react';
import { Form, Input, InputNumber } from 'antd';
import { FORM_ITEMS_LAYOUT } from "../../lib/Const";
import { intFlagFromCheckboxEvent } from '../../lib/Utils';
import Checkbox from 'antd/lib/checkbox/Checkbox';
import { DateInput } from '../../lib/DateInput';

const PriceForm = (props) => {
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

    return <Form
        {...FORM_ITEMS_LAYOUT}
        form={props.form}
        layout="horizontal"
        name="formPrice"
        onFieldsChange={props.onFieldsChange}
        initialValues={props.initialValues}>
        <Form.Item
            name='priceSgoodSubjectDate'
            label='Дата'>
            <DateInput format="DD.MM.YYYY" disabled />
        </Form.Item>
        <Form.Item
            name='sgoodName'
            label='Товар'>
            <Input disabled />
        </Form.Item>
        <Form.Item
            name='sgoodPrice'
            label='Цена'>
            <InputNumber ref={firstInputRef} parser={s => parseFloat(s.replace(",", "."))} />
        </Form.Item>
        <Form.Item
            name='points'
            label='Баллы'>
            <InputNumber disabled parser={s => parseInt(s)} />
        </Form.Item>
        <Form.Item
            name='blockFlag'
            label='Блокировка'
            valuePropName='checked'
            getValueFromEvent={intFlagFromCheckboxEvent} >
            <Checkbox />
        </Form.Item>
    </Form>
}

export default PriceForm;