import React from 'react';
import { Button, Form, Input } from 'antd';
import { resq$ } from 'resq'
import requestToAPI from "./Request";

const URI_FOR_SAVE = "/security/changepswd";
const URI_FOR_LOGIN = "gettoken";

let _activeValidator;

export const SetPasswordContent = (props) => {
    const [form] = Form.useForm();
    const firstInputRef = React.useRef(null);
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        const timerId = setTimeout(() => {
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
        let valuesLogin;
        _activeValidator.setFieldsValue({ error: undefined });
        return _activeValidator.validateFields()
            .then((values) => {
                if (values.newPassword !== values.confirmNewPassword) {
                    _activeValidator.error = "Подтверждение пароля не совпадает с новым паролем";
                    _activeValidator.setFieldsValue({ error: _activeValidator.error });
                    throw _activeValidator.error;
                }
                setLoading(true);
                values = {...values, userName: props.userName};
                valuesLogin = {userName: values.userName, password: values.newPassword};
                return requestToAPI.post(URI_FOR_SAVE, values)
            })
            .then(response => {
                return requestToAPI.post(URI_FOR_LOGIN, valuesLogin)
                    .then(response => {
                        requestToAPI.token = response.token;
                        requestToAPI.user = {
                            login: response.user.login,
                            name: response.user.name,
                        };
                        setLoading(false);
                        if (props.cb) {
                            props.cb();
                        }
                    })
                    .catch((error) => {
                        setLoading(false);
                        if (error.message) {
                            _activeValidator.setFieldsValue({ error: error.message });
                        }
                        throw error;
                    });
            })
            .catch((error) => {
                setLoading(false);
                if (error.message) {
                    _activeValidator.setFieldsValue({ error: error.message });
                }
                throw error;
            });
    }

    return <div onKeyDown={handleKeyDown}>
        <Form
            layout={"vertical"}
            form={form}
            name="formSetPassword"
            style={{ padding: 20 }}
            initialValues={{}}>

            <Form.Item
                name="oldPassword"
                label="Старый пароль"
                rules={[
                    {
                        required: true,
                        message: "Старый пароль не может быть пустым"
                    }
                ]}>
                <Input.Password ref={firstInputRef} />
            </Form.Item>

            <Form.Item
                name="newPassword"
                label="Новый пароль"
                rules={[
                    {
                        required: true,
                        message: "Новый пароль не может быть пустым",
                    }
                ]}
            >
                <Input.Password />
            </Form.Item>

            <Form.Item
                name="confirmNewPassword"
                label="Подтверждение пароля"
                rules={[
                    {
                        required: true,
                        message: "Подтверждение пароля не может быть пустым"
                    }
                ]}
            >
                <Input.Password />
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
                <Button type="primary" onClick={login} loading={loading}>Войти</Button>
            </Form.Item>
        </Form>
    </div>

}