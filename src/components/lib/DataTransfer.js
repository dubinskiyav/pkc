import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Transfer } from 'antd';
import { notification } from 'antd';
import { MSG_NO_RECORD_FORGETONE } from './Const';
import requestToAPI from "./Request";

const DataTransfer = (props) => {
    const [data, setData] = React.useState(null);
    const [targetKeys, setTargetKeys] = useState(props.targetKeys);
    const [selectedKeys, setSelectedKeys] = useState([]);
    const [contextParams] = React.useState({});
    const ready = props.ready;

    const onChange = (nextTargetKeys, direction, moveKeys) => {
        console.log('targetKeys:', nextTargetKeys);
        console.log('direction:', direction);
        console.log('moveKeys:', moveKeys);
        setTargetKeys(nextTargetKeys);
        props.onChange(nextTargetKeys);
    };

    const onSelectChange = (sourceSelectedKeys, targetSelectedKeys) => {
        console.log('sourceSelectedKeys:', sourceSelectedKeys);
        console.log('targetSelectedKeys:', targetSelectedKeys);
        setSelectedKeys([...sourceSelectedKeys, ...targetSelectedKeys]);
    };

    const onScroll = (direction, e) => {
        console.log('direction:', direction);
        console.log('target:', e.target);
    };

    //Загрузка
    const load = React.useCallback(() => {
        // setLoading(true);
        if (props.uri) {
            console.log("DataTransfer load list");
            requestToAPI.post(props.uri, props.params)
                .then(response => {
                    // если компонент размонтирован не надо устанавливать данные
                    if (!contextParams.mountFlag) return;
                    // setLoading(false);
                    response = response.result;
                    setData(response.map(val => {
                        val.key = val[Object.keys(val)[0]];
                        return val
                    }));
                })
                .catch(error => {
                    // если компонент размонтирован не надо устанавливать данные
                    if (!contextParams.mountFlag) return;
                    // setLoading(false);
                    notification.error({
                        message: MSG_NO_RECORD_FORGETONE,
                        description: error.message,
                    })
                    // props.afterCancel();
                    setData([]);
                })
        } else {
            // setLoading(false);
            setData([]);
        }
    }, [props, contextParams.mountFlag])

    React.useEffect(() => {
        contextParams.mountFlag = true;
        if (!data) {
            setData([]);
            if (ready) {
                load();
            }
        }
        // размонтирования компонента сбросит флаг
        return () => contextParams.mountFlag = false;
    }, [data, contextParams, load, ready]);

    return (
        <Transfer
            dataSource={data ?? []}
            titles={props.titles ?? ["Доступно", "Выбрано"]}
            targetKeys={targetKeys}
            selectedKeys={selectedKeys}
            onChange={onChange}
            onSelectChange={onSelectChange}
            onScroll={onScroll}
            render={props.onRender}
            disabled={props.disabled ?? false}
            showSearch
            listStyle={{
                maxWidth: "300px",
                minWidth: "300px",
                height: "400px",
            }}
            filterOption={(inputValue, option) => (props.onRender(option) ?? "").toLowerCase().indexOf(inputValue.toLowerCase()) !== -1}
        />
    );
};

DataTransfer.propTypes = {
    uri: PropTypes.string,
    params: PropTypes.object,
    ready: PropTypes.bool,
}

DataTransfer.defaultProps = {
    ready: false,
}

export default DataTransfer;