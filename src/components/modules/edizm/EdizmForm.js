import React from 'react';
import { Form, Input, Checkbox } from 'antd';
import { FORM_ITEMS_LAYOUT } from "../../lib/Const";
// import { DateInput } from "../../lib/DateInput";
// import Numbering from "../../lib/Numbering";


const EdizmForm = (props) => {
    const firstInputRef = React.useRef(null);
    // const [year, setYear] = React.useState();

    React.useEffect(() => {
        setTimeout(() => {
            firstInputRef.current.focus({
                cursor: 'end',
            })
        }, 100);
    });

    const handleChange = (changedFields, allFields) => {
        // setYear(props.form.getFieldValue("edizmDate") !== null ? props.form.getFieldValue("edizmDate").year() : undefined);
        props.onFieldsChange(changedFields, allFields)
    }

    return <Form
        {...FORM_ITEMS_LAYOUT}
        form={props.form}
        layout="horizontal"
        name="formEdizm"
        onFieldsChange={handleChange}
        initialValues={props.initialValues}
    >

        <Form.Item
            name="edizmCode"
            label="Код"
            rules={[
                { required: true },
                { max: 20 }
            ]}>
            <Input ref={firstInputRef} style={{ width: 200 }} />
        </Form.Item>

        <Form.Item
            name="edizmNotation"
            label="Обозначение"
            rules={[
                { required: true },
                { max: 15 }
            ]}>
            <Input style={{ width: 200 }} />
        </Form.Item>

        <Form.Item
            name="edizmName"
            label="Наименование"
            rules={[
                { max: 50 },
            ]}>
            <Input />
        </Form.Item>

        <Form.Item
            name="edizmBlockFlag"
            label="Блокировка"
            valuePropName="checked"
            getValueFromEvent={(event) => {
                return event.target.checked ? 1 : 0;
            }}
        >
            <Checkbox></Checkbox>
        </Form.Item>

        {/* <Form.Item
            name="edizmDate"
            label="Дата">
            <DateInput />
        </Form.Item>

        <Form.Item
            name="edizmNumber"
            label="Номер">
            <Numbering docEntityName="invoice" params={{ year: year }} />
        </Form.Item> */}

    </Form>
}

export default EdizmForm;