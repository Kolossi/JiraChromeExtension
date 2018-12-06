// Saves options to chrome.storage
function save_options() {
  var comments = document.getElementById('comments').checked;
  var parentSummary = document.getElementById('parentSummary').checked;
  var worklog = document.getElementById('worklog').checked;
  var parentLink = document.getElementById('parentLink').checked;
  var showFire = document.getElementById('showFire').checked;
  chrome.storage.sync.set({
      comments: comments,
      parentSummary: parentSummary,
      worklog: worklog,
      parentLink: parentLink,
      showFire: showFire
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
      parentLink: true,
      showFire: true
  }, function(items) {
    document.getElementById('comments').checked = items.comments;
    document.getElementById('parentSummary').checked = items.parentSummary;
    document.getElementById('worklog').checked = items.worklog;
    document.getElementById('parentLink').checked = items.parentLink;
    document.getElementById('showFire').checked = items.showFire;
  });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);
