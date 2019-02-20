var JofJofIssuesCache = {};
var JofJofIssueActionQueue = {};

function JofJofGetIssue(issId, successFn) {
    var cacheVal = JofJofIssuesCache[issId];
    if (cacheVal != null) {
        successFn(cacheVal);
        return;
    } else {
        jQuery.ajax( {
            url : "/rest/api/2/issue/"+issId,
            success : function(issue) {
                JofJofIssuesCache[issue.id] = issue;
                console.debug("jofjof : Retrieved "+issue.id+" expecting:"+issId+" calling "+successFn); // #DEBUGONLY
                successFn(issue);
            }
        });
    }
}

var JOFJOF_LAST_ACTION_MAGIC_VALUE = "Last";

function JofJofQueueLastAction(queueData, action) {
    JofJofQueueIssueAction(JOFJOF_LAST_ACTION_MAGIC_VALUE, queueData, action);
}

function JofJofQueueIssueAction(issId, queueData, action) {
    var queueVal = JofJofIssueActionQueue[issId];
    if (queueVal == null) {
        queueVal = [];
        JofJofIssueActionQueue[issId] = queueVal;
    }
    queueVal.push({action:action, data:queueData});
    console.debug("jofjof : Queued "+issId+", uniqueId:"+queueData.uniqueId+", pending now for issId: "+JSON.stringify(queueVal));  // #DEBUGONLY
    console.debug("jofjof queued pending now for all: "+JSON.stringify(JofJofIssueActionQueue)); // #DEBUGONLY
}

function JofJofProcessQueue()
{
    console.debug("jofjof: ProcessQueue, pending now for all: "+JSON.stringify(JofJofIssueActionQueue)); // #DEBUGONLY
    for (var queueIssId in JofJofIssueActionQueue) {
        if (queueIssId==JOFJOF_LAST_ACTION_MAGIC_VALUE) continue;
        console.debug("jofjof: ProcessQueue, getting issId:" + queueIssId); // #DEBUGONLY
        JofJofGetIssue(queueIssId, function(issue) {
            var getIssId = issue.id;
            console.debug("jofjof : Retrieved "+getIssId + "pending now for all: "+JSON.stringify(JofJofIssueActionQueue)); // #DEBUGONLY
            var queueItems = JofJofIssueActionQueue[getIssId];
            console.debug("jofjof : Retrieved "+getIssId+" looping over waiters: "+ JSON.stringify(queueItems)); // #DEBUGONLY
            if (queueItems) {
                for (var i = 0; i< queueItems.length; i++) {
                    var callData = queueItems[i].data;
                    console.debug("jofjof : Processing "+getIssId+", uniqueId:"+callData.uniqueId+" - calling "+queueItems[i].action + " with "+JSON.stringify(callData)+" targetElement:"+callData.targetElement[0].outerHTML); // #DEBUGONLY
                    queueItems[i].action(issue, callData);
                }
            }
            delete JofJofIssueActionQueue[getIssId];
            if (Object.entries(JofJofIssueActionQueue).length==1 && JofJofIssueActionQueue[JOFJOF_LAST_ACTION_MAGIC_VALUE])
            {
                var queueItems = JofJofIssueActionQueue[JOFJOF_LAST_ACTION_MAGIC_VALUE];
                console.debug("jofjof : Retrieved last actions looping over waiters: "+ JSON.stringify(queueItems)); // #DEBUGONLY
                for (var i = 0; i< queueItems.length; i++) {
                    var callData = queueItems[i].data;
                    console.debug("jofjof : Processing last action - calling "+queueItems[i].action + " with "+JSON.stringify(callData)); // #DEBUGONLY
                    queueItems[i].action(JofJofIssuesCache, callData);
                    delete JofJofIssueActionQueue[JOFJOF_LAST_ACTION_MAGIC_VALUE];
                }
            }
        });
    }
}
