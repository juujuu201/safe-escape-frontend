import {useState} from "react";
import Constants from "../common/Constants.js";
import {SEAlertDialog, SEFormInput, SETextButton} from "../widgets/Widgets.js";
import Resources from "../common/Resources.js";
import {Box} from "@mui/material";

const _viewNames = Constants.VIEW_NAMES;

const LoginView = () => {
    const [open, setOpen] = useState(false);

    function _doLogin(e) {
        let isSuccess = false,
            data, email, password;
        e.preventDefault();

        data = new FormData(e.currentTarget);
        email = data.get(Constants.INPUT_NAMES.EMAIL);
        password = data.get(Constants.INPUT_NAMES.PASSWORD);

        // isSuccess = Requester.doLogin(email, password);

        if (isSuccess) {

        } else {
            setOpen(true);
        }
    }

    function _onCloseDialog(e) {
        setOpen(false);
    }

    return (
        <div className={_viewNames.LOGIN_VIEW}>
            <Box component="form" onSubmit={_doLogin}>
                <SEFormInput name={Constants.INPUT_NAMES.EMAIL} type={Constants.INPUT_TYPES.EMAIL} label={Resources.EMAIL} placeholder={Resources.INPUT_EMAIL} required={true}/>
                <SEFormInput name={Constants.INPUT_NAMES.PASSWORD} type={Constants.INPUT_TYPES.PASSWORD} label={Resources.PASSWORD} placeholder={Resources.INPUT_PASSWORD}/>
                <SETextButton type={Constants.BUTTON_TYPES.SUBMIT} desc={Resources.LOGIN} color={Constants.COLORS.THEME}/>
            </Box>
            <SEAlertDialog title={Resources.ALERT} desc={Resources.LOGIN_ALERT_MSG} open={open} onClose={_onCloseDialog}/>
        </div>
    );
};

export default LoginView;