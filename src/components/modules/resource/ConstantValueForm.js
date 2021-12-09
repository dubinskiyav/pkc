import React from 'react';
import { Form, Input, InputNumber, Checkbox } from 'antd';
import { FORM_ITEMS_LAYOUT } from "../../lib/Const";
import { DateInput } from "../../lib/DateInput";

const ConstantValueForm = (props) => {
    const firstInputRef = React.useRef(null);
    const constantTypeId = props.initialValues["constantTypeId"];

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
        name="formConstantValue"
        onFieldsChange={props.onFieldsChange}
        initialValues={props.initialValues}>
        <Form.Item
            name='constantId'
            hidden={true}>
            <Input />
        </Form.Item>
        <Form.Item
            name='constantValueDatebeg'
            label='Дата'
            rules={[
                { required: true }
            ]}>
            <DateInput ref={firstInputRef} />
        </Form.Item>
        {constantTypeId == 1 &&
            <Form.Item
                name='constantValueInteger'
                label='Значение'
                rules={[
                    { required: true }
                ]}>
                <InputNumber precision={0} />
            </Form.Item>
        }
        {constantTypeId == 2 &&
            <Form.Item
                name='constantValueBoolean'
                label='Значение'
                valuePropName="checked"
                getValueFromEvent={(event) => {
                    return event.target.checked ? 1 : 0;
                }}>
                <Checkbox />
            </Form.Item>
        }
        {constantTypeId == 3 &&
            <Form.Item
                name='constantValueString'
                label='Значение'
                rules={[
                    { required: true },
                    { max: 255 }
                ]}>
                <Input />
            </Form.Item>
        }
        {constantTypeId == 4 &&
            <Form.Item
                name='constantValueDate'
                label='Значение'
                rules={[
                    { required: true }
                ]}>
                <DateInput />
            </Form.Item>
        }
        {constantTypeId == 5 &&
            <Form.Item
                name='constantValueFloat'
                label='Значение'
                rules={[
                    { required: true }
                ]}>
                <InputNumber />
            </Form.Item>
        }
        {constantTypeId == 6 &&
            <Form.Item
                name='constantValueMoney'
                label='Значение'
                rules={[
                    { required: true }
                ]}>
                <InputNumber precision={2} />
            </Form.Item>
        }
    </Form>
}

export default ConstantValueForm;