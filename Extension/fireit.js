debugger; // #DEBUGONLY
// bomb out if we aren't on a jira page
$("body#jira").each(function() {
    chrome.storage.sync.get({
        comments: true,
        parentSummary: true,
        worklog: true,
        maxWorkLog : 3,
        parentLink: true,
        readiness: true,
        showFire:true,
        menu:false
    }, function(config) {

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
                    GetIssue(issId,
                        function(issue) {
                            if (issue.fields.worklog.worklogs.length==0) return;

                            var wlNum = 0;
                            var hideRows = false;
                            issue.fields.worklog.worklogs.forEach(function(wl) {
                                if (config.maxWorkLog>0 && wlNum==config.maxWorkLog) {
                                    hideRows = true;
                                }
                                var startParts = (new Date(wl.started)).toDateString().split(" ");
                                var newRow = "<tr rel='"+issId+"' class='jofjofwl"
                                    + "'><td></td><td></td><td colspan=100>&nbsp;&nbsp;&nbsp;&nbsp;<span "
                                    + (config.showFire ? "style='border-bottom:1px dotted darkorange;'" : "")
                                    + ">" + wl.author.displayName + ": <b>"
                                    + wl.timeSpent + "</b> on <b>"
                                    + startParts[0] + " " + startParts[2] + "-" + startParts[1] + "-" + startParts[3]
                                    + "</b>" + (wl.comment ? " : " + wl.comment : "")
                                    + "</span></td></tr>";
                                row.after(newRow);
                                wlNum+=1;
                            });
                            if (hideRows) {
                                var showRow = $("<tr rel='"+issId+"' class='jofjofwl'><td></td><td></td><td colspan=100>&nbsp;&nbsp;&nbsp;&nbsp;<span class='jofjofwlshow' "
                                        + (config.showFire ? "style='border-bottom:1px dotted darkorange;'" : "")
                                        + ">&nbsp;&nbsp;&nbsp;&nbsp;... click to show remaining worklog ..."
                                        + "</span></td></tr>")
                                            .click(function (e) {
                                                $(".jofjofhidden[rel="+issId+"]").removeClass("jofjofhidden");
                                                $(this).addClass("jofjofhidden");
                                            });
                                
                                $(".jofjofwl[rel="+issId+"]").eq(config.maxWorkLog-1).after(showRow);
                                $(".jofjofwl[rel="+issId+"]:gt("+(config.maxWorkLog)+")").addClass("jofjofhidden");
                            }
                        });
                });
            }
        }

        var Readiness = {
            UNKNOWN : 0,
            STOP : 1,
            WAIT : 2,
            GO : 3,
            DONE : 4,
        };

        function AddReadiness(targetElement, readiness) {
            targetElement.after("<div class='jofjofrd jofjofrd"+readiness
                + (config.showFire ? ' jofjofshowfire' : '')
                + "'>&nbsp;</div>");
        }

        function ComputeReadiness(issId, targetElement) {
            GetIssue(issId,
                        function(issue) {
                            var readiness = Readiness.UNKNOWN;
                            var isSubTask = issue.fields.issuetype.subtask;
                            if (issue.fields.status.statusCategory.name == "Done") {
                                readiness = Readiness.DONE;
                                AddReadiness(targetElement, readiness);
                            } else if (!isSubTask || issue.fields.status.statusCategory.name == "In Progress") {
                                readiness = Readiness.GO;
                                AddReadiness(targetElement, readiness);
                            } else {
                                var parentIssId = issue.fields.parent.id;
                                GetIssue(parentIssId,
                                    function(issue) {
                                        if (issue.fields.status.statusCategory.name == "Done")
                                        {
                                            readiness = Readiness.STOP;
                                        } else {
                                            var predecessorStatus = "Done";
                                            issue.fields.subtasks.every(function(st) {
                                                if (st.id==issId) {
                                                    readiness = (predecessorStatus=="Done") ? Readiness.GO : Readiness.WAIT;
                                                    return false;
                                                }
                                                predecessorStatus = st.fields.status.statusCategory.name;
                                                return true;
                                            });
                                        }
                                        AddReadiness(targetElement, readiness);
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
            }
            doRepeatChecks();

            // pretty horrid, but jira continually messes with page as a semi-SPA
            // so we have to repeatedly call our fixups
            setInterval(doRepeatChecks, 2000);
        }
    });
});
