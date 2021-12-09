import React from 'react';
import { Form, Input, Checkbox } from 'antd';
import { FORM_ITEMS_LAYOUT } from "../../lib/Const";

export const SetPasswordProgUserForm = (props) => {
    const firstInputRef = React.useRef(null);

    React.useEffect(() => {
        const timerId = setTimeout(() => {
            if (firstInputRef.current)
                firstInputRef.current.focus({
                    cursor: 'end',
                })
        }, 100);
        return () => {
            clearTimeout(timerId)
        }
    });

    return <Form
        {...FORM_ITEMS_LAYOUT}
        form={props.form}
        layout="horizontal"
        name="formSetPassword"
        onFieldsChange={props.onFieldsChange}
        initialValues={{
            tempFlag: 1
        }}
        onSubmit={props.form.resetFields()}
        >
        <Form.Item
            name='newPassword'
            label='Новый пароль'
            rules={[
                { required: true }
            ]}>
            <Input.Password ref={firstInputRef} />
        </Form.Item>
        <Form.Item
            name='tempFlag'
            label='Временный пароль'
            getValueFromEvent={(event) => {
                return event.target.checked ? 1 : 0;
            }}>
            <Checkbox defaultChecked/>
        </Form.Item>
    </Form>
}
