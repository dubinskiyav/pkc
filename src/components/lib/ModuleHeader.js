import React from 'react';
import PropTypes from 'prop-types';
import { Button, Input } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { DesktopOrTabletScreen, MobileScreen } from './Responsive';
import { buildMobileButtons } from "./Utils";

const { Search } = Input;

const ModuleHeader = (props) => {
    const showBackButton = props.showBackButton;
    const showButtonsInMobile = props.showButtonsInMobile;

    return (
        <div className="mod-header">
            {showBackButton &&
                <Button
                    icon={<ArrowLeftOutlined />}
                    className="back-button"
                    onClick={() => window.history.back()}
                />
            }
            <h2 className="mod-title">{props.title}</h2>
            <div style={{ marginLeft: 'auto' }}></div>
            <div>{props.children}</div>
            {props.search ? <Search placeholder="Поиск..." allowClear onSearch={props.onSearch} style={{ width: 200, marginLeft: 8 }} /> : null}
            <DesktopOrTabletScreen>
                <div className="mod-buttons">
                    {props.buttons}
                </div>
            </DesktopOrTabletScreen>
            {showButtonsInMobile &&
                <MobileScreen>
                    <div className="mod-buttons">
                        {buildMobileButtons(props.buttons, true)}
                    </div>
                </MobileScreen>
            }
        </div>
    );
}

ModuleHeader.propTypes = {
    search: PropTypes.bool,
    showBackButton: PropTypes.bool,
    showButtonsInMobile: PropTypes.bool
}

ModuleHeader.defaultProps = {
    search: true,
    showBackButton: true,
    showButtonsInMobile: false
}

export default ModuleHeader;