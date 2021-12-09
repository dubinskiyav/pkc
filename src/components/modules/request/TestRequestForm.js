import React from 'react';
import { Form } from 'antd';
import { FORM_ITEMS_LAYOUT } from "../../lib/Const";
import Numbering from "../../lib/Numbering";
import { DateInput } from '../../lib/DateInput';
import DataSelect from '../../lib/DataSelect';


const TestRequestForm = (props) => {
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
        name="formTestRequest"
        onFieldsChange={props.onFieldsChange}
        initialValues={props.initialValues}>
        <Form.Item
            name='documentRealNumber'
            label='Номер'
            rules={[{
                max: 128,
                required: true
            }]}>
            {/* <Input /> */}
            <Numbering ref={firstInputRef} docEntityName="testrequest" />
        </Form.Item>
        <Form.Item
            name='documentRealDate'
            label='Дата'
            rules={[
                { required: true }
            ]}>
            <DateInput />
        </Form.Item>
        <Form.Item
            name='testRequestCapclassId'
            label='Типы ремонта'
            normalize={(value) => parseInt(value)}
            rules={[
                { required: true }
            ]}>
            <DataSelect.CapClassSelect capClassType={204} displayValue={props.initialValues["testRequestCapclassName"]} style={{ width: "100%" }} />
        </Form.Item>
    </Form>
}

export default TestRequestForm;