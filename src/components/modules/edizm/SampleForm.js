import React from 'react';
import { Form } from 'antd';
import { FORM_ITEMS_LAYOUT } from "../../lib/Const";


export const SampleForm = (props) => {
    const firstInputRef = React.useRef(null);

    React.useEffect(() => {
        setTimeout(() => {
            if (firstInputRef.current)
                firstInputRef.current.focus({
                    cursor: 'end',
                })
        }, 100);
    })

    return <Form
        {...FORM_ITEMS_LAYOUT}
        form={props.form}
        layout="horizontal"
        name="formSample"
        onFieldsChange={props.onFieldsChange}
        initialValues={props.initialValues}>
    </Form>

}
