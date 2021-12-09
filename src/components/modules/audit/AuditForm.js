import React from 'react';
import { Form, Input, Tabs } from 'antd';
import { FORM_ITEMS_LAYOUT } from "../../lib/Const";
import moment from 'moment';
import {DEFAULT_DATETIME_FORMAT,EVENT_KINDS } from "../../lib/Const"

const { TextArea } = Input;
const { TabPane } = Tabs;


const AuditForm = (props) => {
    let values = {...props.initialValues};
    const firstInputRef = React.useRef(null);

    React.useEffect(() => {
        setTimeout(() => {
            firstInputRef.current.focus({
                cursor: 'end',
            })
        }, 100);
    });



    if(Object.keys(values).length>0) {
        values.datetime=moment(values.datetime).format(DEFAULT_DATETIME_FORMAT+".SSS");
        values.proguserName = values.proguser?values.proguser.proguserName:'-';
        values.kindDisplay = EVENT_KINDS[values.kind];
        values.entityAndId = values.entity+": "+values.idValue;
        values.inputJson = JSON.stringify(values.inputObject, undefined, 4);
        values.outputJson = JSON.stringify(values.outputObject, undefined, 4);
    }

    return <Form
        {...FORM_ITEMS_LAYOUT}
        form={props.form}
        layout="horizontal"
        name="formEdizm"
        onFieldsChange={props.onFieldsChange}
        initialValues={values}
    >

        <Form.Item
            name="datetime"
            label="Дата/Время"
            >
            <Input readOnly ref={firstInputRef} style={{ width: 200 }} />
        </Form.Item>
        <Form.Item
            name="proguserName"
            label="Пользователь"
            >
            <Input readOnly style={{ width: 200 }} />
        </Form.Item>
        <Form.Item
            name="kindDisplay"
            label="Событие"
            >
            <Input readOnly style={{ width: 200 }} />
        </Form.Item>
        <Form.Item
            name="entityAndId"
            label="Сущность и идентификатор"
            >
            <Input readOnly style={{ width: 200 }} />
        </Form.Item>
        <Form.Item
            name="path"
            label="Адрес вызванного метода"
            >
            <Input readOnly style={{ width: 300 }} />
        </Form.Item>
        <Tabs defaultActiveKey="1">
            <TabPane tab="Ввод" key="1">
                <TextArea readOnly rows={8} style={{ width: "100%" }} value={values.inputJson}/>
            </TabPane>
            <TabPane tab="Вывод" key="2">
                <TextArea readOnly rows={8} style={{ width: "100%" }} value={values.outputJson}/>
            </TabPane>
            <TabPane tab="Исключительная ситуация" key="3">
                <TextArea readOnly rows={8} style={{ width: "100%"}} value={values.faultInfo} />
            </TabPane>
          </Tabs>



    </Form>


}    

export default AuditForm;