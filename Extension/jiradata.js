var JiraIssuesCache = {};

function GetIssue(issId, successFn) {
    var cacheVal = JiraIssuesCache[issId];
    if (cacheVal != null) {
        successFn(cacheVal);
        return;
    } else {
        jQuery.ajax( {
            url : "/rest/api/2/issue/"+issId,
            success : function(issue) {
                JiraIssuesCache[issId] = issue;
                successFn(issue);
            }
        });
    }
}
