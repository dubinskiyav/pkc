import React, { useContext, useState, useEffect, useRef } from 'react';
import { Form, Input, InputNumber } from 'antd';
import { DateInput } from './DateInput';
const EditableContext = React.createContext(null);

export const EditableRow = ({ index, ...props }) => {
    const [form] = Form.useForm();
    return (
        <Form form={form} component={false}>
            <EditableContext.Provider value={form}>
                <tr {...props} />
            </EditableContext.Provider>
        </Form>
    );
};

export const EditableCell = ({
    title,
    editable,
    children,
    dataIndex,
    record,
    handleSave,
    editComponentName,
    required,
    ...restProps
}) => {
    const [editing, setEditing] = useState(false);
    const inputRef = useRef(null);
    const form = useContext(EditableContext);
    useEffect(() => {
        if (editing) {
            inputRef.current.focus();
            if (editComponentName === "InputNumber") {
                inputRef.current.select(); 
            }
        }
    }, [editing, editComponentName]);

    const toggleEdit = () => {
        setEditing(!editing);
        form.setFieldsValue({
            [dataIndex]: record[dataIndex],
        });
    };

    const save = async (e) => {
        if (e && e.stopPropagation) e.stopPropagation();
        try {
            const values = await form.validateFields();
            toggleEdit();
            handleSave({ ...record, ...values });
        } catch (errInfo) {
            console.log('Save failed:', errInfo);
        }
    };

    let childNode = children;

    if (editable) {
        childNode = editing ? (
            <Form.Item
                style={{
                    margin: 0,
                }}
                name={dataIndex}
                rules={[
                    {
                        required: required,
                        message: `${title} обязательно для заполнения`,
                    },
                ]}
            >
                {
                    editComponentName === "InputNumber"
                        ? <InputNumber parser={s => parseInt(s)} ref={inputRef} onPressEnter={save} onBlur={save} />
                        : editComponentName === "DateInput"
                            ? <DateInput format="DD.MM.YYYY HH:mm" showTime={true} allowClear={false} ref={inputRef} open={true} onOk={save} onBlur={save} />
                            : <Input ref={inputRef} onPressEnter={save} onBlur={save} />
                }
            </Form.Item>
        ) : (
            <div
                className="editable-cell-value-wrap"
                onClick={toggleEdit}>
                {children}
            </div>
        );
    }

    return <td {...restProps}>{childNode}</td>;
};