import React from 'react';
import PropTypes from 'prop-types';

import { Modal, notification, Button } from 'antd';
import { CloseOutlined } from '@ant-design/icons'
import { MSG_NO_RECORD_FORGETONE, MSG_SAVE_ERROR, MSG_CONFIRM_MODIFY } from './Const';
import requestToAPI from "./Request";
import { getLoginButton } from "./LoginForm";
import { confirm } from "./Dialogs";
import { resq$ } from 'resq'
import { useHistory } from "react-router-dom";
import moment from 'moment';

export const FORM_MAX_WIDTH = 30000;

const CommandButton = (props) => {
    return <Button {...props}>{props.children}</Button>
}

const EditForm = (props) => {
    const [data, setData] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const [internalTrigger] = React.useState({});
    const [status] = React.useState({});
    const idName = props.idName;
    const history = useHistory();
    const [contextParams] = React.useState({});
    const noSave = !props.editorContext.uriForSave;
    const convertors = props.convertors;
    const [, forceUpdate] = React.useReducer(x => x + 1, 0);
    const onlyCloseButton = props.onlyCloseButton;

    const closeDialog = React.useCallback(() => {
        props.afterCancel();
        // если компонент размонтирован не надо устанавливать данные
        if (!contextParams.mountFlag) return;
        setData(null);
    }, [props, contextParams.mountFlag])

    //Загрузка
    const load = React.useCallback(() => {
        const convertLoad = (response) => {
            let convertedResponse = { ...response };
            if (convertors && convertors.date) {
                convertors.date.forEach(element => {
                    if (convertedResponse[element]) {
                        convertedResponse[element] = moment(convertedResponse[element]);
                    }
                });
            }
            if (convertors && convertors.valueFromObject) {
                convertors.valueFromObject.forEach(element => {
                    if (convertedResponse[element]) {
                        convertedResponse[element] = { value: convertedResponse[element] };
                    }
                });
            }
            return convertedResponse;
        };

        status.modified = false;
        status.modeCopy = noSave; // если нет uri для сохранения переходим в режим копировать
        setLoading(true);
        if (props.editorContext.uriForGetOne) {
            console.log(props.editorContext.id ? "Load for id = " + props.editorContext.id : "Load for add");
            requestToAPI.post(props.editorContext.uriForGetOne, props.editorContext.id ?? "")
                .then(response => {
                    // если компонент размонтирован не надо устанавливать данные
                    if (!contextParams.mountFlag) return;
                    if (props.onAfterLoad) {
                        response = props.onAfterLoad(response) ?? response;
                    }
                    setLoading(false);
                    // Выполним конвертирование полученного ответа в соответствии с пропсом convertors
                    setData(convertLoad(response));
                })
                .catch(error => {
                    // если компонент размонтирован не надо устанавливать данные
                    if (!contextParams.mountFlag) return;
                    setLoading(false);
                    notification.error({
                        message: MSG_NO_RECORD_FORGETONE,
                        description: error.message,
                        btn: getLoginButton(error.status, history)
                    })
                    closeDialog();
                })
        } else if (props.editorContext.record) {
            status.modeCopy = props.modeCopy ?? false;
            setLoading(false);
            setData(convertLoad(props.editorContext.record));
        } else {
            setLoading(false);
            setData({});
        }
    }, [props, status, history, contextParams.mountFlag, closeDialog, noSave, convertors])

    React.useEffect(() => {
        if (data != null && Object.keys(data).length != 0) {
            props.form.resetFields();
        }
    }, [data, props.form]);

    React.useEffect(() => {
        contextParams.mountFlag = true;

        if (!data && props.visible) {
            setData({});
            load();
        }
        // размонтирования компонента сбросит флаг
        return () => contextParams.mountFlag = false;
    }, [data, contextParams, load, props.visible]);

    //Сохранение
    const save = React.useCallback((values, after) => {
        const convertSave = (values) => {
            let convertedValues = { ...values };
            if (convertors && convertors.date) {
                convertors.date.forEach(element => {
                    if (convertedValues[element]) {
                        convertedValues[element] = convertedValues[element].valueOf();
                    }
                });
            }
            if (convertors && convertors.valueFromObject) {
                convertors.valueFromObject.forEach(element => {
                    if (convertedValues[element]) {
                        convertedValues[element] = parseInt(convertedValues[element].value);
                    }
                });
            }
            return convertedValues;
        };

        // Выполним конвертирование сохраняемых данных в соответствии с пропсом convertors
        const valuesForSend = convertSave(values);
        console.log("Save values", valuesForSend);
        if (props.editorContext.uriForSave) {
            setLoading(true);
            requestToAPI.post(props.editorContext.uriForSave, valuesForSend)
                .then(response => {
                    setLoading(false);
                    after(response);
                })
                .catch(error => {
                    setLoading(false);
                    notification.error({
                        message: MSG_SAVE_ERROR,
                        description: error.message,
                        btn: getLoginButton(error.status, history)
                    })
                })
        } else {
            after(values);
        }
    }, [props, history, convertors]);

    const beforeSave = React.useCallback((values) => {
        if (internalTrigger.onBeforeSave) {
            internalTrigger.onBeforeSave(values);
        }
        if (props.beforeSave) {
            values = props.beforeSave(values) ?? values;
        }
        return values;
    }, [props, internalTrigger])

    const afterSave = React.useCallback((response) => {
        status.modified = false;
        if (props.afterSave) {
            props.afterSave(response);
        }
    }, [props, status])

    const afterCopy = React.useCallback((response) => {
        if (props.afterCopy) {
            props.afterCopy(response);
        }
    }, [props])

    const handleKeyDown = (ev) => {
        switch (ev.which) {
            case 13: {
                // только если не в режиме добавления
                if (!status.modeCopy) {
                    let root = document.getElementsByClassName("__dialog__" + props.id);
                    const btn = resq$('button', root[0]).byProps({ id: "ok-btn" });
                    btn.props.onClick(btn);
                }
                ev.stopPropagation();
                break;
            }
            case 27: {
                let root = document.getElementsByClassName("__dialog__" + props.id);
                let btn;
                if (!status.modeCopy) {
                    btn = resq$('button', root[0]).byProps({ id: "cancel-btn" });
                } else {
                    // Это кнопка Закрыть
                    btn = resq$('button', root[0]).byProps({ id: "ok-btn" });
                }
                if (btn) {
                    btn.props.onClick(btn);
                }
                break;
            }
            default:
        }
    }

    const handleFieldsChange = (flds) => {
        status.modified = true;
    }

    const handleCancel = () => {
        if (status.modified) {
            confirm(MSG_CONFIRM_MODIFY, () => {
                closeDialog();
            })
        } else {
            closeDialog();
        }
    };

    const handleOk = (ev, copyClickFlag) => {
        // если кнопка Ok, но в режиме копирования, то просто закрываем
        if ((!copyClickFlag && status.modeCopy) || onlyCloseButton) {
            afterSave(null);
            setData(null);
            return;
        }
        if (props.status) {
            props.status.isModeAdd = !props.editorContext.id || copyClickFlag;
        }
        props.form.validateFields()
            .then((values) => {
                // при редактировании добавим Id в данные
                if (props.editorContext.id && !copyClickFlag) {
                    values[idName] = props.editorContext.id;
                }
                // переключаем в режим копирования
                if (copyClickFlag) {
                    status.modeCopy = true;
                }
                values = beforeSave(values);
                save(values, (response) => {
                    console.log("after save response", response);
                    // если копируем то окно не закрываем, данные не сбрасываем
                    if (!copyClickFlag) {
                        afterSave(response);
                        setData(null);
                    } else {
                        status.modified = false;
                        // при копировании нужно обновить data иначе поля ввода
                        // пересоздадуться с initValues
                        // const newdata = { ...data };
                        // Object.assign(newdata, values);
                        afterCopy(response);
                        // setData(newdata);
                    }
                })
            })
            .catch((info) => {
                console.log('Validate Failed:', info);
            });
    }

    if (props.children.props.events) {
        props.children.props.events.handleOk = handleOk;
        props.children.props.events.forceUpdate = forceUpdate;
    }

    const handleCopy = (ev) => {
        handleOk(ev, true);
    }

    let modalWidth = props.width;
    if (typeof modalWidth == 'number' && modalWidth < 0) {
        modalWidth = undefined;
    }

    let modalHeight = props.height;
    if (typeof modalHeight !== 'number' || modalHeight < 0) {
        modalHeight = "auto";
    }

    const mergeInitialValues = (data, initialValues) => {
        for (var i in initialValues) {
            data[i] = initialValues[i];
        }
        return data;
    }

    const additionalButtons = props.children.props.additionalButtons ?? [];

    return <Modal
        centered={true}
        destroyOnClose
        preserve={false}
        wrapClassName={"__dialog__" + props.id}
        visible={props.visible}
        title={props.title || ((props.editorContext.id && !status.modeCopy) ? "Изменение записи" : "Новая запись")}
        width={modalWidth}
        bodyStyle={{ "height": modalHeight }}
        closeIcon={<CloseOutlined onClick={handleCancel} />}
        footer={[
            props.copyButtonFlag && !onlyCloseButton ? <CommandButton id="copy-btn" key="1" loading={loading} onClick={handleCopy}>Добавить</CommandButton> : null,
            !status.modeCopy && !onlyCloseButton ? <CommandButton id="cancel-btn" key="2" onClick={handleCancel}>Отмена</CommandButton> : null,
            <CommandButton id="ok-btn" type={status.modeCopy || onlyCloseButton ? null : "primary"} key="3"
                loading={loading} onClick={handleOk}>
                {status.modeCopy || onlyCloseButton ? 'Закрыть' : (props.saveButtonTitle ?? 'Сохранить')}
            </CommandButton>,
            ...additionalButtons
        ]}
    >
        <div onKeyDown={handleKeyDown}>
            {props.children ? React.cloneElement(props.children, {
                initialValues: mergeInitialValues(data || {}, props.children.props.initialValues),
                internalTrigger: internalTrigger,
                onFieldsChange: handleFieldsChange,
                mode: props.editorContext.id ? 1 : 0
            }) : null}
        </div>
    </Modal>
}

export const ShowModal = (props) => {
    const dialogId = props.dialogId || "Dialog-" + Math.floor(Math.random() * 10000);
    return <EditForm
        key={dialogId}
        id={dialogId}
        visible={true}
        form={props.form}
        title={props.title}
        width={props.width ?? FORM_MAX_WIDTH}
        editorContext={props.editorContext}
        afterSave={(response) => {
            props.destroyDialog(dialogId)
            if (props.afterSave) props.afterSave(response);
        }}
        afterCancel={() => {
            props.destroyDialog(dialogId)
        }}
        idName={props.idName ?? "id"}
        convertors={props.convertors}
        modeCopy={props.modeCopy}
        saveButtonTitle={props.saveButtonTitle}>
        {React.cloneElement(props.content, {
            form: props.form,
            initialValues: {}
        })}
    </EditForm>
}


export default EditForm;

EditForm.propTypes = {
    idName: PropTypes.string,  // default "id"
    editorContext: PropTypes.object.isRequired,
    afterCancel: PropTypes.func.isRequired,
    beforeSave: PropTypes.func,
    afterSave: PropTypes.func,
    afterCopy: PropTypes.func,
    visible: PropTypes.bool.isRequired,
    id: PropTypes.string.isRequired,
    form: PropTypes.object.isRequired,
    width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    copyButtonFlag: PropTypes.bool,
    convertors: PropTypes.object
}

EditForm.defaultProps = {
    idName: "id",
    visible: false,
    width: -1
}