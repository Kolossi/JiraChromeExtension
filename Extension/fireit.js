// bomb out if we aren't on a jira page
$("body#jira").each(function() {
    chrome.storage.sync.get({
      comments: true,
      parentSummary: true,
      worklog: true,
      parentLink: true
    }, function(config) {

        //boost comment width
        if (config.comments) {
            $(".adg3 .issue-container").css("max-width","100%");$("#edit-comment").css("width","1000px").css("left","30%");
        }

        // show parent description rather than jira num for subtasks
        if (config.parentSummary) {
            $(".parentIssue").each(function() {
                var parTitle=$(this).attr("original-title");
                var parText=$(this).text();
                $(this).text(parTitle);
                $(this).attr("original-title",parText);
                $(this).css("font-weight","bold");
            });
        }

        // get worklog and add to search results table
        if (config.worklog) {
            var pswl=$(".zzzpswl");
            if (pswl.length>0) {
                pswl.remove();
            }
            else {
                $(".issuerow").each(function() {
                    var row=$(this);
                    var issId=$(this).attr("rel");
                    jQuery.ajax( {
                        url:"/rest/api/2/issue/"+issId,
                        success:function(result) {
                            result.fields.worklog.worklogs.forEach(function(wl) {
                                var startParts=(new Date(wl.started)).toDateString().split(" ");
                                var newRow="<tr class='zzzpswl'><td></td><td></td><td colspan=100>  "+wl.author.displayName+": <b>"+wl.timeSpent+"</b> on <b>"+startParts[0]+" "+startParts[2]+"-"+startParts[1]+"-"+startParts[3]+"</b>"+(wl.comment?" : "+wl.comment:"")+"</td></tr>";
                                row.after(newRow);
                            });
                        }
                    });
                });
            }
        }

        // Make board parent jira numbers on cards into links
        if (config.parentLink) {
            function hookuplinks() {
                $("span.ghx-key").each(function() {
                    var jira = $(this).text();
                    $(this).html('<a href="/browse/'+jira+'" aria-label="'+jira+'" data-tooltip="'+jira+'" tabindex="-1" class="ghx-key" original-title style="color:blue">'+jira+'</a>');    
                });
            }
            // pretty horrid, but jira process stuff way after document.ready so we have to delay too
            setTimeout(hookuplinks, 1500);
        }
    });
});
