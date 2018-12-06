// bomb out if we aren't on a jira page
$("body#jira").each(function() {
    chrome.storage.sync.get({
      comments: true,
      parentSummary: true,
      worklog: true,
      parentLink: true,
      showFire:true
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
                    jQuery.ajax( {
                        url : "/rest/api/2/issue/"+issId,
                        success : function(result) {
                            result.fields.worklog.worklogs.forEach(function(wl) {
                                var startParts = (new Date(wl.started)).toDateString().split(" ");
                                var newRow = "<tr class='jofjofwl'><td></td><td></td><td colspan=100>&nbsp;&nbsp;&nbsp;&nbsp;<span "
                                    + (config.showFire ? "style='border-bottom:1px dotted darkorange;'" : "")
                                    + ">" + wl.author.displayName + ": <b>"
                                    + wl.timeSpent + "</b> on <b>"
                                    + startParts[0] + " " + startParts[2] + "-" + startParts[1] + "-" + startParts[3]
                                    + "</b>" + (wl.comment ? " : " + wl.comment : "")
                                    + "</span></td></tr>";
                                row.after(newRow);
                            });
                        }
                    });
                });
            }
        }

        if (config.parentLink || config.comments)
        {
            var increasedTextArea=false;
            function doRepeatChecks() {
                // Make board parent jira numbers on cards into links
                if (config.parentLink) {
                    $("span.ghx-key").each(function() {
                        var jira = $(this).text();
                        $(this).html('<a href="/browse/' + jira + '" aria-label="' + jira + '" data-tooltip="' + jira + '" tabindex="-1" class="ghx-key" original-title '
                            + (config.showFire ? 'style="border-bottom:1px dotted darkorange; "' : '')
                            + '>' + jira + '</a>');    
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
