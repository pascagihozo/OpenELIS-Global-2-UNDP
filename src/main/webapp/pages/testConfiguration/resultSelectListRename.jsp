<%--
  Created by IntelliJ IDEA.
  User: kenny
  Date: 2019-10-01
  Time: 20:53
  To change this template use File | Settings | File Templates.
--%>
<%@ page language="java"
         contentType="text/html; charset=utf-8"
         import="org.openelisglobal.common.action.IActionConstants,
         		org.openelisglobal.common.util.IdValuePair,
         		org.openelisglobal.common.util.*, org.openelisglobal.internationalization.MessageUtil,
         		org.openelisglobal.common.util.Versioning,
         		java.util.List,
         		java.util.ArrayList,
         		org.openelisglobal.common.provider.query.EntityNamesProvider" %>
<%@ page isELIgnored="false" %>
<%@ taglib prefix="form" uri="http://www.springframework.org/tags/form"%>
<%@ taglib prefix="spring" uri="http://www.springframework.org/tags"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>

<%@ taglib prefix="ajax" uri="/tags/ajaxtags" %>

<div>
<form:form name="${form.formName}"
           action="${form.formAction}"
           modelAttribute="form"
           onSubmit="return submitForm(this);"
           method="${form.formMethod}"
           id="mainForm">

    <table class="rename-result-list-table">
        <tr>
            <th>English</th><th>French</th>
        </tr>
        <tr>
            <td class="english"></td><td class="french"></td>
        </tr>
    </table>
    <div class="rename-result-list-form">
        <div style="width: 300px; float: left;">
            <label style="width: 100%;">English</label>
            <form:input path="nameEnglish"/>
        </div>

        <div style="width: 300px; float: left;">
            <label style="width: 100%;">French</label>
            <form:input path="nameFrench"/>
        </div>
        <input type="hidden" id="resultSelectOptionId" name="resultSelectOptionId"/>
    </div>

    <div style="width: 100%; text-align: center">
        <button onclick="return save()">
            <spring:message code="label.button.save"/>
        </button>
        <button onclick="return cancel();">
            <spring:message code="label.button.cancel"/>
        </button>
    </div>
</form:form>
<table>
    <c:forEach items="${form.resultSelectOptionList}" begin="0" end="${fn:length(form.resultSelectOptionList)}" step="4" var="option" varStatus="counter">
        <tr style="padding: 5px;">
            <td style="padding: 5px;" class="test-list-name-${form.resultSelectOptionList[counter.index].id}">
                <a onclick="return editName(${form.resultSelectOptionList[counter.index].id})"><c:out value="${form.resultSelectOptionList[counter.index].dictEntry}" /></a>
            </td>
            <td style="padding: 5px;" class="test-list-name-${form.resultSelectOptionList[counter.index + 1].id}">
                <a onclick="return editName(${form.resultSelectOptionList[counter.index + 1].id})"><c:out value="${form.resultSelectOptionList[counter.index + 1].dictEntry}" /></a>
            </td>
            <td style="padding: 5px;" class="test-list-name-${form.resultSelectOptionList[counter.index + 2].id}">
                <a onclick="return editName(${form.resultSelectOptionList[counter.index + 2].id})"><c:out value="${form.resultSelectOptionList[counter.index + 2].dictEntry}" /></a>
            </td>
            <td style="padding: 5px;" class="test-list-name-${form.resultSelectOptionList[counter.index + 3].id}">
                <a onclick="return editName(${form.resultSelectOptionList[counter.index + 3].id})"><c:out value="${form.resultSelectOptionList[counter.index + 3].dictEntry}" /></a>
            </td>
        </tr>
    </c:forEach>
</table>


<script>
    var options= {};
    <c:forEach items="${form.resultSelectOptionList}" var="dictionary">
        var id = '${dictionary.id}';
        options[id] = '${dictionary.dictEntry}';
    </c:forEach>

    function editName(id) {
        var name = options[id];
        jQuery('.english').html(name);
        jQuery('.french').html(name);
        jQuery('#resultSelectOptionId').val(id);
        jQuery("#mainForm").show();

    }

    function save() {
        var form = document.getElementById("mainForm");
        form.action = "SelectListRenameEntry.do";
        form.submit();
    }

    function cancel() {
        jQuery("#mainForm").hide();
        return false;
    }

    jQuery(document).ready( function() {
        jQuery("#mainForm").hide();
    });
</script>