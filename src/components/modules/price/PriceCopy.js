import React from 'react';
import { Form, InputNumber } from 'antd';
import { FORM_ITEMS_LAYOUT } from "../../lib/Const";
import { DateInput } from '../../lib/DateInput';
import DataSelectObj from '../../lib/DataSelectObj';
import { drawDate } from '../../lib/Utils';
import { userProps } from '../../lib/LoginForm';

const PriceCopy = (props) => {
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
        name="formPriceCopy"
        onFieldsChange={props.onFieldsChange}
        initialValues={props.initialValues}>
        <Form.Item
            name='sourceDate'
            label='Копируем с даты'>
            <DataSelectObj
                uri={"refbooks/sgood/sgoodprice/getpricedates"}
                afterRefresh={response => {
                    let result = {};
                    result.result = response.map(value => {
                        return { id: value, value: drawDate(value) }
                    })
                    return result;
                }}
                params={{ selfOrProviderFlag: false }}
                valueName="id"
                displayValueName="value"
                style={{ width: "140px" }}
                allowClear={false}
                ref={firstInputRef} />
        </Form.Item>
        <Form.Item
            name='destDate'
            label='На дату'>
            <DateInput format="DD.MM.YYYY" style={{ width: "140px" }} />
        </Form.Item>
        <Form.Item
            name='forCustomerId'
            label='Для заказчика (ФСЦ)'>
            <DataSelectObj
                uri={"refbooks/company/company/branches"}
                params={userProps.subject.subjectId}
                afterRefresh={response => { return { result: response } }}
                valueName="companyId"
                displayValueName="companyName"
                style={{ width: "100%" }}
                allowClear={true} />
        </Form.Item>
        <Form.Item
            name='markup'
            label='Наценка'>
            <InputNumber style={{ width: "140px" }} />
        </Form.Item>
    </Form>
}

export default PriceCopy;