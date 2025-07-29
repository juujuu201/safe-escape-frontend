import {useState} from "react";
import Constants from "../common/constants.js";
import Resources from "../common/resources.js";
import Util from "../common/utils.js";
import {Box, ButtonBase, IconButton, Tab, Tabs, Tooltip, Typography} from "@mui/material";
import {Close} from "@mui/icons-material";

const _widgetNames = Constants.WIDGET_NAMES;

/**
 *
 * @param {String} orgClassName             - 기존 className
 * @param {String|Array} newClassName       - 추가할 className
 * @returns {String}
 * @private
 */
function _extendClassName(orgClassName, newClassName) {
    if (!newClassName) {
        return orgClassName || "";
    } else if (!orgClassName) {
        return newClassName || "";
    }

    const classList = orgClassName.split(" ");

    if (typeof newClassName === "string") {
        newClassName = [newClassName];
    }

    for (const name of newClassName) {
        classList.push(name);
    }

    return classList.join(" ");
}

function _getClassList(className) {
    let classList = className;

    if (typeof classList === "string") {
        classList = classList.split(" ");
    }

    return classList;
}

/**************************************************
 * Widgets
 **************************************************/
export const SEImage = (props) => {
    const {image, altText, className} = props;

    return (
        <div className={_extendClassName(_widgetNames.IMAGE, className)}>
            <Box component="img" src={image} alt={altText}/>
        </div>
    );
};

export const SEImageButton = (props) => {
    const {image, onClick, altText, className} = props;

    return (
        <div className={_extendClassName(_widgetNames.IMAGE_BUTTON, className)}>
            <ButtonBase onClick={onClick}>
                <Box component="img" src={image} alt={altText}/>
            </ButtonBase>
        </div>
    );
};

export const SETextButton = (props) => {
    const {
        title = "",
        desc = "",
        isDisabled = false,
        className, onClick
    } = props;
    let orgClassName = _widgetNames.TEXT_BUTTON,
        titleEl, descEl;

    if (title) {
        titleEl = <SEText className={Constants.SUBTITLE_CLASS} desc={title}/>;
    }

    if (desc) {
        descEl = <SEText className={Constants.DESCRIPTION_CLASS} desc={desc}/>;
    }

    if (isDisabled) {
        orgClassName = `${orgClassName} ${Constants.DISABLED_CLASS}`;
    }

    return (
        <div className={_extendClassName(orgClassName, className)}>
            <ButtonBase onClick={onClick} disabled={isDisabled}>
                <Box>
                    {titleEl}
                    {descEl}
                </Box>
            </ButtonBase>
        </div>
    );
};

export const SEIconButton = (props) => {
    const {caption, desc, icon, className, onClick, sx} = props;
    let iconButtonEl = <IconButton sx={sx}>{icon}</IconButton>,
        descEl;

    if (caption) {
        iconButtonEl = <Tooltip title={caption}>{iconButtonEl}</Tooltip>;
    }

    if (desc) {
        descEl = <div>{desc}</div>;
    }

    return (
        <div className={_extendClassName(_widgetNames.ICON_BUTTON, className)} onClick={onClick}>
            {iconButtonEl}
            {descEl}
        </div>
    );
};

export const SETab = (props) => {
    const {tabInfoList, direction, defaultTab, descVisible = false, className = []} = props,
        tabNameList = tabInfoList.map(tab => tab.name),
        [curTabIdx, setTabIdx] = useState(tabNameList.indexOf(defaultTab) ?? -1),
        tabList = [];
    let classList = _getClassList(className) || [],
        tabPanel;

    for (const tabInfo of tabInfoList) {
        const {name, image, icon, panel} = tabInfo,
            attr = {};

        if (image) {
            attr["label"] = <img alt={name} src={image}/>;
        }

        if (icon) {
            attr["icon"] = icon;
        }

        if (descVisible) {
            const desc = Resources[name.toUpperCase()];

            if (desc) {
                if (attr.hasOwnProperty("label")) {
                    attr["label"] = (
                        <>
                            {attr["label"]}
                            <span className={Constants.TAB_TEXT_CLASS}>{desc}</span>
                        </>
                    );
                } else {
                    attr["label"] = desc;
                }
            }
        }

        tabList.push(<Tab key={`${name}_tab`} {...attr}/>);

        if (tabNameList[curTabIdx] === name) {
            tabPanel = <SETabPanel value={name} children={panel}/>;
        }
    }

    if (direction === "vertical") {
        classList.push(direction);
    }

    function _handleChange(e, curIdx) {
        setTabIdx(curIdx);
    }

    return (
        <div className={_extendClassName(_widgetNames.TAB, classList)}>
            <Box sx={{borderBottom: 1}}>
                <Tabs value={curTabIdx} orientation={direction} onChange={_handleChange}>
                    {tabList}
                </Tabs>
            </Box>
            {tabPanel}
        </div>
    );
};

export const SETabPanel = (props) => {
    const {children, value, className} = props;

    return (
        <div className={_extendClassName(_widgetNames.TAB_PANEL, className)} role="tabpanel" value={value}>
            {children}
        </div>
    );
};

export const SEText = (props) => {
    const {desc, color, size, align, className, hasUnderline = false} = props;
    let styleProps;

    if (hasUnderline) {
        styleProps = {
            sx: {
                textDecoration: "underline"
            }
        };
    }

    return (
        <div className={_extendClassName(_widgetNames.TEXT, className)}>
            <Typography color={color || Constants.COLORS.THEME} variant={size} align={align} {...styleProps}>{desc}</Typography>
        </div>
    );
};

export const SEMapTooltip = (props) => {
    const {image, isOpen, title, desc, className, onClose, style} = props;
    let styleObj;

    function _onClose() {
        if (onClose) {
            onClose();
        }
    }

    if (!isOpen) {
        return null;
    }

    if (!Util.isEmptyObject(style)) {
        styleObj = style;
    }

    return (
        <div className={_extendClassName(_widgetNames.MAP_TOOLTIP, className)} style={styleObj}>
            <IconButton onClick={_onClose}>
                <Close fontSize="small"/>
            </IconButton>
            <div className={Constants.MAP_TOOLTIP_CONTENT}>
                {image && <SEImage image={image}/>}
                <div>
                    {title && <SEText className={Constants.SUBTITLE_CLASS} desc={title}/>}
                    {desc && <SEText className={Constants.DESCRIPTION_CLASS} desc={desc}/>}
                </div>
            </div>
        </div>
    );
};