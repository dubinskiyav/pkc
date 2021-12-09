import React from 'react';
import PropTypes from 'prop-types';
import { Input, Button, Menu, Dropdown, notification } from 'antd';
import { FieldNumberOutlined, EllipsisOutlined } from '@ant-design/icons';
import requestToAPI from "./Request";
import { NONE } from "./ModuleConst";
import { buildURL, getItemFromLocalStorage, setItemInLocalStorage } from "./Utils";
import { MSG_ERROR_NUMBERING_GET, MSG_ERROR_NUMBERING_RUN } from "./Const";
import { RESOURCE_NUMBERING } from "./CapResourceType";

const numberingCache = {};

const Numbering = React.forwardRef((props, ref) => {
    const { docEntityName, params, disabled, ...otherProps } = props;
    const [artifactCode, setArtifactCode] = React.useState();
    let artifacts = React.useRef([]);
    const [value, setValue] = React.useState();
    const [contextParams] = React.useState({});

    const handleMenuClick = React.useCallback((e) => {
        console.log(e);
        if (e.key) {
            setArtifactCode(e.key);
            setItemInLocalStorage("numbering_" + docEntityName + "_defaultValue", e.key);

            let subMenu = [];
            artifacts.current.forEach(value => {
                subMenu.push(<Menu.Item key={value.code}>{value.name}</Menu.Item>);
            })
            setMenu(
                <Menu onClick={handleMenuClick} selectedKeys={[e.key]}>
                    {subMenu}
                </Menu>
            )
        }
    }, [setArtifactCode, docEntityName])

    let [menu, setMenu] = React.useState(
        <Menu onClick={handleMenuClick}>
            <Menu.Item>Загрузка...</Menu.Item>
        </Menu>
    );

    const afterLoad = React.useCallback((data) => {
        // если компонент размонтирован не надо устанавливать данные
        if (!contextParams.mountFlag) return;
        artifacts.current = data;
        let defaultValue = getItemFromLocalStorage("numbering_" + docEntityName + "_defaultValue");
        // Установим первый элемент полученного массива в качестве нумератора по умолчанию
        if (artifacts.current.length > 0) {
            let flagFound = false;
            for (let i = 0; i < artifacts.current.length; i++) {
                if (artifacts.current[i].code === defaultValue) {
                    setArtifactCode(artifacts.current[i].code);
                    flagFound = true;
                    break;
                }
            }
            if (!flagFound) {
                defaultValue = artifacts.current[0].code;
                setArtifactCode(artifacts.current[0].code);
            }
        }
        let subMenu = [];
        artifacts.current.forEach(value => {
            subMenu.push(<Menu.Item key={value.code}>{value.name}</Menu.Item>);
        })
        setMenu(
            <Menu onClick={handleMenuClick} selectedKeys={[defaultValue]}>
                {subMenu}
            </Menu>
        )
    }, [setMenu, handleMenuClick, docEntityName, contextParams])

    const load = React.useCallback(() => {
        // если компонент размонтирован не надо устанавливать данные
        if (!contextParams.mountFlag) return;

        if (!numberingCache[docEntityName + "_" + requestToAPI.user.login]) {
            requestToAPI.post(buildURL(NONE, NONE, "Artifacts") + "/list-of-call", {
                pagination: {
                    current: 1,
                    pageSize: 10
                },
                filters: {
                    entity: docEntityName,
                    kind: RESOURCE_NUMBERING,
                },
            })
                .then(response => {
                    numberingCache[docEntityName + "_" + requestToAPI.user.login] = response.result;
                    afterLoad(numberingCache[docEntityName + "_" + requestToAPI.user.login]);
                })
                .catch(error => {
                    // если компонент размонтирован не надо устанавливать данные
                    if (!contextParams.mountFlag) return;
                    notification.error({
                        message: MSG_ERROR_NUMBERING_GET,
                        description: error.message,
                    })
                });
        } else {
            afterLoad(numberingCache[docEntityName + "_" + requestToAPI.user.login]);
        }
    }, [docEntityName, contextParams, afterLoad])

    React.useEffect(() => {
        contextParams.mountFlag = true;
        setTimeout(() => load(), 200);
        // размонтирования компонента сбросит флаг
        return () => contextParams.mountFlag = false;
    }, [load, contextParams]);

    const getArtifactByCode = (artifactCode) => {
        let found;
        artifacts.current.forEach(value => {
            if (value.code === artifactCode) {
                found = value;
            }
        })
        return found;
    }

    const generateNumber = (e) => {
        console.log("generate number for " + artifactCode);
        const artifact = getArtifactByCode(artifactCode);
        requestToAPI.post(buildURL(NONE, NONE, "Artifacts") + "/run", {
            code: artifact.code,
            name: artifact.name,
            kind: RESOURCE_NUMBERING,
            params: params,
        })
            .then(response => {
                setValue(response.value);
                if (props.onChange) {
                    props.onChange(response.value);
                }
            })
            .catch(error => {
                notification.error({
                    message: MSG_ERROR_NUMBERING_RUN,
                    description: error.message,
                })
            });
    }

    return (
        <Input
            className="numbering"
            style={{ width: 200 }}
            addonAfter={
                <>
                    <Button onClick={generateNumber} icon={<FieldNumberOutlined />} disabled={disabled || artifactCode === undefined} />
                    <Dropdown overlay={menu} disabled={disabled}>
                        <Button icon={<EllipsisOutlined />} />
                    </Dropdown>
                </>
            }
            value={value}
            disabled={disabled}
            ref={ref}
            {...otherProps}
        />
    )
})

Numbering.propTypes = {
    docEntityName: PropTypes.string.isRequired,
}

export default (Numbering);