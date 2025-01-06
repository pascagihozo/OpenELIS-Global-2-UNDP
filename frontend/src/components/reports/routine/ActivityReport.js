import React, { useEffect, useState, useRef, useContext } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  Form,
  FormLabel,
  Grid,
  Column,
  Section,
  Button,
  Loading,
  Select,
  SelectItem,
  Row,
} from "@carbon/react";
import CustomDatePicker from "../../common/CustomDatePicker";
import { AlertDialog } from "../../common/CustomNotification";
import TestSelectForm from "../../workplan/TestSelectForm";
import TestSectionSelectForm from "../../workplan/TestSectionSelectForm";
import PanelSelectForm from "../../workplan/PanelSelectForm";
import "../../Style.css";
import { getFromOpenElisServer } from "../../utils/Utils";
import { encodeDate } from "../../utils/Utils";
import config from "../../../config.json";
import { ConfigurationContext } from "../layout/Layout";
import UserSessionDetailsContext from "../../UserSessionDetailsContext";

const ActivityReport = ({ report }) => {
  const intl = useIntl();
  const [loading, setLoading] = useState(true);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const { userSessionDetails } = useContext(UserSessionDetailsContext);
  const [reportFormValues, setReportFormValues] = useState({
    startDate: null,
    endDate: null,
    value: null,
    error: null,
  });
  const [list, setList] = useState([]);

  const handleDatePickerChangeDate = (datePicker, date) => {
    let updatedDate = encodeDate(date);
    let obj = null;
    switch (datePicker) {
      case "startDate":
        obj = {
          ...reportFormValues,
          startDate: updatedDate,
        };
        break;
      case "endDate":
        obj = {
          ...reportFormValues,
          endDate: updatedDate,
        };
        break;
      default:
    }
    setReportFormValues(obj);
  };

  const handleSubmit = () => {
    setLoading(true);
    let reportType = "";
    let additionalParams = "";
    switch (report) {  // Changed from selectedReportType to report
      case "activityReportByTest":
        reportType = "activityReportByTest";
        additionalParams = "report=activityReportByTest";
        break;
      case "activityReportByPanel":
        reportType = "activityReportByPanel";
        additionalParams = "report=activityReportByPanel";
        break;
      case "activityReportByTestSection":
        reportType = "activityReportByTestSection";
        additionalParams = "report=activityReportByTestSection";
        break;
      default:
        break;
    }
    const baseParams = `${additionalParams}&type=indicator&report=${reportType}`;
    const baseUrl = `${config.serverBaseUrl}/ReportPrint`;
    const url = `${baseUrl}?${baseParams}&lowerDateRange=${reportFormValues.startDate}&upperDateRange=${reportFormValues.endDate}&value=${reportFormValues.value}`;
    window.open(url, "_blank");
    setLoading(false);
    setNotificationVisible(true);
  };

  const setDataList = (data) => {
    console.log("Raw API data: ", data);
    
    if (report === "activityReportByTestSection" && userSessionDetails?.userLabRolesMap) {
      // Get departments where user has Reports role
      const authorizedDepartments = Object.entries(userSessionDetails.userLabRolesMap)
        .filter(([dept, roles]) => roles.includes('Reports'))
        .map(([dept]) => dept);
      
      console.log("Authorized departments: ", authorizedDepartments);
      
      // Filter data to only show authorized departments
      const filteredData = data.filter(item => 
        authorizedDepartments.includes(item.value)
      );
      
      console.log("Filtered data: ", filteredData);
      setList(filteredData);
    } else {
      setList(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    switch (report) {
      case "activityReportByTest":
        getFromOpenElisServer("/rest/test-list", setDataList);
        break;
      case "activityReportByPanel":
        getFromOpenElisServer("/rest/panels", setDataList);
        break;
      case "activityReportByTestSection":
        getFromOpenElisServer("/rest/user-test-sections/ALL", setDataList);
        break;
      default:
        break;
    }
  }, [report, userSessionDetails]);  // Added userSessionDetails to dependencies

  return (
    <>
      <FormLabel>
        <Section>
          <Section>
            <h1>
              <FormattedMessage id={`sidenav.label.${report}`} />
            </h1>
          </Section>
        </Section>
      </FormLabel>
      {notificationVisible && <AlertDialog />}
      {loading && <Loading />}
      <Grid fullWidth={true}>
        <Column lg={16}>
          <Form>
            <Grid fullWidth={true}>
              <Column lg={10}>
                <Section>
                  <br />
                  <h5>
                    <FormattedMessage id="select.date.range" />
                  </h5>
                </Section>
                <div className="inlineDiv">
                  <CustomDatePicker
                    id={"startDate"}
                    labelText={intl.formatMessage({
                      id: "eorder.date.start",
                      defaultMessage: "Start Date",
                    })}
                    autofillDate={true}
                    value={reportFormValues.startDate}
                    className="inputDate"
                    onChange={(date) =>
                      handleDatePickerChangeDate("startDate", date)
                    }
                  />
                  <CustomDatePicker
                    id={"endDate"}
                    labelText={intl.formatMessage({
                      id: "eorder.date.end",
                      defaultMessage: "End Date",
                    })}
                    className="inputDate"
                    autofillDate={true}
                    value={reportFormValues.endDate}
                    onChange={(date) =>
                      handleDatePickerChangeDate("endDate", date)
                    }
                  />
                </div>
              </Column>
              <Column lg={10}>
                {list && list.length > 0 && (
                  <Select
                    id="type"
                    labelText={intl.formatMessage({
                      id: "label.form.searchby",
                    })}
                    value={reportFormValues.value}
                    onChange={(e) => {
                      setReportFormValues({
                        ...reportFormValues,
                        value: e.target.value,
                      });
                    }}
                  >
                    <SelectItem key={"emptyselect"} value={""} text={""} />
                    {list.map((statusOption) => (
                      <SelectItem
                        key={statusOption.id}
                        value={statusOption.id}
                        text={statusOption.value}
                      />
                    ))}
                  </Select>
                )}
              </Column>
            </Grid>

            <br />
            <Section>
              <br />
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!reportFormValues.value || !reportFormValues.startDate || !reportFormValues.endDate}
              >
                <FormattedMessage
                  id="label.button.generatePrintableVersion"
                  defaultMessage="Generate printable version"
                />
              </Button>
            </Section>
          </Form>
        </Column>
      </Grid>
    </>
  );
};

export default ActivityReport;