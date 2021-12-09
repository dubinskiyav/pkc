import React from 'react';
import { Form, Input, Checkbox } from 'antd';
import { FORM_ITEMS_LAYOUT } from "./Const";
import { intFlagFromCheckboxEvent } from "./Utils";

const CapClassForm = (props) => {
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
        name="formCapClass"
        onFieldsChange={props.onFieldsChange}
        initialValues={props.initialValues}>
        <Form.Item
            name='capClassTypeId'
            hidden={true}>
            <Input />
        </Form.Item>
        <Form.Item
            name='capClassCode'
            label='Код'
            rules={[
                { required: true },
                { max: 20 }
            ]}>
            <Input ref={firstInputRef} />
        </Form.Item>
        <Form.Item
            name='capClassName'
            label='Наименование'
            rules={[
                { required: true },
                { max: 255 }
            ]}>
            <Input />
        </Form.Item>
        <Form.Item
            name='capClassRemark'
            label='Примечание'
            rules={[
                { max: 255 }
            ]}>
            <Input />
        </Form.Item>
        <Form.Item
            name='capClassBlockflag'
            label='Блокировка'
            valuePropName='checked'
            getValueFromEvent={intFlagFromCheckboxEvent}
            rules={[
                { required: true }
            ]}>
            <Checkbox />
        </Form.Item>
    </Form>
}

export default CapClassForm;