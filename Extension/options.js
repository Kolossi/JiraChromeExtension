// Saves options to chrome.storage
function save_options() {
  var comments = document.getElementById('comments').checked;
  var parentSummary = document.getElementById('parentSummary').checked;
  var worklog = document.getElementById('worklog').checked;
  var timesheet = document.getElementById('timesheet').checked;
  var parentLink = document.getElementById('parentLink').checked;
  var readiness = document.getElementById('readiness').checked;
  var showFire = document.getElementById('showFire').checked;
  var progressNums = document.getElementById('progressNums').checked;
  var menu = document.getElementById('menu').checked; // #DEBUGONLY
  chrome.storage.sync.set({
      comments: comments,
      parentSummary: parentSummary,
      worklog: worklog,
      timesheet: timesheet,
      parentLink: parentLink,
      readiness: readiness,
      showFire: showFire,
      progressNums : progressNums
      ,menu: menu // #DEBUGONLY
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.innerHTML = '&nbsp;';
    }, 1000);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  // Use default true for all options
  chrome.storage.sync.get({
      comments: true,
      parentSummary: true,
      worklog: true,
      timesheet: true,
      parentLink: true,
      readiness: true,
      showFire: true,
      progressNums : true
      ,menu:false // #DEBUGONLY
  }, function(items) {
    document.getElementById('comments').checked = items.comments;
    document.getElementById('parentSummary').checked = items.parentSummary;
    document.getElementById('worklog').checked = items.worklog;
    document.getElementById('timesheet').checked = items.timesheet;
    document.getElementById('parentLink').checked = items.parentLink;
    document.getElementById('readiness').checked = items.readiness;
    document.getElementById('showFire').checked = items.showFire;
    document.getElementById('progressNums').checked = items.progressNums;
    document.getElementById('menu').checked = items.menu; // #DEBUGONLY
  });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);
