import React from 'react';
import { Button, Form, Input } from 'antd';
import { resq$ } from 'resq'
import requestToAPI from "./Request";

const URI_FOR_REQUEST = "/security/recovery/request";

let _activeValidator;

export const ForgetPassword = (props) => {
    const [form] = Form.useForm();
    const firstInputRef = React.useRef(null);
    const [loading, setLoading] = React.useState(false);
    const [controlCase, setControlCase] = React.useState(false);

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
    })

    const handleKeyDown = (ev) => {
        if (ev.which == 13) {
            let root = document.getElementById("root");
            const okBtn = resq$('Button', root).byProps({ type: "primary" });
            okBtn.props.onClick(okBtn);
        }
    }

    _activeValidator = form;

    const login = () => {
        _activeValidator.setFieldsValue({ error: undefined });
        return _activeValidator.validateFields()
            .then((values) => {
                setLoading(true);
                return requestToAPI.post(URI_FOR_REQUEST, values);
            })
            .then(response => {
                setLoading(false);
                if (props.cb) {
                    props.cb();
                }
                setControlCase(true);
            })
            .catch((error) => {
                setLoading(false);
                if (error.message) {
                    _activeValidator.setFieldsValue({ error: error.message });
                } else {
                    _activeValidator.setFieldsValue({ error: "У пользователя отсутствует email адрес" });
                }
                throw error;
            });
    }

    switch (controlCase) {
        case true:
            return <div>
                    <span style={{color: "green"}}>Письмо для восстановления пароля отправлено</span>
                </div>;
        default:
            return <div onKeyDown={handleKeyDown}>
                <Form
                    layout={"vertical"}
                    form={form}
                    name="formForgetPassword"
                    style={{ padding: 20 }}
                    initialValues={{}}>

                    <Form.Item
                        name="emailOrLogin"
                        label="E-mail или имя пользователя"
                        rules={[
                            {
                                required: true,
                                message: "E-mail или имя пользователя не может быть пустым",
                            }
                        ]}>
                        <Input ref={firstInputRef} />
                    </Form.Item>

                    <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) => prevValues.error !== currentValues.error}>
                        {
                            ({ getFieldValue }) =>
                                getFieldValue('error') ? (
                                    <div className="ant-form-item ant-form-item-explain ant-form-item-explain-error">{getFieldValue('error')}</div>
                                ) : null
                        }
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" onClick={login} loading={loading}>Восстановить пароль</Button>
                    </Form.Item>
                </Form>
            </div>;
    }
}