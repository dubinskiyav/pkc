import React from 'react';
import { Form, Input } from 'antd';
import { FORM_ITEMS_LAYOUT } from "../../lib/Const";
import DataSelect from "../../lib/DataSelect";
import DataLookup from '../../lib/DataLookup';

const ProguserForm = (props) => {
    const firstInputRef = React.useRef(null);

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
        name="formProguser"
        onFieldsChange={props.onFieldsChange}
        initialValues={props.initialValues}>
        <Form.Item
            name='statusId'
            label='Статус'
            normalize={(value)=>parseInt(value)}
            rules={[
                { required: true }
            ]}>
            <DataSelect.CapCodeSelect capCodeType={13} ref={firstInputRef} displayValue={props.initialValues["statusDisplay"]}/>
        </Form.Item>
        <Form.Item
            name='proguserName'
            label='Наименование'
            rules={[
                { required: true },
                { max: 50 }
            ]}>
            <Input  />
        </Form.Item>
        <Form.Item
            name='proguserFullname'
            label='Описание'
            rules={[
                { max: 50 }
            ]}>
            <Input  />
        </Form.Item>
        <Form.Item
            name='proguserchannelAddress'
            label='E-mail'
            rules={[
                { max: 128 },
                { type: 'email'}
                ]}>
            <Input  />
        </Form.Item>
        <Form.Item
            name='subject'
            label='ОАУ'
            rules={[
                { required: true }
            ]}>
            <DataLookup.Subject />
        </Form.Item>
    </Form>
}

export default ProguserForm;