import React from 'react';
import { Form, Input, notification } from 'antd';
import { FORM_ITEMS_LAYOUT, MSG_REQUEST_ERROR } from "./Const";
import { DateInput } from "./DateInput";
import requestToAPI from './Request';

const DocumentRealTransitForm = (props) => {
    const firstInputRef = React.useRef(null);
    const isSetStatus = props.isSetStatus;
    const [isSetDocumentName, setIsSetDocumentName] = React.useState(false);

    React.useEffect(() => {
        if (!isSetDocumentName && props.initialValues["documentRealIds"]) {
            if (props.initialValues["documentRealIds"].length === 1) {
                requestToAPI.post("system/documentreal/getname", props.initialValues["documentRealIds"][0])
                .then(response => {
                    props.form.setFieldsValue({ "documentRealName": response.value });
                    setIsSetDocumentName(true);
                })
                .catch((error) => {
                    console.log(error);
                    notification.error({
                        message: MSG_REQUEST_ERROR,
                        description: error.message
                    })
                })
            } else if (props.initialValues["documentRealIds"].length > 1) {
                props.form.setFieldsValue({ "documentRealName": "Выбрано несколько записей" });
                setIsSetDocumentName(true);
            }
        }
    }, [props.initialValues, props.form, isSetDocumentName, setIsSetDocumentName])

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
        name="formDocumentRealTransit"
        onFieldsChange={props.onFieldsChange}
        initialValues={props.initialValues}>
        <Form.Item
            name='documentRealIds'
            hidden={true}>
            <Input />
        </Form.Item>
        <Form.Item
            name='documentRealName'
            label='Наименование документа'>
            <Input disabled />
        </Form.Item>
        <Form.Item
            name='documentTransitId'
            hidden={true}>
            <Input />
        </Form.Item>
        <Form.Item
            name='documentTransitName'
            label={isSetStatus ? 'Устанавливаемый статус' : 'Снимаемый статус'}>
            <Input disabled />
        </Form.Item>
        <Form.Item
            name='documentRealTransitDate'
            label={isSetStatus ? 'Дата установки статуса' : 'Дата снятия статуса'}
            rules={[
                { required: true }
            ]}>
            <DateInput format="DD.MM.YYYY HH:mm" showTime={true} allowClear={false} disabled={!isSetStatus} />
        </Form.Item>
        <Form.Item
            name='documentRealTransitRemark'
            label='Примечание'
            rules={[
                { max: 128 }
            ]}
            hidden={!isSetStatus}>
            <Input ref={firstInputRef} />
        </Form.Item>
    </Form>
}

export default DocumentRealTransitForm;