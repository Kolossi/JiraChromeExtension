debugger; // #DEBUGONLY
// bomb out if we aren't on a jira page
$("body#jira").each(function() {
    chrome.storage.sync.get({
        comments: true,
        parentSummary: true,
        worklog: false,
        maxWorkLog : 3,
        timesheet: true,
        parentLink: true,
        readiness: true,
        progressNums: true,
        showFire:true,
        menu:false
    }, function(config) {
        var uniqueId = 10001;

        //boost comment width
        if (config.comments) {
            var container = $(".adg3 .issue-container")
            if (container.length>0) {
                $("#viewissuesidebar").css({
                    'width' : '25%',
                    'border' : config.showFire ? '1px dotted darkorange' : null
                })
            }
            container.css("max-width","100%");
            $(".action-body.flooded").css({
                'padding':'5px',
                'border' : config.showFire ? '1px dotted darkorange' : null
            });
        }

        // show parent description rather than jira num for subtasks
        if (config.parentSummary) {
            $(".parentIssue").each(function() {
                var parTitle=$(this).attr("original-title");
                var parText=$(this).text();
                $(this).text(parTitle);
                $(this).attr("original-title", parText);
                $(this).css({
                    'display' : 'block',
                    'background' : 'none',
                    'border-bottom' : config.showFire ? '1px dotted darkorange' : null
                });
            });
        }

        if (config.progressNums) {
            var jofpn=$(".jofjofpn");
            if (jofpn.length>0) {
                jofpn.remove();
            }
            else
            {
                var progressTables = $("td.progress>table");
                progressTables.each(function() {
                    var progressTable = $(this);
                    if (progressTable == null) return;
                    if (config.showFire) progressTable.addClass("jofjofshowfire");
                    var rowPair = $("tr table tr table", progressTable);
                    if (rowPair == null) return;
                    var beforeText = GetText(rowPair[0]);
                    var afterText = GetText(rowPair[1]);
                    var targetRow = $("tbody>tr:first",progressTable);
                    targetRow.after("<tr class='jofjofpn'><td colspan='2'>"+afterText+"</td></tr>");
                    targetRow.before("<tr class='jofjofpn'><td colspan='2'>"+beforeText+"</td></tr>");
                });
            }
        }

        function GetText(parentElem)
        {
            if (parentElem == null) return "";
            var itemArray = [];
            $.each($("img", parentElem), function (index, item) {
                var altValue = $(item).attr("alt")
                if (altValue == null) return;
                altValue = altValue.trim();
                if (altValue == "") return;
                itemArray.push(CleanProgressString(altValue));
            });
            return itemArray.join(" / ");
        }

        function CleanProgressString(str)
        {
             var replaceMap = {
                        "Original Estimate -" : "est:",
                        "Time Spent -" : "rec:",
                        "Remaining Estimate -" : "rem:",
                        " days" : "d",
                        " day" : "d",
                        " hours" : "h",
                        " hour" : "h",
                        " minutes" : "m",
                        " minute" : "m",
                        " " : "&nbsp;"
                    };
            for (key in replaceMap) {
                str = str.replace(new RegExp(key, 'gi'), replaceMap[key]);
            }
            return str;
        }

        // get worklog and add to search results table
        if (config.worklog) {
            var jofwl=$(".jofjofwl");
            if (jofwl.length>0) {
                jofwl.remove();
            }
            else {
                $(".issuerow").each(function() {
                    var row = $(this);
                    var issId = $(this).attr("rel");
                    JofJofQueueIssueAction(issId,
                        {
                            targetElement:row,
                            uniqueId:uniqueId++,
                            issId:issId
                        },
                        function(issue, data) {
                            console.debug("jofjof : wl callback " + data.issId +  " with "+JSON.stringify(data)+ " targetElement:"+data.targetElement[0].outerHTML); // #DEBUGONLY

                            if (issue.fields.worklog.worklogs.length==0) return;

                            var wlNum = 0;
                            var hideRows = false;
                            issue.fields.worklog.worklogs.forEach(function(wl) {
                                if (config.maxWorkLog>0 && wlNum==config.maxWorkLog) {
                                    hideRows = true;
                                }
                                var startParts = (new Date(wl.started)).toDateString().split(" ");
                                var newRow = "<tr rel='"+data.issId+"' class='jofjofwl"
                                    + "'><td></td><td></td><td colspan=100>&nbsp;&nbsp;&nbsp;&nbsp;<span "
                                    + (config.showFire ? "style='border-bottom:1px dotted darkorange;'" : "")
                                    + ">" + wl.author.displayName + ": <b>"
                                    + wl.timeSpent + "</b> on <b>"
                                    + startParts[0] + " " + startParts[2] + "-" + startParts[1] + "-" + startParts[3]
                                    + "</b>" + (wl.comment ? " : " + wl.comment : "")
                                    + "</span></td></tr>";
                                data.targetElement.after(newRow);
                                wlNum+=1;
                            });
                            if (hideRows) {
                                var showRow = $("<tr rel='"+data.issId+"' class='jofjofwl'><td></td><td></td><td colspan=100>&nbsp;&nbsp;&nbsp;&nbsp;<span class='jofjofwlshow' "
                                        + (config.showFire ? "style='border-bottom:1px dotted darkorange;'" : "")
                                        + ">&nbsp;&nbsp;&nbsp;&nbsp;... click to show remaining worklog ..."
                                        + "</span></td></tr>")
                                            .click(function (e) {
                                                $(".jofjofhidden[rel="+data.issId+"]").removeClass("jofjofhidden");
                                                $(this).addClass("jofjofhidden");
                                            });
                                
                                $(".jofjofwl[rel="+data.issId+"]").eq(config.maxWorkLog-1).after(showRow);
                                $(".jofjofwl[rel="+data.issId+"]:gt("+(config.maxWorkLog)+")").addClass("jofjofhidden");
                            }
                        });
                });
            }
        }

        // add timesheet of all worklogs after search results table
        if (config.timesheet) {
            var jofts=$(".jofjoftimesheet");
            if (jofts.length>0) {
                jofts.remove();
            }
            else {
                var listDiv = $(".list-view:first")
                JofJofQueueLastAction(
                    {
                        targetElement:listDiv
                    },
                    function (issues, data)
                    {
                        console.debug("jofjof : ts callback with "+JSON.stringify(data)); // #DEBUGONLY
                        RenderTimesheetAfter(issues, data.targetElement);
                    });
            }
        }

        function RenderTimesheetAfter(issues, targetElement)
        {
            var timesheet = {}
            var worklogs = Object.values(JofJofIssuesCache)
                .map(function(item,index) {return item.fields.worklog.worklogs })
                .reduce(function(x,y) { return x.concat(y) })
                .sort(function(a,b) { return (new Date(b.started)-new Date(a.started)) });
            for (var worklog in worklogs) {
                AddWorkLogToTimesheet(timesheet, worklogs[worklog]);
            }
            var mainDiv = $("<div></div>").addClass("jofjoftimesheet");
            if (config.showFire) mainDiv.addClass("jofjofshowfire");
            var header = $("<h1 class='jofjoftimesheetheader' title='Timesheet'>Timesheet</h1>");
            mainDiv.append(header);
            var table = $("<table></table>").addClass("jofjoftstable").addClass("aui");
            mainDiv.append(table);
            var tableHead = $("<thead><tr>"
                          + "<th class='jofjofindentcolumn'>Person</td>"
                          + "<th class='jofjofindentcolumn'>Day</td>"
                          + "<th>Key</td>"
                          + "<th>Summary</td>"
                          + "<th>Time spent</td>"
                          + "<th>&nbsp;</td>"
                          + "</tr></thead>");
            table.append(tableHead);
            var tableBody = $("<tbody></tbody>");
            table.append(tableBody);
                                  
            for (var person in timesheet) {
                var row = $("<tr><td colspan='6' class='jofjoftsperson'><b>"+person+"</b></td></tr>");
                tableBody.append(row);
                var personData = timesheet[person];
                for (var day in personData) {
                    var row = $("<tr><td>&nbsp;</td><td colspan='5' class='jofjoftsday'><b>"+day+"</b></td></tr>");
                    tableBody.append(row);
                    var dayData = personData[day];
                    for (var item in dayData)
                    {
                        var issue = issues[dayData[item].issueId];
                        var keyContent;
                        var summaryContent;
                        var keyCells = $("tr#issuerow"+issue.id+" td.issuekey");
                        if (keyCells.length>0) {
                            keyContent = keyCells[0].innerHTML;
                        } else {
                            keyContent = '<a class="issue-link" data-issue-key="'+issue.key+' href="/browse/'+issue.key+'" original-title="">'+issue.key+'</a>'
                        }

                        var summaryCells = $("tr#issuerow"+issue.id+" td.summary");
                        if (summaryCells.length>0) {
                            summaryContent = summaryCells[0].innerHTML;
                        } else {
                            summaryContent = '<p><a class="issue-link" data-issue-key="'+issue.key+'" href="/browse/'+issue.key+'" original-title="">'+issue.fields.summary+'</a></p>'
                        }
                        var row = $("<tr>"
                                     + "<td class='jofjoftsperson'>&nbsp;</td>"
                                     + "<td class='jofjoftsday'>&nbsp;</td>"
                                     + "<td class='issuekey jofjoftskey'>"+keyContent+"</td>"
                                     + "<td class='summary jofjoftssummary'>"+summaryContent+"</td>"
                                     + "<td class='jofjoftstimespent'>"+dayData[item].timespent+"</td>"
                                     + "<td class='jofjoftspad'>&nbsp;</td>"
                                     + "</tr>");
                        tableBody.append(row);
                    }
                }
            }
            targetElement.after(mainDiv);
        }

        function AddWorkLogToTimesheet(timesheet, worklog)
        {
            var person = worklog.author.displayName;
            var personData = timesheet[person];
            if (personData == null) {
                personData = {};
                timesheet[person] = personData;
            }
            var startParts = (new Date(worklog.started)).toDateString().split(" ");
            var day = startParts[0] + " " + startParts[2] + "-" + startParts[1] + "-" + startParts[3];
            var timespent = worklog.timeSpent;
            var issueId = worklog.issueId;
            var dayData = personData[day];
            if (dayData == null) {
                dayData = [];
                personData[day] = dayData;
            }
            dayData.push({issueId:issueId, timespent:timespent});
        }

        var Readiness = {
            UNKNOWN : 0,
            STOP : 1,
            WAIT : 2,
            GO : 3,
            DONE : 4,
        };

        function AddReadiness(targetElement, readiness, readinessText) {
            targetElement.after("<div class='jofjofrd jofjofrd"+readiness
                + (config.showFire ? ' jofjofshowfire' : '')
                + "'"
                + (readinessText != null ? " title='" + readinessText + "'" : "")
                + ">&nbsp;</div>");
        }

        function ComputeReadiness(issId, targetElement) {
            JofJofQueueIssueAction(issId,
                {
                    targetElement:targetElement,
                    uniqueId:uniqueId++,
                    issId:issId,
                },
                function(issue, data) {
                    console.debug("jofjof : rd callback " + issId + " with "+JSON.stringify(data)+ " targetElement:"+data.targetElement[0].outerHTML); // #DEBUGONLY
                    var readiness = Readiness.UNKNOWN;
                    var readinessText = null;
                    var isSubTask = issue.fields.issuetype.subtask;
                    if (issue.fields.status.statusCategory.name == "Done") {
                        readiness = Readiness.DONE;
                        readinessText = "Done";
                        AddReadiness(data.targetElement, readiness, readinessText);
                    } else if (issue.fields.status.name.toLowerCase() === 'dev blocked') {
                        readiness = Readiness.STOP;
                        readinessText = issue.fields.status.name; 
                        AddReadiness(data.targetElement, readiness, readinessText);
                    } else if (issue.fields.labels.findIndex(label => label.toLowerCase() === 'blocked') >=0 ) {
                        readiness = Readiness.STOP;
                        readinessText = "Labelled blocked"; 
                        AddReadiness(data.targetElement, readiness, readinessText);
                    } else if (!isSubTask) {
                        if (issue.fields.status.statusCategory.name == "In Progress"
                                || issue.fields.status.statusCategory.name == "To Do") {
                            readiness = Readiness.GO;
                            readinessText =  issue.fields.status.statusCategory.name;
                            AddReadiness(data.targetElement, readiness, readinessText);
                        }
                    } else {
                        var parentIssId = issue.fields.parent.id;
                        JofJofQueueIssueAction(parentIssId,
                            { 
                                targetElement:targetElement,
                                uniqueId:uniqueId++,
                                issId:issId,
                                parentIssId:parentIssId
                            },
                            function(issue, parentData) {
                                console.debug("jofjof : rd parent " + parentData.parentIssId + " callback for " + parentData.issId + " with "+JSON.stringify(parentData)+ " targetElement:"+parentData.targetElement[0].outerHTML); // #DEBUGONLY
                                if (issue.fields.status.statusCategory.name == "Done")
                                {
                                    readiness = Readiness.STOP;
                                    readinessText = "Parent is Done";
                                } else if (issue.fields.status.name.toLowerCase() === 'dev blocked') {
                                    readiness = Readiness.STOP;
                                    readinessText = "Parent is " + issue.fields.status.name; 
                                } else if (issue.fields.labels.findIndex(label => label.toLowerCase() === 'blocked') >= 0) {
                                    readiness = Readiness.STOP;
                                    readinessText = "Parent is labelled blocked"; 
                                } else {
                                    var predecessorStatus = "Done";
                                    issue.fields.subtasks.every(function(st) {
                                        if (st.id==parentData.issId) {
                                            if (predecessorStatus=="Done") {
                                                readiness = Readiness.GO;
                                                readinessText = "Previous subtask is Done";
                                            } else {
                                                readiness = Readiness.WAIT;
                                                readinessText = "Previous subtask is not yet Done";
                                            }
                                            return false;
                                        }
                                        predecessorStatus = st.fields.status.statusCategory.name;
                                        return true;
                                    });
                                }
                                AddReadiness(parentData.targetElement, readiness, readinessText);
                            });
                    }
                });
        }

        if (config.readiness) {
            var jofrd=$(".jofjofrd");
            if (jofrd.length>0) {
                jofrd.remove();
            }
            else {
                $(".issuerow").each(function() {
                    var row = $(this);
                    var targetElement = $("td.issuetype > a:last", row);
                    var issId = $(this).attr("rel");
                    ComputeReadiness(issId, targetElement);
                });
            }
        }


        if (config.parentLink || config.comments || config.menu)
        {
            var increasedTextArea=false;
            function doRepeatChecks() {
                // show left hand sidebar menu icon
                if (config.menu) {
                    var imgsrc = chrome.runtime.getURL("jira32.png");
                    var navelement = $("#navigation-app span:first > div > div:first");
                    if ($("div.jofjofmenu", navelement.parent()).length==0) {
                        navelement.after("<div class='jofjofmenu'>"
                                + "<img src='"+imgsrc+"'>"
                                + "</div>");
                    }
                }

                if (config.readiness) {
                    var jofrd=$(".jofjofrd");
                    if (jofrd.length==0) {
                        $(".ghx-issue").each(function() {
                            var card = $(this);
                            var targetElement = $("section.ghx-stat-fields > div.ghx-stat-1 > span.ghx-field-icon:last", card);
                            var issId = $(this).attr("data-issue-id");
                            ComputeReadiness(issId, targetElement);
                        });
                    }
                }
                    

                // Make board parent jira numbers on cards into links
                if (config.parentLink) {
                    $("span.ghx-key").each(function() {
                        if ($("a",this).length==0)
                        {
                            var jira = $(this).text();
                            $(this).html('<a href="/browse/' + jira + '" aria-label="' + jira + '" data-tooltip="' + jira + '" tabindex="-1" class="ghx-key" original-title '
                                + (config.showFire ? 'style="border-bottom:1px dotted darkorange; "' : '')
                                + '>' + jira + '</a>');    
                        }
                    });
                }
                //
                //boost comment edit width
                if (config.comments) {
                    $("#edit-comment").css({
                        'width' : '1000px',
                        'left' : '30%',
                        'margin-top' : '-400px'
                    });
                    $("#edit-comment #comment-edit .form-body").css({
                        'max-height' : '650px'
                    });

                    // just one-shot this to initially grow, but then leave it as user may resize
                    if (!increasedTextArea) {
                        var textArea=$("#edit-comment #comment-edit textarea#comment")
                        if (textArea.length>0) {
                            textArea.css({
                                'height' : '435px'
                            });
                            increasedTextArea = true;
                        }
                    }
                    if (config.showFire) {
                        $("#edit-comment #comment-edit .comment-input").css({
                            'border' : '1px dotted darkorange', 
                            'margin':'1px -6px',
                            'padding':'3px 5px'
                        });
                    }
                }
                JofJofProcessQueue();
            }
            doRepeatChecks();

            // pretty horrid, but jira continually messes with page as a semi-SPA
            // so we have to repeatedly call our fixups
            setInterval(doRepeatChecks, 2000);
        }
    });
});
